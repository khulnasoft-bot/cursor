/**
 * Socket Service IPC Handlers
 * IPC communication layer for socket service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getSocketService } from './socketService'
import type { SocketOptions } from './socketService'

export function setupSocketServiceIpcs() {
    const socketService = getSocketService()

    // Connect to a socket
    ipcMain.handle(
        'socket-service-connect',
        async (_event: IpcMainInvokeEvent, options: SocketOptions) => {
            try {
                const connectionId = await socketService.connect(options)
                return { success: true, connectionId }
            } catch (error) {
                log.error('Failed to connect socket:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Send data through socket
    ipcMain.handle(
        'socket-service-send',
        async (_event: IpcMainInvokeEvent, connectionId: string, data: string | Buffer) => {
            try {
                await socketService.send(connectionId, data)
                return { success: true }
            } catch (error) {
                log.error('Failed to send data:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Receive data from socket
    ipcMain.handle(
        'socket-service-receive',
        async (_event: IpcMainInvokeEvent, connectionId: string, timeout?: number) => {
            try {
                const data = await socketService.receive(connectionId, timeout)
                return { success: true, data: data.toString('base64') }
            } catch (error) {
                log.error('Failed to receive data:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disconnect socket
    ipcMain.handle(
        'socket-service-disconnect',
        async (_event: IpcMainInvokeEvent, connectionId: string) => {
            try {
                await socketService.disconnect(connectionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to disconnect:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disconnect all sockets
    ipcMain.handle(
        'socket-service-disconnect-all',
        async () => {
            try {
                socketService.disconnectAll()
                return { success: true }
            } catch (error) {
                log.error('Failed to disconnect all:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if connection is active
    ipcMain.handle(
        'socket-service-is-connected',
        async (_event: IpcMainInvokeEvent, connectionId: string) => {
            try {
                const connected = socketService.isConnected(connectionId)
                return { success: true, connected }
            } catch (error) {
                log.error('Failed to check connection:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all active connections
    ipcMain.handle(
        'socket-service-get-connections',
        async () => {
            try {
                const connections = socketService.getConnections()
                return { success: true, connections }
            } catch (error) {
                log.error('Failed to get connections:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Socket service IPC handlers registered')
}
