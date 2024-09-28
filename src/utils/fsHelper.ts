'use strict'
import CustomGitAdapter from '../adapter/CustomGitAdapter'
import type { Config } from '../types/config'

import { join } from 'path'
import { outputFile, copySync } from 'fs-extra'
import { treatPathSep } from './fsUtils'
import { buildIgnoreHelper } from './ignoreHelper'

import { lstatSync } from 'fs'
import { FileGitRef } from '../types/git'

const copiedFiles = new Set()
const writtenFiles: Map<string, string> = new Map();  // Instead of blindly checking only if the file was already overwritten, also check if the new content is different from the previous overwriting's content.

export const copyFiles = async (config: Config, src: string) => {
  if (copiedFiles.has(src) || writtenFiles.has(src)) return true
  copiedFiles.add(src)

  const ignoreHelper = await buildIgnoreHelper(config)
  if (ignoreHelper.globalIgnore.ignores(src)) {
    return
  }
  try {
    if (await isDirectory(treatPathSep(src))) {
      // Copy all files from directory to dst
      const dst = config.output + '/' + src
      copySync(src, dst, { overwrite: false })
    } else {
      const gitAdapter = CustomGitAdapter.getInstance(config)
      const files = await gitAdapter.getFilesFrom(treatPathSep(src))
      for (const file of files) {
        // Use Buffer to output the file content
        // Let fs implementation detect the encoding ("utf8" or "binary")
        const dst = join(config.output, file.path)

        // Write bufferData in dst
        await outputFile(dst, file.content)
      }
    }
    return true
  } catch (e) {
    // console.log(`[copyFiles] Exception thrown: ${e}`)
    /* empty */
    return false
  }
}

const isDirectory = async (path: string) => {
  try {
    return lstatSync(path).isDirectory()
  } catch {
    // Path does not exist. Defaulting to false
    return false
  }
}

export const readPathFromGit = async (forRef: FileGitRef, config: Config) => {
  let utf8Data = ''
  try {
    const gitAdapter = CustomGitAdapter.getInstance(config)
    utf8Data = await gitAdapter.getStringContent(forRef)
  } catch (error) {
    /* empty */
  }
  return utf8Data
}

export const pathExists = async (path: string, config: Config) => {
  const gitAdapter = CustomGitAdapter.getInstance(config)
  try {
    return await gitAdapter.pathExists(path)
  } catch {
    return false
  }
}

export const readDir = async (
  path: string,
  config: Config
): Promise<string[]> => {
  const gitAdapter = CustomGitAdapter.getInstance(config)
  return await gitAdapter.getFilesPath(path)
}

export const writeFile = async (
  path: string,
  content: string,
  config: Config
) => {
  if (writtenFiles.has(path) && writtenFiles.get(path) == content) {
    return
  }
  writtenFiles.set(path, content)

  const ignoreHelper = await buildIgnoreHelper(config)
  if (ignoreHelper.globalIgnore.ignores(path)) {
    return
  }
  await outputFile(join(config.output, treatPathSep(path)), content)
}
