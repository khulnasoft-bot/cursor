/**
 * Agent Execution Type Definitions
 * Core types for autonomous agent execution
 */

/**
 * Task status
 */
export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

/**
 * Goal priority
 */
export type GoalPriority = 'low' | 'medium' | 'high' | 'critical'

/**
 * Plan status
 */
export type PlanStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'

/**
 * Step status
 */
export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'

/**
 * Memory entry type
 */
export type MemoryType = 'observation' | 'action' | 'result' | 'context' | 'goal'

/**
 * Agent task definition
 */
export interface AgentTask {
    id: string
    command: string
    args: string[]
    cwd?: string
    env?: Record<string, string>
    status: TaskStatus
    output: string
    error?: string
    startTime?: Date
    endTime?: Date
    toolName?: string
    toolParams?: Record<string, any>
}

/**
 * Memory entry
 */
export interface MemoryEntry {
    id: string
    type: MemoryType
    content: string
    timestamp: Date
    metadata?: Record<string, any>
    importance: number // 0-1 score for relevance
    embeddings?: number[] // For semantic search
}

/**
 * Memory query
 */
export interface MemoryQuery {
    query: string
    type?: MemoryType
    limit?: number
    minImportance?: number
    timeRange?: { start: Date; end: Date }
}

/**
 * Agent goal
 */
export interface AgentGoal {
    id: string
    description: string
    priority: GoalPriority
    status: TaskStatus
    dependencies: string[]
    createdAt: Date
    completedAt?: Date
}

/**
 * Agent plan
 */
export interface AgentPlan {
    id: string
    goal: string
    steps: AgentStep[]
    estimatedDuration: number
    status: PlanStatus
    currentStep: number
    totalSteps: number
    createdAt: Date
    startedAt?: Date
    completedAt?: Date
}

/**
 * Agent step
 */
export interface AgentStep {
    id: string
    description: string
    toolName: string
    toolParams: Record<string, any>
    status: StepStatus
    result?: any
    error?: string
    estimatedDuration: number
    dependencies: string[]
}

/**
 * Agent execution
 */
export interface AgentExecution {
    id: string
    planId: string
    goal: string
    status: PlanStatus
    steps: AgentStep[]
    currentStep: number
    startTime: Date
    endTime?: Date
    error?: string
    context?: Record<string, any>
}

/**
 * Tool definition
 */
export interface Tool {
    name: string
    description: string
    parameters: Record<string, { type: string; required: boolean; description: string }>
    execute: (params: Record<string, any>) => Promise<ToolResult>
}

/**
 * Tool result
 */
export interface ToolResult {
    success: boolean
    data?: any
    error?: string
}

/**
 * Agent configuration
 */
export interface AgentConfig {
    maxConcurrentTasks?: number
    executionTimeoutMs?: number
    maxMemories?: number
    importanceThreshold?: number
    enableRollback?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
}