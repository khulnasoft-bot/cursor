/**
 * Composer IPC Handlers
 * IPC communication layer for multi-file editing orchestration
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getComposerService } from './composerService'
import type { ComposerRequest, ComposerResult, ComposerExecution } from './composerService'

export function setupComposerIpcs() {
    const composerService = getComposerService()

    // Plan changes
    ipcMain.handle(
        'composer-plan-changes',
        async (_event: IpcMainInvokeEvent, request: ComposerRequest) => {
            try {
                const result = await composerService.planChanges(request)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to plan changes:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Execute changes
    ipcMain.handle(
        'composer-execute-changes',
        async (_event: IpcMainInvokeEvent, result: ComposerResult) => {
            try {
                const execution = await composerService.executeChanges(result)

                // Send progress updates
                _event.sender.send('composer-progress', {
                    requestId: execution.requestId,
                    currentStep: execution.currentStep,
                    totalSteps: execution.totalSteps,
                    status: execution.status
                })

                return { success: true, execution }
            } catch (error) {
                log.error('Failed to execute changes:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get execution status
    ipcMain.handle(
        'composer-get-execution',
        async (_event: IpcMainInvokeEvent, requestId: string) => {
            try {
                const execution = composerService.getExecution(requestId)
                return { success: true, execution }
            } catch (error) {
                log.error('Failed to get execution:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Cancel execution
    ipcMain.handle(
        'composer-cancel-execution',
        async (_event: IpcMainInvokeEvent, requestId: string) => {
            try {
                const cancelled = composerService.cancelExecution(requestId)
                return { success: true, cancelled }
            } catch (error) {
                log.error('Failed to cancel execution:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Rollback execution
    ipcMain.handle(
        'composer-rollback-execution',
        async (_event: IpcMainInvokeEvent, requestId: string) => {
            try {
                const execution = await composerService.rollbackExecution(requestId)
                return { success: true, execution }
            } catch (error) {
                log.error('Failed to rollback execution:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get active executions
    ipcMain.handle(
        'composer-get-active-executions',
        async () => {
            try {
                const executions = composerService.getActiveExecutions()
                return { success: true, executions }
            } catch (error) {
                log.error('Failed to get active executions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Composer IPC handlers registered')
}
