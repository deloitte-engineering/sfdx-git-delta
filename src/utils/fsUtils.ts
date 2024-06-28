'use strict'
import { isAbsolute, join, normalize, relative } from 'path'

import { stat, readFile as fsReadFile, readdirSync } from 'fs-extra'

import {
  PATH_SEPARATOR_REGEX,
  UTF8_ENCODING,
  PATH_SEP,
} from '../constant/fsConstants'

export const treatPathSep = (data: string) =>
  data.replace(PATH_SEPARATOR_REGEX, PATH_SEP)

export const sanitizePath = (data: string) =>
  data ? normalize(treatPathSep(data)) : data

export const isSubDir = (parent: string, dir: string) => {
  const rel = relative(parent, dir)
  return !!rel && !rel.startsWith('..') && !isAbsolute(rel)
}

export const dirExists = async (dir: string) => {
  try {
    const st = await stat(dir)
    return st.isDirectory()
  } catch {
    return false
  }
}

export const fileExists = async (file: string) => {
  try {
    const st = await stat(file)
    return st.isFile()
  } catch {
    return false
  }
}

export const readFile = async (path: string) => {
  const file = await fsReadFile(path, {
    encoding: UTF8_ENCODING,
  })
  return file
}

export const readAllFilesInDirectory = async (dir: string) => {
  const children = readdirSync(dir, { withFileTypes: true })

  const files: string[] = []
  for (const child of children) {
    if (child.isDirectory()) {
      files.push(...(await readAllFilesInDirectory(join(dir, child.name))))
    } else {
      files.push(join(dir, child.name))
    }
  }

  return files
}
