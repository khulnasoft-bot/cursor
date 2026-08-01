/**
 * Explorer Service IPC Handlers
 * IPC communication layer for explorer service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getExplorerService } from './explorerService'
import type { ExplorerOptions } from './explorerService'

export function setupExplorerServiceIpcs() {
    const explorerService = getExplorerService()

    // Set workspace root
    ipcMain.handle(
        'explorer-service-set-workspace',
        async (_event: IpcMainInvokeEvent, rootPath: string) => {
            try {
                explorerService.setWorkspaceRoot(rootPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to set workspace:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get directory tree
    ipcMain.handle(
        'explorer-service-get-tree',
        async (_event: IpcMainInvokeEvent, dirPath: string, options: ExplorerOptions = {}) => {
            try {
                const tree = await explorerService.getDirectoryTree(dirPath, options)
                return { success: true, tree }
            } catch (error) {
                log.error('Failed to get directory tree:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Search nodes
    ipcMain.handle(
        'explorer-service-search',
        async (_event: IpcMainInvokeEvent, query: string, rootNode: any) => {
            try {
                const results = await explorerService.searchNodes(query, rootNode)
                return { success: true, results }
            } catch (error) {
                log.error('Failed to search nodes:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get node by path
    ipcMain.handle(
        'explorer-service-get-node',
        async (_event: IpcMainInvokeEvent, targetPath: string, rootNode: any) => {
            try {
                const node = await explorerService.getNodeByPath(targetPath, rootNode)
                return { success: true, node }
            } catch (error) {
                log.error('Failed to get node:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get workspace root
    ipcMain.handle(
        'explorer-service-get-workspace',
        async () => {
            try {
                const root = explorerService.getWorkspaceRoot()
                return { success: true, root }
            } catch (error) {
                log.error('Failed to get workspace root:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear cache
    ipcMain.handle(
        'explorer-service-clear-cache',
        async () => {
            try {
                explorerService.clearCache()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear cache:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Explorer service IPC handlers registered')
}
