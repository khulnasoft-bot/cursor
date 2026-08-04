# Cursor Packages - Quick Start Guide

Get started with Cursor packages in 5 minutes.

---

## Installation

```bash
npm install @cursor/ai-service @cursor/composer @cursor/agent-exec @cursor/semantic-indexer
```

---

## Basic Usage

### 1. AI Service

```typescript
import { createAIService } from '@cursor/ai-service'

const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

const response = await aiService.sendMessage('Hello, world!')
console.log(response)
```

### 2. Multi-File Editing

```typescript
import { createComposerService } from '@cursor/composer'

const composer = createComposerService()
composer.setAIService(aiService)

const result = await composer.planChanges({
    prompt: 'Add error handling to all API functions',
    context: {
        projectPath: './my-project',
        files: new Map([
            ['src/api/user.ts', 'export function getUser() { return fetch(...) }'],
            ['src/api/auth.ts', 'export function login() { return fetch(...) }']
        ])
    }
})

console.log(`Planned ${result.changes.length} changes`)
```

### 3. Agent Execution

```typescript
import { createAgentExecService, createToolRegistry } from '@cursor/agent-exec'

const agentExec = createAgentExecService()
const toolRegistry = createToolRegistry()
agentExec.setToolRegistry(toolRegistry)

const taskId = await agentExec.executeTool('read_file', {
    filePath: './src/main.ts'
})

console.log(`Task ${taskId} completed`)
```

### 4. Semantic Search

```typescript
import { createSemanticIndexer } from '@cursor/semantic-indexer'

const indexer = createSemanticIndexer()

await indexer.indexFile('./src/main.ts', fileContent, 'typescript')

const results = await indexer.search({
    query: 'authentication logic',
    limit: 5
})

results.forEach(result => {
    console.log(`${result.filePath}:${result.lineRange.start}`)
    console.log(`Similarity: ${result.similarity.toFixed(2)}`)
})
```

---

## Complete Example

```typescript
import {
    createAIService,
    createComposerService,
    createAgentExecService,
    createToolRegistry,
    createSemanticIndexer
} from '@cursor/*'

// Initialize services
const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

const composer = createComposerService()
composer.setAIService(aiService)

const toolRegistry = createToolRegistry()
const agentExec = createAgentExecService()
agentExec.setToolRegistry(toolRegistry)

const indexer = createSemanticIndexer()

// Use them together
await indexer.indexDirectory('./src')

const plan = await composer.planChanges({
    prompt: 'Refactor authentication',
    context: { projectPath: './my-project', files: new Map([...]) }
})

const execution = await composer.executeChanges(plan)
console.log(`Execution status: ${execution.status}`)
```

---

## Environment Variables

Required for AI service:

```bash
OPENAI_API_KEY=your-key-here
ANTHROPIC_API_KEY=your-key-here
GOOGLE_API_KEY=your-key-here
```

---

## Next Steps

- Read [Integration Guide](./INTEGRATION_GUIDE.md) for detailed integration patterns
- Read [Deployment Guide](./DEPLOYMENT_GUIDE.md) for deployment information
- Check individual package READMEs for detailed documentation

---

## Support

For issues or questions, refer to the package READMEs or integration guide.