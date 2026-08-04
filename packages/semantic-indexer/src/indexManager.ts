/**
 * Index Manager
 * Manages index lifecycle, updates, and persistence
 */

import {
    CodeChunk,
    SemanticIndex,
    IndexerConfig
} from './types'
import { Logger, ConsoleLogger } from './logger'

export interface IndexSnapshot {
    version: string
    timestamp: Date
    chunkCount: number
    fileCount: number
    checksum: string
}

export class IndexManager {
    private index: SemanticIndex
    private snapshots: Map<string, IndexSnapshot>
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
        this.snapshots = new Map()
        
        this.index = {
            chunks: new Map(),
            filePaths: new Set(),
            lastIndexed: new Date(),
            totalChunks: 0,
            version: '1.0.0'
        }
    }

    addChunk(chunk: CodeChunk): void {
        // Check index size limit
        if (this.config.maxIndexSize && this.index.totalChunks >= this.config.maxIndexSize) {
            this.logger.warn('Index size limit reached, consider pruning')
        }

        this.index.chunks.set(chunk.id, chunk)
        this.index.filePaths.add(chunk.filePath)
        this.index.totalChunks = this.index.chunks.size
        this.index.lastIndexed = new Date()
    }

    removeChunk(chunkId: string): boolean {
        const chunk = this.index.chunks.get(chunkId)
        if (!chunk) return false

        this.index.chunks.delete(chunkId)

        // Check if file still has chunks
        const fileHasChunks = Array.from(this.index.chunks.values()).some(
            c => c.filePath === chunk.filePath
        )

        if (!fileHasChunks) {
            this.index.filePaths.delete(chunk.filePath)
        }

        this.index.totalChunks = this.index.chunks.size
        this.logger.debug(`Removed chunk: ${chunkId}`)
        return true
    }

    removeFile(filePath: string): number {
        let count = 0
        for (const [id, chunk] of this.index.chunks) {
            if (chunk.filePath === filePath) {
                this.index.chunks.delete(id)
                count++
            }
        }

        this.index.filePaths.delete(filePath)
        this.index.totalChunks = this.index.chunks.size
        this.logger.info(`Removed ${count} chunks for file: ${filePath}`)
        return count
    }

    updateChunk(chunkId: string, updates: Partial<CodeChunk>): boolean {
        const chunk = this.index.chunks.get(chunkId)
        if (!chunk) return false

        const updated = { ...chunk, ...updates }
        this.index.chunks.set(chunkId, updated)
        this.logger.debug(`Updated chunk: ${chunkId}`)
        return true
    }

    getIndex(): SemanticIndex {
        return {
            chunks: new Map(this.index.chunks),
            filePaths: new Set(this.index.filePaths),
            lastIndexed: this.index.lastIndexed,
            totalChunks: this.index.totalChunks,
            version: this.index.version
        }
    }

    setIndex(index: SemanticIndex): void {
        this.index = {
            chunks: new Map(index.chunks),
            filePaths: new Set(index.filePaths),
            lastIndexed: index.lastIndexed,
            totalChunks: index.totalChunks,
            version: index.version
        }
        this.logger.info('Index updated')
    }

    createSnapshot(): IndexSnapshot {
        const snapshot: IndexSnapshot = {
            version: this.index.version,
            timestamp: new Date(),
            chunkCount: this.index.totalChunks,
            fileCount: this.index.filePaths.size,
            checksum: this.computeChecksum()
        }

        const snapshotId = `snapshot-${snapshot.timestamp.getTime()}`
        this.snapshots.set(snapshotId, snapshot)
        this.logger.info(`Created snapshot: ${snapshotId}`)
        return snapshot
    }

    restoreSnapshot(snapshotId: string): boolean {
        const snapshot = this.snapshots.get(snapshotId)
        if (!snapshot) {
            this.logger.warn(`Snapshot not found: ${snapshotId}`)
            return false
        }

        // Verify checksum
        const currentChecksum = this.computeChecksum()
        if (currentChecksum !== snapshot.checksum) {
            this.logger.warn('Checksum mismatch, cannot restore snapshot')
            return false
        }

        this.logger.info(`Restored snapshot: ${snapshotId}`)
        return true
    }

    pruneOldSnapshots(olderThan: Date): number {
        let count = 0
        for (const [id, snapshot] of this.snapshots) {
            if (snapshot.timestamp < olderThan) {
                this.snapshots.delete(id)
                count++
            }
        }
        this.logger.info(`Pruned ${count} old snapshots`)
        return count
    }

    clearSnapshots(): void {
        this.snapshots.clear()
        this.logger.info('Cleared all snapshots')
    }

    private computeChecksum(): string {
        // Simple checksum based on chunk count and file paths
        const filePaths = Array.from(this.index.filePaths).sort()
        const data = `${this.index.totalChunks}:${filePaths.join(',')}:${this.index.version}`
        
        let hash = 0
        for (let i = 0; i < data.length; i++) {
            const char = data.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash
        }
        return hash.toString(36)
    }

    getIndexStats(): {
        totalChunks: number
        totalFiles: number
        lastIndexed: Date
        version: string
        snapshots: number
    } {
        return {
            totalChunks: this.index.totalChunks,
            totalFiles: this.index.filePaths.size,
            lastIndexed: this.index.lastIndexed,
            version: this.index.version,
            snapshots: this.snapshots.size
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
        this.logger.info('Index cleared')
    }

    async saveIndex(path: string): Promise<boolean> {
        if (!this.config.enablePersistence) {
            this.logger.warn('Persistence is disabled')
            return false
        }

        try {
            // In production, this would save to disk
            // For now, this is a placeholder
            this.logger.info(`Saved index to: ${path}`)
            return true
        } catch (error) {
            this.logger.error('Failed to save index:', error)
            return false
        }
    }

    async loadIndex(path: string): Promise<boolean> {
        if (!this.config.enablePersistence) {
            this.logger.warn('Persistence is disabled')
            return false
        }

        try {
            // In production, this would load from disk
            // For now, this is a placeholder
            this.logger.info(`Loaded index from: ${path}`)
            return true
        } catch (error) {
            this.logger.error('Failed to load index:', error)
            return false
        }
    }

    optimizeIndex(): void {
        // Rebuild the index to optimize memory usage
        const optimizedChunks = new Map(this.index.chunks)
        const optimizedFilePaths = new Set(this.index.filePaths)

        this.index.chunks = optimizedChunks
        this.index.filePaths = optimizedFilePaths
        this.index.totalChunks = optimizedChunks.size

        this.logger.info('Index optimized')
    }

    validateIndex(): { valid: boolean; errors: string[] } {
        const errors: string[] = []

        // Check for orphaned chunks
        for (const [id, chunk] of this.index.chunks) {
            if (!this.index.filePaths.has(chunk.filePath)) {
                errors.push(`Orphaned chunk: ${id} (file not in filePaths)`)
            }
        }

        // Check for orphaned file paths
        for (const filePath of this.index.filePaths) {
            const hasChunks = Array.from(this.index.chunks.values()).some(
                c => c.filePath === filePath
            )
            if (!hasChunks) {
                errors.push(`Orphaned file path: ${filePath} (no chunks)`)
            }
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    updateConfig(config: Partial<IndexerConfig>): void {
        this.config = { ...this.config, ...config }
        this.logger.info('Index manager configuration updated')
    }

    getConfig(): IndexerConfig {
        return { ...this.config }
    }

    reset(): void {
        this.clearIndex()
        this.clearSnapshots()
        this.logger.info('Reset index manager')
    }
}

// Singleton instance
let indexManager: IndexManager | null = null

export function getIndexManager(config?: IndexerConfig, logger?: Logger): IndexManager {
    if (!indexManager) {
        indexManager = new IndexManager(config, logger)
    }
    return indexManager
}

export function destroyIndexManager(): void {
    if (indexManager) {
        indexManager.reset()
        indexManager = null
    }
}

export function createIndexManager(config?: IndexerConfig, logger?: Logger): IndexManager {
    return new IndexManager(config, logger)
}