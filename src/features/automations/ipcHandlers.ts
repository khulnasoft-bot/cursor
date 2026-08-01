/**
 * Automations IPC Handlers
 * IPC handlers for automation services
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getAutomationService } from './automationService'
import { getTriggerSystem } from './triggerSystem'
import { getActionRegistry } from './actionRegistry'
import { getAutomationScheduler } from './automationScheduler'
import { getAutomationLogger } from './automationLogger'
import { getAutomationTemplates } from './automationTemplates'

export function setupAutomationsIpcs(): void {
    const automationService = getAutomationService()
    const triggerSystem = getTriggerSystem()
    const actionRegistry = getActionRegistry()
    const automationScheduler = getAutomationScheduler()
    const automationLogger = getAutomationLogger()
    const automationTemplates = getAutomationTemplates()

    // Automation Service
    ipcMain.handle(
        'automation-activate',
        async () => {
            try {
                automationService.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate automation service:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-deactivate',
        async () => {
            try {
                automationService.deactivate()
                return { success: true }
            } catch (error) {
                log.error('Failed to deactivate automation service:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-create-workflow',
        async (_event: IpcMainInvokeEvent, workflow: any) => {
            try {
                const created = automationService.createWorkflow(workflow)
                return { success: true, workflow: created }
            } catch (error) {
                log.error('Failed to create workflow:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-update-workflow',
        async (_event: IpcMainInvokeEvent, workflowId: string, updates: any) => {
            try {
                const updated = automationService.updateWorkflow(workflowId, updates)
                return { success: true, workflow: updated }
            } catch (error) {
                log.error('Failed to update workflow:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-delete-workflow',
        async (_event: IpcMainInvokeEvent, workflowId: string) => {
            try {
                const deleted = automationService.deleteWorkflow(workflowId)
                return { success: true, deleted }
            } catch (error) {
                log.error('Failed to delete workflow:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-get-workflows',
        async () => {
            try {
                const workflows = automationService.getWorkflows()
                return { success: true, workflows }
            } catch (error) {
                log.error('Failed to get workflows:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-execute-workflow',
        async (_event: IpcMainInvokeEvent, workflowId: string, context?: any) => {
            try {
                const execution = await automationService.executeWorkflow(workflowId, context)
                return { success: true, execution }
            } catch (error) {
                log.error('Failed to execute workflow:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Trigger System
    ipcMain.handle(
        'automation-activate-triggers',
        async () => {
            try {
                triggerSystem.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate trigger system:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-deactivate-triggers',
        async () => {
            try {
                triggerSystem.deactivate()
                return { success: true }
            } catch (error) {
                log.error('Failed to deactivate trigger system:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-fire-trigger',
        async (_event: IpcMainInvokeEvent, eventType: string, data?: any) => {
            try {
                await triggerSystem.fireTrigger(eventType, data)
                return { success: true }
            } catch (error) {
                log.error('Failed to fire trigger:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Action Registry
    ipcMain.handle(
        'automation-register-action',
        async (_event: IpcMainInvokeEvent, action: any) => {
            try {
                actionRegistry.registerAction(action)
                return { success: true }
            } catch (error) {
                log.error('Failed to register action:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-get-actions',
        async () => {
            try {
                const actions = actionRegistry.getActions()
                return { success: true, actions }
            } catch (error) {
                log.error('Failed to get actions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Automation Scheduler
    ipcMain.handle(
        'automation-activate-scheduler',
        async () => {
            try {
                automationScheduler.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate scheduler:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-deactivate-scheduler',
        async () => {
            try {
                automationScheduler.deactivate()
                return { success: true }
            } catch (error) {
                log.error('Failed to deactivate scheduler:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-schedule-workflow',
        async (_event: IpcMainInvokeEvent, workflowId: string, schedule: string) => {
            try {
                const task = automationScheduler.scheduleWorkflow(workflowId, schedule)
                return { success: true, task }
            } catch (error) {
                log.error('Failed to schedule workflow:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-unschedule-task',
        async (_event: IpcMainInvokeEvent, taskId: string) => {
            try {
                const deleted = automationScheduler.unscheduleTask(taskId)
                return { success: true, deleted }
            } catch (error) {
                log.error('Failed to unschedule task:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Automation Logger
    ipcMain.handle(
        'automation-get-logs',
        async (_event: IpcMainInvokeEvent, workflowId?: string, level?: string) => {
            try {
                const logs = automationLogger.getLogs(workflowId, level as any)
                return { success: true, logs }
            } catch (error) {
                log.error('Failed to get logs:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-get-execution-stats',
        async (_event: IpcMainInvokeEvent, workflowId: string) => {
            try {
                const stats = automationLogger.getExecutionStatistics(workflowId)
                return { success: true, stats }
            } catch (error) {
                log.error('Failed to get execution stats:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Automation Templates
    ipcMain.handle(
        'automation-get-templates',
        async (_event: IpcMainInvokeEvent, category?: string) => {
            try {
                const templates = category 
                    ? automationTemplates.getTemplatesByCategory(category as any)
                    : automationTemplates.getTemplates()
                return { success: true, templates }
            } catch (error) {
                log.error('Failed to get templates:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'automation-create-from-template',
        async (_event: IpcMainInvokeEvent, templateId: string, overrides?: any) => {
            try {
                const workflow = automationTemplates.createWorkflowFromTemplate(templateId, overrides)
                return { success: true, workflow }
            } catch (error) {
                log.error('Failed to create workflow from template:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Automations IPC handlers registered')
}
