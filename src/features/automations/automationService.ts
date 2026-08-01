/**
 * Automations Service
 * Service for managing automations, triggers, and workflows
 */

import log from 'electron-log'

export interface AutomationTrigger {
    id: string
    type: 'file_save' | 'file_change' | 'git_commit' | 'time' | 'manual' | 'event'
    config: Record<string, any>
    enabled: boolean
}

export interface AutomationAction {
    id: string
    type: 'command' | 'script' | 'ai_task' | 'notification' | 'file_operation' | 'git_operation'
    config: Record<string, any>
    enabled: boolean
}

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
}

export interface AutomationExecution {
    id: string
    workflowId: string
    trigger: AutomationTrigger
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
    startTime: Date
    endTime?: Date
    results: Array<{ actionId: string; success: boolean; output?: string; error?: string; duration?: number }>
    error?: string
    context?: Record<string, any>
}

export class AutomationService {
    private workflows: Map<string, AutomationWorkflow> = new Map()
    private executions: Map<string, AutomationExecution> = new Map()
    private workflowCounter = 0
    private executionCounter = 0
    private active: boolean = false

    activate(): void {
        this.active = true
        log.info('Automation service activated')
    }

    deactivate(): void {
        this.active = false
        log.info('Automation service deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    createWorkflow(
        name: string,
        description: string,
        triggers: AutomationTrigger[],
        actions: AutomationAction[]
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
            runCount: 0
        }

        this.workflows.set(workflowId, workflow)
        log.info(`Created workflow: ${name}`)
        return workflow
    }

    updateWorkflow(
        workflowId: string,
        updates: Partial<Omit<AutomationWorkflow, 'id' | 'createdAt' | 'runCount'>>
    ): AutomationWorkflow | null {
        const workflow = this.workflows.get(workflowId)
        if (!workflow) return null

        const updated = {
            ...workflow,
            ...updates,
            updatedAt: new Date()
        }

        this.workflows.set(workflowId, updated)
        log.info(`Updated workflow: ${workflow.name}`)
        return updated
    }

    deleteWorkflow(workflowId: string): boolean {
        const deleted = this.workflows.delete(workflowId)
        if (deleted) {
            log.info(`Deleted workflow: ${workflowId}`)
        }
        return deleted
    }

    enableWorkflow(workflowId: string): boolean {
        const workflow = this.workflows.get(workflowId)
        if (!workflow) return false

        workflow.enabled = true
        log.info(`Enabled workflow: ${workflow.name}`)
        return true
    }

    disableWorkflow(workflowId: string): boolean {
        const workflow = this.workflows.get(workflowId)
        if (!workflow) return false

        workflow.enabled = false
        log.info(`Disabled workflow: ${workflow.name}`)
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

    async executeWorkflow(workflowId: string, trigger: AutomationTrigger, context?: Record<string, any>): Promise<AutomationExecution> {
        const workflow = this.workflows.get(workflowId)
        if (!workflow) {
            throw new Error(`Workflow not found: ${workflowId}`)
        }

        if (!workflow.enabled) {
            throw new Error(`Workflow is disabled: ${workflow.name}`)
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

        try {
            execution.status = 'running'
            log.info(`Starting execution of workflow: ${workflow.name}`)

            // Execute actions in sequence
            for (const action of workflow.actions) {
                if (!action.enabled) continue

                const actionStartTime = Date.now()
                try {
                    const result = await this.executeAction(action, context)
                    const duration = Date.now() - actionStartTime
                    execution.results.push({
                        actionId: action.id,
                        success: true,
                        output: result,
                        duration
                    })
                } catch (error) {
                    const duration = Date.now() - actionStartTime
                    execution.results.push({
                        actionId: action.id,
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        duration
                    })
                }
            }

            execution.status = 'completed'
            execution.endTime = new Date()
            workflow.lastRun = execution.endTime
            workflow.runCount++

            log.info(`Completed execution of workflow: ${workflow.name}`)
        } catch (error) {
            execution.status = 'failed'
            execution.error = error instanceof Error ? error.message : 'Unknown error'
            execution.endTime = new Date()
            log.error(`Failed execution of workflow ${workflow.name}:`, error)
        }

        return execution
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
            default:
                throw new Error(`Unknown action type: ${action.type}`)
        }
    }

    private async executeCommandAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        // Execute shell command
        const command = action.config.command
        if (!command) throw new Error('Command not specified')

        // Substitute context variables in command
        let finalCommand = command
        if (context) {
            for (const [key, value] of Object.entries(context)) {
                finalCommand = finalCommand.replace(`\${${key}}`, String(value))
            }
        }

        log.info(`Executing command: ${finalCommand}`)
        try {
            // Placeholder for actual command execution
            // TODO: Implement actual command execution with proper error handling
            return `Executed: ${finalCommand}`
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            log.error(`Command execution failed: ${errorMsg}`)
            throw new Error(`Command execution failed: ${errorMsg}`)
        }
    }

