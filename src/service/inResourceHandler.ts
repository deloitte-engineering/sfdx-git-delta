'use strict'
import { join, parse } from 'path'

import { DOT, PATH_SEP } from '../constant/fsConstants'
import { META_REGEX, METAFILE_SUFFIX } from '../constant/metadataConstants'
import { MetadataRepository } from '../metadata/MetadataRepository'
import type { Work } from '../types/work'
import { pathExists } from '../utils/fsHelper'

import StandardHandler from './standardHandler'

export default class ResourceHandler extends StandardHandler {
  protected readonly metadataName: string

  constructor(
    line: string,
    type: string,
    work: Work,
    metadata: MetadataRepository
  ) {
    super(line, type, work, metadata)
    this.metadataName = this._getMetadataName()
  }

  public override async handleAddition() {
    await super.handleAddition()
    if (!this.config.generateDelta) return

    if (this.line !== this.metadataName && this._parentFolderIsNotTheType()) {
      let dirToBeCopied = this.metadataName;

      if (dirToBeCopied.endsWith('digitalExperiences/site')) {
        /*
        In digitalExpierences/site, multiple sites can be stored and deployed individually.

        In this case, `this.metadataName` is equal to `${sourcePath}/digitalExperiences/site`, forcing a copy of 
        all sites in the directory even though some of them don't have changes.
        */
        dirToBeCopied = `${this.metadataName}/${this._getRootElementAfterMetadataName()}`;
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
      super.handleDeletion()
    }
  }

  protected override _getElementName() {
    const parsedPath = this._getParsedPath()
    return parsedPath.name
  }

  protected override _getParsedPath() {
    return parse(
      this.splittedLine[this.splittedLine.indexOf(this.type) + 1]
        .replace(META_REGEX, '')
        .replace(this.suffixRegex, '')
    )
  }

  protected override _isProcessable() {
    return true
  }

  protected _getMetadataName() {
    const resourcePath = []
    for (const pathElement of this.splittedLine) {
      if (resourcePath.slice(-2)[0] === this.type) {
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
    let rootElement = this.splittedLine.join('/').replace(`${this.metadataName}/`, '').trim();

    if (rootElement.includes('/')) {
      rootElement = rootElement.split('/')[0].trim();
    }

    return rootElement;
  }

  protected override _getMetaTypeFilePath() {
    return `${this.metadataName}.${this.metadataDef.suffix}${METAFILE_SUFFIX}`
  }
}
