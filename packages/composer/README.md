# @cursor/composer

Multi-file editing orchestration engine for coordinated changes across files.

## Installation

```bash
npm install @cursor/composer
```

## Usage

```typescript
import { ComposerService, createComposerService } from '@cursor/composer'
import { createAIService } from '@cursor/ai-service'

// Create composer service
const composer = createComposerService()

// Set AI service for planning
const aiService = createAIService()
aiService.setProvider('openai', 'your-api-key')
composer.setAIService(aiService)

// Plan multi-file changes
const request = {
    prompt: 'Add error handling to all API functions',
    context: {
        projectPath: './my-project',
        files: new Map([
            ['src/api/user.ts', 'export function getUser() { return fetch(...) }'],
            ['src/api/auth.ts', 'export function login() { return fetch(...) }']
        ]),
        language: 'typescript'
    },
    constraints: {
        maxFiles: 5,
        allowedPaths: ['src/api/']
    }
}

const result = await composer.planChanges(request)
console.log(result.summary)

// Execute the planned changes
const execution = await composer.executeChanges(result)
console.log(`Execution status: ${execution.status}`)

// Rollback if needed
if (execution.status === 'failed') {
    await composer.rollbackExecution(execution.requestId)
}
```

## Features

### Multi-File Planning
- AI-powered change planning across multiple files
- Dependency detection and resolution
- Constraint validation (max files, path restrictions)
- Execution order optimization

### Change Orchestration
- Coordinated change application
- Atomic change execution
- Progress tracking
- Rollback capabilities

### Diff Generation
- Unified diff format
- Multi-file diff summary
- Change validation
- Diff application and verification

### Context Analysis
- File relationship mapping
- Import/export dependency graph
- Symbol extraction
- Impact analysis

## API

### ComposerService

#### Configuration
```typescript
interface ComposerConfig {
    maxConcurrentExecutions?: number
    executionTimeoutMs?: number
    defaultMaxFiles?: number
    enableRollback?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
}
```

#### Planning
- `setAIService(aiService)` - Set AI service for planning
- `planChanges(request)` - Plan multi-file changes
- `updateConfig(config)` - Update service configuration

#### Execution
- `executeChanges(result)` - Execute planned changes
- `rollbackExecution(requestId)` - Rollback execution
- `cancelExecution(requestId)` - Cancel execution

#### Monitoring
- `getExecution(requestId)` - Get execution details
- `getActiveExecutions()` - Get active executions
- `clearExecutions()` - Clear all executions

### DiffGenerator

#### Diff Generation
- `generateDiff(oldContent, newContent)` - Generate diff hunks
- `generateFileDiff(filePath, oldContent, newContent)` - Generate file diff
- `generateMultiFileDiff(fileChanges, executionOrder)` - Generate multi-file diff

#### Diff Formatting
- `formatDiffHunk(hunk)` - Format diff hunk
- `formatFileDiff(fileDiff)` - Format file diff
- `formatMultiFileDiff(multiFileDiff)` - Format multi-file diff

#### Diff Application
- `applyDiff(content, hunks)` - Apply diff to content
- `validateDiff(oldContent, newContent, hunks)` - Validate diff

### ChangeOrchestrator

#### Orchestration
- `createPlan(changes, executionOrder)` - Create orchestration plan
- `executePlan(plan, execution, applyChange)` - Execute plan
- `rollbackPlan(plan, execution, restoreFile)` - Rollback plan

#### Validation
- `validatePlan(plan)` - Validate orchestration plan
- `getExecutionProgress(plan)` - Get execution progress

### ContextAnalyzer

#### Analysis
- `analyzeFile(filePath, content, language)` - Analyze single file
- `analyzeProject(files)` - Analyze entire project
- `getAffectedFiles(filePath, graph, depth)` - Get affected files
- `getImpactAnalysis(filePath, graph)` - Get impact analysis

#### Relationships
- `findRelatedFiles(filePath, graph, context)` - Find related files

## Examples

### Basic Multi-File Edit
```typescript
const request = {
    prompt: 'Rename all occurrences of "foo" to "bar"',
    context: {
        projectPath: './my-project',
        files: new Map([
            ['src/utils.ts', 'export function foo() {}'],
            ['src/index.ts', 'import { foo } from "./utils"']
        ])
    }
}

const result = await composer.planChanges(request)
console.log(`Planned ${result.changes.length} changes`)
```

### With Constraints
```typescript
const request = {
    prompt: 'Add logging to all functions',
    context: { /* ... */ },
    constraints: {
        maxFiles: 10,
        allowedPaths: ['src/'],
        forbiddenPaths: ['src/vendor/']
    }
}
```

### Diff Generation
```typescript
import { getDiffGenerator } from '@cursor/composer'

const diffGen = getDiffGenerator()
const fileDiff = diffGen.generateFileDiff(
    'src/main.ts',
    oldContent,
    newContent
)
console.log(fileDiff.summary)
```

### Context Analysis
```typescript
import { getContextAnalyzer } from '@cursor/composer'

const analyzer = getContextAnalyzer()
const graph = analyzer.analyzeProject(files)
const impact = analyzer.getImpactAnalysis('src/main.ts', graph)
console.log(`Direct dependents: ${impact.directDependents.length}`)
```

### Custom Execution
```typescript
const execution = await composer.executeChanges(result, {
    async applyChange(change) {
        // Custom file change application
        await fs.writeFile(change.filePath, change.proposedContent)
    }
})
```

## Best Practices

### Planning
- Be specific in prompts for better results
- Use constraints to limit scope
- Review planned changes before execution
- Test with small changes first

### Execution
- Always have rollback enabled for production
- Monitor execution progress
- Handle errors gracefully
- Validate changes after execution

### Performance
- Limit the number of files in single operation
- Use appropriate timeout values
- Monitor memory usage for large projects
- Cache context analysis results

## Advanced Features

### Custom AI Integration
```typescript
class CustomAIService {
    async sendMessage(message: string, context?: any): Promise<string> {
        // Custom AI implementation
        return response
    }
}

composer.setAIService(new CustomAIService())
```

### Custom File Operations
```typescript
await composer.executeChanges(result, {
    async applyChange(change) {
        // Integrate with your file system
        await fileService.writeFile(change.filePath, change.proposedContent)
    }
})
```

### Progress Monitoring
```typescript
const execution = await composer.executeChanges(result)
console.log(`Progress: ${execution.currentStep}/${execution.totalSteps}`)
```

## Error Handling

The service provides detailed error information:

```typescript
try {
    const result = await composer.planChanges(request)
} catch (error) {
    if (error.message.includes('Circular dependency')) {
        console.error('Dependency cycle detected')
    } else if (error.message.includes('Too many files')) {
        console.error('Scope too large')
    }
}
```

## Integration with AI Service

The composer service integrates with @cursor/ai-service for intelligent change planning:

```typescript
import { createAIService } from '@cursor/ai-service'
import { createComposerService } from '@cursor/composer'

const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

const composer = createComposerService()
composer.setAIService(aiService)
```

## License

MIT
