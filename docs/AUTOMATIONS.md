# Automations Framework

The Automations Framework provides a powerful system for creating, scheduling, and executing automated workflows within the Cursor IDE.

## Overview

The automations framework consists of several core components:

- **Automation Service**: Manages workflow definitions and executions
- **Trigger System**: Handles event-based triggers for workflows
- **Action Registry**: Provides a registry of available automation actions
- **Automation Scheduler**: Manages scheduled (time-based) task execution
- **Automation Logger**: Logs and monitors automation executions
- **Automation Templates**: Pre-built automation templates for common workflows

## Core Concepts

### Workflows

An **AutomationWorkflow** represents a complete automation that can be triggered and executed. It consists of:

- **Triggers**: Events that initiate the workflow (file changes, time-based, manual, etc.)
- **Actions**: Steps to execute when the workflow runs
- **Context**: Data passed to the workflow during execution
- **Settings**: Configuration options (enabled, priority, etc.)

### Triggers

Triggers define when a workflow should execute:

- **File Change**: Triggers when specific files are modified
- **Manual**: Triggered by user action
- **Scheduled**: Time-based execution (cron-like expressions)
- **Custom**: Application-specific events

### Actions

Actions are the individual steps in a workflow:

- **File Operations**: Create, modify, delete files
- **Command Execution**: Run shell commands
- **API Calls**: Make HTTP requests
- **Custom Actions**: User-defined actions registered in the registry

## Usage

### Creating a Workflow

```typescript
import { getAutomationService } from './features/automations'

const automationService = getAutomationService()

const workflow = automationService.createWorkflow({
    name: 'Auto-format on save',
    description: 'Format code when files are saved',
    triggers: [
        {
            type: 'file-change',
            config: {
                patterns: ['*.ts', '*.tsx'],
                events: ['save']
            }
        }
    ],
    actions: [
        {
            type: 'command',
            config: {
                command: 'prettier',
                args: ['--write', '$FILE_PATH']
            }
        }
    ],
    enabled: true
})
```

### Executing a Workflow Manually

```typescript
const execution = await automationService.executeWorkflow(workflow.id, {
    filePath: '/path/to/file.ts'
})
```

### Scheduling a Workflow

```typescript
import { getAutomationScheduler } from './features/automations'

const scheduler = getAutomationScheduler()

scheduler.scheduleWorkflow(workflow.id, '0 * * * *') // Every hour
```

### Using Templates

```typescript
import { getAutomationTemplates } from './features/automations'

const templates = getAutomationTemplates()

// Get all templates
const allTemplates = templates.getTemplates()

// Get templates by category
const devTemplates = templates.getTemplatesByCategory('development')

// Create workflow from template
const workflow = templates.createWorkflowFromTemplate('auto-format', {
    patterns: ['*.ts']
})
```

## API Reference

### Automation Service

#### Methods

- `activate()`: Activate the automation service
- `deactivate()`: Deactivate the automation service
- `createWorkflow(workflow)`: Create a new workflow
- `updateWorkflow(id, updates)`: Update an existing workflow
- `deleteWorkflow(id)`: Delete a workflow
- `getWorkflow(id)`: Get a specific workflow
- `getWorkflows()`: Get all workflows
- `executeWorkflow(id, context)`: Execute a workflow
- `getExecutions()`: Get all executions
- `getExecutionsByWorkflow(id)`: Get executions for a workflow

### Trigger System

#### Methods

- `activate()`: Activate the trigger system
- `deactivate()`: Deactivate the trigger system
- `registerTrigger(trigger)`: Register a trigger
- `unregisterTrigger(id)`: Unregister a trigger
- `fireTrigger(type, data)`: Fire a trigger event
- `getTriggers()`: Get all triggers

### Action Registry

#### Methods

- `registerAction(action)`: Register an action
- `unregisterAction(id)`: Unregister an action
- `getAction(id)`: Get a specific action
- `getActions()`: Get all actions
- `executeAction(action, context)`: Execute an action

### Automation Scheduler

#### Methods

- `activate()`: Activate the scheduler
- `deactivate()`: Deactivate the scheduler
- `scheduleWorkflow(id, schedule)`: Schedule a workflow
- `unscheduleTask(id)`: Unschedule a task
- `getScheduledTasks()`: Get all scheduled tasks

