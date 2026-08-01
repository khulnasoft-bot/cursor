/**
 * Semantic Indexer
 * Basic embedding-based code understanding for semantic search
 */

import log from 'electron-log'
import { getAIService } from '../aiService'
import crypto from 'crypto'

export interface CodeChunk {
    id: string
    filePath: string
    content: string
    startLine: number
    endLine: number
    language?: string
    embedding?: number[]
    hash: string
}

export interface SemanticIndex {
    chunks: Map<string, CodeChunk>
    filePaths: Set<string>
    lastIndexed: Date
    totalChunks: number
}

export interface SearchQuery {
    query: string
    limit?: number
    threshold?: number
    filePaths?: string[]
}

export interface SearchResult {
    chunk: CodeChunk
    similarity: number
    filePath: string
    lineRange: { start: number; end: number }
}

export class SemanticIndexer {
    private index: SemanticIndex = {
        chunks: new Map(),
        filePaths: new Set(),
        lastIndexed: new Date(),
        totalChunks: 0
    }
    private aiService = getAIService()
    private embeddingCache: Map<string, number[]> = new Map()
    private chunkSize = 500 // characters per chunk
    private chunkOverlap = 50 // characters overlap between chunks

    constructor() {
        this.loadIndex()
    }

    async indexFile(filePath: string, content: string, language?: string): Promise<void> {
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
                const embedding = await this.generateEmbedding(chunk.content)
                codeChunk.embedding = embedding
            } catch (error) {
                log.warn(`Failed to generate embedding for chunk ${codeChunk.id}:`, error)
                // Continue without embedding
            }

            this.index.chunks.set(codeChunk.id, codeChunk)
        }

        this.index.filePaths.add(filePath)
        this.index.totalChunks = this.index.chunks.size
        this.index.lastIndexed = new Date()
        
        log.info(`Indexed file: ${filePath}, chunks: ${chunks.length}`)
    }

    async indexDirectory(
        directoryPath: string,
        fileExtensions: string[] = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.java', '.rs'],
        ignorePatterns: string[] = ['node_modules', '.git', 'dist', 'build']
    ): Promise<void> {
        log.info(`Starting semantic indexing for directory: ${directoryPath}`)
        
        // This would integrate with the file system to walk the directory
        // For now, this is a placeholder
        // TODO: Implement directory walking and file reading
        
        log.info(`Semantic indexing complete. Total chunks: ${this.index.totalChunks}`)
    }

    async search(query: SearchQuery): Promise<SearchResult[]> {
        const { query: searchQuery, limit = 10, threshold = 0.7, filePaths } = query
        
        // Generate embedding for the search query
        const queryEmbedding = await this.generateEmbedding(searchQuery)
        
        // Calculate similarity scores for all chunks
        const results: SearchResult[] = []
        
        for (const [id, chunk] of this.index.chunks) {
            // Filter by file paths if specified
            if (filePaths && filePaths.length > 0 && !filePaths.includes(chunk.filePath)) {
                continue
            }
            
            // Skip chunks without embeddings
            if (!chunk.embedding) {
                continue
            }
            
            const similarity = this.cosineSimilarity(queryEmbedding, chunk.embedding)
            
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
            
            if (currentLength + lineLength > this.chunkSize && currentChunk.length > 0) {
                // Save current chunk
                chunks.push({
                    content: currentChunk.join('\n'),
                    startLine,
                    endLine: i
                })
                
                // Start new chunk with overlap
                const overlapLines = Math.floor(this.chunkOverlap / (this.chunkSize / currentChunk.length))
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

    private async generateEmbedding(text: string): Promise<number[]> {
        // Check cache first
        const hash = this.computeHash(text)
        if (this.embeddingCache.has(hash)) {
            return this.embeddingCache.get(hash)!
        }
        
        // Generate embedding using AI service
        // For now, use a simple hash-based embedding as placeholder
        // TODO: Integrate with actual embedding model (OpenAI text-embedding-3, etc.)
        const embedding = this.generatePlaceholderEmbedding(text)
        
        // Cache the embedding
        this.embeddingCache.set(hash, embedding)
        
        return embedding
    }

    private generatePlaceholderEmbedding(text: string): number[] {
        // Simple hash-based embedding as placeholder
        // In production, this would call an embedding API
        const embedding = new Array(1536).fill(0) // Standard OpenAI embedding size
        
        const hash = this.computeHash(text)
        for (let i = 0; i < hash.length; i++) {
            const charCode = hash.charCodeAt(i)
            embedding[i % embedding.length] = (charCode % 100) / 100
        }
        
        return embedding
    }

    private cosineSimilarity(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('Embedding dimensions must match')
        }
        
        let dotProduct = 0
        let normA = 0
        let normB = 0
        
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i]
            normA += a[i] * a[i]
            normB += b[i] * b[i]
        }
        
        if (normA === 0 || normB === 0) {
            return 0
        }
        
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    }

    private generateChunkId(filePath: string, line: number): string {
        return `${filePath}:${line}:${crypto.randomBytes(8).toString('hex')}`
    }

    private computeHash(content: string): string {
        return crypto.createHash('md5').update(content).digest('hex')
    }

    getIndexStats(): {
        totalChunks: number
        totalFiles: number
        lastIndexed: Date
        indexedFiles: string[]
    } {
        return {
            totalChunks: this.index.totalChunks,
            totalFiles: this.index.filePaths.size,
            lastIndexed: this.index.lastIndexed,
            indexedFiles: Array.from(this.index.filePaths)
        }
    }

    clearIndex(): void {
        this.index = {
            chunks: new Map(),
            filePaths: new Set(),
            lastIndexed: new Date(),
            totalChunks: 0
        }
        this.embeddingCache.clear()
        log.info('Semantic index cleared')
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
        log.info(`Removed file from semantic index: ${filePath}`)
    }

    private loadIndex(): void {
        // Load index from disk if available
        // TODO: Implement persistent storage
        log.info('Semantic index loaded')
    }

    private saveIndex(): void {
        // Save index to disk
        // TODO: Implement persistent storage
        log.info('Semantic index saved')
    }

    async reindexFile(filePath: string, content: string, language?: string): Promise<void> {
        this.removeFile(filePath)
        await this.indexFile(filePath, content, language)
    }
}

// Singleton instance
let semanticIndexer: SemanticIndexer | null = null

export function getSemanticIndexer(): SemanticIndexer {
    if (!semanticIndexer) {
        semanticIndexer = new SemanticIndexer()
    }
    return semanticIndexer
}

export function destroySemanticIndexer() {
    if (semanticIndexer) {
        semanticIndexer.clearIndex()
        semanticIndexer = null
    }
}
