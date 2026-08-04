# @cursor/agent-exec

Autonomous agent execution service with planning, memory, and decision-making capabilities.

## Installation

```bash
npm install @cursor/agent-exec
```

## Usage

```typescript
import {
    createAgentExecService,
    createAgentMemory,
    createAgentPlanner,
    createToolRegistry
} from '@cursor/agent-exec'

// Create services
const agentExec = createAgentExecService()
const agentMemory = createAgentMemory()
const agentPlanner = createAgentPlanner()
const toolRegistry = createToolRegistry()

// Wire up tool registry
agentExec.setToolRegistry(toolRegistry)
agentPlanner.setToolRegistry(toolRegistry)

// Create and execute a plan
const plan = await agentPlanner.createPlan('Read the main.ts file')
const executedPlan = await agentPlanner.executePlan(plan.id, (step, progress) => {
    console.log(`Progress: ${progress.toFixed(1)}% - ${step.description}`)
})

console.log(`Plan status: ${executedPlan.status}`)
```

## Features

### Agent Execution
- Command and script execution
- Tool orchestration
- Task management and monitoring
- Progress tracking

### Memory System
- Context retention for tasks
- Importance-based memory management
- Semantic search capabilities
- Memory pruning and cleanup

### Planning System
- Goal decomposition
- Step-by-step execution
- Dependency management
- Adaptive planning

### Decision Engine
- Autonomous decision-making
- Self-correction and learning
- Retry logic with limits
- Adaptation strategies

### Sandbox Environment
- Execution isolation
- Resource limits
- Path validation
- Security controls

### Tool Registry
- Extensible tool system
- Parameter validation
- Built-in file and search tools
- Custom tool registration

## API

### AgentExecService

#### Configuration
```typescript
interface AgentConfig {
    maxConcurrentTasks?: number
    executionTimeoutMs?: number
    maxMemories?: number
    importanceThreshold?: number
    enableRollback?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
}
```

#### Execution
- `executeAgent(command, args, cwd, env)` - Execute a command
- `executeAgentScript(scriptPath, args, cwd)` - Execute a script
- `executeAgentCommand(commandString, cwd)` - Execute a command string
- `executeTool(toolName, params)` - Execute a registered tool

#### Task Management
- `getTask(taskId)` - Get task details
- `getTasks()` - Get all tasks
- `getRunningTasks()` - Get running tasks
- `stopTask(taskId)` - Stop a specific task
- `stopAllTasks()` - Stop all tasks

### AgentMemory

#### Memory Operations
- `addMemory(type, content, metadata, importance)` - Add a memory entry
- `addObservation(content, metadata, importance)` - Add observation
- `addAction(content, metadata, importance)` - Add action
- `addResult(content, metadata, importance)` - Add result
- `addContext(content, metadata, importance)` - Add context
- `addGoal(content, metadata, importance)` - Add goal

#### Memory Retrieval
- `getMemory(memoryId)` - Get specific memory
- `getMemories()` - Get all memories
- `getMemoriesByType(type)` - Get memories by type
- `getRecentMemories(count)` - Get recent memories
- `searchMemories(query)` - Search memories

### AgentPlanner

#### Planning
- `createPlan(goal, context)` - Create an execution plan
- `executePlan(planId, onProgress)` - Execute a plan
- `decomposeGoal(goal, context)` - Decompose goal into steps

#### Goal Management
- `createGoal(description, priority, dependencies)` - Create a goal
- `completeGoal(goalId)` - Mark goal as complete
- `getGoals()` - Get all goals
- `getGoalsByStatus(status)` - Get goals by status

### AgentProgress

#### Progress Tracking
- `startExecution(executionId, plan)` - Start tracking execution
- `updateProgress(executionId, plan)` - Update progress
- `completeExecution(executionId, plan)` - Complete tracking
- `getProgress(executionId)` - Get execution progress

### AgentSandbox

#### Sandbox Management
- `createSandbox(config)` - Create a sandbox instance
- `suspendSandbox(sandboxId)` - Suspend a sandbox
- `resumeSandbox(sandboxId)` - Resume a sandbox
- `terminateSandbox(sandboxId)` - Terminate a sandbox

#### Security
- `validatePath(sandboxId, path)` - Validate file path access
- `updateResourceUsage(sandboxId, usage)` - Update resource usage

### ToolRegistry

#### Tool Management
- `registerTool(tool)` - Register a new tool
- `unregisterTool(toolName)` - Unregister a tool
- `getTool(toolName)` - Get a specific tool
- `getTools()` - Get all tools

#### Tool Execution
- `executeTool(toolName, params)` - Execute a tool
- `searchTools(query)` - Search for tools

