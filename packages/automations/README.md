# @cursor/automations

Workflow automation engine with triggers, actions, and scheduling capabilities.

## Installation

```bash
npm install @cursor/automations
```

## Usage

```typescript
import { AutomationService, ConsoleLogger } from '@cursor/automations'

// Create automation service
const service = new AutomationService({}, new ConsoleLogger())
service.activate()

// Create a workflow
const workflow = service.createWorkflow(
    'Auto Commit',
    'Automatically commit changes when files are saved',
    [
        {
            id: 'trigger-file-save',
            type: 'file_save',
            config: { files: ['src/**/*'] },
            enabled: true
        }
    ],
    [
        {
            id: 'action-git-add',
            type: 'git_operation',
            config: { operation: 'add', files: ['*'] },
            enabled: true
        },
        {
            id: 'action-git-commit',
            type: 'git_operation',
            config: { operation: 'commit', message: 'Auto commit' },
            enabled: true
        }
    ]
)

// Execute workflow
const execution = await service.executeWorkflow(
    workflow.id,
    workflow.triggers[0],
    { filePath: 'src/main.ts' }
)
```

## Features

### Workflow Management
- Create, update, delete workflows
- Enable/disable workflows
- Tag and categorize workflows
- Import/export workflows

### Triggers
- File save/change events
- Git commit events
- Time-based triggers
- Manual triggers
- Custom event triggers
- API/webhook triggers

### Actions
- Command execution
- Script execution
- AI task execution
- Notifications
- File operations
- Git operations
- HTTP requests
- Custom actions

### Scheduling
- One-time scheduled execution
- Recurring schedules (interval, daily, weekly, monthly)
- Cron-style scheduling (with library)
- Task management and monitoring

### Action Registry
- Pre-built action definitions
- Custom action registration
- Action validation
- Action categorization
- Action search and discovery

### Templates
- Pre-built workflow templates
- Template customization
- Template categories and tags
- Quick workflow creation

## API

### AutomationService

#### Configuration
```typescript
interface AutomationConfig {
    maxConcurrentExecutions?: number
    executionTimeoutMs?: number
    retryEnabled?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    storageEnabled?: boolean
    storagePath?: string
}
```

#### Workflow Management
- `createWorkflow(name, description, triggers, actions, tags?, metadata?)` - Create workflow
- `updateWorkflow(workflowId, updates)` - Update workflow
- `deleteWorkflow(workflowId)` - Delete workflow
- `enableWorkflow(workflowId)` - Enable workflow
- `disableWorkflow(workflowId)` - Disable workflow
- `getWorkflow(workflowId)` - Get workflow
- `getWorkflows()` - Get all workflows
- `getEnabledWorkflows()` - Get enabled workflows
- `getWorkflowsByTrigger(triggerType)` - Get workflows by trigger type
- `getWorkflowsByTag(tag)` - Get workflows by tag

#### Execution
- `executeWorkflow(workflowId, trigger, context?)` - Execute workflow
- `cancelExecution(executionId)` - Cancel execution
- `getExecution(executionId)` - Get execution
- `getExecutions()` - Get all executions
- `getExecutionsByWorkflow(workflowId)` - Get executions by workflow
- `getActiveExecutions()` - Get active executions
- `clearExecutions()` - Clear all executions
- `clearOldExecutions(olderThan)` - Clear old executions

#### Statistics
- `getStatistics()` - Get automation statistics

#### Import/Export
- `exportWorkflows()` - Export workflows as JSON
- `importWorkflows(json)` - Import workflows from JSON

### ActionRegistry

#### Action Management
- `registerAction(definition)` - Register action
- `unregisterAction(type)` - Unregister action
- `getAction(type)` - Get action definition
- `getActions()` - Get all actions
- `getActionsByCategory(category)` - Get actions by category
- `searchActions(query)` - Search actions
- `getCategories()` - Get action categories