    private async executeScriptAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        // Execute script file
        const scriptPath = action.config.scriptPath
        if (!scriptPath) throw new Error('Script path not specified')

        log.info(`Executing script: ${scriptPath}`)
        try {
            // Placeholder for actual script execution
            // TODO: Implement actual script execution with proper error handling
            return `Executed script: ${scriptPath}`
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            log.error(`Script execution failed: ${errorMsg}`)
            throw new Error(`Script execution failed: ${errorMsg}`)
        }
    }

    private async executeAiTaskAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        // Execute AI task
        const prompt = action.config.prompt
        if (!prompt) throw new Error('Prompt not specified')

        // Substitute context variables in prompt
        let finalPrompt = prompt
        if (context) {
            for (const [key, value] of Object.entries(context)) {
                finalPrompt = finalPrompt.replace(`\${${key}}`, String(value))
            }
        }

        log.info(`Executing AI task: ${finalPrompt}`)
        try {
            // Placeholder for actual AI task execution
            // TODO: Implement actual AI task execution with proper error handling
            return `AI task completed: ${finalPrompt}`
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            log.error(`AI task execution failed: ${errorMsg}`)
            throw new Error(`AI task execution failed: ${errorMsg}`)
        }
    }

    private async executeNotificationAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        // Send notification
        const message = action.config.message
        if (!message) throw new Error('Message not specified')

        // Substitute context variables in message
        let finalMessage = message
        if (context) {
            for (const [key, value] of Object.entries(context)) {
                finalMessage = finalMessage.replace(`\${${key}}`, String(value))
            }
        }

        log.info(`Sending notification: ${finalMessage}`)
        try {
            // Placeholder for actual notification
            // TODO: Implement actual notification sending with proper error handling
            return `Notification sent: ${finalMessage}`
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            log.error(`Notification sending failed: ${errorMsg}`)
            throw new Error(`Notification sending failed: ${errorMsg}`)
        }
    }

    private async executeFileOperationAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        // Execute file operation
        const operation = action.config.operation
        if (!operation) throw new Error('Operation not specified')

        log.info(`Executing file operation: ${operation}`)
        try {
            // Placeholder for actual file operation
            // TODO: Implement actual file operation with proper error handling
            return `File operation completed: ${operation}`
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            log.error(`File operation failed: ${errorMsg}`)
            throw new Error(`File operation failed: ${errorMsg}`)
        }
    }

    private async executeGitOperationAction(action: AutomationAction, context?: Record<string, any>): Promise<string> {
        // Execute git operation
        const operation = action.config.operation
        if (!operation) throw new Error('Operation not specified')

        log.info(`Executing git operation: ${operation}`)
        try {
            // Placeholder for actual git operation
            // TODO: Implement actual git operation with proper error handling
            return `Git operation completed: ${operation}`
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            log.error(`Git operation failed: ${errorMsg}`)
            throw new Error(`Git operation failed: ${errorMsg}`)
        }
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
        log.info(`Cancelled execution: ${executionId}`)
        return true
    }

    clearExecutions(): void {
        this.executions.clear()
        log.info('Cleared all executions')
    }

    clearOldExecutions(olderThan: Date): number {
        const oldExecutions = this.getExecutions().filter(e =>
            e.endTime && e.endTime < olderThan
        )
        let count = 0
        for (const execution of oldExecutions) {
            this.executions.delete(execution.id)
            count++
        }
        log.info(`Cleared ${count} old executions`)
        return count
    }

    getStatistics(): {
        totalWorkflows: number
        enabledWorkflows: number
        totalExecutions: number
        successfulExecutions: number
        failedExecutions: number
        runningExecutions: number
    } {
        const workflows = this.getWorkflows()
        const executions = this.getExecutions()

        return {
            totalWorkflows: workflows.length,
            enabledWorkflows: workflows.filter(w => w.enabled).length,
            totalExecutions: executions.length,
            successfulExecutions: executions.filter(e => e.status === 'completed').length,
            failedExecutions: executions.filter(e => e.status === 'failed').length,
            runningExecutions: executions.filter(e => e.status === 'running').length
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
            log.info(`Imported ${count} workflows`)
            return count
        } catch (error) {
            log.error('Failed to import workflows:', error)
            return 0
        }
    }

    reset(): void {
        this.workflows.clear()
        this.executions.clear()
        this.workflowCounter = 0
        this.executionCounter = 0
        log.info('Automation service reset')
    }
}

// Singleton instance
let automationService: AutomationService | null = null

export function getAutomationService(): AutomationService {
    if (!automationService) {
        automationService = new AutomationService()
    }
    return automationService
}

export function destroyAutomationService() {
    if (automationService) {
        automationService.reset()
        automationService = null
    }
}
