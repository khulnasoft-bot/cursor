/**
 * Advanced Codebase Search
 * High-performance search using ripgrep with incremental indexing
 */

import { spawn } from 'child_process'
import log from 'electron-log'
import { watch } from 'fs'
import path from 'path'

export interface SearchResult {
    filePath: string
    lineNumber: number
    columnNumber: number
    lineContent: string
    matchText: string
    contextBefore?: string[]
    contextAfter?: string[]
    score?: number
    rank?: number
}

export interface SearchOptions {
    pattern: string
    directory: string
    caseSensitive?: boolean
    regex?: boolean
    wholeWord?: boolean
    maxResults?: number
    contextLines?: number
    fileExtensions?: string[]
    excludePatterns?: string[]
    symbolType?: 'function' | 'class' | 'variable' | 'constant' | 'all'
}

export interface SearchIndex {
    files: Map<string, { size: number; modifiedTime: Date }>
    lastIndexed: Date
    totalFiles: number
}

export class AdvancedSearchService {
    private index: SearchIndex = {
        files: new Map(),
        lastIndexed: new Date(),
        totalFiles: 0
    }
    private watchers: Map<string, any> = new Map()
    private indexingInProgress = false

    async search(options: SearchOptions): Promise<SearchResult[]> {
        const {
            pattern,
            directory,
            caseSensitive = false,
            regex = true,
            wholeWord = false,
            maxResults = 100,
            contextLines = 2,
            fileExtensions,
            excludePatterns,
            symbolType
        } = options

        // If symbolType is specified, use symbol-aware search
        if (symbolType && symbolType !== 'all') {
            return this.searchSymbols(pattern, directory, symbolType, {
                caseSensitive,
                maxResults,
                contextLines,
                fileExtensions,
                excludePatterns
            })
        }

        const args = this.buildRipgrepArgs(pattern, directory, {
            caseSensitive,
            regex,
            wholeWord,
            maxResults,
            contextLines,
            fileExtensions,
            excludePatterns
        })

        try {
            const results = await this.executeRipgrep(args)
            return this.parseRipgrepOutput(results)
        } catch (error) {
            log.error('Search failed:', error)
            throw error
        }
    }

    private async searchSymbols(
        pattern: string,
        directory: string,
        symbolType: 'function' | 'class' | 'variable' | 'constant',
        options: {
            caseSensitive?: boolean
            maxResults?: number
            contextLines?: number
            fileExtensions?: string[]
            excludePatterns?: string[]
        }
    ): Promise<SearchResult[]> {
        // Build symbol-specific patterns based on language
        const symbolPatterns = this.getSymbolPatterns(symbolType)

        const allResults: SearchResult[] = []

        for (const symbolPattern of symbolPatterns) {
            const combinedPattern = `${symbolPattern}${pattern}`

            const args = this.buildRipgrepArgs(combinedPattern, directory, {
                caseSensitive: options.caseSensitive || false,
                regex: true,
                wholeWord: false,
                maxResults: options.maxResults || 100,
                contextLines: options.contextLines || 2,
                fileExtensions: options.fileExtensions,
                excludePatterns: options.excludePatterns
            })

            try {
                const output = await this.executeRipgrep(args)
                const results = this.parseRipgrepOutput(output)
                allResults.push(...results)
            } catch (error) {
                log.warn(`Symbol search failed for pattern ${combinedPattern}:`, error)
            }
        }

        // Remove duplicates and limit results
        const uniqueResults = this.deduplicateResults(allResults)
        return uniqueResults.slice(0, options.maxResults || 100)
    }

    private getSymbolPatterns(symbolType: 'function' | 'class' | 'variable' | 'constant'): string[] {
        switch (symbolType) {
            case 'function':
                return [
                    'function\\s+', // JavaScript/TypeScript
                    'const\\s+.*=\\s*\\(', // Arrow functions
                    'def\\s+', // Python
                    'func\\s+', // Go
                    'fn\\s+', // Rust
                    'public\\s+\\w+\\s+\\w+\\s*\\(', // Java/C# methods
                    'private\\s+\\w+\\s+\\w+\\s*\\(', // Java/C# methods
                ]
            case 'class':
                return [
                    'class\\s+', // JavaScript/TypeScript/Python
                    'interface\\s+', // TypeScript
                    'type\\s+', // TypeScript
                    'struct\\s+', // Go/Rust
                    'enum\\s+', // TypeScript/Go/Rust
                ]
            case 'variable':
                return [
                    'let\\s+', // JavaScript/TypeScript
                    'var\\s+', // JavaScript
                    'const\\s+[^=]+=', // JavaScript/TypeScript (not functions)
                    'var\\s+', // Python
                    'let\\s+', // Rust
                    'var\\s+', // Go
                ]
            case 'constant':
                return [
                    'const\\s+[A-Z_]+', // JavaScript/TypeScript (uppercase)
                    '#define\\s+', // C/C++
                    'const\\s+[A-Z_]+', // Go/Rust
                ]
            default:
                return []
        }
    }

