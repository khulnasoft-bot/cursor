# @cursor/file-service

File indexing and search service with caching and incremental updates.

## Installation

```bash
npm install @cursor/file-service
```

## Usage

```typescript
import { createFileService, ConsoleLogger } from '@cursor/file-service'

// Create a file service instance
const fileService = createFileService({
    cachePath: './.file-cache',
    enableCache: true,
    defaultIndexingOptions: {
        excludePatterns: ['node_modules', '.git', 'dist'],
        maxFileSize: 1024 * 1024 // 1MB
    }
}, new ConsoleLogger())

// Index a directory
await fileService.indexDirectory('./my-project')

// Search for content
const results = await fileService.search({
    query: 'function',
    caseSensitive: false,
    fileTypes: ['typescript', 'javascript']
})

// Get file content
const content = fileService.getFileContent('./src/main.ts')

// Get index statistics
const stats = fileService.getIndexStats()
console.log(`Indexed ${stats.totalFiles} files in ${stats.totalSize} bytes`)
console.log('Languages:', stats.languages)

// Update a specific file
await fileService.updateFile('./src/main.ts')

// Remove a file from index
await fileService.removeFile('./src/old-file.ts')

// Clear the entire index
fileService.clearIndex()
```

## Features

### File Indexing
- Recursive directory traversal
- Incremental updates based on file modification time
- Configurable include/exclude patterns
- File size limits
- Language detection for 20+ programming languages
- Depth-limited traversal

### Search Capabilities
- Content search with regex support
- Case-sensitive and case-insensitive search
- Filter by file type
- Line and position information for matches
- Configurable result limits

### Caching
- Automatic index caching to disk
- Fast startup with cached index
- Configurable cache location
- Can be disabled for memory-only operation

### Logging
- Multiple logger implementations (Console, NoOp, Memory)
- Configurable log levels
- Debug information for troubleshooting

## API

### FileService

#### Methods

- `indexDirectory(directoryPath: string, options?: IndexingOptions): Promise<void>`
  - Index a directory and its contents
  - Options: includePatterns, excludePatterns, maxFileSize, followSymlinks, maxDepth

- `search(options: SearchOptions): Promise<SearchResult[]>`
  - Search indexed files for content
  - Options: query, caseSensitive, regex, fileTypes, maxResults

- `getFileContent(filePath: string): string | null`
  - Get cached content of a file

- `updateFile(filePath: string): Promise<void>`
  - Update a specific file in the index

- `removeFile(filePath: string): Promise<void>`
  - Remove a file from the index

- `clearIndex(): void`
  - Clear the entire index

- `getIndexStats(): { totalFiles: number; totalSize: number; languages: Record<string, number> }`
  - Get statistics about the current index

- `isIndexing(): boolean`
  - Check if indexing is currently in progress

- `getIndexedFiles(): string[]`
  - Get list of all indexed file paths

- `getIndexSize(): number`
  - Get the number of indexed files

### Configuration

#### IndexingOptions
```typescript
interface IndexingOptions {
    includePatterns?: string[]      // Glob patterns to include
    excludePatterns?: string[]      // Glob patterns to exclude
    maxFileSize?: number           // Maximum file size in bytes
    followSymlinks?: boolean       // Whether to follow symbolic links
    maxDepth?: number              // Maximum directory depth
}
```

#### SearchOptions
```typescript
interface SearchOptions {
    query: string                   // Search query
    caseSensitive?: boolean        // Case-sensitive search
    regex?: boolean                 // Regex search
    fileTypes?: string[]           // Filter by file type
    maxResults?: number            // Maximum results to return
}
```

#### FileServiceConfig
```typescript
interface FileServiceConfig {
    cachePath?: string             // Path to cache file
    defaultIndexingOptions?: IndexingOptions
    enableCache?: boolean          // Enable/disable caching
    logger?: Logger                // Logger instance
}
```

## Language Detection

The service automatically detects programming languages based on file extensions:

- TypeScript (.ts, .tsx)
- JavaScript (.js, .jsx)
- Python (.py)
- Java (.java)
- C/C++ (.c, .cpp)
- Go (.go)
- Rust (.rs)
- PHP (.php)
- Ruby (.rb)
- Swift (.swift)
- Kotlin (.kt)
- Scala (.scala)
- HTML (.html)
- CSS (.css, .scss, .sass, .less)
- JSON (.json)
- XML (.xml)
- YAML (.yaml, .yml)
- Markdown (.md)
- SQL (.sql)
- Shell (.sh)
- PowerShell (.ps1)
- Batch (.bat)
- Vue (.vue)
- Svelte (.svelte)

## Logger Implementations

### ConsoleLogger
Outputs to console with level prefixes.

```typescript
import { ConsoleLogger } from '@cursor/file-service'

const logger = new ConsoleLogger()
logger.setEnabled(false) // Disable logging
```

### NoOpLogger
Silent logger, useful for testing or disabling logs.

```typescript
import { NoOpLogger } from '@cursor/file-service'

const logger = new NoOpLogger()
```

### MemoryLogger
Stores logs in memory for testing and debugging.

```typescript
import { MemoryLogger } from '@cursor/file-service'

const logger = new MemoryLogger()
const logs = logger.getLogs()
const errorLogs = logger.getLogsByLevel('error')
logger.clearLogs()
```

## Examples

### Basic Usage
```typescript
import { createFileService } from '@cursor/file-service'

const service = createFileService()
await service.indexDirectory('./src')
const results = await service.search({ query: 'export' })
```

### Advanced Configuration
```typescript
import { createFileService, ConsoleLogger } from '@cursor/file-service'

const service = createFileService({
    cachePath: './.my-cache',
    enableCache: true,
    defaultIndexingOptions: {
        excludePatterns: ['node_modules', '.git', 'dist', 'build'],
        maxFileSize: 2 * 1024 * 1024, // 2MB
        maxDepth: 10
    }
}, new ConsoleLogger())
```

### Regex Search
```typescript
const results = await service.search({
    query: 'function.*\\(.*\\)',
    regex: true,
    caseSensitive: false
})
```

### Filter by File Type
```typescript
const results = await service.search({
    query: 'interface',
    fileTypes: ['typescript', 'javascript']
})
```

### Statistics
```typescript
const stats = service.getIndexStats()
console.log(`Total files: ${stats.totalFiles}`)
console.log(`Total size: ${stats.totalSize} bytes`)
console.log('Languages:', stats.languages)
```

## Performance Considerations

- **Memory Usage**: The service keeps file contents in memory. For large codebases, consider increasing memory limits or using maxFileSize to exclude large files.
- **Indexing Time**: Initial indexing can be slow for large directories. Subsequent runs are faster due to incremental updates.
- **Caching**: Caching is enabled by default. Disable it for memory-constrained environments.
- **Search Performance**: Search is optimized with cached content. Consider using maxResults for large result sets.

## License

MIT