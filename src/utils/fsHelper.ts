'use strict'
import { readFile as fsReadFile } from 'fs-extra'
import { isAbsolute, join, relative } from 'path'
import { outputFile, stat } from 'fs-extra'
import {
  GIT_FOLDER,
  GIT_PATH_SEP,
  UTF8_ENCODING,
} from './gitConstants'
import { EOLRegex, getSpawnContent } from './childProcessUtils'

import GitAdapter from '../adapter/GitAdapter'
import type { Config } from '../types/config'
import type { FileGitRef } from '../types/git'

import { treatPathSep } from './fsUtils'
import { buildIgnoreHelper } from './ignoreHelper'


const copiedFiles = new Set()
const writtenFiles = new Set()

export const gitPathSeparatorNormalizer = (path: string) =>
  path.replace(/\\+/g, GIT_PATH_SEP)

export const copyFiles = async (config: Config, src: string) => {
  if (copiedFiles.has(src) || writtenFiles.has(src)) {
    return
  }
  copiedFiles.add(src)

  const ignoreHelper = await buildIgnoreHelper(config)
  if (ignoreHelper.globalIgnore.ignores(src)) {
    return
  }
  try {
    const gitAdapter = GitAdapter.getInstance(config)
    const files = await gitAdapter.getFilesFrom(treatPathSep(src))
    for (const file of files) {
      // Use Buffer to output the file content
      // Let fs implementation detect the encoding ("utf8" or "binary")
      const dst = join(config.output, file.path)
      await outputFile(treatPathSep(dst), file.content)
      copiedFiles.add(dst)
    }
  } catch {
    /* empty */
  }
}

const readPathFromGitAsBuffer = async (path: string, { repo, to }: { repo: string; to: string }) => {
  // Custom: "git show HEAD:<FILE>" command was replaced by "cat <FILE>" for better performance.
  to = to
  const normalizedPath = gitPathSeparatorNormalizer(path)
  const bufferData: Buffer = await getSpawnContent(
    "cat",
    [`${normalizedPath}`],
    {
      cwd: repo,
    }
  )

  return bufferData
}

export const readPathFromGit = async (forRef: FileGitRef, config: Config) => {
  let utf8Data = ''
  try {
    const gitAdapter = GitAdapter.getInstance(config)
    utf8Data = await gitAdapter.getStringContent(forRef)
  } catch {
    /* empty */
  }
  return utf8Data
}

export const pathExists = async (path: string, config: Config) => {
  const gitAdapter = GitAdapter.getInstance(config)
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
  const gitAdapter = GitAdapter.getInstance(config)
  return await gitAdapter.getFilesPath(path)
}

export const writeFile = async (
  path: string,
  content: string,
  config: Config
) => {
  if (writtenFiles.has(path)) {
    return
  }
  writtenFiles.add(path)

  const ignoreHelper = await buildIgnoreHelper(config)
  if (ignoreHelper.globalIgnore.ignores(path)) {
    return
  }
  await outputFile(join(config.output, treatPathSep(path)), content)
}