    private deduplicateResults(results: SearchResult[]): SearchResult[] {
        const seen = new Set<string>()
        const unique: SearchResult[] = []

        for (const result of results) {
            const key = `${result.filePath}:${result.lineNumber}:${result.matchText}`
            if (!seen.has(key)) {
                seen.add(key)
                unique.push(result)
            }
        }

        return unique
    }

    async searchInFile(filePath: string, pattern: string, options: Partial<SearchOptions> = {}): Promise<SearchResult[]> {
        return this.search({
            pattern,
            directory: path.dirname(filePath),
            ...options
        })
    }

    async buildIndex(directory: string, fileExtensions?: string[]): Promise<void> {
        if (this.indexingInProgress) {
            log.warn('Indexing already in progress')
            return
        }

        this.indexingInProgress = true
        log.info(`Building search index for directory: ${directory}`)

        try {
            // Use ripgrep to find all files
            const args = ['--files', '--hidden']
            if (fileExtensions && fileExtensions.length > 0) {
                args.push('-g', fileExtensions.map(ext => `*${ext}`).join(''))
            }
            args.push(directory)

            const fileResults = await this.executeRipgrep(args)
            const files = fileResults.split('\n').filter(f => f.trim() !== '')

            // Get file stats for each file
            for (const file of files) {
                try {
                    const stats = await this.getFileStats(file)
                    this.index.files.set(file, {
                        size: stats.size,
                        modifiedTime: stats.mtime
                    })
                } catch (error) {
                    log.warn(`Failed to get stats for ${file}:`, error)
                }
            }

            this.index.lastIndexed = new Date()
            this.index.totalFiles = this.index.files.size

            log.info(`Search index built: ${this.index.totalFiles} files indexed`)
        } catch (error) {
            log.error('Failed to build search index:', error)
        } finally {
            this.indexingInProgress = false
        }
    }

    startWatching(directory: string, callback: (filePath: string, event: string) => void): void {
        if (this.watchers.has(directory)) {
            log.warn(`Already watching directory: ${directory}`)
            return
        }

        log.info(`Starting to watch directory: ${directory}`)

        const watcher = watch(directory, { recursive: true }, (event, filename) => {
            if (filename) {
                const filePath = path.join(directory, filename)
                callback(filePath, event)

                // Update index on file changes
                if (event === 'change' || event === 'rename') {
                    this.updateIndexEntry(filePath)
                } else if (event === 'unlink') {
                    this.index.files.delete(filePath)
                }
            }
        })

        this.watchers.set(directory, watcher)
    }

    stopWatching(directory: string): void {
        const watcher = this.watchers.get(directory)
        if (watcher) {
            watcher.close()
            this.watchers.delete(directory)
            log.info(`Stopped watching directory: ${directory}`)
        }
    }

    stopAllWatching(): void {
        for (const [directory, watcher] of this.watchers) {
            watcher.close()
        }
        this.watchers.clear()
        log.info('Stopped watching all directories')
    }

    private buildRipgrepArgs(
        pattern: string,
        directory: string,
        options: {
            caseSensitive: boolean
            regex: boolean
            wholeWord: boolean
            maxResults: number
            contextLines: number
            fileExtensions?: string[]
            excludePatterns?: string[]
        }
    ): string[] {
        const args: string[] = []

        // Case sensitivity
        if (!options.caseSensitive) {
            args.push('-i')
        }

        // Regex mode
        if (!options.regex) {
            args.push('-F') // Fixed strings
        }

        // Whole word
        if (options.wholeWord) {
            args.push('-w')
        }

        // Context lines
        args.push('-C', options.contextLines.toString())

        // Max results
        args.push('-m', options.maxResults.toString())

        // File extensions
        if (options.fileExtensions && options.fileExtensions.length > 0) {
            for (const ext of options.fileExtensions) {
                args.push('-g', `*${ext}`)
            }
        }

        // Exclude patterns
        if (options.excludePatterns) {
            for (const pattern of options.excludePatterns) {
                args.push('--glob', `!${pattern}`)
            }
        }

        // Output format: JSON for easier parsing
        args.push('--json')

        // Pattern
        args.push(pattern)

        // Directory
        args.push(directory)

        return args
    }

