/**
 * File Service Configuration
 * Configuration options for the file indexing and search service
 */

/**
 * Indexing options for file service
 */
export interface IndexingOptions {
    /** File patterns to include (glob patterns) */
    includePatterns?: string[]
    /** File/directory patterns to exclude (glob patterns) */
    excludePatterns?: string[]
    /** Maximum file size to index in bytes */
    maxFileSize?: number
    /** Whether to follow symbolic links */
    followSymlinks?: boolean
    /** Maximum depth for directory traversal */
    maxDepth?: number
}

/**
 * Search options for file service
 */
export interface SearchOptions {
    /** Search query string */
    query: string
    /** Whether the search should be case sensitive */
    caseSensitive?: boolean
    /** Whether the query is a regular expression */
    regex?: boolean
    /** File types to include in search (based on language detection) */
    fileTypes?: string[]
    /** Maximum number of results to return */
    maxResults?: number
}

/**
 * Search result with file matches
 */
export interface SearchResult {
    /** File path where matches were found */
    path: string
    /** Array of matches with line and position information */
    matches: Array<{
        line: number
        content: string
        startIndex: number
        endIndex: number
    }>
}

/**
 * File index entry
 */
export interface FileIndex {
    /** File path */
    path: string
    /** File content */
    content: string
    /** Last modified timestamp */
    lastModified: number
    /** File size in bytes */
    size: number
    /** Detected programming language */
    language: string
}

/**
 * File service configuration
 */
export interface FileServiceConfig {
    /** Path to cache file for storing index */
    cachePath?: string
    /** Default indexing options */
    defaultIndexingOptions?: IndexingOptions
    /** Whether to enable caching */
    enableCache?: boolean
    /** Logger instance for service operations */
    logger?: any
}

/**
 * Default indexing options
 */
export const DEFAULT_INDEXING_OPTIONS: IndexingOptions = {
    includePatterns: ['*'],
    excludePatterns: ['node_modules', '.git', '.webpack', 'dist', 'build', 'out', 'coverage'],
    maxFileSize: 1024 * 1024, // 1MB
    followSymlinks: false,
    maxDepth: 100
}

/**
 * Default file service configuration
 */
export const DEFAULT_FILE_SERVICE_CONFIG: FileServiceConfig = {
    cachePath: undefined, // Will be set dynamically if not provided
    defaultIndexingOptions: DEFAULT_INDEXING_OPTIONS,
    enableCache: true,
    logger: undefined // Will use console logger if not provided
}