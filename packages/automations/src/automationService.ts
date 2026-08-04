/**
 * Cursor Automations Service
 * Workflow automation engine with triggers, actions, and execution management
 * Extracted and adapted from Cursor's automation service
 */

import {
    AutomationTrigger,
    AutomationAction,
    AutomationWorkflow,
    AutomationExecution,
    ExecutionStatus,
    AutomationConfig,
    AutomationStatistics,
    ActionResult
} from './types'
import { Logger, ConsoleLogger } from './logger'

export class AutomationService {
    private workflows: Map<string, AutomationWorkflow> = new Map()
    private executions: Map<string, AutomationExecution> = new Map()
    private workflowCounter = 0
    private executionCounter = 0
    private active: boolean = false
    private config: AutomationConfig
    private logger: Logger
    private executionQueue: string[] = []
    private maxConcurrentExecutions: number

    constructor(config: AutomationConfig = {}, logger?: Logger) {
        this.config = {
            maxConcurrentExecutions: 5,
            executionTimeoutMs: 300000, // 5 minutes
            retryEnabled: true,
            logLevel: 'info',
            ...config
        }
        this.maxConcurrentExecutions = this.config.maxConcurrentExecutions || 5
        this.logger = logger || new ConsoleLogger()
    }

    updateConfig(config: Partial<AutomationConfig>): void {
        this.config = { ...this.config, ...config }
        if (config.maxConcurrentExecutions) {
            this.maxConcurrentExecutions = config.maxConcurrentExecutions
        }
        this.logger.info('Automation service configuration updated')
    }

    getConfig(): AutomationConfig {
        return { ...this.config }
    }

    activate(): void {
        this.active = true
        this.logger.info('Automation service activated')
    }

