/**
 * MCP Service IPC Handlers
 * IPC communication layer for MCP service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getMCPService } from './mcpService'
import type { MCPMessage } from './mcpService'

export function setupMCPServiceIpcs() {
    const mcpService = getMCPService()

    // Start MCP server
    ipcMain.handle(
        'mcp-service-start-server',
        async (_event: IpcMainInvokeEvent, name: string, command: string, args: string[] = []) => {
            try {
                const serverId = await mcpService.startServer(name, command, args)
                return { success: true, serverId }
            } catch (error) {
                log.error('Failed to start MCP server:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Initialize MCP server
    ipcMain.handle(
        'mcp-service-initialize-server',
        async (_event: IpcMainInvokeEvent, serverId: string) => {
            try {
                await mcpService.initializeServer(serverId)
                return { success: true }
            } catch (error) {
                log.error('Failed to initialize MCP server:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Send message to MCP server
    ipcMain.handle(
        'mcp-service-send-message',
        async (_event: IpcMainInvokeEvent, serverId: string, message: MCPMessage) => {
            try {
                const response = await mcpService.sendMessage(serverId, message)
                return { success: true, response }
            } catch (error) {
                log.error('Failed to send MCP message:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Call tool on MCP server
    ipcMain.handle(
        'mcp-service-call-tool',
        async (_event: IpcMainInvokeEvent, serverId: string, toolName: string, params: any = {}) => {
            try {
                const result = await mcpService.callTool(serverId, toolName, params)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to call MCP tool:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // List tools on MCP server
    ipcMain.handle(
        'mcp-service-list-tools',
        async (_event: IpcMainInvokeEvent, serverId: string) => {
            try {
                const tools = await mcpService.listTools(serverId)
                return { success: true, tools }
            } catch (error) {
                log.error('Failed to list MCP tools:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop MCP server
    ipcMain.handle(
        'mcp-service-stop-server',
        async (_event: IpcMainInvokeEvent, serverId: string) => {
            try {
                await mcpService.stopServer(serverId)
                return { success: true }
            } catch (error) {
                log.error('Failed to stop MCP server:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop all MCP servers
    ipcMain.handle(
        'mcp-service-stop-all',
        async () => {
            try {
                mcpService.stopAllServers()
                return { success: true }
            } catch (error) {
                log.error('Failed to stop all MCP servers:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all MCP servers
    ipcMain.handle(
        'mcp-service-get-servers',
        async () => {
            try {
                const servers = mcpService.getServers()
                return { success: true, servers }
            } catch (error) {
                log.error('Failed to get MCP servers:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if server is connected
    ipcMain.handle(
        'mcp-service-is-connected',
        async (_event: IpcMainInvokeEvent, serverId: string) => {
            try {
                const connected = mcpService.isServerConnected(serverId)
                return { success: true, connected }
            } catch (error) {
                log.error('Failed to check MCP connection:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('MCP service IPC handlers registered')
}
