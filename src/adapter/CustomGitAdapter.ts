import { join } from 'path'

import { readFile } from 'fs-extra'
import { simpleGit, SimpleGit } from 'simple-git'

import { GIT_FOLDER, UTF8_ENCODING } from '../constant/gitConstants'
import { Config } from '../types/config'
import { FileGitRef } from '../types/git'
import {
  dirExists,
  fileExists,
  readAllFilesInDirectory,
  treatPathSep,
} from '../utils/fsUtils'

const firstCommitParams = ['rev-list', '--max-parents=0', 'HEAD']

export default class CustomGitAdapter {
  private static instances: Map<Config, CustomGitAdapter> = new Map()

  public static getInstance(config: Config): CustomGitAdapter {
    if (!CustomGitAdapter.instances.has(config)) {
      const instance = new CustomGitAdapter(config)
      CustomGitAdapter.instances.set(config, instance)
    }

    //@ts-expect-error The instance is created in the if block
    return CustomGitAdapter.instances.get(config)
  }

  private readonly config: Config
  private gitDirectory: string
  protected readonly simpleGit: SimpleGit
  private readonly reverseParsedRevs: Map<string, string> = new Map<
    string,
    string
  >()

  private constructor(config: Config) {
    this.config = config
    this.gitDirectory = config.repo
    this.simpleGit = simpleGit(config.repo)
  }

  public async configureRepository() {
    // Do nothing.
  }

  public async setGitDir(): Promise<void> {
    if (this.gitDirectory) {
      return
    }

    if (await dirExists(join(this.gitDirectory, GIT_FOLDER))) {
      this.gitDirectory = join(this.gitDirectory, GIT_FOLDER)
    } else if (await fileExists(join(this.gitDirectory, GIT_FOLDER))) {
      const gitFileContent = await readFile(join(this.gitDirectory, GIT_FOLDER))
      this.gitDirectory = gitFileContent.toString().trim().substring(8)
    } else {
      throw new Error('Not a git repository')
    }
  }

  public async parseRev(ref: string) {
    const parsedRev = await this.simpleGit.revparse([ref])
    this.reverseParsedRevs.set(parsedRev, ref)
    return parsedRev
  }

  public async pathExists(path: string) {
    try {
      const isExistingDir: boolean = await dirExists(treatPathSep(path))
      const isExistingFile: boolean = await fileExists(treatPathSep(path))

      return isExistingDir || isExistingFile
    } catch {
      return false
    }
  }

  public async getFirstCommitRef() {
    const sha = await this.simpleGit.raw(firstCommitParams)
    return sha
  }

  public async getStringContent(forRef: FileGitRef): Promise<string> {
    let gitReference = null
    if (this.reverseParsedRevs.has(forRef.oid)) {
      gitReference = this.reverseParsedRevs.get(forRef.oid)
    }

    if (gitReference != null && gitReference == 'HEAD') {
      return await this.getStringContentFromDisk(forRef)
    }

    return await this.getStringContentFromGitHistory(forRef)
  }

  private async getStringContentFromDisk(forRef: FileGitRef): Promise<string> {
    try {
      const bufferData = await readFile(join(this.gitDirectory, forRef.path))
      return bufferData?.toString(UTF8_ENCODING) ?? ''
    } catch (error) {
      const err = error as Error
      if (err.name === 'NotFoundError') {
        return ''
      } else {
        throw error
      }
    }
  }

  private async getStringContentFromGitHistory(
    forRef: FileGitRef
  ): Promise<string> {
    return await this.simpleGit.show([`${forRef.oid}:${forRef.path}`])
  }

  public async getFilesPath(path: string): Promise<string[]> {
    // Read all files in all subdirectories of `path`
    const treatedPath = treatPathSep(path)

    if (await fileExists(treatedPath)) {
      return [path]
    }

    return await readAllFilesInDirectory(path)
  }

  public async getFilesFrom(
    path: string
  ): Promise<{ path: string; content: Buffer }[]> {
    // If is file, read file as Buffer; if is directory, read all files in directory as Buffer
    const bufferFiles: { path: string; content: Buffer }[] = []

    if (await dirExists(path)) {
      const filesInDir: string[] = await this.getFilesPath(path)
      for (const filePath in filesInDir) {
        bufferFiles.push({
          path: treatPathSep(filePath),
          content: await readFile(
            join(this.gitDirectory, treatPathSep(filePath))
          ),
        })
      }
    } else if (await fileExists(path)) {
      bufferFiles.push({
        path: treatPathSep(path),
        content: await readFile(join(this.gitDirectory, treatPathSep(path))),
      })
    } else {
      throw new Error(`Path ${path} does not exist in ${this.config.to}`)
    }

    return bufferFiles
  }

  public async getDiffLines() {
    // git diff from...to
    const output: string = await this.simpleGit.diff([
      `${this.config.from}..${this.config.to}`,
      '--name-status',
    ])
    return output.split('\n')
  }
}
