/**
 * Resolver Service IPC Handlers
 * IPC communication layer for resolver service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getResolverService } from './resolverService'
import type { ResolverConfig } from './resolverService'

export function setupResolverServiceIpcs() {
    const resolverService = getResolverService()

    // Set resolver config
    ipcMain.handle(
        'resolver-service-set-config',
        async (_event: IpcMainInvokeEvent, config: ResolverConfig) => {
            try {
                resolverService.setConfig(config)
                return { success: true }
            } catch (error) {
                log.error('Failed to set resolver config:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Resolve authority
    ipcMain.handle(
        'resolver-service-resolve',
        async (_event: IpcMainInvokeEvent, authority: string) => {
            try {
                const result = await resolverService.resolveAuthority(authority)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to resolve authority:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get connection token
    ipcMain.handle(
        'resolver-service-get-token',
        async () => {
            try {
                const token = resolverService.getConnectionToken()
                return { success: true, token }
            } catch (error) {
                log.error('Failed to get connection token:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get connection data
    ipcMain.handle(
        'resolver-service-get-data',
        async () => {
            try {
                const data = resolverService.getConnectionData()
                return { success: true, data }
            } catch (error) {
                log.error('Failed to get connection data:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if connected
    ipcMain.handle(
        'resolver-service-is-connected',
        async () => {
            try {
                const connected = resolverService.isConnected()
                return { success: true, connected }
            } catch (error) {
                log.error('Failed to check connection status:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disconnect
    ipcMain.handle(
        'resolver-service-disconnect',
        async () => {
            try {
                resolverService.disconnect()
                return { success: true }
            } catch (error) {
                log.error('Failed to disconnect resolver:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Resolver service IPC handlers registered')
}
