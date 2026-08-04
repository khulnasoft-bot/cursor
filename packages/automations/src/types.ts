/**
 * Automations Type Definitions
 * Core types for the workflow automation engine
 */

/**
 * Trigger types for automations
 */
export type TriggerType = 'file_save' | 'file_change' | 'git_commit' | 'time' | 'manual' | 'event' | 'api' | 'webhook'

/**
 * Action types for automations
 */
export type ActionType = 'command' | 'script' | 'ai_task' | 'notification' | 'file_operation' | 'git_operation' | 'http_request' | 'custom'

/**
 * Execution status
 */
export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Automation trigger configuration
 */
export interface AutomationTrigger {
    id: string
    type: TriggerType
    config: Record<string, any>
    enabled: boolean
    description?: string
}

/**
 * Automation action configuration
 */
export interface AutomationAction {
    id: string
    type: ActionType
    config: Record<string, any>
    enabled: boolean
    description?: string
    retryPolicy?: {
        maxRetries: number
        backoffMs: number
    }
}

/**
 * Automation workflow definition
 */
export interface AutomationWorkflow {
    id: string
    name: string
    description: string
    triggers: AutomationTrigger[]
    actions: AutomationAction[]
    enabled: boolean
    createdAt: Date
    updatedAt: Date
    lastRun?: Date
    runCount: number
    tags?: string[]
    metadata?: Record<string, any>
}

/**
 * Automation execution record
 */
export interface AutomationExecution {
    id: string
    workflowId: string
    trigger: AutomationTrigger
    status: ExecutionStatus
    startTime: Date
    endTime?: Date
    results: ActionResult[]
    error?: string
    context?: Record<string, any>
    metadata?: Record<string, any>
}

/**
 * Action execution result
 */
export interface ActionResult {
    actionId: string
    success: boolean
    output?: string
    error?: string
    duration?: number
    retryCount?: number
}

/**
 * Automation configuration
 */
export interface AutomationConfig {
    maxConcurrentExecutions?: number
    executionTimeoutMs?: number
    retryEnabled?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    storageEnabled?: boolean
    storagePath?: string
}

/**
 * Automation statistics
 */
export interface AutomationStatistics {
    totalWorkflows: number
    enabledWorkflows: number
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    runningExecutions: number
    averageExecutionTimeMs?: number
    mostTriggeredWorkflow?: string
}