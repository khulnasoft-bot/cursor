/**
 * File Service IPC Handlers
 * IPC communication layer for file service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getFileService } from './fileService'
import type { IndexingOptions, SearchOptions } from './fileService'

export function setupFileServiceIpcs() {
    const fileService = getFileService()

    // Index a directory
    ipcMain.handle(
        'file-service-index-directory',
        async (_event: IpcMainInvokeEvent, directoryPath: string, options: IndexingOptions = {}) => {
            try {
                await fileService.indexDirectory(directoryPath, options)
                return { success: true }
            } catch (error) {
                log.error('Failed to index directory:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Search in indexed files
    ipcMain.handle(
        'file-service-search',
        async (_event: IpcMainInvokeEvent, options: SearchOptions) => {
            try {
                const results = await fileService.search(options)
                return { success: true, results }
            } catch (error) {
                log.error('Failed to search:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get file content from index
    ipcMain.handle(
        'file-service-get-content',
        async (_event: IpcMainInvokeEvent, filePath: string) => {
            try {
                const content = fileService.getFileContent(filePath)
                return { success: true, content }
            } catch (error) {
                log.error('Failed to get file content:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Update a file in the index
    ipcMain.handle(
        'file-service-update-file',
        async (_event: IpcMainInvokeEvent, filePath: string) => {
            try {
                await fileService.updateFile(filePath)
                return { success: true }
            } catch (error) {
                log.error('Failed to update file:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Remove a file from the index
    ipcMain.handle(
        'file-service-remove-file',
        async (_event: IpcMainInvokeEvent, filePath: string) => {
            try {
                await fileService.removeFile(filePath)
                return { success: true }
            } catch (error) {
                log.error('Failed to remove file:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear the entire index
    ipcMain.handle(
        'file-service-clear-index',
        async () => {
            try {
                fileService.clearIndex()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear index:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get index statistics
    ipcMain.handle(
        'file-service-get-stats',
        async () => {
            try {
                const stats = fileService.getIndexStats()
                return { success: true, stats }
            } catch (error) {
                log.error('Failed to get stats:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('File service IPC handlers registered')
}
