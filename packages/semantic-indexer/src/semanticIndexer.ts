/**
 * Semantic Indexer
 * Embedding-based code understanding for semantic search
 * Extracted and adapted from Cursor's semantic indexer
 */

import {
    CodeChunk,
    SemanticIndex,
    SearchQuery,
    SearchResult,
    IndexerConfig
} from './types'
import { EmbeddingGenerator, getEmbeddingGenerator } from './embeddingGenerator'
import { Logger, ConsoleLogger } from './logger'

export class SemanticIndexer {
    private index: SemanticIndex
    private embeddingGenerator: EmbeddingGenerator
    private config: IndexerConfig
    private logger: Logger

    constructor(config: IndexerConfig = {}, logger?: Logger) {
        this.config = {
            chunkSize: config.chunkSize ?? 500,
            chunkOverlap: config.chunkOverlap ?? 50,
            maxIndexSize: config.maxIndexSize ?? 100000,
            enableCache: config.enableCache ?? true,
            enablePersistence: config.enablePersistence ?? false,
            logLevel: config.logLevel || 'info'
        }
        this.logger = logger || new ConsoleLogger()
        this.embeddingGenerator = getEmbeddingGenerator()
        
        this.index = {
            chunks: new Map(),
            filePaths: new Set(),
            lastIndexed: new Date(),
            totalChunks: 0,
            version: '1.0.0'
        }
    }

    async indexFile(filePath: string, content: string, language?: string): Promise<void> {
        this.logger.info(`Indexing file: ${filePath}`)
        
        const chunks = this.chunkContent(content)
        
        for (const chunk of chunks) {
            const codeChunk: CodeChunk = {
                id: this.generateChunkId(filePath, chunk.startLine),
                filePath,
                content: chunk.content,
                startLine: chunk.startLine,
                endLine: chunk.endLine,
                language,
                hash: this.computeHash(chunk.content)
            }

            // Generate embedding for the chunk
            try {
                const embedding = await this.embeddingGenerator.generateEmbedding(chunk.content)
                codeChunk.embedding = embedding
            } catch (error) {
                this.logger.warn(`Failed to generate embedding for chunk ${codeChunk.id}:`, error)
                // Continue without embedding
            }

            this.index.chunks.set(codeChunk.id, codeChunk)
        }

        this.index.filePaths.add(filePath)
        this.index.totalChunks = this.index.chunks.size
        this.index.lastIndexed = new Date()
        
        this.logger.info(`Indexed file: ${filePath}, chunks: ${chunks.length}`)
    }

    async indexDirectory(
        directoryPath: string,
        fileExtensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs'],
        ignorePatterns: string[] = ['node_modules', '.git', 'dist', 'build']
    ): Promise<void> {
        this.logger.info(`Starting semantic indexing for directory: ${directoryPath}`)
        
        // This would integrate with the file system to walk the directory
        // For now, this is a placeholder
        // TODO: Implement directory walking and file reading or integrate with file service
        
        this.logger.info(`Semantic indexing complete. Total chunks: ${this.index.totalChunks}`)
    }

