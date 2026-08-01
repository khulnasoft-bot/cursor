/**
 * Extension Service IPC Handlers
 * IPC communication layer for extension service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getExtensionService } from './extensionService'
import type { Extension, ExtensionManifest } from './extensionService'

export function setupExtensionServiceIpcs() {
    const extensionService = getExtensionService()

    // Install extension
    ipcMain.handle(
        'extension-service-install',
        async (_event: IpcMainInvokeEvent, extensionPath: string) => {
            try {
                const extensionId = await extensionService.installExtension(extensionPath)
                return { success: true, extensionId }
            } catch (error) {
                log.error('Failed to install extension:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Uninstall extension
    ipcMain.handle(
        'extension-service-uninstall',
        async (_event: IpcMainInvokeEvent, extensionId: string) => {
            try {
                await extensionService.uninstallExtension(extensionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to uninstall extension:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Enable extension
    ipcMain.handle(
        'extension-service-enable',
        async (_event: IpcMainInvokeEvent, extensionId: string) => {
            try {
                await extensionService.enableExtension(extensionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to enable extension:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disable extension
    ipcMain.handle(
        'extension-service-disable',
        async (_event: IpcMainInvokeEvent, extensionId: string) => {
            try {
                await extensionService.disableExtension(extensionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to disable extension:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get extension
    ipcMain.handle(
        'extension-service-get',
        async (_event: IpcMainInvokeEvent, extensionId: string) => {
            try {
                const extension = extensionService.getExtension(extensionId)
                return { success: true, extension }
            } catch (error) {
                log.error('Failed to get extension:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all extensions
    ipcMain.handle(
        'extension-service-get-all',
        async () => {
            try {
                const extensions = extensionService.getExtensions()
                return { success: true, extensions }
            } catch (error) {
                log.error('Failed to get extensions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get enabled extensions
    ipcMain.handle(
        'extension-service-get-enabled',
        async () => {
            try {
                const extensions = extensionService.getEnabledExtensions()
                return { success: true, extensions }
            } catch (error) {
                log.error('Failed to get enabled extensions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Load extension
    ipcMain.handle(
        'extension-service-load',
        async (_event: IpcMainInvokeEvent, extensionId: string) => {
            try {
                await extensionService.loadExtension(extensionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to load extension:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Unload extension
    ipcMain.handle(
        'extension-service-unload',
        async (_event: IpcMainInvokeEvent, extensionId: string) => {
            try {
                await extensionService.unloadExtension(extensionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to unload extension:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Register extension manifest
    ipcMain.handle(
        'extension-service-register-manifest',
        async (_event: IpcMainInvokeEvent, manifest: ExtensionManifest) => {
            try {
                extensionService.registerExtensionManifest(manifest)
                return { success: true }
            } catch (error) {
                log.error('Failed to register extension manifest:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get extension manifest
    ipcMain.handle(
        'extension-service-get-manifest',
        async (_event: IpcMainInvokeEvent, extensionId: string) => {
            try {
                const manifest = extensionService.getExtensionManifest(extensionId)
                return { success: true, manifest }
            } catch (error) {
                log.error('Failed to get extension manifest:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get registry extensions
    ipcMain.handle(
        'extension-service-get-registry',
        async () => {
            try {
                const extensions = extensionService.getRegistryExtensions()
                return { success: true, extensions }
            } catch (error) {
                log.error('Failed to get registry extensions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Validate extension
    ipcMain.handle(
        'extension-service-validate',
        async (_event: IpcMainInvokeEvent, extensionPath: string) => {
            try {
                const isValid = await extensionService.validateExtension(extensionPath)
                return { success: true, isValid }
            } catch (error) {
                log.error('Failed to validate extension:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get extensions path
    ipcMain.handle(
        'extension-service-get-path',
        async () => {
            try {
                const extensionsPath = extensionService.getExtensionsPath()
                return { success: true, extensionsPath }
            } catch (error) {
                log.error('Failed to get extensions path:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Extension service IPC handlers registered')
}