#### Action Execution
- `validateAction(action)` - Validate action configuration
- `executeAction(action)` - Execute action

### TriggerSystem

#### Trigger Management
- `registerTrigger(trigger, handler)` - Register trigger
- `unregisterTrigger(handlerId)` - Unregister trigger
- `enableTrigger(handlerId)` - Enable trigger
- `disableTrigger(handlerId)` - Disable trigger

#### Trigger Execution
- `triggerManual(handlerId, context?)` - Trigger manually
- `triggerFileSave(filePath, context?)` - Trigger file save
- `triggerFileChange(filePath, changeType, context?)` - Trigger file change
- `triggerGitCommit(commitHash, message, context?)` - Trigger git commit
- `triggerTime(scheduledTime, context?)` - Trigger time event
- `triggerEvent(eventName, context?)` - Trigger custom event
- `triggerApi(endpoint, method, context?)` - Trigger API event
- `triggerWebhook(webhookId, payload, context?)` - Trigger webhook

### AutomationScheduler

#### Scheduling
- `start()` - Start scheduler
- `stop()` - Stop scheduler
- `isRunning()` - Check if running
- `scheduleWorkflow(workflow, schedule, recurring?)` - Schedule workflow
- `scheduleAtInterval(workflow, intervalMs)` - Schedule at interval
- `scheduleDaily(workflow, hour, minute?)` - Schedule daily
- `scheduleWeekly(workflow, dayOfWeek, hour, minute?)` - Schedule weekly
- `scheduleMonthly(workflow, dayOfMonth, hour, minute?)` - Schedule monthly

#### Task Management
- `unscheduleTask(taskId)` - Unschedule task
- `enableTask(taskId)` - Enable task
- `disableTask(taskId)` - Disable task
- `getScheduledTasks()` - Get scheduled tasks
- `getTask(taskId)` - Get task
- `getTasksByWorkflow(workflowId)` - Get tasks by workflow

### AutomationTemplates

#### Template Management
- `getTemplate(templateId)` - Get template
- `getTemplates()` - Get all templates
- `getTemplatesByCategory(category)` - Get templates by category
- `getTemplatesByTag(tag)` - Get templates by tag
- `searchTemplates(query)` - Search templates
- `getCategories()` - Get template categories
- `getAllTags()` - Get all template tags

#### Workflow Creation
- `createWorkflowFromTemplate(templateId, params)` - Create workflow from template

## Examples

### Basic Workflow
```typescript
import { AutomationService } from '@cursor/automations'

const service = new AutomationService()
service.activate()

const workflow = service.createWorkflow(
    'Simple Log',
    'Log a message',
    [
        {
            id: 'trigger-manual',
            type: 'manual',
            config: {},
            enabled: true
        }
    ],
    [
        {
            id: 'action-log',
            type: 'command',
            config: { command: 'echo "Hello World"' },
            enabled: true
        }
    ]
)

await service.executeWorkflow(workflow.id, workflow.triggers[0])
```

### File Monitoring
```typescript
const workflow = service.createWorkflow(
    'File Monitor',
    'Monitor file changes',
    [
        {
            id: 'trigger-file-change',
            type: 'file_change',
            config: { files: ['src/**/*'] },
            enabled: true
        }
    ],
    [
        {
            id: 'action-notify',
            type: 'notification',
            config: { message: 'File changed: ${filePath}' },
            enabled: true
        }
    ]
)
```

### Git Automation
```typescript
const workflow = service.createWorkflow(
    'Auto Commit',
    'Auto commit on save',
    [
        {
            id: 'trigger-file-save',
            type: 'file_save',
            config: { files: ['src/**/*'] },
            enabled: true
        }
    ],
    [
        {
            id: 'action-git-add',
            type: 'git_operation',
            config: { operation: 'add', files: ['*'] },
            enabled: true
        },
        {
            id: 'action-git-commit',
            type: 'git_operation',
            config: { operation: 'commit', message: 'Auto commit' },
            enabled: true
        }
    ]
)
```

