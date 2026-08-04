/**
 * @cursor/file-service
 * File indexing and search service with caching and incremental updates
 */

// Main file service
export {
    getFileService,
    destroyFileService,
    createFileService
} from './fileService'

// Types
export type {
    FileIndex,
    IndexingOptions,
    SearchOptions,
    SearchResult,
    FileServiceConfig
} from './fileService'

// Configuration
export {
    DEFAULT_INDEXING_OPTIONS,
    DEFAULT_FILE_SERVICE_CONFIG
} from './config'

// Logger
export {
    Logger,
    ConsoleLogger,
    NoOpLogger,
    MemoryLogger
} from './logger'