    private async executeRipgrep(args: string[]): Promise<string> {
        return new Promise((resolve, reject) => {
            const rg = spawn('rg', args)
            let stdout = ''
            let stderr = ''

            rg.stdout?.on('data', (data) => {
                stdout += data.toString()
            })

            rg.stderr?.on('data', (data) => {
                stderr += data.toString()
            })

            rg.on('close', (code) => {
                if (code === 0 || code === 1) {
                    // 0 = matches found, 1 = no matches (both are success)
                    resolve(stdout)
                } else {
                    reject(new Error(`ripgrep exited with code ${code}: ${stderr}`))
                }
            })

            rg.on('error', (error) => {
                reject(new Error(`Failed to execute ripgrep: ${error.message}`))
            })
        })
    }

    private parseRipgrepOutput(output: string): SearchResult[] {
        const results: SearchResult[] = []
        const lines = output.split('\n').filter(line => line.trim() !== '')

        for (const line of lines) {
            try {
                const data = JSON.parse(line)

                if (data.type === 'match') {
                    const result: SearchResult = {
                        filePath: data.data.path.text,
                        lineNumber: data.data.line_number,
                        columnNumber: data.data.submatches[0]?.start || 0,
                        lineContent: data.data.lines.text,
                        matchText: data.data.submatches[0]?.match?.text || '',
                        contextBefore: data.data.lines.before || [],
                        contextAfter: data.data.lines.after || []
                    }
                    results.push(result)
                }
            } catch (error) {
                log.warn('Failed to parse ripgrep output line:', error)
            }
        }

        return results
    }

    rankResults(results: SearchResult[], query: string): SearchResult[] {
        // Calculate scores for each result
        const scoredResults = results.map(result => ({
            ...result,
            score: this.calculateScore(result, query)
        }))

        // Sort by score (descending)
        scoredResults.sort((a, b) => b.score! - a.score!)

        // Assign ranks
        scoredResults.forEach((result, index) => {
            result.rank = index + 1
        })

        return scoredResults
    }

    private calculateScore(result: SearchResult, query: string): number {
        let score = 0

        // Exact match bonus
        if (result.matchText.toLowerCase() === query.toLowerCase()) {
            score += 100
        }

        // Partial match bonus based on overlap
        const overlap = this.calculateOverlap(result.matchText, query)
        score += overlap * 50

        // File name relevance
        const fileName = path.basename(result.filePath)
        if (fileName.toLowerCase().includes(query.toLowerCase())) {
            score += 30
        }

        // Directory depth penalty (prefer files closer to root)
        const depth = result.filePath.split(path.sep).length
        score -= depth * 2

        // Line length penalty (prefer shorter, more focused lines)
        score -= result.lineContent.length * 0.01

        // Context relevance
        if (result.contextBefore && result.contextBefore.length > 0) {
            score += 5
        }
        if (result.contextAfter && result.contextAfter.length > 0) {
            score += 5
        }

        return Math.max(0, score)
    }

    private calculateOverlap(str1: string, str2: string): number {
        const s1 = str1.toLowerCase()
        const s2 = str2.toLowerCase()

        if (s1 === s2) return 1

        let overlap = 0
        const shorter = s1.length < s2.length ? s1 : s2
        const longer = s1.length < s2.length ? s2 : s1

        for (let i = 0; i < shorter.length; i++) {
            if (longer.includes(shorter[i])) {
                overlap++
            }
        }

        return overlap / shorter.length
    }

    private async getFileStats(filePath: string): Promise<{ size: number; mtime: Date }> {
        // This would use the file system to get stats
        // For now, return placeholder
        // TODO: Implement actual file stats retrieval
        return {
            size: 0,
            mtime: new Date()
        }
    }

    private async updateIndexEntry(filePath: string): Promise<void> {
        try {
            const stats = await this.getFileStats(filePath)
            this.index.files.set(filePath, {
                size: stats.size,
                modifiedTime: stats.mtime
            })
        } catch (error) {
            log.warn(`Failed to update index entry for ${filePath}:`, error)
        }
    }

    getIndexStats(): SearchIndex {
        return {
            files: this.index.files,
            lastIndexed: this.index.lastIndexed,
            totalFiles: this.index.totalFiles
        }
    }

    clearIndex(): void {
        this.index = {
            files: new Map(),
            lastIndexed: new Date(),
            totalFiles: 0
        }
        log.info('Search index cleared')
    }

    isRipgrepAvailable(): boolean {
        // Check if ripgrep is installed
        // This would execute a simple check
        // For now, assume it's available
        return true
    }
}

// Singleton instance
let advancedSearchService: AdvancedSearchService | null = null

export function getAdvancedSearchService(): AdvancedSearchService {
    if (!advancedSearchService) {
        advancedSearchService = new AdvancedSearchService()
    }
    return advancedSearchService
}

export function destroyAdvancedSearchService() {
    if (advancedSearchService) {
        advancedSearchService.stopAllWatching()
        advancedSearchService.clearIndex()
        advancedSearchService = null
    }
}
