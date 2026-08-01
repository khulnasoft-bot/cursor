/**
 * Cursor MCP Service
 * Handles MCP (Model Context Protocol) for Cursor
 */

import { spawn, ChildProcess } from 'child_process'
import log from 'electron-log'

export interface MCPServer {
    id: string
    name: string
    command: string
    args: string[]
    process: ChildProcess | null
    connected: boolean
}

export interface MCPMessage {
    jsonrpc: '2.0'
    id?: string | number
    method?: string
    params?: any
    result?: any
    error?: any
}

class MCPService {
    private servers: Map<string, MCPServer> = new Map()
    private serverIdCounter = 0

    async startServer(name: string, command: string, args: string[] = []): Promise<string> {
        const serverId = `mcp-${++this.serverIdCounter}`
        
        try {
            const process = spawn(command, args, {
                stdio: ['pipe', 'pipe', 'pipe']
            })

            const server: MCPServer = {
                id: serverId,
                name,
                command,
                args,
                process,
                connected: false
            }

            this.setupProcessHandlers(server)
            this.servers.set(serverId, server)

            log.info(`Started MCP server: ${name} (${serverId})`)
            return serverId
        } catch (error) {
            log.error(`Failed to start MCP server ${name}:`, error)
            throw error
        }
    }

    private setupProcessHandlers(server: MCPServer) {
        if (!server.process) return

        server.process.stdout?.on('data', (data) => {
            try {
                const messages = data.toString().split('\n').filter(Boolean)
                for (const msg of messages) {
                    const parsed = JSON.parse(msg) as MCPMessage
                    this.handleServerMessage(server, parsed)
                }
            } catch (error) {
                log.warn(`Failed to parse MCP message from ${server.name}:`, error)
            }
        })

        server.process.stderr?.on('data', (data) => {
            log.error(`MCP server ${server.name} stderr:`, data.toString())
        })

        server.process.on('close', (code) => {
            log.info(`MCP server ${server.name} closed with code ${code}`)
            server.connected = false
            server.process = null
        })

        server.process.on('error', (error) => {
            log.error(`MCP server ${server.name} error:`, error)
            server.connected = false
        })
    }

    private handleServerMessage(server: MCPServer, message: MCPMessage) {
        log.info(`MCP message from ${server.name}:`, message)
        
        // Handle initialization response
        if (message.result && message.result.serverInfo) {
            server.connected = true
            log.info(`MCP server ${server.name} connected`)
        }
    }

    async sendMessage(serverId: string, message: MCPMessage): Promise<MCPMessage> {
        const server = this.servers.get(serverId)
        if (!server || !server.process) {
            throw new Error(`Server not found or not running: ${serverId}`)
        }

        return new Promise((resolve, reject) => {
            const messageStr = JSON.stringify(message) + '\n'
            
            const timeout = setTimeout(() => {
                reject(new Error('MCP request timeout'))
            }, 30000)

            // Set up one-time response handler
            const responseHandler = (data: Buffer) => {
                try {
                    const response = JSON.parse(data.toString()) as MCPMessage
                    if (response.id === message.id) {
                        clearTimeout(timeout)
                        server.process?.stdout?.off('data', responseHandler)
                        resolve(response)
                    }
                } catch (error) {
                    // Ignore parse errors for non-JSON data
                }
            }

            server.process.stdout?.once('data', responseHandler)
            server.process.stdin?.write(messageStr)

            server.process.on('error', (error) => {
                clearTimeout(timeout)
                reject(error)
            })
        })
    }

    async initializeServer(serverId: string): Promise<void> {
        const initMessage: MCPMessage = {
            jsonrpc: '2.0',
            id: 1,
            method: 'initialize',
            params: {
                protocolVersion: '2024-11-05',
                capabilities: {},
                clientInfo: {
                    name: 'Cursor',
                    version: '3.9.16'
                }
            }
        }

        const response = await this.sendMessage(serverId, initMessage)
        
        if (response.error) {
            throw new Error(`MCP initialization failed: ${response.error.message}`)
        }

        // Send initialized notification
        const initializedMessage: MCPMessage = {
            jsonrpc: '2.0',
            method: 'notifications/initialized'
        }
        
        await this.sendMessage(serverId, initializedMessage)
    }

    async callTool(serverId: string, toolName: string, params: any = {}): Promise<any> {
        const message: MCPMessage = {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/call',
            params: {
                name: toolName,
                arguments: params
            }
        }

        const response = await this.sendMessage(serverId, message)
        
        if (response.error) {
            throw new Error(`Tool call failed: ${response.error.message}`)
        }

        return response.result
    }

    async listTools(serverId: string): Promise<any[]> {
        const message: MCPMessage = {
            jsonrpc: '2.0',
            id: Date.now(),
            method: 'tools/list'
        }

        const response = await this.sendMessage(serverId, message)
        
        if (response.error) {
            throw new Error(`Failed to list tools: ${response.error.message}`)
        }

        return response.result?.tools || []
    }

    async stopServer(serverId: string): Promise<void> {
        const server = this.servers.get(serverId)
        if (server && server.process) {
            server.process.kill()
            this.servers.delete(serverId)
            log.info(`Stopped MCP server: ${server.name} (${serverId})`)
        }
    }

    stopAllServers(): void {
        for (const [serverId, server] of this.servers) {
            if (server.process) {
                server.process.kill()
            }
        }
        this.servers.clear()
        log.info('Stopped all MCP servers')
    }

    getServers(): MCPServer[] {
        return Array.from(this.servers.values())
    }

    getServer(serverId: string): MCPServer | undefined {
        return this.servers.get(serverId)
    }

    isServerConnected(serverId: string): boolean {
        const server = this.servers.get(serverId)
        return server ? server.connected : false
    }
}

// Singleton instance
let mcpService: MCPService | null = null

export function getMCPService(): MCPService {
    if (!mcpService) {
        mcpService = new MCPService()
    }
    return mcpService
}

export function destroyMCPService() {
    if (mcpService) {
        mcpService.stopAllServers()
        mcpService = null
    }
}
