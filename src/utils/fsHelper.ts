'use strict'
import { join } from 'path'
import { GIT_FOLDER, GIT_PATH_SEP } from '../constant/gitConstants'
import { readFile as fsReadFile, outputFile, copySync } from 'fs-extra'
import { UTF8_ENCODING } from '../constant/fsConstants'
import { EOLRegex, getSpawnContent, treatPathSep } from './childProcessUtils'
import { isLFS, getLFSObjectContentPath } from './gitLfsHelper'
import { buildIgnoreHelper } from './ignoreHelper'
import { dirExists, fileExists } from './fsUtils'
import { Config } from '../types/config'

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
    const bufferData: Buffer = await readPathFromGitAsBuffer(src, config)
    const utf8Data = bufferData?.toString(UTF8_ENCODING) ?? ''

    if (utf8Data.startsWith(FOLDER)) {
      const [header, , ...files] = utf8Data.split(EOLRegex)
      const folder = header.split(':')[1]
      for (const file of files) {
        const fileSrc = join(folder, file)

        await copyFiles(config, fileSrc)
      }
    } else {
      const dst = join(config.output, treatPathSep(src))
      // Use Buffer to output the file content
      // Let fs implementation detect the encoding ("utf8" or "binary")
      if (await isDirectory(treatPathSep(src))) {
        // Copy all files from directory to dst
        const sourceDir = dst.replace(config.output + '/', '')
        copySync(sourceDir, dst, { overwrite: false })
      } else {
        // Write bufferData in dst
        await outputFile(dst, bufferData)
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
  const data = await readPathFromGit(path, config)
  return !!data
}

export const readDir = async (dir: string, config: Config) => {
  const data = await readPathFromGit(dir, config)
  const dirContent: string[] = []
  if (data.startsWith(FOLDER)) {
    const [, , ...files] = data.split(EOLRegex)
    dirContent.push(...files)
  }
  return dirContent
}

export async function* scan(
  dir: string,
  config: Config
): AsyncGenerator<string, void, void> {
  const entries = await readDir(dir, config)
  for (const file of entries) {
    const filePath = join(dir, file)
    if (file.endsWith(GIT_PATH_SEP)) {
      yield* scan(filePath, config)
    } else {
      yield filePath
      //yield new Promise<string>(resolve => resolve(filePath))
    }
  }
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

export const scanExtension = async (
  dir: string,
  ext: string,
  config: Config
): Promise<string[]> => {
  const result = []
  for await (const file of scan(dir, config)) {
    if (file.endsWith(ext)) {
      result.push(file)
    }
  }
  return result
}

export const isGit = async (dir: string) => {
  const isGitDir = await dirExists(join(dir, GIT_FOLDER))
  const isGitFile = await fileExists(join(dir, GIT_FOLDER))

  return isGitDir || isGitFile
}

export const DOT = '.'