### Scheduled Tasks
```typescript
import { AutomationScheduler } from '@cursor/automations'

const scheduler = new AutomationScheduler()
scheduler.start()

// Schedule daily backup
const task = scheduler.scheduleDaily(workflow, 2, 0) // 2:00 AM daily

// Schedule at interval
const intervalTask = scheduler.scheduleAtInterval(workflow, 3600000) // Every hour
```

### Using Templates
```typescript
import { AutomationTemplates } from '@cursor/automations'

const templates = new AutomationTemplates()

// Get available templates
const allTemplates = templates.getTemplates()
const gitTemplates = templates.getTemplatesByCategory('git')

// Create workflow from template
const workflow = templates.createWorkflowFromTemplate('git-auto-commit', {
    commitMessage: 'Auto commit on save',
    files: ['src/**/*']
})
```

### Custom Actions
```typescript
import { ActionRegistry } from '@cursor/automations'

const registry = new ActionRegistry()

// Register custom action
registry.registerAction({
    type: 'custom_task',
    name: 'Custom Task',
    description: 'Execute custom task',
    category: 'custom',
    configSchema: {
        taskName: { type: 'string', required: true, description: 'Task name' }
    },
    execute: async (config) => {
        // Custom implementation
        return `Completed custom task: ${config.taskName}`
    }
})
```

### Retry Policy
```typescript
const action = {
    id: 'action-retry',
    type: 'command',
    config: { command: 'npm test' },
    enabled: true,
    retryPolicy: {
        maxRetries: 3,
        backoffMs: 2000
    }
}
```

### Context Variables
```typescript
const action = {
    id: 'action-context',
    type: 'notification',
    config: { message: 'File ${filePath} was changed by ${user}' },
    enabled: true
}

// Execution with context
await service.executeWorkflow(workflow.id, trigger, {
    filePath: 'src/main.ts',
    user: 'alice'
})
```

## Best Practices

### Workflow Design
- Keep workflows focused on single responsibilities
- Use meaningful names and descriptions
- Tag workflows for easy organization
- Test workflows before enabling in production

### Action Configuration
- Validate action configurations before execution
- Use retry policies for unreliable operations
- Implement proper error handling
- Provide clear error messages

### Performance
- Set appropriate concurrency limits
- Use scheduling for resource-intensive tasks
- Monitor execution statistics
- Clean up old executions regularly

### Security
- Validate all user inputs
- Sanitize file paths
- Use proper permissions
- Log sensitive operations appropriately

## Advanced Features

### Concurrency Control
```typescript
const service = new AutomationService({
    maxConcurrentExecutions: 3,
    executionTimeoutMs: 300000
})
```

### Execution Context
```typescript
await service.executeWorkflow(workflow.id, trigger, {
    userId: 'user-123',
    projectId: 'project-456',
    customData: { key: 'value' }
})
```

### Workflow Metadata
```typescript
const workflow = service.createWorkflow(
    'My Workflow',
    'Description',
    triggers,
    actions,
    ['production', 'critical'],
    { owner: 'team-a', priority: 'high' }
)
```

### Statistics Monitoring
```typescript
const stats = service.getStatistics()
console.log(`Total workflows: ${stats.totalWorkflows}`)
console.log(`Running executions: ${stats.runningExecutions}`)
console.log(`Average execution time: ${stats.averageExecutionTimeMs}ms`)
```

## Error Handling

The service provides detailed error information through execution results:

```typescript
const execution = await service.executeWorkflow(workflow.id, trigger)

if (execution.status === 'failed') {
    console.error(`Execution failed: ${execution.error}`)
    
    // Check individual action results
    for (const result of execution.results) {
        if (!result.success) {
            console.error(`Action ${result.actionId} failed: ${result.error}`)
        }
    }
}
```

## License

MIT