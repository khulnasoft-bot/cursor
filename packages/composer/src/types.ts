/**
 * Composer Type Definitions
 * Core types for multi-file editing orchestration
 */

/**
 * File change type
 */
export type ChangeType = 'insert' | 'delete' | 'replace' | 'move'

/**
 * Execution status
 */
export type ExecutionStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

/**
 * File change definition
 */
export interface FileChange {
    filePath: string
    originalContent: string
    proposedContent: string
    changeType: ChangeType
    lineRange: { start: number; end: number }
    description: string
    dependencies: string[] // Other file changes this depends on
    dependents: string[] // Other file changes that depend on this
}

/**
 * Composer request
 */
export interface ComposerRequest {
    prompt: string
    context: {
        projectPath: string
        files: Map<string, string> // filePath -> content
        language?: string
    }
    constraints?: {
        maxFiles?: number
        allowedPaths?: string[]
        forbiddenPaths?: string[]
    }
}

/**
 * Composer result
 */
export interface ComposerResult {
    changes: FileChange[]
    summary: string
    estimatedTime: number
    dependencies: Map<string, string[]> // changeId -> dependent changeIds
    executionOrder: string[]
}

/**
 * Composer execution
 */
export interface ComposerExecution {
    requestId: string
    status: ExecutionStatus
    changes: FileChange[]
    executedChanges: string[]
    failedChanges: string[]
    currentStep: number
    totalSteps: number
    startTime: Date
    endTime?: Date
    error?: string
    appliedChanges: Map<string, string> // filePath -> new content
    rollbackData?: Map<string, string> // filePath -> original content for rollback
    canRollback: boolean
}

/**
 * Composer configuration
 */
export interface ComposerConfig {
    maxConcurrentExecutions?: number
    executionTimeoutMs?: number
    defaultMaxFiles?: number
    enableRollback?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
}