/**
 * Embedding Generator
 * Generates embeddings for code chunks using various strategies
 */

import { EmbeddingConfig } from './types'
import { Logger, ConsoleLogger } from './logger'

// AI service interface for integration
export interface EmbeddingService {
    generateEmbedding(text: string): Promise<number[]>
}

export class EmbeddingGenerator {
    private config: EmbeddingConfig
    private cache: Map<string, number[]>
    private logger: Logger
    private embeddingService: EmbeddingService | null = null

    constructor(config: EmbeddingConfig = {}, logger?: Logger) {
        this.config = {
            dimension: config.dimension || 1536, // Standard OpenAI embedding size
            model: config.model || 'text-embedding-3-small',
            batchSize: config.batchSize || 100,
            cacheSize: config.cacheSize || 10000
        }
        this.cache = new Map()
        this.logger = logger || new ConsoleLogger()
    }

    setEmbeddingService(service: EmbeddingService): void {
        this.embeddingService = service
        this.logger.info('Embedding service set')
    }

    async generateEmbedding(text: string): Promise<number[]> {
        const hash = this.computeHash(text)

        // Check cache
        if (this.cache.has(hash)) {
            return this.cache.get(hash)!
        }

        let embedding: number[]

        if (this.embeddingService) {
            // Use AI service for embedding generation
            try {
                embedding = await this.embeddingService.generateEmbedding(text)
            } catch (error) {
                this.logger.warn('Failed to generate embedding with AI service, using fallback')
                embedding = this.generatePlaceholderEmbedding(text)
            }
        } else {
            // Use placeholder embedding
            embedding = this.generatePlaceholderEmbedding(text)
        }

        // Cache the embedding
        this.cache.set(hash, embedding)

        // Prune cache if needed
        if (this.cache.size > (this.config.cacheSize || 10000)) {
            this.pruneCache()
        }

        return embedding
    }

    async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
        const batchSize = this.config.batchSize || 100
        const embeddings: number[][] = []

        for (let i = 0; i < texts.length; i += batchSize) {
            const batch = texts.slice(i, i + batchSize)
            const batchEmbeddings = await Promise.all(
                batch.map(text => this.generateEmbedding(text))
            )
            embeddings.push(...batchEmbeddings)
        }

        return embeddings
    }

    private generatePlaceholderEmbedding(text: string): number[] {
        // Simple hash-based embedding as placeholder
        // In production, this would call an embedding API
        const embedding = new Array(this.config.dimension).fill(0)

        const hash = this.computeHash(text)
        for (let i = 0; i < hash.length; i++) {
            const charCode = hash.charCodeAt(i)
            embedding[i % embedding.length] = (charCode % 100) / 100
        }

        return embedding
    }

    private computeHash(text: string): string {
        // Simple hash function for caching
        let hash = 0
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32bit integer
        }
        return hash.toString(36)
    }

    private pruneCache(): void {
        // Simple LRU-style pruning
        const keys = Array.from(this.cache.keys())
        const toRemove = keys.slice(0, keys.length / 2)
        for (const key of toRemove) {
            this.cache.delete(key)
        }
        this.logger.debug(`Pruned embedding cache, removed ${toRemove.length} entries`)
    }

    cosineSimilarity(a: number[], b: number[]): number {
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

    euclideanDistance(a: number[], b: number[]): number {
        if (a.length !== b.length) {
            throw new Error('Embedding dimensions must match')
        }

        let sum = 0
        for (let i = 0; i < a.length; i++) {
            const diff = a[i] - b[i]
            sum += diff * diff
        }

        return Math.sqrt(sum)
    }

    clearCache(): void {
        this.cache.clear()
        this.logger.info('Cleared embedding cache')
    }

    getCacheStats(): {
        size: number
        maxSize: number
        utilization: number
    } {
        const maxSize = this.config.cacheSize || 10000
        return {
            size: this.cache.size,
            maxSize,
            utilization: this.cache.size / maxSize
        }
    }

    reset(): void {
        this.cache.clear()
        this.logger.info('Reset embedding generator')
    }
}

// Singleton instance
let embeddingGenerator: EmbeddingGenerator | null = null

export function getEmbeddingGenerator(config?: EmbeddingConfig, logger?: Logger): EmbeddingGenerator {
    if (!embeddingGenerator) {
        embeddingGenerator = new EmbeddingGenerator(config, logger)
    }
    return embeddingGenerator
}

export function destroyEmbeddingGenerator(): void {
    if (embeddingGenerator) {
        embeddingGenerator.reset()
        embeddingGenerator = null
    }
}

export function createEmbeddingGenerator(config?: EmbeddingConfig, logger?: Logger): EmbeddingGenerator {
    return new EmbeddingGenerator(config, logger)
}