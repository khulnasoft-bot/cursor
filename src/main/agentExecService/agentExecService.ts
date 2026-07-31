/**
 * Cursor Agent Exec Service
 * Agent execution service for running AI agent tasks
 */

import { spawn, ChildProcess } from 'child_process'
import log from 'electron-log'
import { getToolRegistry } from './toolRegistry'

export interface AgentTask {
    id: string
    command: string
    args: string[]
    cwd?: string
    env?: Record<string, string>
    status: 'pending' | 'running' | 'completed' | 'failed'
    output: string
    error?: string
    startTime?: Date
    endTime?: Date
    toolName?: string
    toolParams?: Record<string, any>
}

class AgentExecService {
    private tasks: Map<string, AgentTask> = new Map()
    private processes: Map<string, ChildProcess> = new Map()
    private taskIdCounter = 0
    private toolRegistry = getToolRegistry()

    async executeAgent(command: string, args: string[] = [], cwd?: string, env?: Record<string, string>): Promise<string> {
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
            const childProcess = spawn(command, args, {
                cwd: cwd || process.cwd(),
                env: { ...process.env, ...env },
                stdio: ['pipe', 'pipe', 'pipe']
            })

            this.processes.set(taskId, childProcess)
            task.status = 'running'
            task.startTime = new Date()

            childProcess.stdout?.on('data', (data) => {
                task.output += data.toString()
            })

            childProcess.stderr?.on('data', (data) => {
                task.error = (task.error || '') + data.toString()
            })

            childProcess.on('close', (code) => {
                task.status = code === 0 ? 'completed' : 'failed'
                task.endTime = new Date()
                this.processes.delete(taskId)
                log.info(`Agent task ${taskId} completed with code ${code}`)
            })

            childProcess.on('error', (error) => {
                task.status = 'failed'
                task.error = error.message
                task.endTime = new Date()
                this.processes.delete(taskId)
                log.error(`Agent task ${taskId} error:`, error)
            })

            log.info(`Started agent task: ${taskId}`)
            return taskId
        } catch (error) {
            task.status = 'failed'
            task.error = error instanceof Error ? error.message : 'Unknown error'
            task.endTime = new Date()
            log.error('Failed to execute agent:', error)
            throw error
        }
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
        const process = this.processes.get(taskId)
        if (process) {
            process.kill()
            this.processes.delete(taskId)

            const task = this.tasks.get(taskId)
            if (task) {
                task.status = 'failed'
                task.error = 'Task stopped by user'
                task.endTime = new Date()
            }

            log.info(`Stopped agent task: ${taskId}`)
        }
    }

    async stopAllTasks(): Promise<void> {
        for (const [taskId, process] of this.processes) {
            process.kill()

            const task = this.tasks.get(taskId)
            if (task) {
                task.status = 'failed'
                task.error = 'Task stopped by user'
                task.endTime = new Date()
            }
        }
        this.processes.clear()
        log.info('Stopped all agent tasks')
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
        log.info('Cleared all agent tasks')
    }

    getTaskOutput(taskId: string): string | null {
        const task = this.tasks.get(taskId)
        return task ? task.output : null
    }

    getTaskError(taskId: string): string | null {
        const task = this.tasks.get(taskId)
        return task ? task.error || null : null
    }

    async executeTool(toolName: string, params: Record<string, any>): Promise<string> {
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

            log.info(`Tool task ${taskId} completed: ${toolName}`)
            return taskId
        } catch (error) {
            task.status = 'failed'
            task.error = error instanceof Error ? error.message : 'Unknown error'
            task.endTime = new Date()
            log.error(`Tool task ${taskId} error:`, error)
            throw error
        }
    }

    getAvailableTools() {
        return this.toolRegistry.getTools()
    }

    getTool(toolName: string) {
        return this.toolRegistry.getTool(toolName)
    }
}

// Singleton instance
let agentExecService: AgentExecService | null = null

export function getAgentExecService(): AgentExecService {
    if (!agentExecService) {
        agentExecService = new AgentExecService()
    }
    return agentExecService
}

export function destroyAgentExecService() {
    if (agentExecService) {
        agentExecService.stopAllTasks()
        agentExecService = null
    }
}
