'use strict'
import { join, parse } from 'path'

import { EXTENSION_SUFFIX_REGEX, PATH_SEP } from '../constant/fsConstants'
import {
  INFOLDER_SUFFIX,
  META_REGEX,
  METAFILE_SUFFIX,
} from '../constant/metadataConstants'
import { readDir } from '../utils/fsHelper'

import StandardHandler from './standardHandler'

const INFOLDER_SUFFIX_REGEX = new RegExp(`${INFOLDER_SUFFIX}$`)
export default class InFolderHandler extends StandardHandler {
  override async handleAddition() {
    await super.handleAddition()
    if (!this.config.generateDelta) return
    await this._copyFolderMetaFile()
    await this._copySpecialExtension()
  }

  protected async _copyFolderMetaFile() {
    const [folderPathAndName, folderPath, folderName] = this._parseLine()!

    // Copy folder meta file
    await this._copyFolderMetaFileSpecificPath(folderPath, folderName)

    // Copy meta files for subfolders (if existing)
    const subdirectories: string[] = this.line
      .replace(`${folderPathAndName}/`, '')
      .includes('/')
      ? this.line
          .replace(`${folderPathAndName}/`, '')
          .trim()
          .split('/')
          .slice(0, -1)
      : []

    let subdirectoryFolderPath = folderPathAndName
    for (const subdirectory of subdirectories) {
      await this._copyFolderMetaFileSpecificPath(
        subdirectoryFolderPath,
        subdirectory.trim()
      )
      subdirectoryFolderPath = join(subdirectoryFolderPath, subdirectory)
    }
  }

  protected async _copyFolderMetaFileSpecificPath(
    folderPath: string,
    folderName: string
  ) {
    // Copy ${component}.${componentType}-meta.xml (e.g.: `someDashboard.dashboard-meta.xml`)
    let suffix = folderName.endsWith(INFOLDER_SUFFIX)
      ? ''
      : `.${this.metadataDef.suffix!.toLowerCase()}`

    let folderFileName = `${folderName}${suffix}${METAFILE_SUFFIX}`

    await this._copyWithMetaFile(join(folderPath, folderFileName))

    // Copy ${component}.${componentType}Folder-meta.xml (e.g.: `someDashboard.dashboardFolder-meta.xml`)
    suffix = folderName.endsWith(
      `.${this.metadataDef.suffix!.toLowerCase()}${INFOLDER_SUFFIX}`
    )
      ? ''
      : `.${this.metadataDef.suffix!.toLowerCase()}${INFOLDER_SUFFIX}`

    folderFileName = `${folderName}${suffix}${METAFILE_SUFFIX}`

    await this._copyWithMetaFile(join(folderPath, folderFileName))
  }

  protected async _copySpecialExtension() {
    const parsedLine = parse(this.line)
    const dirContent = await readDir(parsedLine.dir, this.config)

    await Promise.all(
      dirContent
        .filter((file: string) => file.startsWith(parsedLine.name))
        .map((file: string) => this._copyWithMetaFile(file))
    )
  }

  protected override _getElementName() {
    return this.splittedLine
      .slice(this.splittedLine.indexOf(this.metadataDef.directoryName) + 1)
      .join(PATH_SEP)
      .replace(META_REGEX, '')
      .replace(INFOLDER_SUFFIX_REGEX, '')
      .replace(EXTENSION_SUFFIX_REGEX, '')
  }

  protected override _isProcessable() {
    return (
      super._isProcessable() ||
      this._parentFolderIsNotTheType() ||
      this.ext!.endsWith(INFOLDER_SUFFIX)
    )
  }
}