### DecisionEngine

#### Decision Making
- `makeDecision(context)` - Make an autonomous decision
- `recordDecision(decision, outcome)` - Record decision outcome
- `setLearningRate(rate)` - Set learning rate

## Examples

### Basic Agent Execution
```typescript
import { createAgentExecService, createToolRegistry } from '@cursor/agent-exec'

const agentExec = createAgentExecService()
const toolRegistry = createToolRegistry()

agentExec.setToolRegistry(toolRegistry)

// Execute a tool
const taskId = await agentExec.executeTool('read_file', {
    filePath: './src/main.ts'
})

const task = agentExec.getTask(taskId)
console.log(task.output)
```

### Memory System
```typescript
import { createAgentMemory } from '@cursor/agent-exec'

const memory = createAgentMemory()

// Add memories
memory.addObservation('User requested file read', { filePath: 'main.ts' })
memory.addAction('Reading file main.ts', { bytes: 1024 })
memory.addResult('File read successfully', { lines: 42 })

// Search memories
const results = memory.searchMemories({
    query: 'file read',
    limit: 10,
    minImportance: 0.5
})
```

### Planning and Execution
```typescript
import { createAgentPlanner, createToolRegistry } from '@cursor/agent-exec'

const planner = createAgentPlanner()
const toolRegistry = createToolRegistry()

planner.setToolRegistry(toolRegistry)

// Create a plan
const plan = await planner.createPlan('Read and analyze main.ts')

// Execute with progress tracking
const executedPlan = await planner.executePlan(plan.id, (step, progress) => {
    console.log(`Step ${step.id}: ${step.description} (${progress.toFixed(1)}%)`)
})
```

### Custom Tools
```typescript
import { createToolRegistry } from '@cursor/agent-exec'

const toolRegistry = createToolRegistry()

toolRegistry.registerTool({
    name: 'custom_analyzer',
    description: 'Custom code analyzer',
    parameters: {
        code: { type: 'string', required: true, description: 'Code to analyze' }
    },
    execute: async (params) => {
        // Custom implementation
        return { success: true, data: { complexity: 5 } }
    }
})
```

### Sandbox Execution
```typescript
import { createAgentSandbox } from '@cursor/agent-exec'

const sandbox = createAgentSandbox()

// Create sandbox with custom config
const instance = sandbox.createSandbox({
    resourceLimits: {
        maxMemoryMB: 256,
        maxCpuPercent: 50
    },
    allowedPaths: ['/home/user/project'],
    networkAccess: false
})

// Validate path before access
const validation = sandbox.validatePath(instance.id, '/home/user/project/src/main.ts')
if (validation.allowed) {
    // Proceed with file operation
}
```

### Decision Engine
```typescript
import { createDecisionEngine } from '@cursor/agent-exec'

const decisionEngine = createDecisionEngine()

const decision = decisionEngine.makeDecision({
    plan,
    step,
    history: [],
    availableTools: ['read_file', 'write_file'],
    resourceLimits: { maxMemory: 512 }
})

console.log(`Decision: ${decision.action} - ${decision.reasoning}`)
```

## Best Practices

### Memory Management
- Set appropriate importance scores for memories
- Use memory pruning to manage storage
- Clean up old memories periodically
- Search with specific queries for better results

### Planning
- Decompose complex goals into smaller steps
- Set appropriate dependencies between steps
- Monitor execution progress
- Handle failures gracefully

### Tool Design
- Keep tools focused and single-purpose
- Provide clear parameter descriptions
- Validate all parameters
- Return consistent result structures

### Security
- Always use sandbox for file operations
- Validate paths before access
- Set appropriate resource limits
- Monitor resource usage

### Performance
- Limit concurrent executions
- Use memory pruning
- Set appropriate timeouts
- Monitor resource usage

## Integration with AI Service

The agent execution service can integrate with @cursor/ai-service for intelligent planning:

```typescript
import { createAIService } from '@cursor/ai-service'
import { createAgentPlanner } from '@cursor/agent-exec'

const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

const planner = createAgentPlanner()
// Use AI for intelligent goal decomposition
const plan = await planner.createPlan('Refactor the entire codebase', {
    aiService
})
```

## Error Handling

The service provides detailed error information:

```typescript
try {
    const plan = await planner.createPlan(goal)
    const executedPlan = await planner.executePlan(plan.id)
} catch (error) {
    if (error.message.includes('Tool not found')) {
        console.error('Tool not registered')
    } else if (error.message.includes('Tool registry not set')) {
        console.error('Tool registry not configured')
    }
}
```

## License

MIT