# Cursor Packages Integration Guide

**Version**: 1.0.0  
**Date**: August 4, 2026

This guide provides comprehensive information on integrating the Cursor packages into your projects.

---

## Quick Start

### Installation

Install individual packages as needed:

```bash
npm install @cursor/types
npm install @cursor/utils
npm install @cursor/file-service
npm install @cursor/react-codemirror
npm install @cursor/ai-service
npm install @cursor/automations
npm install @cursor/rules-service
npm install @cursor/composer
npm install @cursor/agent-exec
npm install @cursor/semantic-indexer
```

Or install all packages:

```bash
npm install @cursor/types @cursor/utils @cursor/file-service @cursor/react-codemirror @cursor/ai-service @cursor/automations @cursor/rules-service @cursor/composer @cursor/agent-exec @cursor/semantic-indexer
```

---

## Package Integration Patterns

### Pattern 1: AI-Powered Application

Best for applications that need AI capabilities.

```typescript
import { createAIService } from '@cursor/ai-service'
import { createComposerService } from '@cursor/composer'
import { createSemanticIndexer } from '@cursor/semantic-indexer'

// Initialize AI service
const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

// Initialize composer for multi-file editing
const composer = createComposerService()
composer.setAIService(aiService)

// Initialize semantic indexer for code understanding
const indexer = createSemanticIndexer()

// Use the services
const plan = await composer.planChanges({
    prompt: 'Add error handling to all API functions',
    context: { projectPath: './my-project', files: new Map([...]) }
})
```

### Pattern 2: Automation-First Application

Best for workflow automation and task execution.

```typescript
import { createAutomationsService } from '@cursor/automations'
import { createAgentExecService, createToolRegistry } from '@cursor/agent-exec'

// Initialize automation service
const automationService = createAutomationsService()

// Initialize agent execution
const agentExec = createAgentExecService()
const toolRegistry = createToolRegistry()
agentExec.setToolRegistry(toolRegistry)

// Create and execute workflows
const workflow = automationService.createWorkflow(
    'Auto Commit',
    'Automatically commit changes',
    [{ type: 'file_save', path: './src' }],
    [{ name: 'git_commit', params: { message: 'Auto commit' } }]
)

await automationService.executeWorkflow(workflow.id, { type: 'file_save' })
```

### Pattern 3: Code Quality Application

Best for enforcing coding standards and conventions.

```typescript
import { createRuleService } from '@cursor/rules-service'
import { createSemanticIndexer } from '@cursor/semantic-indexer'

// Initialize rules service
const ruleService = createRuleService()
await ruleService.loadRules('./')

// Initialize semantic indexer
const indexer = createSemanticIndexer()

// Apply rules to code
const result = await ruleService.applyRulesToCode(code, './src/main.ts')
console.log('Violations:', result.violations)

// Use semantic understanding for better rule enforcement
await indexer.indexFile('./src/main.ts', content, 'typescript')
const similarCode = await indexer.search({ query: 'authentication pattern' })
```

### Pattern 4: Full-Stack Cursor-like Application

Best for building complete AI-powered development tools.

```typescript
import {
    createAIService,
    createComposerService,
    createAgentExecService,
    createToolRegistry,
    createSemanticIndexer,
    createAutomationsService,
    createRuleService
} from '@cursor/*'

// Initialize all services
const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

const composer = createComposerService()
composer.setAIService(aiService)

const toolRegistry = createToolRegistry()
const agentExec = createAgentExecService()
agentExec.setToolRegistry(toolRegistry)

const indexer = createSemanticIndexer()

const automationService = createAutomationsService()

const ruleService = createRuleService()

// Use them together for a complete experience
// 1. Index codebase for semantic understanding
await indexer.indexDirectory('./src')

// 2. Set up automations for common tasks
automationService.createWorkflow('Auto Format', 'Format code on save', [...], [...])

// 3. Configure rules for code quality
await ruleService.loadRules('./cursor-rules')

// 4. Enable AI-powered multi-file editing
const plan = await composer.planChanges({ prompt: 'Refactor authentication', ... })
```

---

## Service Configuration

### AI Service Configuration

```typescript
import { createAIService } from '@cursor/ai-service'

const aiService = createAIService({
    defaultProvider: 'openai',
    enableStreaming: true,
    maxRetries: 3,
    timeoutMs: 30000
})

// Configure providers
aiService.setProvider('openai', process.env.OPENAI_API_KEY)
aiService.setProvider('anthropic', process.env.ANTHROPIC_API_KEY)
aiService.setProvider('google', process.env.GOOGLE_API_KEY)
```

### Composer Configuration

```typescript
import { createComposerService } from '@cursor/composer'

const composer = createComposerService({
    maxConcurrentExecutions: 3,
    executionTimeoutMs: 300000,
    defaultMaxFiles: 10,
    enableRollback: true,
    logLevel: 'info'
})
```

### Agent Execution Configuration

```typescript
import { createAgentExecService } from '@cursor/agent-exec'

const agentExec = createAgentExecService({
    maxConcurrentTasks: 3,
    executionTimeoutMs: 300000,
    maxMemories: 1000,
    importanceThreshold: 0.3,
    enableRollback: true
})
```

