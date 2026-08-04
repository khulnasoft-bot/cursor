# @cursor/semantic-indexer

Embedding-based semantic codebase understanding and search for intelligent code navigation.

## Installation

```bash
npm install @cursor/semantic-indexer
```

## Usage

```typescript
import { createSemanticIndexer } from '@cursor/semantic-indexer'

// Create semantic indexer
const indexer = createSemanticIndexer({
    chunkSize: 500,
    chunkOverlap: 50
})

// Index a file
await indexer.indexFile('./src/main.ts', fileContent, 'typescript')

// Search semantically
const results = await indexer.search({
    query: 'How to handle authentication',
    limit: 10,
    threshold: 0.7
})

results.forEach(result => {
    console.log(`${result.filePath}:${result.lineRange.start}-${result.lineRange.end}`)
    console.log(`Similarity: ${result.similarity.toFixed(2)}`)
    console.log(result.chunk.content)
})
```

## Features

### Semantic Indexing
- Embedding-based code understanding
- Configurable chunking with overlap
- Support for multiple programming languages
- Efficient caching of embeddings

### Semantic Search
- Cosine similarity-based search
- Hybrid search (semantic + text)
- File and language filtering
- Configurable similarity thresholds

### Relationship Mapping
- Import/export dependency analysis
- File relationship graph
- Related file discovery
- Similar file detection

### Index Management
- Incremental index updates
- Snapshot and rollback support
- Index validation and optimization
- Persistent storage support

### Search Engine
- High-performance search with caching
- Near-context search
- Similar code discovery
- Hybrid ranking strategies

## API

### SemanticIndexer

#### Configuration
```typescript
interface IndexerConfig {
    chunkSize: number
    chunkOverlap: number
    maxIndexSize?: number
    enableCache?: boolean
    enablePersistence?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
}
```

#### Indexing
- `indexFile(filePath, content, language)` - Index a single file
- `indexDirectory(directoryPath, fileExtensions, ignorePatterns)` - Index a directory
- `reindexFile(filePath, content, language)` - Re-index a file
- `removeFile(filePath)` - Remove a file from index

#### Search
- `search(query)` - Semantic search
- `searchByFile(filePath, query, limit)` - Search within a file

#### Index Management
- `getIndexStats()` - Get index statistics
- `clearIndex()` - Clear the entire index
- `getChunk(chunkId)` - Get a specific chunk
- `getChunksByFile(filePath)` - Get all chunks for a file

### EmbeddingGenerator

#### Configuration
```typescript
interface EmbeddingConfig {
    dimension: number
    model?: string
    batchSize?: number
    cacheSize?: number
}
```

#### Embedding Generation
- `generateEmbedding(text)` - Generate embedding for text
- `generateBatchEmbeddings(texts)` - Generate embeddings for multiple texts
- `cosineSimilarity(a, b)` - Calculate cosine similarity
- `euclideanDistance(a, b)` - Calculate Euclidean distance

#### Cache Management
- `clearCache()` - Clear embedding cache
- `getCacheStats()` - Get cache statistics

### RelationshipMapper

#### Analysis
- `analyzeFile(filePath, content, language)` - Analyze file relationships
- `getDependents(filePath)` - Get files that depend on this file
- `getDependencies(filePath)` - Get files this file depends on
- `getRelatedFiles(filePath, maxDepth)` - Get related files

#### Similarity
- `findSimilarFiles(filePath, threshold)` - Find similar files

#### Graph Management
- `getGraph()` - Get the relationship graph
- `getGraphStats()` - Get graph statistics
- `clearGraph()` - Clear the graph

### SearchEngine

#### Configuration
```typescript
interface SearchOptions {
    enableHybridSearch?: boolean
    enableCache?: boolean
    maxResults?: number
    minSimilarity?: number
}
```

#### Search
- `search(chunks, query)` - Perform semantic search
- `hybridSearch(chunks, query, textResults)` - Hybrid semantic + text search
- `searchNear(chunks, filePath, line, radius)` - Search near a specific line
- `searchSimilar(chunks, referenceChunk, limit)` - Find similar code

#### Cache Management
- `clearCache()` - Clear search cache
- `getCacheStats()` - Get cache statistics

### IndexManager

#### Index Operations
- `addChunk(chunk)` - Add a chunk to the index
- `removeChunk(chunkId)` - Remove a chunk from the index
- `removeFile(filePath)` - Remove all chunks for a file
- `updateChunk(chunkId, updates)` - Update a chunk

#### Snapshot Management
- `createSnapshot()` - Create an index snapshot
- `restoreSnapshot(snapshotId)` - Restore from a snapshot
- `pruneOldSnapshots(olderThan)` - Prune old snapshots

#### Persistence
- `saveIndex(path)` - Save index to disk
- `loadIndex(path)` - Load index from disk

