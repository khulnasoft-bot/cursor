/**
 * Shadow Workspace Service IPC Handlers
 * IPC communication layer for shadow workspace service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getShadowWorkspaceService } from './shadowWorkspaceService'
import type { ShadowWorkspace } from './shadowWorkspaceService'

export function setupShadowWorkspaceServiceIpcs() {
    const shadowWorkspaceService = getShadowWorkspaceService()

    // Create shadow workspace
    ipcMain.handle(
        'shadow-workspace-create',
        async (_event: IpcMainInvokeEvent, originalPath: string) => {
            try {
                const workspaceId = await shadowWorkspaceService.createShadowWorkspace(originalPath)
                return { success: true, workspaceId }
            } catch (error) {
                log.error('Failed to create shadow workspace:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Sync to shadow
    ipcMain.handle(
        'shadow-workspace-sync-to',
        async (_event: IpcMainInvokeEvent, workspaceId: string) => {
            try {
                await shadowWorkspaceService.syncToShadow(workspaceId)
                return { success: true }
            } catch (error) {
                log.error('Failed to sync to shadow workspace:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Sync from shadow
    ipcMain.handle(
        'shadow-workspace-sync-from',
        async (_event: IpcMainInvokeEvent, workspaceId: string) => {
            try {
                await shadowWorkspaceService.syncFromShadow(workspaceId)
                return { success: true }
            } catch (error) {
                log.error('Failed to sync from shadow workspace:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Delete shadow workspace
    ipcMain.handle(
        'shadow-workspace-delete',
        async (_event: IpcMainInvokeEvent, workspaceId: string) => {
            try {
                await shadowWorkspaceService.deleteShadowWorkspace(workspaceId)
                return { success: true }
            } catch (error) {
                log.error('Failed to delete shadow workspace:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get workspace
    ipcMain.handle(
        'shadow-workspace-get',
        async (_event: IpcMainInvokeEvent, workspaceId: string) => {
            try {
                const workspace = shadowWorkspaceService.getWorkspace(workspaceId)
                return { success: true, workspace }
            } catch (error) {
                log.error('Failed to get shadow workspace:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all workspaces
    ipcMain.handle(
        'shadow-workspace-get-all',
        async () => {
            try {
                const workspaces = shadowWorkspaceService.getWorkspaces()
                return { success: true, workspaces }
            } catch (error) {
                log.error('Failed to get shadow workspaces:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Activate workspace
    ipcMain.handle(
        'shadow-workspace-activate',
        async (_event: IpcMainInvokeEvent, workspaceId: string) => {
            try {
                await shadowWorkspaceService.activateWorkspace(workspaceId)
                return { success: true }
            } catch (error) {
                log.error('Failed to activate shadow workspace:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Deactivate workspace
    ipcMain.handle(
        'shadow-workspace-deactivate',
        async (_event: IpcMainInvokeEvent, workspaceId: string) => {
            try {
                await shadowWorkspaceService.deactivateWorkspace(workspaceId)
                return { success: true }
            } catch (error) {
                log.error('Failed to deactivate shadow workspace:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Shadow workspace service IPC handlers registered')
}
