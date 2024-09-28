'use strict'
import { join, parse } from 'path'

import { DOT, PATH_SEP } from '../constant/fsConstants'
import { METAFILE_SUFFIX, META_REGEX } from '../constant/metadataConstants'
import { pathExists, readDir } from '../utils/fsHelper'

import StandardHandler from './standardHandler'

export default class ResourceHandler extends StandardHandler {
  protected metadataName: string | undefined

  public override async handleAddition() {
    this.metadataName = this._getMetadataName()
    await super.handleAddition()
    if (!this.config.generateDelta) return

    if (this.line !== this.metadataName && this._parentFolderIsNotTheType()) {
      let dirToBeCopied = this.metadataName

      if (dirToBeCopied.endsWith('digitalExperiences/site')) {
        /*
        In digitalExpierences/site, multiple sites can be stored and deployed individually.

        In this case, `this.metadataName` is equal to `${sourcePath}/digitalExperiences/site`, forcing a copy of 
        all sites in the directory even though some of them don't have changes.
        */
        dirToBeCopied = `${this.metadataName}/${this._getRootElementAfterMetadataName()}`
      }

      await this._copy(dirToBeCopied)
    }
  }

  public override async handleDeletion() {
    const [, elementPath, elementName] = this._parseLine()!
    const exists = await pathExists(join(elementPath, elementName), this.config)
    if (exists) {
      await this.handleModification()
    } else {
      await super.handleDeletion()
    }
  }

  protected async _copyResourceFiles() {
    const staticResourcePath = this.metadataName!.substring(
      0,
      this.metadataName!.lastIndexOf(PATH_SEP)
    )
    const allStaticResources = await readDir(
      staticResourcePath,
      this.work.config
    )
    const resourceFiles = allStaticResources.filter((file: string) =>
      file.startsWith(this.metadataName!)
    )
    for (const resourceFile of resourceFiles) {
      await this._copy(resourceFile)
    }
  }

  protected override _getElementName() {
    const parsedPath = this._getParsedPath()
    return parsedPath.name
  }

  protected override _getParsedPath() {
    const base =
      !this.metadataDef.excluded && this.ext === this.metadataDef.suffix
        ? this.splittedLine.at(-1)!
        : this.splittedLine[
            this.splittedLine.indexOf(this.metadataDef.directoryName) + 1
          ]
    return parse(base.replace(META_REGEX, ''))
  }

  protected override _isProcessable() {
    return true
  }

  protected _getMetadataName() {
    const resourcePath = []
    for (const pathElement of this.splittedLine) {
      if (resourcePath.slice(-2)[0] === this.metadataDef.directoryName) {
        break
      }
      resourcePath.push(pathElement)
    }
    const lastPathElement = resourcePath[resourcePath.length - 1]
      .replace(METAFILE_SUFFIX, '')
      .split(DOT)
    if (lastPathElement.length > 1) {
      lastPathElement.pop()
    }

    resourcePath[resourcePath.length - 1] = lastPathElement.join(DOT)
    return `${resourcePath.join(PATH_SEP)}`
  }

  protected _getRootElementAfterMetadataName() {
    let rootElement = this.splittedLine
      .join('/')
      .replace(`${this.metadataName}/`, '')
      .trim()

    if (rootElement.includes('/')) {
      rootElement = rootElement.split('/')[0].trim()
    }

    return rootElement
  }

  protected override _getMetaTypeFilePath() {
    // If `this.line` (the entire Git diff line) is a LWC JavaScript file, the builded meta file is wrong because there is no `suffix` definition
    if (this.line.includes(`/lwc/`) && this.line.endsWith('.js')) {
      return `${this.line}${METAFILE_SUFFIX}`
    }

    return `${this.metadataName}.${this.metadataDef.suffix}${METAFILE_SUFFIX}`
  }

  protected override _shouldCopyMetaFile(): boolean {
    return true
  }
}
