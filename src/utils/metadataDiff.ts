/* eslint-disable @typescript-eslint/no-explicit-any */
'use strict'

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads'

import { isEqual } from 'lodash'

import { MetadataRepository } from '../metadata/MetadataRepository'
import type { Config } from '../types/config'
import type { SharedFileMetadata } from '../types/metadata'
import type { Manifest } from '../types/work'

import {
  asArray,
  parseXmlFileToJson,
  convertJsonToXml,
  ATTRIBUTE_PREFIX,
  XML_HEADER_ATTRIBUTE_KEY,
} from './fxpHelper'
import { fillPackageWithParameter } from './packageHelper'

type ManifestTypeMember = {
  type: string
  member: string
}

// Store functional area
// Side effect on store
const addToStore =
  (store: Manifest) =>
  ({ type, member }: ManifestTypeMember): Manifest => {
    fillPackageWithParameter({ store, type, member })
    return store
  }

const hasMember =
  (store: Manifest) =>
  (attributes: Map<string, SharedFileMetadata>) =>
  (subType: string) =>
  (member: string) =>
    attributes.has(subType) &&
    store.get(attributes.get(subType)!.xmlName!)?.has(member)

const selectKey =
  (attributes: Map<string, SharedFileMetadata>) =>
  (type: string) =>
  (elem: any) =>
    elem?.[attributes.get(type)!.key!]

// Metadata JSON structure functional area
const getRootMetadata = (fileContent: any): any =>
  fileContent[
    Object.keys(fileContent).find(
      attribute => attribute !== XML_HEADER_ATTRIBUTE_KEY
    ) as string
  ] ?? {}

const getSubTypeTags =
  (attributes: Map<string, SharedFileMetadata>) => (fileContent: any) =>
    Object.keys(getRootMetadata(fileContent)).filter(tag => attributes.has(tag))

// const extractMetadataForSubtype =
//   (fileContent: any) =>
//   (subType: string): string[] =>
//     asArray(getRootMetadata(fileContent)?.[subType])

const isEmpty = (fileContent: any) =>
  Object.entries(getRootMetadata(fileContent))
    .filter(([key]) => !key.startsWith(ATTRIBUTE_PREFIX))
    .every(([, value]) => Array.isArray(value) && value.length === 0)

// Diff processing functional area
// const compareContent =
//   (attributes: Map<string, SharedFileMetadata>) =>
//   (
//     contentAtRef: any,
//     otherContent: any,
//     // eslint-disable-next-line no-unused-vars
//     predicat: (arg0: any, arg1: string, arg2: string) => boolean
//   ): Manifest => {
//     const v: ManifestTypeMember[] = getSubTypeTags(attributes)(
//       contentAtRef
//     ).flatMap(
//       processMetadataForSubType(
//         contentAtRef,
//         otherContent,
//         predicat,
//         attributes
//       )
//     )
//     const store: Manifest = new Map()
//     v.forEach((nameByType: ManifestTypeMember) => addToStore(store)(nameByType))
//     return store
//   }

// const processMetadataForSubType =
//   (
//     baseContent: any,
//     otherContent: any,
//     // eslint-disable-next-line no-unused-vars
//     predicat: (arg0: any, arg1: string, arg2: string) => boolean,
//     attributes: Map<string, SharedFileMetadata>
//   ) =>
//   (subType: string): ManifestTypeMember[] => {
//     const baseMeta = extractMetadataForSubtype(baseContent)(subType)
//     const otherMeta = extractMetadataForSubtype(otherContent)(subType)
//     const processElement = getElementProcessor(
//       subType,
//       predicat,
//       otherMeta,
//       attributes
//     )
//     return baseMeta
//       .map(processElement)
//       .filter(x => x !== undefined) as ManifestTypeMember[]
//   }
const extractRootMetadata = (fileContent: any): any => {
  const keys = Object.keys(fileContent)
  for (const key of keys) {
    if (key !== XML_HEADER_ATTRIBUTE_KEY) {
      return fileContent[key] ?? {}
    }
  }
  return {}
}

const extractMetadataForSubtype = (
  rootMetadata: any,
  subType: string
): string[] => {
  return asArray(rootMetadata[subType])
}

const processElement = (
  elem: any,
  subType: string,
  predicat: (arg0: any, arg1: string, arg2: string) => boolean,
  otherMeta: string[],
  attributes: Map<string, SharedFileMetadata>
): ManifestTypeMember | undefined => {
  if (predicat(otherMeta, subType, elem)) {
    return {
      type: attributes.get(subType)!.xmlName!,
      member: selectKey(attributes)(subType)(elem),
    }
  }
  return undefined
}

const processMetadataForSubType = async (
  rootBaseContent: any,
  rootOtherContent: any,
  subType: string,
  predicat: (arg0: any, arg1: string, arg2: string) => boolean,
  attributes: Map<string, SharedFileMetadata>
): Promise<ManifestTypeMember[]> => {
  const [baseMeta, otherMeta] = await Promise.all([
    extractMetadataForSubtype(rootBaseContent, subType),
    extractMetadataForSubtype(rootOtherContent, subType),
  ])

  return baseMeta
    .map(elem => processElement(elem, subType, predicat, otherMeta, attributes))
    .filter(Boolean) as ManifestTypeMember[]
}

