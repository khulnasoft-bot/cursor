/**
 * Cursor File Service
 * Handles indexing and retrieval for file operations
 * Extracted and adapted from Cursor's file service
 */

import * as fs from 'fs'
import * as path from 'path'
import { Logger, ConsoleLogger } from './logger'
import {
    FileServiceConfig,
    IndexingOptions,
    SearchOptions,
    SearchResult,
    FileIndex,
    DEFAULT_INDEXING_OPTIONS,
    DEFAULT_FILE_SERVICE_CONFIG
} from './config'

class FileService {
    private index: Map<string, FileIndex> = new Map()
    private indexingInProgress = false
    private indexCachePath: string
    private config: Required<FileServiceConfig>
    private logger: Logger

    constructor(config?: FileServiceConfig, logger?: Logger) {
        this.config = {
            cachePath: config?.cachePath || this.getDefaultCachePath(),
            defaultIndexingOptions: config?.defaultIndexingOptions || DEFAULT_INDEXING_OPTIONS,
            enableCache: config?.enableCache ?? true,
            logger: logger || new ConsoleLogger()
        }
        this.indexCachePath = this.config.cachePath
        this.logger = this.config.logger!

        if (this.config.enableCache) {
            this.loadIndexFromCache()
        }
    }

    private getDefaultCachePath(): string {
        const homeDir = typeof process !== 'undefined' && process.env.HOME ? process.env.HOME : '.'
        return path.join(homeDir, '.cursor-file-index.json')
    }

    async indexDirectory(directoryPath: string, options?: IndexingOptions): Promise<void> {
        if (this.indexingInProgress) {
            this.logger.warn('Indexing already in progress')
            return
        }

        this.indexingInProgress = true
        this.logger.info(`Starting indexing of directory: ${directoryPath}`)

        try {
            const mergedOptions: IndexingOptions = {
                ...DEFAULT_INDEXING_OPTIONS,
                ...this.config.defaultIndexingOptions,
                ...options
            }

            await this.walkDirectory(directoryPath, mergedOptions)
            
            if (this.config.enableCache) {
                await this.saveIndexToCache()
            }
            
            this.logger.info(`Indexing complete. Total files indexed: ${this.index.size}`)
        } catch (error) {
            this.logger.error('Error during indexing:', error)
            throw error
        } finally {
            this.indexingInProgress = false
        }
    }

    private async walkDirectory(dirPath: string, options: IndexingOptions, currentDepth: number = 0): Promise<void> {
        // Check max depth
        if (options.maxDepth !== undefined && currentDepth >= options.maxDepth) {
            return
        }

        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)

            // Skip excluded directories
            if (entry.isDirectory() && options.excludePatterns && options.excludePatterns.some(pattern =>
                this.matchesPattern(entry.name, pattern) || this.matchesPattern(fullPath, pattern)
            )) {
                this.logger.debug(`Skipping excluded directory: ${fullPath}`)
                continue
            }

