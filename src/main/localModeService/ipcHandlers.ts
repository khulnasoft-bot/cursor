/**
 * Local Mode Service IPC Handlers
 * IPC communication layer for local mode service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getLocalModeService } from './localModeService'

export function setupLocalModeServiceIpcs() {
    const localModeService = getLocalModeService()

    // Enable local mode
    ipcMain.handle(
        'local-mode-service-enable',
        async () => {
            try {
                localModeService.enableLocalMode()
                return { success: true }
            } catch (error) {
                log.error('Failed to enable local mode:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disable local mode
    ipcMain.handle(
        'local-mode-service-disable',
        async () => {
            try {
                localModeService.disableLocalMode()
                return { success: true }
            } catch (error) {
                log.error('Failed to disable local mode:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if local mode enabled
    ipcMain.handle(
        'local-mode-service-is-enabled',
        async () => {
            try {
                const enabled = localModeService.isLocalModeEnabled()
                return { success: true, enabled }
            } catch (error) {
                log.error('Failed to check local mode status:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Enable offline mode
    ipcMain.handle(
        'local-mode-service-enable-offline',
        async () => {
            try {
                localModeService.enableOfflineMode()
                return { success: true }
            } catch (error) {
                log.error('Failed to enable offline mode:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disable offline mode
    ipcMain.handle(
        'local-mode-service-disable-offline',
        async () => {
            try {
                localModeService.disableOfflineMode()
                return { success: true }
            } catch (error) {
                log.error('Failed to disable offline mode:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if offline mode
    ipcMain.handle(
        'local-mode-service-is-offline',
        async () => {
            try {
                const offline = localModeService.isOfflineMode()
                return { success: true, offline }
            } catch (error) {
                log.error('Failed to check offline mode status:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Cache data
    ipcMain.handle(
        'local-mode-service-cache',
        async (_event: IpcMainInvokeEvent, key: string, data: any) => {
            try {
                localModeService.cacheData(key, data)
                return { success: true }
            } catch (error) {
                log.error('Failed to cache data:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get cached data
    ipcMain.handle(
        'local-mode-service-get-cached',
        async (_event: IpcMainInvokeEvent, key: string) => {
            try {
                const data = localModeService.getCachedData(key)
                return { success: true, data }
            } catch (error) {
                log.error('Failed to get cached data:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Remove cached data
    ipcMain.handle(
        'local-mode-service-remove-cached',
        async (_event: IpcMainInvokeEvent, key: string) => {
            try {
                localModeService.removeCachedData(key)
                return { success: true }
            } catch (error) {
                log.error('Failed to remove cached data:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear cache
    ipcMain.handle(
        'local-mode-service-clear-cache',
        async () => {
            try {
                localModeService.clearCache()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear cache:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get cache keys
    ipcMain.handle(
        'local-mode-service-get-cache-keys',
        async () => {
            try {
                const keys = localModeService.getCacheKeys()
                return { success: true, keys }
            } catch (error) {
                log.error('Failed to get cache keys:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if data cached
    ipcMain.handle(
        'local-mode-service-is-cached',
        async (_event: IpcMainInvokeEvent, key: string) => {
            try {
                const cached = localModeService.isDataCached(key)
                return { success: true, cached }
            } catch (error) {
                log.error('Failed to check if data cached:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Should use local resource
    ipcMain.handle(
        'local-mode-service-should-use-local',
        async (_event: IpcMainInvokeEvent, url: string) => {
            try {
                const shouldUse = localModeService.shouldUseLocalResource(url)
                return { success: true, shouldUse }
            } catch (error) {
                log.error('Failed to check if should use local resource:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get local resource path
    ipcMain.handle(
        'local-mode-service-get-local-path',
        async (_event: IpcMainInvokeEvent, url: string) => {
            try {
                const path = localModeService.getLocalResourcePath(url)
                return { success: true, path }
            } catch (error) {
                log.error('Failed to get local resource path:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Local mode service IPC handlers registered')
}
