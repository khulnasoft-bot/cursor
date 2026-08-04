/**
 * Semantic Indexer Type Definitions
 * Core types for embedding-based codebase understanding
 */

/**
 * Code chunk for embedding
 */
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

/**
 * Semantic index structure
 */
export interface SemanticIndex {
    chunks: Map<string, CodeChunk>
    filePaths: Set<string>
    lastIndexed: Date
    totalChunks: number
    version: string
}

/**
 * Search query
 */
export interface SearchQuery {
    query: string
    limit?: number
    threshold?: number
    filePaths?: string[]
    languages?: string[]
}

/**
 * Search result
 */
export interface SearchResult {
    chunk: CodeChunk
    similarity: number
    filePath: string
    lineRange: { start: number; end: number }
}

/**
 * Embedding configuration
 */
export interface EmbeddingConfig {
    dimension?: number
    model?: string
    batchSize?: number
    cacheSize?: number
}

/**
 * Index configuration
 */
export interface IndexerConfig {
    chunkSize?: number
    chunkOverlap?: number
    maxIndexSize?: number
    enableCache?: boolean
    enablePersistence?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
}

/**
 * File relationship
 */
export interface FileRelationship {
    sourceFile: string
    targetFile: string
    relationshipType: 'import' | 'export' | 'reference' | 'similar'
    strength: number
}

/**
 * Relationship graph
 */
export interface RelationshipGraph {
    nodes: Map<string, CodeChunk>
    edges: Map<string, Set<FileRelationship>>
}