    async search(query: SearchQuery): Promise<SearchResult[]> {
        const { query: searchQuery, limit = 10, threshold = 0.7, filePaths, languages } = query
        
        // Generate embedding for the search query
        const queryEmbedding = await this.embeddingGenerator.generateEmbedding(searchQuery)
        
        // Calculate similarity scores for all chunks
        const results: SearchResult[] = []
        
        for (const [id, chunk] of this.index.chunks) {
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
        return results.slice(0, limit)
    }

    async searchByFile(filePath: string, query: string, limit = 5): Promise<SearchResult[]> {
        return this.search({
            query,
            limit,
            filePaths: [filePath]
        })
    }

    private chunkContent(content: string): Array<{ content: string; startLine: number; endLine: number }> {
        const chunks: Array<{ content: string; startLine: number; endLine: number }> = []
        const lines = content.split('\n')
        
        let currentChunk: string[] = []
        let startLine = 1
        let currentLength = 0
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const lineLength = line.length + 1 // +1 for newline
            
            if (currentLength + lineLength > (this.config.chunkSize || 500) && currentChunk.length > 0) {
                // Save current chunk
                chunks.push({
                    content: currentChunk.join('\n'),
                    startLine,
                    endLine: i
                })
                
                // Start new chunk with overlap
                const overlapLines = Math.floor((this.config.chunkOverlap || 50) / ((this.config.chunkSize || 500) / (currentChunk.length || 1)))
                currentChunk = currentChunk.slice(-overlapLines)
                startLine = i - overlapLines + 1
                currentLength = currentChunk.reduce((sum, l) => sum + l.length + 1, 0)
            }
            
            currentChunk.push(line)
            currentLength += lineLength
        }
        
        // Add final chunk if not empty
        if (currentChunk.length > 0) {
            chunks.push({
                content: currentChunk.join('\n'),
                startLine,
                endLine: lines.length
            })
        }
        
        return chunks
    }

    private generateChunkId(filePath: string, line: number): string {
        return `${filePath}:${line}:${Math.random().toString(36).substring(2, 10)}`
    }

    private computeHash(content: string): string {
        // Simple hash function
        let hash = 0
        for (let i = 0; i < content.length; i++) {
            const char = content.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32bit integer
        }
        return hash.toString(36)
    }

    getIndexStats(): {
        totalChunks: number
        totalFiles: number
        lastIndexed: Date
        indexedFiles: string[]
        version: string
    } {
        return {
            totalChunks: this.index.totalChunks,
            totalFiles: this.index.filePaths.size,
            lastIndexed: this.index.lastIndexed,
            indexedFiles: Array.from(this.index.filePaths),
            version: this.index.version
        }
    }

    clearIndex(): void {
        this.index = {
            chunks: new Map(),
            filePaths: new Set(),
            lastIndexed: new Date(),
            totalChunks: 0,
            version: '1.0.0'
        }
        this.embeddingGenerator.clearCache()
        this.logger.info('Semantic index cleared')
    }

    removeFile(filePath: string): void {
        // Remove all chunks for this file
        for (const [id, chunk] of this.index.chunks) {
            if (chunk.filePath === filePath) {
                this.index.chunks.delete(id)
            }
        }
        
        this.index.filePaths.delete(filePath)
        this.index.totalChunks = this.index.chunks.size
        this.logger.info(`Removed file from semantic index: ${filePath}`)
    }

    async reindexFile(filePath: string, content: string, language?: string): Promise<void> {
        this.removeFile(filePath)
        await this.indexFile(filePath, content, language)
    }

    getChunk(chunkId: string): CodeChunk | undefined {
        return this.index.chunks.get(chunkId)
    }

    getChunksByFile(filePath: string): CodeChunk[] {
        return Array.from(this.index.chunks.values()).filter(c => c.filePath === filePath)
    }

    setEmbeddingGenerator(generator: EmbeddingGenerator): void {
        this.embeddingGenerator = generator
        this.logger.info('Embedding generator updated')
    }

    updateConfig(config: Partial<IndexerConfig>): void {
        this.config = { ...this.config, ...config }
        this.logger.info('Semantic indexer configuration updated')
    }

    getConfig(): IndexerConfig {
        return { ...this.config }
    }

    reset(): void {
        this.clearIndex()
        this.logger.info('Reset semantic indexer')
    }
}

// Singleton instance
let semanticIndexer: SemanticIndexer | null = null

export function getSemanticIndexer(config?: IndexerConfig, logger?: Logger): SemanticIndexer {
    if (!semanticIndexer) {
        semanticIndexer = new SemanticIndexer(config, logger)
    }
    return semanticIndexer
}

export function destroySemanticIndexer(): void {
    if (semanticIndexer) {
        semanticIndexer.reset()
        semanticIndexer = null
    }
}

export function createSemanticIndexer(config?: IndexerConfig, logger?: Logger): SemanticIndexer {
    return new SemanticIndexer(config, logger)
}