### Automation Logger

#### Methods

- `log(level, message, data)`: Log an event
- `getLogs()`: Get all logs
- `getLogsByWorkflow(id)`: Get logs for a workflow
- `getExecutionStatistics(id)`: Get execution statistics for a workflow
- `exportLogs()`: Export logs as JSON

### Automation Templates

#### Methods

- `getTemplates()`: Get all templates
- `getTemplatesByCategory(category)`: Get templates by category
- `getTemplate(id)`: Get a specific template
- `createWorkflowFromTemplate(id, overrides)`: Create workflow from template
- `addTemplate(template)`: Add a custom template

## IPC Handlers

The automations framework provides IPC handlers for communication between the main and renderer processes:

- `automation-activate`: Activate automation service
- `automation-deactivate`: Deactivate automation service
- `automation-create-workflow`: Create a workflow
- `automation-update-workflow`: Update a workflow
- `automation-delete-workflow`: Delete a workflow
- `automation-get-workflows`: Get all workflows
- `automation-execute-workflow`: Execute a workflow
- `automation-activate-triggers`: Activate trigger system
- `automation-fire-trigger`: Fire a trigger event
- `automation-register-action`: Register an action
- `automation-get-actions`: Get all actions
- `automation-activate-scheduler`: Activate scheduler
- `automation-schedule-workflow`: Schedule a workflow
- `automation-unschedule-task`: Unschedule a task
- `automation-get-logs`: Get logs
- `automation-get-execution-stats`: Get execution statistics
- `automation-get-templates`: Get templates
- `automation-create-from-template`: Create workflow from template

## Examples

### Example 1: Auto-format on Save

```typescript
const workflow = automationService.createWorkflow({
    name: 'Auto-format on save',
    description: 'Format code when files are saved',
    triggers: [
        {
            type: 'file-change',
            config: {
                patterns: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                events: ['save']
            }
        }
    ],
    actions: [
        {
            type: 'command',
            config: {
                command: 'prettier',
                args: ['--write', '$FILE_PATH']
            }
        }
    ],
    enabled: true
})
```

### Example 2: Scheduled Backup

```typescript
const workflow = automationService.createWorkflow({
    name: 'Daily Backup',
    description: 'Create a daily backup of the project',
    triggers: [], // No event triggers, will be scheduled
    actions: [
        {
            type: 'command',
            config: {
                command: 'git',
                args: ['push', 'origin', 'main']
            }
        }
    ],
    enabled: true
})

scheduler.scheduleWorkflow(workflow.id, '0 2 * * *') // 2 AM daily
```

### Example 3: Custom Action

```typescript
const actionRegistry = getActionRegistry()

actionRegistry.registerAction({
    id: 'custom-action',
    name: 'Custom Action',
    description: 'A custom action example',
    config: {
        // Action-specific configuration
    },
    execute: async (context) => {
        console.log('Executing custom action with context:', context)
        return { success: true }
    }
})
```

## Best Practices

1. **Use Descriptive Names**: Name workflows and actions clearly to describe their purpose
2. **Handle Errors**: Always include error handling in custom actions
3. **Log Important Events**: Use the automation logger to track important events
4. **Test Workflows**: Test workflows manually before enabling them in production
5. **Use Templates**: Leverage pre-built templates for common workflows
6. **Schedule Wisely**: Be mindful of resource usage when scheduling frequent tasks
7. **Monitor Executions**: Regularly review execution logs and statistics

## Troubleshooting

### Workflow Not Triggering

- Check that the workflow is enabled
- Verify trigger configuration matches expected events
- Check trigger system is activated
- Review logs for errors

### Action Failing

- Check action configuration
- Verify required dependencies are available
- Review action execution logs
- Test action independently

### Scheduled Task Not Running

- Verify scheduler is activated
- Check schedule expression is valid
- Ensure workflow is enabled
- Review scheduler logs

## Future Enhancements

- Webhook triggers for external integrations
- Conditional logic in workflows
- Parallel action execution
- Workflow dependencies
- Retry policies for failed actions
- Resource quotas for automation execution
