/**
 * Search Engine
 * High-performance semantic search with hybrid capabilities
 */

import {
    CodeChunk,
    SearchQuery,
    SearchResult
} from './types'
import { EmbeddingGenerator } from './embeddingGenerator'
import { Logger, ConsoleLogger } from './logger'

export interface SearchOptions {
    enableHybridSearch?: boolean
    enableCache?: boolean
    maxResults?: number
    minSimilarity?: number
}

export class SearchEngine {
    private embeddingGenerator: EmbeddingGenerator
    private queryCache: Map<string, SearchResult[]>
    private options: SearchOptions
    private logger: Logger

    constructor(embeddingGenerator: EmbeddingGenerator, options: SearchOptions = {}, logger?: Logger) {
        this.embeddingGenerator = embeddingGenerator
        this.options = {
            enableHybridSearch: true,
            enableCache: true,
            maxResults: 10,
            minSimilarity: 0.7,
            ...options
        }
        this.queryCache = new Map()
        this.logger = logger || new ConsoleLogger()
    }

    async search(
        chunks: Map<string, CodeChunk>,
        query: SearchQuery
    ): Promise<SearchResult[]> {
        const { query: searchQuery, limit = 10, threshold = 0.7, filePaths, languages } = query

        // Check cache
        if (this.options.enableCache) {
            const cacheKey = this.generateCacheKey(searchQuery, filePaths, languages)
            if (this.queryCache.has(cacheKey)) {
                this.logger.debug('Returning cached search results')
                return this.queryCache.get(cacheKey)!.slice(0, limit)
            }
        }

        // Generate embedding for the search query
        const queryEmbedding = await this.embeddingGenerator.generateEmbedding(searchQuery)

        // Calculate similarity scores for all chunks
        const results: SearchResult[] = []

        for (const [id, chunk] of chunks) {
            // Filter by file paths if specified
            if (filePaths && filePaths.length > 0 && !filePaths.includes(chunk.filePath)) {
                continue
            }

            // Filter by languages if specified
            if (languages && languages.length > 0 && chunk.language && !languages.includes(chunk.language)) {
                continue
            }

            // Skip chunks without embeddings
            if (!chunk.embedding) {
                continue
            }

            const similarity = this.embeddingGenerator.cosineSimilarity(queryEmbedding, chunk.embedding)

            if (similarity >= threshold) {
                results.push({
                    chunk,
                    similarity,
                    filePath: chunk.filePath,
                    lineRange: { start: chunk.startLine, end: chunk.endLine }
                })
            }
        }

        // Sort by similarity (descending) and limit results
        results.sort((a, b) => b.similarity - a.similarity)
        const finalResults = results.slice(0, limit)

        // Cache results
        if (this.options.enableCache) {
            const cacheKey = this.generateCacheKey(searchQuery, filePaths, languages)
            this.queryCache.set(cacheKey, finalResults)
        }

        return finalResults
    }

    async hybridSearch(
        chunks: Map<string, CodeChunk>,
        query: SearchQuery,
        textResults: SearchResult[]
    ): Promise<SearchResult[]> {
        if (!this.options.enableHybridSearch) {
            return this.search(chunks, query)
        }

        // Get semantic search results
        const semanticResults = await this.search(chunks, query)

        // Combine and rank results
        const combined = new Map<string, SearchResult>()

        // Add semantic results with weight 0.7
        for (const result of semanticResults) {
            const key = `${result.filePath}:${result.lineRange.start}`
            combined.set(key, {
                ...result,
                similarity: result.similarity * 0.7
            })
        }

        // Add text results with weight 0.3
        for (const result of textResults) {
            const key = `${result.filePath}:${result.lineRange.start}`
            const existing = combined.get(key)
            if (existing) {
                combined.set(key, {
                    ...existing,
                    similarity: existing.similarity + (result.similarity * 0.3)
                })
            } else {
                combined.set(key, {
                    ...result,
                    similarity: result.similarity * 0.3
                })
            }
        }

        // Sort by combined similarity
        const finalResults = Array.from(combined.values())
        finalResults.sort((a, b) => b.similarity - a.similarity)

        return finalResults.slice(0, query.limit || 10)
    }

    async searchNear(
        chunks: Map<string, CodeChunk>,
        filePath: string,
        line: number,
        radius: number = 5
    ): Promise<SearchResult[]> {
        const results: SearchResult[] = []

        for (const [id, chunk] of chunks) {
            if (chunk.filePath !== filePath) continue

            // Check if chunk is within radius of the specified line
            const chunkCenter = (chunk.startLine + chunk.endLine) / 2
            const distance = Math.abs(chunkCenter - line)

            if (distance <= radius) {
                results.push({
                    chunk,
                    similarity: 1 - (distance / radius), // Higher similarity for closer chunks
                    filePath: chunk.filePath,
                    lineRange: { start: chunk.startLine, end: chunk.endLine }
                })
            }
        }

        results.sort((a, b) => b.similarity - a.similarity)
        return results
    }

    async searchSimilar(
        chunks: Map<string, CodeChunk>,
        referenceChunk: CodeChunk,
        limit: number = 5
    ): Promise<SearchResult[]> {
        if (!referenceChunk.embedding) {
            throw new Error('Reference chunk must have an embedding')
        }

        const results: SearchResult[] = []

        for (const [id, chunk] of chunks) {
            if (chunk.id === referenceChunk.id) continue
            if (!chunk.embedding) continue

            const similarity = this.embeddingGenerator.cosineSimilarity(
                referenceChunk.embedding,
                chunk.embedding
            )

            if (similarity > 0) {
                results.push({
                    chunk,
                    similarity,
                    filePath: chunk.filePath,
                    lineRange: { start: chunk.startLine, end: chunk.endLine }
                })
            }
        }

        results.sort((a, b) => b.similarity - a.similarity)
        return results.slice(0, limit)
    }

    private generateCacheKey(query: string, filePaths?: string[], languages?: string[]): string {
        const parts = [query]
        if (filePaths) parts.push(...filePaths.sort())
        if (languages) parts.push(...languages.sort())
        return parts.join('|')
    }

    clearCache(): void {
        this.queryCache.clear()
        this.logger.info('Search cache cleared')
    }

    getCacheStats(): {
        size: number
        keys: string[]
    } {
        return {
            size: this.queryCache.size,
            keys: Array.from(this.queryCache.keys())
        }
    }

    updateOptions(options: Partial<SearchOptions>): void {
        this.options = { ...this.options, ...options }
        this.logger.info('Search engine options updated')
    }

    getOptions(): SearchOptions {
        return { ...this.options }
    }

    reset(): void {
        this.queryCache.clear()
        this.logger.info('Reset search engine')
    }
}

// Singleton instance
let searchEngine: SearchEngine | null = null

export function getSearchEngine(
    embeddingGenerator: EmbeddingGenerator,
    options?: SearchOptions,
    logger?: Logger
): SearchEngine {
    if (!searchEngine) {
        searchEngine = new SearchEngine(embeddingGenerator, options, logger)
    }
    return searchEngine
}

export function destroySearchEngine(): void {
    if (searchEngine) {
        searchEngine.reset()
        searchEngine = null
    }
}

export function createSearchEngine(
    embeddingGenerator: EmbeddingGenerator,
    options?: SearchOptions,
    logger?: Logger
): SearchEngine {
    return new SearchEngine(embeddingGenerator, options, logger)
}