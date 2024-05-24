'use strict'
import { join } from 'path'
import { GIT_FOLDER, GIT_PATH_SEP } from '../constant/gitConstants'
import { readFile as fsReadFile, outputFile, copySync } from 'fs-extra'
import { UTF8_ENCODING } from '../constant/fsConstants'
import { EOLRegex, getSpawnContent } from './childProcessUtils'
import { isLFS, getLFSObjectContentPath } from './gitLfsHelper'

import GitAdapter from '../adapter/GitAdapter'
import { Config } from '../types/config'
import { FileGitRef } from '../types/git'

import { treatPathSep } from './fsUtils'
import { buildIgnoreHelper } from './ignoreHelper'

import { existsSync, lstatSync, mkdirSync } from 'fs'

const FOLDER = 'tree'

export const gitPathSeparatorNormalizer = (path: string) =>
  path.replace(/\\+/g, GIT_PATH_SEP)
const copiedFiles = new Set()
const writtenFiles = new Set()

export const copyFiles = async (config: Config, src: string) => {
  if (copiedFiles.has(src) || writtenFiles.has(src)) return true
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
      if (await isDirectory(treatPathSep(src))) {
        // Copy all files from directory to dst
        const sourceDir = dst.replace(config.output + '/', '')
        copySync(sourceDir, dst, { overwrite: false })
      } else {
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
    return false;
  }
}

const readPathFromGitAsBuffer = async (path: string, { repo, to }: { repo: string; to: string }) => {
  // Custom: "git show HEAD:<FILE>" command was replaced by "cat <FILE>" for better performance.
  to = to
  const normalizedPath = gitPathSeparatorNormalizer(path)

  let command = 'git'
  let args = ['--no-pager', 'show', `${to}:${normalizedPath}`]
  const options = {
    cwd: repo,
  }

  if (to == 'HEAD') {
    command = 'cat'
    args = [`${normalizedPath}`]
  }

  if (await isDirectory(path)) {
    command = 'ls'
    args = [`${normalizedPath}`]
  }

  let bufferData: Buffer = await getSpawnContent(command, args, options)
  if (isLFS(bufferData)) {
    const lsfPath = getLFSObjectContentPath(bufferData)
    bufferData = await fsReadFile(join(repo, lsfPath))
  }
  
  return bufferData
}

export const readPathFromGit = async (path: string, config: Config) => {
  let utf8Data = ''
  try {
    const bufferData = await readPathFromGitAsBuffer(path, config)
    utf8Data = bufferData.toString(UTF8_ENCODING)
  } catch (e) {
    // console.log(`[readPathFromGit] Exception thrown: ${e}`)
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
