/**
 * Visual Editor IPC Handlers
 * IPC handlers for visual editor service
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getVisualEditorService } from './visualEditorService'

export function setupVisualEditorIpcs(): void {
    const visualEditorService = getVisualEditorService()

    // Activate visual editor
    ipcMain.handle(
        'visual-editor-activate',
        async () => {
            try {
                visualEditorService.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate visual editor:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Deactivate visual editor
    ipcMain.handle(
        'visual-editor-deactivate',
        async () => {
            try {
                visualEditorService.deactivate()
                return { success: true }
            } catch (error) {
                log.error('Failed to deactivate visual editor:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if active
    ipcMain.handle(
        'visual-editor-is-active',
        async () => {
            try {
                const active = visualEditorService.isActive()
                return { success: true, active }
            } catch (error) {
                log.error('Failed to check visual editor status:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Select element
    ipcMain.handle(
        'visual-editor-select-element',
        async (_event: IpcMainInvokeEvent, element: any) => {
            try {
                visualEditorService.selectElement(element)
                return { success: true }
            } catch (error) {
                log.error('Failed to select element:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Deselect element
    ipcMain.handle(
        'visual-editor-deselect-element',
        async () => {
            try {
                visualEditorService.deselectElement()
                return { success: true }
            } catch (error) {
                log.error('Failed to deselect element:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get selected element
    ipcMain.handle(
        'visual-editor-get-selected',
        async () => {
            try {
                const element = visualEditorService.getSelectedElement()
                return { success: true, element }
            } catch (error) {
                log.error('Failed to get selected element:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Hover element
    ipcMain.handle(
        'visual-editor-hover-element',
        async (_event: IpcMainInvokeEvent, element: any) => {
            try {
                visualEditorService.hoverElement(element)
                return { success: true }
            } catch (error) {
                log.error('Failed to hover element:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear hover
    ipcMain.handle(
        'visual-editor-clear-hover',
        async () => {
            try {
                visualEditorService.clearHover()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear hover:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Update element property
    ipcMain.handle(
        'visual-editor-update-property',
        async (_event: IpcMainInvokeEvent, elementId: string, property: string, value: any) => {
            try {
                const change = visualEditorService.updateElementProperty(elementId, property, value)
                return { success: true, change }
            } catch (error) {
                log.error('Failed to update element property:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Update element style
    ipcMain.handle(
        'visual-editor-update-style',
        async (_event: IpcMainInvokeEvent, elementId: string, styleProperty: string, value: string) => {
            try {
                const change = visualEditorService.updateElementStyle(elementId, styleProperty, value)
                return { success: true, change }
            } catch (error) {
                log.error('Failed to update element style:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Undo
    ipcMain.handle(
        'visual-editor-undo',
        async () => {
            try {
                const change = visualEditorService.undo()
                return { success: true, change }
            } catch (error) {
                log.error('Failed to undo:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Redo
    ipcMain.handle(
        'visual-editor-redo',
        async () => {
            try {
                const change = visualEditorService.redo()
                return { success: true, change }
            } catch (error) {
                log.error('Failed to redo:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check can undo
    ipcMain.handle(
        'visual-editor-can-undo',
        async () => {
            try {
                const canUndo = visualEditorService.canUndo()
                return { success: true, canUndo }
            } catch (error) {
                log.error('Failed to check can undo:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check can redo
    ipcMain.handle(
        'visual-editor-can-redo',
        async () => {
            try {
                const canRedo = visualEditorService.canRedo()
                return { success: true, canRedo }
            } catch (error) {
                log.error('Failed to check can redo:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Set preview mode
    ipcMain.handle(
        'visual-editor-set-preview',
        async (_event: IpcMainInvokeEvent, enabled: boolean) => {
            try {
                visualEditorService.setPreviewMode(enabled)
                return { success: true }
            } catch (error) {
                log.error('Failed to set preview mode:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get changes
    ipcMain.handle(
        'visual-editor-get-changes',
        async () => {
            try {
                const changes = visualEditorService.getChanges()
                return { success: true, changes }
            } catch (error) {
                log.error('Failed to get changes:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear changes
    ipcMain.handle(
        'visual-editor-clear-changes',
        async () => {
            try {
                visualEditorService.clearChanges()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear changes:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get change history
    ipcMain.handle(
        'visual-editor-get-history',
        async () => {
            try {
                const history = visualEditorService.getChangeHistory()
                return { success: true, history }
            } catch (error) {
                log.error('Failed to get change history:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Parse code to elements
    ipcMain.handle(
        'visual-editor-parse-code',
        async (_event: IpcMainInvokeEvent, code: string, filePath: string) => {
            try {
                const elements = visualEditorService.parseCodeToElements(code, filePath)
                return { success: true, elements }
            } catch (error) {
                log.error('Failed to parse code:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Generate code from elements
    ipcMain.handle(
        'visual-editor-generate-code',
        async (_event: IpcMainInvokeEvent, elements: any[]) => {
            try {
                const code = visualEditorService.generateCodeFromElements(elements)
                return { success: true, code }
            } catch (error) {
                log.error('Failed to generate code:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Map visual to code
    ipcMain.handle(
        'visual-editor-map-to-code',
        async (_event: IpcMainInvokeEvent, change: any) => {
            try {
                const mapping = visualEditorService.mapVisualToCode(change)
                return { success: true, mapping }
            } catch (error) {
                log.error('Failed to map visual to code:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get state
    ipcMain.handle(
        'visual-editor-get-state',
        async () => {
            try {
                const state = visualEditorService.getState()
                return { success: true, state }
            } catch (error) {
                log.error('Failed to get state:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Reset
    ipcMain.handle(
        'visual-editor-reset',
        async () => {
            try {
                visualEditorService.reset()
                return { success: true }
            } catch (error) {
                log.error('Failed to reset visual editor:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Visual editor IPC handlers registered')
}