            if (entry.isDirectory()) {
                await this.walkDirectory(fullPath, options, currentDepth + 1)
            } else if (entry.isFile()) {
                await this.indexFile(fullPath, options)
            }
        }
    }

    private matchesPattern(text: string, pattern: string): boolean {
        // Simple glob pattern matching
        const regexPattern = pattern
            .replace(/\*/g, '.*')
            .replace(/\?/g, '.')
        const regex = new RegExp(regexPattern, 'i')
        return regex.test(text)
    }

    private async indexFile(filePath: string, options: IndexingOptions): Promise<void> {
        try {
            const stats = await fs.promises.stat(filePath)

            // Skip files larger than max size
            if (options.maxFileSize !== undefined && stats.size > options.maxFileSize) {
                this.logger.debug(`Skipping large file: ${filePath} (${stats.size} bytes)`)
                return
            }

            // Check if file needs reindexing
            const existingIndex = this.index.get(filePath)
            if (existingIndex && existingIndex.lastModified >= stats.mtimeMs) {
                this.logger.debug(`Skipping unchanged file: ${filePath}`)
                return
            }

            const content = await fs.promises.readFile(filePath, 'utf-8')
            const language = this.detectLanguage(filePath)

            this.index.set(filePath, {
                path: filePath,
                content,
                lastModified: stats.mtimeMs,
                size: stats.size,
                language
            })

            this.logger.debug(`Indexed file: ${filePath}`)
        } catch (error) {
            this.logger.warn(`Failed to index file ${filePath}:`, error)
        }
    }

    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase()
        const languageMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.sass': 'sass',
            '.less': 'less',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sql': 'sql',
            '.sh': 'shell',
            '.ps1': 'powershell',
            '.bat': 'batch',
            '.vue': 'vue',
            '.svelte': 'svelte'
        }
        return languageMap[ext] || 'plaintext'
    }

    async search(options: SearchOptions): Promise<SearchResult[]> {
        const results: SearchResult[] = []
        const query = options.caseSensitive ? options.query : options.query.toLowerCase()
        const maxResults = options.maxResults || Number.MAX_SAFE_INTEGER

        for (const [filePath, fileIndex] of this.index) {
            if (results.length >= maxResults) {
                break
            }

            if (options.fileTypes !== undefined && !options.fileTypes.includes(fileIndex.language)) {
                continue
            }

            const content = options.caseSensitive ? fileIndex.content : fileIndex.content.toLowerCase()
            const matches = this.findMatches(content, query, options.regex || false)

            if (matches.length > 0) {
                results.push({
                    path: filePath,
                    matches
                })
            }
        }

        this.logger.debug(`Search complete. Found ${results.length} results`)
        return results
    }

    private findMatches(content: string, query: string, isRegex: boolean): Array<{
        line: number
        content: string
        startIndex: number
        endIndex: number
    }> {
        const matches: Array<{
            line: number
            content: string
            startIndex: number
            endIndex: number
        }> = []
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            let match: RegExpMatchArray | null = null

            if (isRegex) {
                try {
                    const regex = new RegExp(query, 'g')
                    while ((match = regex.exec(line)) !== null) {
                        matches.push({
                            line: i + 1,
                            content: line,
                            startIndex: match.index || 0,
                            endIndex: (match.index || 0) + match[0].length
                        })
                    }
                } catch (e) {
                    // Invalid regex, skip
                    this.logger.warn(`Invalid regex pattern: ${query}`)
                }
            } else {
                let index = line.indexOf(query)
                while (index !== -1) {
                    matches.push({
                        line: i + 1,
                        content: line,
                        startIndex: index,
                        endIndex: index + query.length
                    })
                    index = line.indexOf(query, index + 1)
                }
            }
        }

        return matches
    }

    getFileContent(filePath: string): string | null {
        const fileIndex = this.index.get(filePath)
        return fileIndex ? fileIndex.content : null
    }

    async updateFile(filePath: string): Promise<void> {
        await this.indexFile(filePath, DEFAULT_INDEXING_OPTIONS)
        if (this.config.enableCache) {
            await this.saveIndexToCache()
        }
    }

    async removeFile(filePath: string): Promise<void> {
        this.index.delete(filePath)
        if (this.config.enableCache) {
            await this.saveIndexToCache()
        }
    }

    clearIndex(): void {
        this.index.clear()
        this.logger.info('Index cleared')
    }

    getIndexStats(): { totalFiles: number; totalSize: number; languages: Record<string, number> } {
        let totalSize = 0
        const languages: Record<string, number> = {}

        for (const fileIndex of this.index.values()) {
            totalSize += fileIndex.size
            languages[fileIndex.language] = (languages[fileIndex.language] || 0) + 1
        }

        return {
            totalFiles: this.index.size,
            totalSize,
            languages
        }
    }

    private async saveIndexToCache(): Promise<void> {
        try {
            const indexData = Array.from(this.index.entries())
            await fs.promises.writeFile(this.indexCachePath, JSON.stringify(indexData))
            this.logger.debug(`Index saved to cache: ${this.indexCachePath}`)
        } catch (error) {
            this.logger.error('Failed to save index to cache:', error instanceof Error ? error.message : String(error))
        }
    }

    private async loadIndexFromCache(): Promise<void> {
        try {
            if (fs.existsSync(this.indexCachePath)) {
                const indexData = JSON.parse(await fs.promises.readFile(this.indexCachePath, 'utf-8'))
                this.index = new Map(indexData)
                this.logger.info(`Loaded index from cache. Files: ${this.index.size}`)
            }
        } catch (error) {
            this.logger.error('Failed to load index from cache:', error instanceof Error ? error.message : String(error))
        }
    }

    isIndexing(): boolean {
        return this.indexingInProgress
    }

    getIndexedFiles(): string[] {
        return Array.from(this.index.keys())
    }

    getIndexSize(): number {
        return this.index.size
    }
}

// Singleton instance
let fileService: FileService | null = null

/**
 * Get the singleton file service instance
 * @param config - Optional configuration
 * @param logger - Optional logger instance
 * @returns File service instance
 */
export function getFileService(config?: FileServiceConfig, logger?: Logger): FileService {
    if (!fileService) {
        fileService = new FileService(config, logger)
    }
    return fileService
}

/**
 * Destroy the singleton file service instance
 */
export function destroyFileService(): void {
    if (fileService) {
        fileService.clearIndex()
        fileService = null
    }
}

/**
 * Create a new file service instance (non-singleton)
 * @param config - Optional configuration
 * @param logger - Optional logger instance
 * @returns New file service instance
 */
export function createFileService(config?: FileServiceConfig, logger?: Logger): FileService {
    return new FileService(config, logger)
}

// Export types
export type { FileIndex, IndexingOptions, SearchOptions, SearchResult, FileServiceConfig }