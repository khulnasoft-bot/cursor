/**
 * Cursor File Service
 * Handles indexing and retrieval for Cursor
 */

import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'

export interface FileIndex {
    path: string
    content: string
    lastModified: number
    size: number
    language: string
}

export interface IndexingOptions {
    includePatterns?: string[]
    excludePatterns?: string[]
    maxFileSize?: number
}

export interface SearchOptions {
    query: string
    caseSensitive?: boolean
    regex?: boolean
    fileTypes?: string[]
}

export interface SearchResult {
    path: string
    matches: Array<{
        line: number
        content: string
        startIndex: number
        endIndex: number
    }>
}

class FileService {
    private index: Map<string, FileIndex> = new Map()
    private indexingInProgress = false
    private indexCachePath: string

    constructor() {
        this.indexCachePath = path.join(process.env.HOME || '.', '.cursor-file-index.json')
        this.loadIndexFromCache()
    }

    async indexDirectory(directoryPath: string, options: IndexingOptions = {}): Promise<void> {
        if (this.indexingInProgress) {
            log.warn('Indexing already in progress')
            return
        }

        this.indexingInProgress = true
        log.info(`Starting indexing of directory: ${directoryPath}`)

        try {
            const defaultOptions: IndexingOptions = {
                includePatterns: ['*'],
                excludePatterns: ['node_modules', '.git', '.webpack', 'dist', 'build'],
                maxFileSize: 1024 * 1024, // 1MB
                ...options
            }

            await this.walkDirectory(directoryPath, defaultOptions)
            await this.saveIndexToCache()
            log.info(`Indexing complete. Total files indexed: ${this.index.size}`)
        } catch (error) {
            log.error('Error during indexing:', error)
        } finally {
            this.indexingInProgress = false
        }
    }

    private async walkDirectory(dirPath: string, options: IndexingOptions): Promise<void> {
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true })

        for (const entry of entries) {
            const fullPath = path.join(dirPath, entry.name)

            // Skip excluded directories
            if (entry.isDirectory() && options.excludePatterns?.some(pattern => 
                entry.name.includes(pattern) || fullPath.includes(pattern))) {
                continue
            }

            if (entry.isDirectory()) {
                await this.walkDirectory(fullPath, options)
            } else if (entry.isFile()) {
                await this.indexFile(fullPath, options)
            }
        }
    }

    private async indexFile(filePath: string, options: IndexingOptions): Promise<void> {
        try {
            const stats = await fs.promises.stat(filePath)
            
            // Skip files larger than max size
            if (options.maxFileSize && stats.size > options.maxFileSize) {
                return
            }

            // Check if file needs reindexing
            const existingIndex = this.index.get(filePath)
            if (existingIndex && existingIndex.lastModified >= stats.mtimeMs) {
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
        } catch (error) {
            log.warn(`Failed to index file ${filePath}:`, error)
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
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sql': 'sql',
            '.sh': 'shell',
            '.ps1': 'powershell'
        }
        return languageMap[ext] || 'plaintext'
    }

    async search(options: SearchOptions): Promise<SearchResult[]> {
        const results: SearchResult[] = []
        const query = options.caseSensitive ? options.query : options.query.toLowerCase()

        for (const [filePath, fileIndex] of this.index) {
            if (options.fileTypes && !options.fileTypes.includes(fileIndex.language)) {
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
                const regex = new RegExp(query, 'g')
                while ((match = regex.exec(line)) !== null) {
                    matches.push({
                        line: i + 1,
                        content: line,
                        startIndex: match.index || 0,
                        endIndex: (match.index || 0) + match[0].length
                    })
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
        await this.indexFile(filePath, {})
        await this.saveIndexToCache()
    }

    async removeFile(filePath: string): Promise<void> {
        this.index.delete(filePath)
        await this.saveIndexToCache()
    }

    clearIndex(): void {
        this.index.clear()
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
        } catch (error) {
            log.error('Failed to save index to cache:', error)
        }
    }

    private async loadIndexFromCache(): Promise<void> {
        try {
            if (fs.existsSync(this.indexCachePath)) {
                const indexData = JSON.parse(await fs.promises.readFile(this.indexCachePath, 'utf-8'))
                this.index = new Map(indexData)
                log.info(`Loaded index from cache. Files: ${this.index.size}`)
            }
        } catch (error) {
            log.error('Failed to load index from cache:', error)
        }
    }
}

// Singleton instance
let fileService: FileService | null = null

export function getFileService(): FileService {
    if (!fileService) {
        fileService = new FileService()
    }
    return fileService
}

export function destroyFileService() {
    if (fileService) {
        fileService.clearIndex()
        fileService = null
    }
}
