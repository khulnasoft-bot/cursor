/**
 * Cursor Agent Exec Service
 * Agent execution service for running AI agent tasks
 * Extracted and adapted from Cursor's agent execution service
 */

import {
    AgentTask,
    TaskStatus,
    Tool,
    ToolResult,
    AgentConfig
} from './types'
import { Logger, ConsoleLogger } from './logger'

// Tool registry interface for integration
export interface ToolRegistry {
    getTools(): Tool[]
    getTool(toolName: string): Tool | undefined
    executeTool(toolName: string, params: Record<string, any>): Promise<ToolResult>
}

export class AgentExecService {
    private tasks: Map<string, AgentTask> = new Map()
    private taskIdCounter = 0
    private toolRegistry: ToolRegistry | null = null
    private config: AgentConfig
    private logger: Logger

    constructor(config: AgentConfig = {}, logger?: Logger) {
        this.config = {
            maxConcurrentTasks: 3,
            executionTimeoutMs: 300000, // 5 minutes
            maxMemories: 1000,
            importanceThreshold: 0.3,
            enableRollback: true,
            logLevel: 'info',
            ...config
        }
        this.logger = logger || new ConsoleLogger()
    }

    setToolRegistry(toolRegistry: ToolRegistry): void {
        this.toolRegistry = toolRegistry
        this.logger.info('Tool registry set for agent execution')
    }

    updateConfig(config: Partial<AgentConfig>): void {
        this.config = { ...this.config, ...config }
        this.logger.info('Agent exec service configuration updated')
    }

    getConfig(): AgentConfig {
        return { ...this.config }
    }

    async executeAgent(
        command: string,
        args: string[] = [],
        cwd?: string,
        env?: Record<string, string>
    ): Promise<string> {
        const taskId = `agent-task-${++this.taskIdCounter}`

        const task: AgentTask = {
            id: taskId,
            command,
            args,
            cwd,
            env,
            status: 'pending',
            output: ''
        }

        this.tasks.set(taskId, task)

        try {
            task.status = 'running'
            task.startTime = new Date()

            // Execute the command (placeholder for actual process execution)
            await this.executeCommand(command, args, cwd, env, task)

            task.status = 'completed'
            task.endTime = new Date()

            this.logger.info(`Agent task ${taskId} completed`)
            return taskId
        } catch (error) {
            task.status = 'failed'
            task.error = error instanceof Error ? error.message : 'Unknown error'
            task.endTime = new Date()
            this.logger.error('Failed to execute agent:', error)
            throw error
        }
    }

    private async executeCommand(
        command: string,
        args: string[],
        cwd: string | undefined,
        env: Record<string, string> | undefined,
        task: AgentTask
    ): Promise<void> {
        // Placeholder for actual command execution
        // In a real implementation, this would use child_process.spawn
        this.logger.info(`Executing command: ${command} ${args.join(' ')}`)
        
        // Simulate command execution
        task.output = `Executed: ${command} ${args.join(' ')}`
        
        // In production, this would:
        // 1. Spawn the process with proper environment
        // 2. Capture stdout and stderr
        // 3. Handle process termination
        // 4. Handle timeout
    }

    async executeAgentScript(scriptPath: string, args: string[] = [], cwd?: string): Promise<string> {
        return this.executeAgent(scriptPath, args, cwd)
    }

    async executeAgentCommand(commandString: string, cwd?: string): Promise<string> {
        const parts = commandString.split(' ')
        const command = parts[0]
        const args = parts.slice(1)
        return this.executeAgent(command, args, cwd)
    }