#### Optimization
- `optimizeIndex()` - Optimize index for memory
- `validateIndex()` - Validate index integrity

## Examples

### Basic Semantic Search
```typescript
import { createSemanticIndexer } from '@cursor/semantic-indexer'

const indexer = createSemanticIndexer()

// Index files
await indexer.indexFile('./src/auth.ts', authContent, 'typescript')
await indexer.indexFile('./src/user.ts', userContent, 'typescript')

// Search
const results = await indexer.search({
    query: 'user authentication logic',
    limit: 5,
    threshold: 0.7
})

results.forEach(result => {
    console.log(`Found in ${result.filePath} (similarity: ${result.similarity.toFixed(2)})`)
})
```

### Relationship Analysis
```typescript
import { createRelationshipMapper } from '@cursor/semantic-indexer'

const mapper = createRelationshipMapper()

// Analyze files
mapper.analyzeFile('./src/main.ts', mainContent, 'typescript')
mapper.analyzeFile('./src/utils.ts', utilsContent, 'typescript')

// Get dependencies
const deps = mapper.getDependencies('./src/main.ts')
console.log('Dependencies:', deps.map(d => d.targetFile))

// Get related files
const related = mapper.getRelatedFiles('./src/main.ts', 2)
console.log('Related files:', related)
```

### Advanced Search
```typescript
import { createSearchEngine, createEmbeddingGenerator } from '@cursor/semantic-indexer'

const embeddingGen = createEmbeddingGenerator()
const searchEngine = createSearchEngine(embeddingGen, {
    enableHybridSearch: true,
    enableCache: true
})

// Hybrid search
const results = await searchEngine.hybridSearch(
    chunks,
    { query: 'error handling', limit: 10 },
    textResults
)

// Search near a specific line
const nearResults = await searchEngine.searchNear(
    chunks,
    './src/main.ts',
    42,
    5
)
```

### Index Management
```typescript
import { createIndexManager } from '@cursor/semantic-indexer'

const manager = createIndexManager({
    enablePersistence: true,
    maxIndexSize: 100000
})

// Create snapshot before changes
const snapshot = manager.createSnapshot()

// Make changes
manager.addChunk(newChunk)
manager.removeChunk(oldChunkId)

// Validate index
const validation = manager.validateIndex()
if (!validation.valid) {
    console.error('Index validation failed:', validation.errors)
}

// Optimize index
manager.optimizeIndex()
```

### Custom Embedding Service
```typescript
import { createEmbeddingGenerator } from '@cursor/semantic-indexer'

class CustomEmbeddingService {
    async generateEmbedding(text: string): Promise<number[]> {
        // Custom embedding implementation
        // e.g., use a local model or different API
        return embedding
    }
}

const embeddingGen = createEmbeddingGenerator()
embeddingGen.setEmbeddingService(new CustomEmbeddingService())
```

## Best Practices

### Indexing
- Use appropriate chunk sizes for your codebase
- Enable caching for better performance
- Re-index files after changes
- Monitor index size and prune if needed

### Searching
- Use specific queries for better results
- Adjust similarity thresholds based on needs
- Use file/language filters for faster searches
- Enable hybrid search for better recall

### Performance
- Enable caching for repeated queries
- Use batch embedding for multiple texts
- Optimize index periodically
- Set appropriate index size limits

### Memory Management
- Monitor embedding cache size
- Prune old embeddings when needed
- Use index size limits for large codebases
- Clear caches when not needed

## Integration with AI Service

The semantic indexer can integrate with @cursor/ai-service for embedding generation:

```typescript
import { createAIService } from '@cursor/ai-service'
import { createEmbeddingGenerator } from '@cursor/semantic-indexer'

const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

const embeddingGen = createEmbeddingGenerator()
embeddingGen.setEmbeddingService({
    async generateEmbedding(text: string): Promise<number[]> {
        const response = await aiService.sendMessage(
            `Generate embedding for: ${text}`,
            { model: 'text-embedding-3-small' }
        )
        return JSON.parse(response)
    }
})
```

## Error Handling

The service provides detailed error information:

```typescript
try {
    const results = await indexer.search(query)
} catch (error) {
    if (error.message.includes('Embedding dimensions must match')) {
        console.error('Embedding dimension mismatch')
    } else if (error.message.includes('Index size limit reached')) {
        console.error('Index too large, consider pruning')
    }
}
```

## Performance

### Indexing Performance
- ~500 chunks/second for typical code
- Caching reduces repeated embedding generation
- Batch processing for multiple files

### Search Performance
- <100ms for typical queries with caching
- <500ms for uncached queries
- Hybrid search adds ~50ms overhead

### Memory Usage
- ~1KB per chunk (excluding embeddings)
- ~6KB per chunk with 1536-dim embeddings
- Cache size configurable (default: 10,000 entries)

## License

MIT