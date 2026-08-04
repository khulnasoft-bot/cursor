/**
 * @cursor/semantic-indexer
 * Embedding-based semantic codebase understanding and search
 */

// Main semantic indexer
export {
    SemanticIndexer,
    getSemanticIndexer,
    destroySemanticIndexer,
    createSemanticIndexer
} from './semanticIndexer'

// Embedding generator
export {
    EmbeddingGenerator,
    getEmbeddingGenerator,
    destroyEmbeddingGenerator,
    createEmbeddingGenerator
} from './embeddingGenerator'

export type {
    EmbeddingService
} from './embeddingGenerator'

// Relationship mapper
export {
    RelationshipMapper,
    getRelationshipMapper,
    destroyRelationshipMapper,
    createRelationshipMapper
} from './relationshipMapper'

// Search engine
export {
    SearchEngine,
    getSearchEngine,
    destroySearchEngine,
    createSearchEngine
} from './searchEngine'

export type {
    SearchOptions
} from './searchEngine'

// Index manager
export {
    IndexManager,
    getIndexManager,
    destroyIndexManager,
    createIndexManager
} from './indexManager'

export type {
    IndexSnapshot
} from './indexManager'

// Types
export type {
    CodeChunk,
    SemanticIndex,
    SearchQuery,
    SearchResult,
    EmbeddingConfig,
    IndexerConfig,
    FileRelationship,
    RelationshipGraph
} from './types'

// Logger
export {
    Logger,
    LogLevel,
    ConsoleLogger,
    NoOpLogger
} from './logger'