### Semantic Indexer Configuration

```typescript
import { createSemanticIndexer } from '@cursor/semantic-indexer'

const indexer = createSemanticIndexer({
    chunkSize: 500,
    chunkOverlap: 50,
    maxIndexSize: 100000,
    enableCache: true,
    enablePersistence: false
})
```

---

## Error Handling

All services provide detailed error information:

```typescript
try {
    const result = await composer.planChanges(request)
} catch (error) {
    if (error.message.includes('AI service not set')) {
        console.error('AI service not configured')
    } else if (error.message.includes('Circular dependency')) {
        console.error('Dependency cycle detected')
    } else {
        console.error('Unknown error:', error)
    }
}
```

---

## Best Practices

### 1. Service Lifecycle

Create services once and reuse them:

```typescript
// Good: Create once
const aiService = createAIService()

// Bad: Create multiple times
const aiService1 = createAIService()
const aiService2 = createAIService()
```

### 2. Configuration Management

Use environment variables for sensitive data:

```typescript
const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)
```

### 3. Error Handling

Always handle errors gracefully:

```typescript
try {
    await service.operation()
} catch (error) {
    // Log error
    logger.error('Operation failed', error)
    // Provide user feedback
    showError('Operation failed: ' + error.message)
}
```

### 4. Resource Management

Clean up resources when done:

```typescript
// For singleton instances
destroyAIService()
destroyComposerService()
destroyAgentExecService()

// For created instances
const service = createXService()
// Use service...
// Then reset if needed
service.reset()
```

### 5. Performance

Enable caching where available:

```typescript
const indexer = createSemanticIndexer({ enableCache: true })
const searchEngine = createSearchEngine(embeddingGen, { enableCache: true })
```

---

## Common Integration Scenarios

### Scenario 1: Building a Code Editor

```typescript
import { createReactCodeMirror } from '@cursor/react-codemirror'
import { createSemanticIndexer } from '@cursor/semantic-indexer'

// Editor component
const CodeEditor = createReactCodeMirror({
    theme: 'cursor-dark',
    lineNumbers: true,
    highlightSelectionMatches: true
})

// Semantic search for code navigation
const indexer = createSemanticIndexer()
await indexer.indexDirectory('./src')

const searchResults = await indexer.search({ query: 'authentication' })
```

### Scenario 2: Building a CI/CD Tool

```typescript
import { createAutomationsService } from '@cursor/automations'
import { createRuleService } from '@cursor/rules-service'

// Set up quality checks
const ruleService = createRuleService()
await ruleService.loadRules('./quality-rules')

// Automate quality checks
const automationService = createAutomationsService()
const workflow = automationService.createWorkflow(
    'Quality Check',
    'Run quality checks on commit',
    [{ type: 'git_commit' }],
    [{ name: 'apply_rules', params: { path: './src' } }]
)
```

### Scenario 3: Building an AI Assistant

```typescript
import { createAIService } from '@cursor/ai-service'
import { createComposerService } from '@cursor/composer'
import { createAgentExecService } from '@cursor/agent-exec'

// AI service for understanding
const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

// Composer for multi-file changes
const composer = createComposerService()
composer.setAIService(aiService)

// Agent execution for autonomous tasks
const agentExec = createAgentExecService()
const toolRegistry = createToolRegistry()
agentExec.setToolRegistry(toolRegistry)

// Combined: AI assistant that can make multi-file changes
const plan = await composer.planChanges({
    prompt: 'Add logging to all API endpoints',
    context: { projectPath: './my-project', files: new Map([...]) }
})
```

---

## Troubleshooting

### Issue: AI Service Not Working

**Solution**: Ensure API keys are set correctly:

```typescript
const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)
```

### Issue: Composer Cannot Plan Changes

**Solution**: Ensure AI service is set:

```typescript
const composer = createComposerService()
composer.setAIService(aiService) // Required
```

### Issue: Agent Execution Fails

**Solution**: Ensure tool registry is set:

```typescript
const agentExec = createAgentExecService()
agentExec.setToolRegistry(toolRegistry) // Required
```

### Issue: Semantic Search Returns No Results

**Solution**: Ensure files are indexed:

```typescript
await indexer.indexFile('./src/main.ts', content, 'typescript')
```

---

## Performance Tips

1. **Enable Caching**: Use caching for AI and search operations
2. **Batch Operations**: Use batch embedding generation for multiple files
3. **Limit Scope**: Use file/language filters to limit search scope
4. **Monitor Memory**: Set appropriate cache and index size limits
5. **Optimize Index**: Periodically optimize semantic index

---

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **File Access**: Use sandbox environment for file operations
3. **Input Validation**: Validate all user inputs before processing
4. **Resource Limits**: Set appropriate resource limits for execution
5. **Error Messages**: Don't expose sensitive information in error messages

---

## Support

For issues or questions:
- Check package READMEs for detailed documentation
- Review integration examples in this guide
- Check error messages for specific guidance
- Refer to TypeScript type definitions for API details