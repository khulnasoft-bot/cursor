/**
 * Agent Exec Service IPC Handlers
 * IPC communication layer for agent exec service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getAgentExecService } from './agentExecService'
import type { AgentTask } from './agentExecService'

export function setupAgentExecServiceIpcs() {
    const agentExecService = getAgentExecService()

    // Execute agent
    ipcMain.handle(
        'agent-exec-service-execute',
        async (_event: IpcMainInvokeEvent, command: string, args?: string[], cwd?: string, env?: Record<string, string>) => {
            try {
                const taskId = await agentExecService.executeAgent(command, args || [], cwd, env)
                return { success: true, taskId }
            } catch (error) {
                log.error('Failed to execute agent:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Execute agent script
    ipcMain.handle(
        'agent-exec-service-execute-script',
        async (_event: IpcMainInvokeEvent, scriptPath: string, args?: string[], cwd?: string) => {
            try {
                const taskId = await agentExecService.executeAgentScript(scriptPath, args || [], cwd)
                return { success: true, taskId }
            } catch (error) {
                log.error('Failed to execute agent script:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Execute agent command
    ipcMain.handle(
        'agent-exec-service-execute-command',
        async (_event: IpcMainInvokeEvent, commandString: string, cwd?: string) => {
            try {
                const taskId = await agentExecService.executeAgentCommand(commandString, cwd)
                return { success: true, taskId }
            } catch (error) {
                log.error('Failed to execute agent command:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get task
    ipcMain.handle(
        'agent-exec-service-get-task',
        async (_event: IpcMainInvokeEvent, taskId: string) => {
            try {
                const task = agentExecService.getTask(taskId)
                return { success: true, task }
            } catch (error) {
                log.error('Failed to get agent task:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all tasks
    ipcMain.handle(
        'agent-exec-service-get-tasks',
        async () => {
            try {
                const tasks = agentExecService.getTasks()
                return { success: true, tasks }
            } catch (error) {
                log.error('Failed to get agent tasks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get running tasks
    ipcMain.handle(
        'agent-exec-service-get-running',
        async () => {
            try {
                const tasks = agentExecService.getRunningTasks()
                return { success: true, tasks }
            } catch (error) {
                log.error('Failed to get running tasks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get completed tasks
    ipcMain.handle(
        'agent-exec-service-get-completed',
        async () => {
            try {
                const tasks = agentExecService.getCompletedTasks()
                return { success: true, tasks }
            } catch (error) {
                log.error('Failed to get completed tasks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get failed tasks
    ipcMain.handle(
        'agent-exec-service-get-failed',
        async () => {
            try {
                const tasks = agentExecService.getFailedTasks()
                return { success: true, tasks }
            } catch (error) {
                log.error('Failed to get failed tasks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop task
    ipcMain.handle(
        'agent-exec-service-stop',
        async (_event: IpcMainInvokeEvent, taskId: string) => {
            try {
                await agentExecService.stopTask(taskId)
                return { success: true }
            } catch (error) {
                log.error('Failed to stop agent task:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop all tasks
    ipcMain.handle(
        'agent-exec-service-stop-all',
        async () => {
            try {
                await agentExecService.stopAllTasks()
                return { success: true }
            } catch (error) {
                log.error('Failed to stop all agent tasks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear task
    ipcMain.handle(
        'agent-exec-service-clear',
        async (_event: IpcMainInvokeEvent, taskId: string) => {
            try {
                agentExecService.clearTask(taskId)
                return { success: true }
            } catch (error) {
                log.error('Failed to clear agent task:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear completed tasks
    ipcMain.handle(
        'agent-exec-service-clear-completed',
        async () => {
            try {
                agentExecService.clearCompletedTasks()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear completed tasks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear failed tasks
    ipcMain.handle(
        'agent-exec-service-clear-failed',
        async () => {
            try {
                agentExecService.clearFailedTasks()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear failed tasks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear all tasks
    ipcMain.handle(
        'agent-exec-service-clear-all',
        async () => {
            try {
                agentExecService.clearAllTasks()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear all tasks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get task output
    ipcMain.handle(
        'agent-exec-service-get-output',
        async (_event: IpcMainInvokeEvent, taskId: string) => {
            try {
                const output = agentExecService.getTaskOutput(taskId)
                return { success: true, output }
            } catch (error) {
                log.error('Failed to get task output:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get task error
    ipcMain.handle(
        'agent-exec-service-get-error',
        async (_event: IpcMainInvokeEvent, taskId: string) => {
            try {
                const error = agentExecService.getTaskError(taskId)
                return { success: true, error }
            } catch (error) {
                log.error('Failed to get task error:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Agent exec service IPC handlers registered')
}