    deactivate(): void {
        this.active = false
        this.logger.info('Automation service deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    createWorkflow(
        name: string,
        description: string,
        triggers: AutomationTrigger[],
        actions: AutomationAction[],
        tags?: string[],
        metadata?: Record<string, any>
    ): AutomationWorkflow {
        const workflowId = `workflow-${++this.workflowCounter}`

        const workflow: AutomationWorkflow = {
            id: workflowId,
            name,
            description,
            triggers,
            actions,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date(),
            runCount: 0,
            tags,
            metadata
        }

        this.workflows.set(workflowId, workflow)
        this.logger.info(`Created workflow: ${name} (${workflowId})`)
        return workflow
    }

    updateWorkflow(
        workflowId: string,
        updates: Partial<Omit<AutomationWorkflow, 'id' | 'createdAt' | 'runCount'>>
    ): AutomationWorkflow | null {
        const workflow = this.workflows.get(workflowId)
        if (!workflow) return null

        const updated: AutomationWorkflow = {
            ...workflow,
            ...updates,
            updatedAt: new Date()
        }

        this.workflows.set(workflowId, updated)
        this.logger.info(`Updated workflow: ${workflow.name} (${workflowId})`)
        return updated
    }

    deleteWorkflow(workflowId: string): boolean {
        const deleted = this.workflows.delete(workflowId)
        if (deleted) {
            this.logger.info(`Deleted workflow: ${workflowId}`)
        }
        return deleted
    }

    enableWorkflow(workflowId: string): boolean {
        const workflow = this.workflows.get(workflowId)
        if (!workflow) return false

        workflow.enabled = true
        this.logger.info(`Enabled workflow: ${workflow.name} (${workflowId})`)
        return true
    }

    disableWorkflow(workflowId: string): boolean {
        const workflow = this.workflows.get(workflowId)
        if (!workflow) return false

        workflow.enabled = false
        this.logger.info(`Disabled workflow: ${workflow.name} (${workflowId})`)
        return true
    }

    getWorkflow(workflowId: string): AutomationWorkflow | undefined {
        return this.workflows.get(workflowId)
    }

    getWorkflows(): AutomationWorkflow[] {
        return Array.from(this.workflows.values())
    }

    getEnabledWorkflows(): AutomationWorkflow[] {
        return this.getWorkflows().filter(w => w.enabled)
    }

    getWorkflowsByTrigger(triggerType: AutomationTrigger['type']): AutomationWorkflow[] {
        return this.getWorkflows().filter(w =>
            w.triggers.some(t => t.type === triggerType && t.enabled)
        )
    }

    getWorkflowsByTag(tag: string): AutomationWorkflow[] {
        return this.getWorkflows().filter(w => w.tags?.includes(tag))
    }

    async executeWorkflow(
        workflowId: string,
        trigger: AutomationTrigger,
        context?: Record<string, any>
    ): Promise<AutomationExecution> {
        if (!this.active) {
            throw new Error('Automation service is not active')
        }

        const workflow = this.workflows.get(workflowId)
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`)
        }

        if (!workflow.enabled) {
            throw new Error(`Workflow is disabled: ${workflow.name}`)
        }

        // Check concurrency limit
        const runningCount = this.getActiveExecutions().length
        if (runningCount >= this.maxConcurrentExecutions) {
            throw new Error(`Maximum concurrent executions (${this.maxConcurrentExecutions}) reached`)
        }

        const executionId = `exec-${++this.executionCounter}`

        const execution: AutomationExecution = {
            id: executionId,
            workflowId,
            trigger,
            status: 'pending',
            startTime: new Date(),
            results: [],
            context
        }

        this.executions.set(executionId, execution)
        this.executionQueue.push(executionId)

        try {
            execution.status = 'running'
            this.logger.info(`Starting execution of workflow: ${workflow.name} (${executionId})`)

            // Execute actions in sequence
            for (const action of workflow.actions) {
                if (!action.enabled) continue

                const actionResult = await this.executeActionWithRetry(action, context)
                execution.results.push(actionResult)

                // Stop on first failure if not configured to continue
                if (!actionResult.success && this.shouldStopOnFailure(action)) {
                    this.logger.warn(`Stopping workflow execution due to action failure: ${action.id}`)
                    break
                }
            }

            execution.status = 'completed'
            execution.endTime = new Date()
            workflow.lastRun = execution.endTime
            workflow.runCount++

            this.logger.info(`Completed execution of workflow: ${workflow.name} (${executionId})`)
        } catch (error) {
            execution.status = 'failed'
            execution.error = error instanceof Error ? error.message : 'Unknown error'
            execution.endTime = new Date()
            this.logger.error(`Failed execution of workflow ${workflow.name} (${executionId}):`, error)
        } finally {
            const queueIndex = this.executionQueue.indexOf(executionId)
            if (queueIndex > -1) {
                this.executionQueue.splice(queueIndex, 1)
            }
        }

        return execution
    }

    private shouldStopOnFailure(action: AutomationAction): boolean {
        // Continue on failure by default unless configured otherwise
        return action.config.stopOnFailure === true
    }

    private async executeActionWithRetry(
        action: AutomationAction,
        context?: Record<string, any>
    ): Promise<ActionResult> {
        const maxRetries = action.retryPolicy?.maxRetries ?? (this.config.retryEnabled ? 3 : 0)
        const backoffMs = action.retryPolicy?.backoffMs ?? 1000

        let lastError: Error | undefined
        let retryCount = 0

        for (let i = 0; i <= maxRetries; i++) {
            retryCount = i
            const actionStartTime = Date.now()

            try {
                const result = await this.executeAction(action, context)
                const duration = Date.now() - actionStartTime

                return {
                    actionId: action.id,
                    success: true,
                    output: result,
                    duration,
                    retryCount
                }
            } catch (error) {
                lastError = error instanceof Error ? error : new Error('Unknown error')
                const duration = Date.now() - actionStartTime

                if (i < maxRetries) {
                    this.logger.warn(`Action ${action.id} failed, retrying (${i + 1}/${maxRetries}): ${lastError.message}`)
                    await this.sleep(backoffMs * (i + 1)) // Exponential backoff
                } else {
                    this.logger.error(`Action ${action.id} failed after ${maxRetries} retries: ${lastError.message}`)
                    return {
                        actionId: action.id,
                        success: false,
                        error: lastError.message,
                        duration,
                        retryCount
                    }
                }
            }
        }

        // Should never reach here, but TypeScript needs it
        return {
            actionId: action.id,
            success: false,
            error: lastError?.message || 'Unknown error',
            retryCount
        }
    }

    private async executeAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        switch (action.type) {
            case 'command':
                return this.executeCommandAction(action, context)
            case 'script':
                return this.executeScriptAction(action, context)
            case 'ai_task':
                return this.executeAiTaskAction(action, context)
            case 'notification':
                return this.executeNotificationAction(action, context)
            case 'file_operation':
                return this.executeFileOperationAction(action, context)
            case 'git_operation':
                return this.executeGitOperationAction(action, context)
            case 'http_request':
                return this.executeHttpRequestAction(action, context)
            case 'custom':
                return this.executeCustomAction(action, context)
            default:
                throw new Error(`Unknown action type: ${action.type}`)
        }
    }

    private substituteVariables(template: string, context?: Record<string, any>): string {
        if (!context) return template

        let result = template
        for (const [key, value] of Object.entries(context)) {
            result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), String(value))
        }
        return result
    }

    private async executeCommandAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        const command = action.config.command
        if (!command) throw new Error('Command not specified')

        const finalCommand = this.substituteVariables(command, context)

        this.logger.info(`Executing command: ${finalCommand}`)
        // Placeholder for actual command execution
        // In a real implementation, this would use child_process.exec
        return `Executed: ${finalCommand}`
    }

    private async executeScriptAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        const scriptPath = action.config.scriptPath
        if (!scriptPath) throw new Error('Script path not specified')

        this.logger.info(`Executing script: ${scriptPath}`)
        // Placeholder for actual script execution
        return `Executed script: ${scriptPath}`
    }

    private async executeAiTaskAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        const prompt = action.config.prompt
        if (!prompt) throw new Error('Prompt not specified')

        const finalPrompt = this.substituteVariables(prompt, context)

        this.logger.info(`Executing AI task: ${finalPrompt}`)
        // Placeholder for actual AI task execution
        // This would integrate with an AI service
        return `AI task completed: ${finalPrompt}`
    }

    private async executeNotificationAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        const message = action.config.message
        if (!message) throw new Error('Message not specified')

        const finalMessage = this.substituteVariables(message, context)

        this.logger.info(`Sending notification: ${finalMessage}`)
        // Placeholder for actual notification
        return `Notification sent: ${finalMessage}`
    }

    private async executeFileOperationAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        const operation = action.config.operation
        if (!operation) throw new Error('Operation not specified')

        this.logger.info(`Executing file operation: ${operation}`)
        // Placeholder for actual file operation
        return `File operation completed: ${operation}`
    }

    private async executeGitOperationAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        const operation = action.config.operation
        if (!operation) throw new Error('Operation not specified')

        this.logger.info(`Executing git operation: ${operation}`)
        // Placeholder for actual git operation
        return `Git operation completed: ${operation}`
    }

    private async executeHttpRequestAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        const url = action.config.url
        if (!url) throw new Error('URL not specified')

        const finalUrl = this.substituteVariables(url, context)

        this.logger.info(`Executing HTTP request: ${finalUrl}`)
        // Placeholder for actual HTTP request
        return `HTTP request completed: ${finalUrl}`
    }

    private async executeCustomAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        const handler = action.config.handler
        if (!handler) throw new Error('Handler not specified')

        this.logger.info(`Executing custom action: ${handler}`)
        // Placeholder for custom action execution
        return `Custom action completed: ${handler}`
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    getExecution(executionId: string): AutomationExecution | undefined {
        return this.executions.get(executionId)
    }

    getExecutions(): AutomationExecution[] {
        return Array.from(this.executions.values())
    }

    getExecutionsByWorkflow(workflowId: string): AutomationExecution[] {
        return this.getExecutions().filter(e => e.workflowId === workflowId)
    }

    getActiveExecutions(): AutomationExecution[] {
        return this.getExecutions().filter(e => e.status === 'running')
    }

    cancelExecution(executionId: string): boolean {
        const execution = this.executions.get(executionId)
        if (!execution || execution.status !== 'running') return false

        execution.status = 'cancelled'
        execution.endTime = new Date()
        this.logger.info(`Cancelled execution: ${executionId}`)

        const queueIndex = this.executionQueue.indexOf(executionId)
        if (queueIndex > -1) {
            this.executionQueue.splice(queueIndex, 1)
        }

        return true
    }

    clearExecutions(): void {
        this.executions.clear()
        this.executionQueue = []
        this.logger.info('Cleared all executions')
    }

    clearOldExecutions(olderThan: Date): number {
        const oldExecutions = this.getExecutions().filter(e =>
            e.endTime && e.endTime < olderThan
        )
        let count = 0
        for (const execution of oldExecutions) {
            this.executions.delete(execution.id)
            const queueIndex = this.executionQueue.indexOf(execution.id)
            if (queueIndex > -1) {
                this.executionQueue.splice(queueIndex, 1)
            }
            count++
        }
        this.logger.info(`Cleared ${count} old executions`)
        return count
    }

    getStatistics(): AutomationStatistics {
        const workflows = this.getWorkflows()
        const executions = this.getExecutions()

        const successfulExecutions = executions.filter(e => e.status === 'completed')
        const averageExecutionTimeMs = successfulExecutions.length > 0
            ? successfulExecutions.reduce((sum, e) => {
                const duration = e.endTime && e.startTime
                    ? e.endTime.getTime() - e.startTime.getTime()
                    : 0
                return sum + duration
            }, 0) / successfulExecutions.length
            : undefined

        // Find most triggered workflow
        const workflowRunCounts = new Map<string, number>()
        executions.forEach(e => {
            const count = workflowRunCounts.get(e.workflowId) || 0
            workflowRunCounts.set(e.workflowId, count + 1)
        })

        let mostTriggeredWorkflow: string | undefined
        let maxRuns = 0
        workflowRunCounts.forEach((count, workflowId) => {
            if (count > maxRuns) {
                maxRuns = count
                mostTriggeredWorkflow = workflowId
            }
        })

        return {
            totalWorkflows: workflows.length,
            enabledWorkflows: workflows.filter(w => w.enabled).length,
            totalExecutions: executions.length,
            successfulExecutions: executions.filter(e => e.status === 'completed').length,
            failedExecutions: executions.filter(e => e.status === 'failed').length,
            runningExecutions: executions.filter(e => e.status === 'running').length,
            averageExecutionTimeMs,
            mostTriggeredWorkflow
        }
    }

    exportWorkflows(): string {
        return JSON.stringify(this.getWorkflows(), null, 2)
    }

    importWorkflows(json: string): number {
        try {
            const workflows = JSON.parse(json) as AutomationWorkflow[]
            let count = 0
            for (const workflow of workflows) {
                this.workflows.set(workflow.id, workflow)
                count++
            }
            this.logger.info(`Imported ${count} workflows`)
            return count
        } catch (error) {
            this.logger.error('Failed to import workflows:', error)
            return 0
        }
    }

    reset(): void {
        this.workflows.clear()
        this.executions.clear()
        this.executionQueue = []
        this.workflowCounter = 0
        this.executionCounter = 0
        this.logger.info('Automation service reset')
    }
}

// Singleton instance
let automationService: AutomationService | null = null

export function getAutomationService(config?: AutomationConfig, logger?: Logger): AutomationService {
    if (!automationService) {
        automationService = new AutomationService(config, logger)
    }
    return automationService
}

export function destroyAutomationService(): void {
    if (automationService) {
        automationService.reset()
        automationService = null
    }
}

export function createAutomationService(config?: AutomationConfig, logger?: Logger): AutomationService {
    return new AutomationService(config, logger)
}