/**
 * Notebook Service IPC Handlers
 * IPC communication layer for notebook service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getNotebookService } from './notebookService'
import type { Notebook, NotebookCell, NotebookKernel, CellOutput } from './notebookService'

export function setupNotebookServiceIpcs() {
    const notebookService = getNotebookService()

    // Create notebook
    ipcMain.handle(
        'notebook-service-create',
        async (_event: IpcMainInvokeEvent, notebookPath: string) => {
            try {
                const notebookId = await notebookService.createNotebook(notebookPath)
                return { success: true, notebookId }
            } catch (error) {
                log.error('Failed to create notebook:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Start kernel
    ipcMain.handle(
        'notebook-service-start-kernel',
        async (_event: IpcMainInvokeEvent, kernelName?: string) => {
            try {
                const kernelId = await notebookService.startKernel(kernelName)
                return { success: true, kernelId }
            } catch (error) {
                log.error('Failed to start kernel:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Execute cell
    ipcMain.handle(
        'notebook-service-execute-cell',
        async (_event: IpcMainInvokeEvent, notebookId: string, cellId: string, kernelId: string) => {
            try {
                const outputs = await notebookService.executeCell(notebookId, cellId, kernelId)
                return { success: true, outputs }
            } catch (error) {
                log.error('Failed to execute cell:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Add cell
    ipcMain.handle(
        'notebook-service-add-cell',
        async (_event: IpcMainInvokeEvent, notebookId: string, cellType: 'code' | 'markdown', content?: string) => {
            try {
                const cellId = await notebookService.addCell(notebookId, cellType, content)
                return { success: true, cellId }
            } catch (error) {
                log.error('Failed to add cell:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Update cell
    ipcMain.handle(
        'notebook-service-update-cell',
        async (_event: IpcMainInvokeEvent, notebookId: string, cellId: string, content: string) => {
            try {
                await notebookService.updateCell(notebookId, cellId, content)
                return { success: true }
            } catch (error) {
                log.error('Failed to update cell:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Delete cell
    ipcMain.handle(
        'notebook-service-delete-cell',
        async (_event: IpcMainInvokeEvent, notebookId: string, cellId: string) => {
            try {
                await notebookService.deleteCell(notebookId, cellId)
                return { success: true }
            } catch (error) {
                log.error('Failed to delete cell:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Save notebook
    ipcMain.handle(
        'notebook-service-save',
        async (_event: IpcMainInvokeEvent, notebookId: string) => {
            try {
                await notebookService.saveNotebook(notebookId)
                return { success: true }
            } catch (error) {
                log.error('Failed to save notebook:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Close notebook
    ipcMain.handle(
        'notebook-service-close',
        async (_event: IpcMainInvokeEvent, notebookId: string) => {
            try {
                await notebookService.closeNotebook(notebookId)
                return { success: true }
            } catch (error) {
                log.error('Failed to close notebook:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop kernel
    ipcMain.handle(
        'notebook-service-stop-kernel',
        async (_event: IpcMainInvokeEvent, kernelId: string) => {
            try {
                await notebookService.stopKernel(kernelId)
                return { success: true }
            } catch (error) {
                log.error('Failed to stop kernel:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get notebook
    ipcMain.handle(
        'notebook-service-get',
        async (_event: IpcMainInvokeEvent, notebookId: string) => {
            try {
                const notebook = notebookService.getNotebook(notebookId)
                return { success: true, notebook }
            } catch (error) {
                log.error('Failed to get notebook:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all notebooks
    ipcMain.handle(
        'notebook-service-get-all',
        async () => {
            try {
                const notebooks = notebookService.getNotebooks()
                return { success: true, notebooks }
            } catch (error) {
                log.error('Failed to get notebooks:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get kernel
    ipcMain.handle(
        'notebook-service-get-kernel',
        async (_event: IpcMainInvokeEvent, kernelId: string) => {
            try {
                const kernel = notebookService.getKernel(kernelId)
                return { success: true, kernel }
            } catch (error) {
                log.error('Failed to get kernel:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all kernels
    ipcMain.handle(
        'notebook-service-get-kernels',
        async () => {
            try {
                const kernels = notebookService.getKernels()
                return { success: true, kernels }
            } catch (error) {
                log.error('Failed to get kernels:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Notebook service IPC handlers registered')
}
