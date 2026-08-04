/**
 * @cursor/automations
 * Workflow automation engine with triggers, actions, and scheduling
 */

// Main automation service
export {
    AutomationService,
    getAutomationService,
    destroyAutomationService,
    createAutomationService
} from './automationService'

// Types
export type {
    TriggerType,
    ActionType,
    ExecutionStatus,
    AutomationTrigger,
    AutomationAction,
    AutomationWorkflow,
    AutomationExecution,
    AutomationConfig,
    AutomationStatistics,
    ActionResult
} from './types'

// Logger
export {
    Logger,
    LogLevel,
    ConsoleLogger,
    NoOpLogger,
    MemoryLogger
} from './logger'

// Action Registry
export {
    ActionRegistry,
    ActionDefinition,
    getActionRegistry,
    destroyActionRegistry,
    createActionRegistry
} from './actions/actionRegistry'

// Trigger System
export {
    TriggerSystem,
    TriggerHandler,
    getTriggerSystem,
    destroyTriggerSystem,
    createTriggerSystem
} from './triggers/triggerSystem'

// Scheduler
export {
    AutomationScheduler,
    ScheduledTask,
    RecurringSchedule,
    getAutomationScheduler,
    destroyAutomationScheduler,
    createAutomationScheduler
} from './scheduler/automationScheduler'

// Templates
export {
    AutomationTemplates,
    AutomationTemplate,
    getAutomationTemplates,
    destroyAutomationTemplates,
    createAutomationTemplates
} from './templates/automationTemplates'