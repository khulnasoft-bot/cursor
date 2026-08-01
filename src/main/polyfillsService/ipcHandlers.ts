/**
 * Polyfills Service IPC Handlers
 * IPC communication layer for polyfills service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getPolyfillsService } from './polyfillsService'
import type { Polyfill } from './polyfillsService'

export function setupPolyfillsServiceIpcs() {
    const polyfillsService = getPolyfillsService()

    // Enable remote polyfills
    ipcMain.handle(
        'polyfills-service-enable-remote',
        async () => {
            try {
                polyfillsService.enableRemotePolyfills()
                return { success: true }
            } catch (error) {
                log.error('Failed to enable remote polyfills:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disable remote polyfills
    ipcMain.handle(
        'polyfills-service-disable-remote',
        async () => {
            try {
                polyfillsService.disableRemotePolyfills()
                return { success: true }
            } catch (error) {
                log.error('Failed to disable remote polyfills:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if remote enabled
    ipcMain.handle(
        'polyfills-service-is-remote-enabled',
        async () => {
            try {
                const enabled = polyfillsService.isRemoteEnabled()
                return { success: true, enabled }
            } catch (error) {
                log.error('Failed to check remote polyfills status:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Register polyfill
    ipcMain.handle(
        'polyfills-service-register',
        async (_event: IpcMainInvokeEvent, polyfill: Polyfill) => {
            try {
                polyfillsService.registerPolyfill(polyfill)
                return { success: true }
            } catch (error) {
                log.error('Failed to register polyfill:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Unregister polyfill
    ipcMain.handle(
        'polyfills-service-unregister',
        async (_event: IpcMainInvokeEvent, name: string) => {
            try {
                polyfillsService.unregisterPolyfill(name)
                return { success: true }
            } catch (error) {
                log.error('Failed to unregister polyfill:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get polyfill
    ipcMain.handle(
        'polyfills-service-get',
        async (_event: IpcMainInvokeEvent, name: string) => {
            try {
                const polyfill = polyfillsService.getPolyfill(name)
                return { success: true, polyfill }
            } catch (error) {
                log.error('Failed to get polyfill:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all polyfills
    ipcMain.handle(
        'polyfills-service-get-all',
        async () => {
            try {
                const polyfills = polyfillsService.getPolyfills()
                return { success: true, polyfills }
            } catch (error) {
                log.error('Failed to get polyfills:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get enabled polyfills
    ipcMain.handle(
        'polyfills-service-get-enabled',
        async () => {
            try {
                const polyfills = polyfillsService.getEnabledPolyfills()
                return { success: true, polyfills }
            } catch (error) {
                log.error('Failed to get enabled polyfills:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Enable polyfill
    ipcMain.handle(
        'polyfills-service-enable',
        async (_event: IpcMainInvokeEvent, name: string) => {
            try {
                polyfillsService.enablePolyfill(name)
                return { success: true }
            } catch (error) {
                log.error('Failed to enable polyfill:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disable polyfill
    ipcMain.handle(
        'polyfills-service-disable',
        async (_event: IpcMainInvokeEvent, name: string) => {
            try {
                polyfillsService.disablePolyfill(name)
                return { success: true }
            } catch (error) {
                log.error('Failed to disable polyfill:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get polyfill code
    ipcMain.handle(
        'polyfills-service-get-code',
        async (_event: IpcMainInvokeEvent, name: string) => {
            try {
                const code = polyfillsService.getPolyfillCode(name)
                return { success: true, code }
            } catch (error) {
                log.error('Failed to get polyfill code:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all polyfill code
    ipcMain.handle(
        'polyfills-service-get-all-code',
        async () => {
            try {
                const code = polyfillsService.getAllPolyfillCode()
                return { success: true, code }
            } catch (error) {
                log.error('Failed to get all polyfill code:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Polyfills service IPC handlers registered')
}