    async executeTool(toolName: string, params: Record<string, any>): Promise<string> {
        if (!this.toolRegistry) {
            throw new Error('Tool registry not set. Call setToolRegistry() first.')
        }

        const taskId = `tool-task-${++this.taskIdCounter}`

        const task: AgentTask = {
            id: taskId,
            command: toolName,
            args: [],
            status: 'pending',
            output: '',
            toolName,
            toolParams: params
        }

        this.tasks.set(taskId, task)

        try {
            task.status = 'running'
            task.startTime = new Date()

            const result = await this.toolRegistry.executeTool(toolName, params)

            task.status = result.success ? 'completed' : 'failed'
            task.output = JSON.stringify(result.data || result.error)
            task.error = result.error
            task.endTime = new Date()

            this.logger.info(`Tool task ${taskId} completed: ${toolName}`)
            return taskId
        } catch (error) {
            task.status = 'failed'
            task.error = error instanceof Error ? error.message : 'Unknown error'
            task.endTime = new Date()
            this.logger.error(`Tool task ${taskId} error:`, error)
            throw error
        }
    }

    getTask(taskId: string): AgentTask | undefined {
        return this.tasks.get(taskId)
    }

    getTasks(): AgentTask[] {
        return Array.from(this.tasks.values())
    }

    getRunningTasks(): AgentTask[] {
        return this.getTasks().filter(t => t.status === 'running')
    }

    getCompletedTasks(): AgentTask[] {
        return this.getTasks().filter(t => t.status === 'completed')
    }

    getFailedTasks(): AgentTask[] {
        return this.getTasks().filter(t => t.status === 'failed')
    }

    async stopTask(taskId: string): Promise<void> {
        const task = this.tasks.get(taskId)
        if (task && task.status === 'running') {
            task.status = 'cancelled'
            task.error = 'Task stopped by user'
            task.endTime = new Date()
            this.logger.info(`Stopped agent task: ${taskId}`)
        }
    }

    async stopAllTasks(): Promise<void> {
        for (const task of this.getRunningTasks()) {
            await this.stopTask(task.id)
        }
        this.logger.info('Stopped all agent tasks')
    }

    clearTask(taskId: string): void {
        this.tasks.delete(taskId)
    }

    clearCompletedTasks(): void {
        for (const task of this.getCompletedTasks()) {
            this.tasks.delete(task.id)
        }
    }

    clearFailedTasks(): void {
        for (const task of this.getFailedTasks()) {
            this.tasks.delete(task.id)
        }
    }

    clearAllTasks(): void {
        this.tasks.clear()
        this.logger.info('Cleared all agent tasks')
    }

    getTaskOutput(taskId: string): string | null {
        const task = this.tasks.get(taskId)
        return task ? task.output : null
    }

    getTaskError(taskId: string): string | null {
        const task = this.tasks.get(taskId)
        return task ? task.error || null : null
    }

    getAvailableTools(): Tool[] {
        if (!this.toolRegistry) {
            return []
        }
        return this.toolRegistry.getTools()
    }

    getTool(toolName: string): Tool | undefined {
        if (!this.toolRegistry) {
            return undefined
        }
        return this.toolRegistry.getTool(toolName)
    }

    getStatistics(): {
        totalTasks: number
        runningTasks: number
        completedTasks: number
        failedTasks: number
        cancelledTasks: number
    } {
        const tasks = this.getTasks()
        return {
            totalTasks: tasks.length,
            runningTasks: tasks.filter(t => t.status === 'running').length,
            completedTasks: tasks.filter(t => t.status === 'completed').length,
            failedTasks: tasks.filter(t => t.status === 'failed').length,
            cancelledTasks: tasks.filter(t => t.status === 'cancelled').length
        }
    }

    reset(): void {
        this.tasks.clear()
        this.taskIdCounter = 0
        this.logger.info('Reset agent exec service')
    }
}

// Singleton instance
let agentExecService: AgentExecService | null = null

export function getAgentExecService(config?: AgentConfig, logger?: Logger): AgentExecService {
    if (!agentExecService) {
        agentExecService = new AgentExecService(config, logger)
    }
    return agentExecService
}

export function destroyAgentExecService(): void {
    if (agentExecService) {
        agentExecService.stopAllTasks()
        agentExecService.reset()
        agentExecService = null
    }
}

export function createAgentExecService(config?: AgentConfig, logger?: Logger): AgentExecService {
    return new AgentExecService(config, logger)
}