/**
 * Cursor Socket Service
 * TCP/TLS socket provider for Cursor extensions
 */

import * as net from 'net'
import * as tls from 'tls'
import log from 'electron-log'

export interface SocketOptions {
    host: string
    port: number
    secure?: boolean
    timeout?: number
}

export interface SocketConnection {
    id: string
    socket: net.Socket | tls.TLSSocket
    connected: boolean
    createdAt: Date
}

class SocketService {
    private connections: Map<string, SocketConnection> = new Map()
    private connectionIdCounter = 0

    async connect(options: SocketOptions): Promise<string> {
        const connectionId = `conn-${++this.connectionIdCounter}`
        
        return new Promise((resolve, reject) => {
            let socket: net.Socket | tls.TLSSocket

            if (options.secure) {
                socket = tls.connect({
                    host: options.host,
                    port: options.port,
                    rejectUnauthorized: false // Allow self-signed certs
                })
            } else {
                socket = net.connect({
                    host: options.host,
                    port: options.port
                })
            }

            const connection: SocketConnection = {
                id: connectionId,
                socket,
                connected: false,
                createdAt: new Date()
            }

            socket.on('connect', () => {
                connection.connected = true
                this.connections.set(connectionId, connection)
                log.info(`Socket connected: ${connectionId} to ${options.host}:${options.port}`)
                resolve(connectionId)
            })

            socket.on('error', (error) => {
                log.error(`Socket error for ${connectionId}:`, error)
                this.connections.delete(connectionId)
                reject(error)
            })

            socket.on('close', () => {
                log.info(`Socket closed: ${connectionId}`)
                this.connections.delete(connectionId)
            })

            if (options.timeout) {
                socket.setTimeout(options.timeout, () => {
                    socket.destroy()
                    reject(new Error('Connection timeout'))
                })
            }
        })
    }

    async send(connectionId: string, data: string | Buffer): Promise<void> {
        const connection = this.connections.get(connectionId)
        if (!connection || !connection.connected) {
            throw new Error(`Connection not found or not connected: ${connectionId}`)
        }

        return new Promise((resolve, reject) => {
            const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data)
            
            connection.socket.write(buffer, (error) => {
                if (error) {
                    reject(error)
                } else {
                    resolve()
                }
            })
        })
    }

    async receive(connectionId: string, timeout = 30000): Promise<Buffer> {
        const connection = this.connections.get(connectionId)
        if (!connection || !connection.connected) {
            throw new Error(`Connection not found or not connected: ${connectionId}`)
        }

        return new Promise((resolve, reject) => {
            let receivedData = Buffer.alloc(0)
            let timeoutId: NodeJS.Timeout

            const onData = (data: Buffer) => {
                receivedData = Buffer.concat([receivedData, data])
            }

            const onEnd = () => {
                cleanup()
                resolve(receivedData)
            }

            const onError = (error: Error) => {
                cleanup()
                reject(error)
            }

            const cleanup = () => {
                connection.socket.off('data', onData)
                connection.socket.off('end', onEnd)
                connection.socket.off('error', onError)
                if (timeoutId) {
                    clearTimeout(timeoutId)
                }
            }

            connection.socket.on('data', onData)
            connection.socket.on('end', onEnd)
            connection.socket.on('error', onError)

            timeoutId = setTimeout(() => {
                cleanup()
                reject(new Error('Receive timeout'))
            }, timeout)
        })
    }

    async disconnect(connectionId: string): Promise<void> {
        const connection = this.connections.get(connectionId)
        if (connection) {
            connection.socket.destroy()
            this.connections.delete(connectionId)
            log.info(`Disconnected socket: ${connectionId}`)
        }
    }

    disconnectAll(): void {
        for (const [connectionId, connection] of this.connections) {
            connection.socket.destroy()
        }
        this.connections.clear()
        log.info('Disconnected all sockets')
    }

    getConnection(connectionId: string): SocketConnection | undefined {
        return this.connections.get(connectionId)
    }

    getConnections(): SocketConnection[] {
        return Array.from(this.connections.values())
    }

    isConnected(connectionId: string): boolean {
        const connection = this.connections.get(connectionId)
        return connection ? connection.connected : false
    }
}

// Singleton instance
let socketService: SocketService | null = null

export function getSocketService(): SocketService {
    if (!socketService) {
        socketService = new SocketService()
    }
    return socketService
}

export function destroySocketService() {
    if (socketService) {
        socketService.disconnectAll()
        socketService = null
    }
}