const compareContentAsync = async (
  attributes: Map<string, SharedFileMetadata>,
  contentAtRef: any,
  otherContent: any,
  predicat: (arg0: any, arg1: string, arg2: string) => boolean
): Promise<Manifest | undefined> => {
  const rootBaseContent = extractRootMetadata(contentAtRef)
  const rootOtherContent = extractRootMetadata(otherContent)
  const subTypes = getSubTypeTags(attributes)(rootBaseContent)

  // Function to handle worker threads
  const runWorker = (subTypeBatch: string[]): Promise<ManifestTypeMember[]> => {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, {
        workerData: {
          rootBaseContent,
          rootOtherContent,
          subTypeBatch,
          attributes: Array.from(attributes.entries()),
          predicat: predicat.toString(),
        },
      })
      worker.on('message', resolve)
      worker.on('error', reject)
      worker.on('exit', code => {
        if (code !== 0)
          reject(new Error(`Worker stopped with exit code ${code}`))
      })
    })
  }

  if (isMainThread) {
    const batchSize = 5
    const promises = []
    for (let i = 0; i < subTypes.length; i += batchSize) {
      const subTypeBatch = subTypes.slice(i, i + batchSize)
      promises.push(runWorker(subTypeBatch))
    }
    const results = (await Promise.all(promises)).flat()
    const store: Manifest = new Map()
    results.forEach(nameByType => addToStore(store)(nameByType))
    return store
  } else {
    const {
      rootBaseContent,
      rootOtherContent,
      subTypeBatch,
      attributes,
      predicat,
    } = workerData

    const attributesMap = new Map<string, SharedFileMetadata>(attributes)
    const predicatFn = predicat

    const results = await Promise.all(
      subTypeBatch.map((subType: string) =>
        processMetadataForSubType(
          rootBaseContent,
          rootOtherContent,
          subType,
          predicatFn,
          attributesMap
        )
      )
    )
    parentPort?.postMessage(results.flat())
    return undefined
  }
}

// const getElementProcessor =
//   (
//     type: string,
//     // eslint-disable-next-line no-unused-vars
//     predicat: (arg0: any, arg1: string, arg2: string) => boolean,
//     otherMeta: string[],
//     attributes: Map<string, SharedFileMetadata>
//   ) =>
//   (elem: any) => {
//     let metadataMember
//     if (predicat(otherMeta, type, elem)) {
//       metadataMember = {
//         type: attributes.get(type)!.xmlName,
//         member: selectKey(attributes)(type)(elem),
//       }
//     }
//     return metadataMember
//   }

// Partial JSON generation functional area
// Side effect on jsonContent
const generatePartialJSON =
  (attributes: Map<string, SharedFileMetadata>) =>
  (jsonContent: any) =>
  (store: Manifest) => {
    const storeHasMember = hasMember(store)(attributes)
    return getSubTypeTags(attributes)(jsonContent).reduce((acc, subType) => {
      const meta = extractMetadataForSubtype(jsonContent, subType)
      const storeHasMemberForType = storeHasMember(subType)
      const key = selectKey(attributes)(subType)
      const rootMetadata = getRootMetadata(acc)
      rootMetadata[subType] = meta.filter(elem =>
        storeHasMemberForType(key(elem))
      )
      return acc
    }, structuredClone(jsonContent))
  }

export default class MetadataDiff {
  protected toContent: any
  protected add!: Manifest
  constructor(
    // eslint-disable-next-line no-unused-vars
    protected readonly config: Config,
    // eslint-disable-next-line no-unused-vars
    protected readonly metadata: MetadataRepository,
    // eslint-disable-next-line no-unused-vars
    protected readonly attributes: Map<string, SharedFileMetadata>
  ) {}

  public async compare(path: string) {
    this.toContent = await parseXmlFileToJson(
      { path, oid: this.config.to },
      this.config
    )
    const fromContent = await parseXmlFileToJson(
      { path, oid: this.config.from },
      this.config
    )

    // const diff = compareContent(this.attributes)

    // Added or Modified
    // this.add = diff(
    //   this.toContent,
    //   fromContent,
    //   (meta: any[], type: string, elem: string) => {
    //     const key = selectKey(this.attributes)(type)
    //     const match = meta.find((el: string) => key(el) === key(elem))
    //     return !match || !isEqual(match, elem)
    //   }
    // )

    const add = await compareContentAsync(
      this.attributes,
      this.toContent,
      fromContent,
      (otherMeta, type, elem) => {
        const key = selectKey(this.attributes)(type)
        const match = otherMeta.find((el: string) => key(el) === key(elem))
        return !match || !isEqual(match, elem)
      }
    )

    this.add = add || new Map()

    // Will be done when not needed
    // Deleted
    // const del = diff(
    //   fromContent,
    //   this.toContent,
    //   (meta: any[], type: string, elem: string) => {
    //     const key = selectKey(this.attributes)(type)
    //     return !meta.some((el: string) => key(el) === key(elem))
    //   }
    // )

    let del = await compareContentAsync(
      this.attributes,
      fromContent,
      this.toContent,
      (otherMeta, type, elem) => {
        const key = selectKey(this.attributes)(type)
        return !otherMeta.some((el: string) => key(el) === key(elem))
      }
    )

    del = del || new Map()

    return {
      added: this.add,
      deleted: del,
    }
  }

  public prune() {
    const prunedContent = generatePartialJSON(this.attributes)(this.toContent)(
      this.add
    )

    const xmlContent: string = convertJsonToXml(prunedContent)
    const onlyNonEmptyLines: string[] = []
    for (const line of xmlContent.split('\n')) {
      if (line.trim().length > 0) {
        onlyNonEmptyLines.push(line)
      }
    }

    return {
      xmlContent: onlyNonEmptyLines.join('\n'),
      isEmpty: isEmpty(prunedContent),
    }
  }
}
