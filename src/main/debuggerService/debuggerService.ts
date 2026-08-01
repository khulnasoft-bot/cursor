/**
 * Cursor Debugger Service
 * Handles VSCode Debug Protocol integration for Cursor
 */

import { spawn, ChildProcess } from 'child_process'
import log from 'electron-log'

export interface DebugSession {
    id: string
    name: string
    type: string
    request: string
    program: string
    process: ChildProcess | null
    connected: boolean
    breakpoints: Map<string, DebugBreakpoint[]>
}

export interface DebugBreakpoint {
    id: string
    line: number
    column: number
    path: string
    verified: boolean
}

export interface DebugVariable {
    name: string
    value: string
    type: string
    variablesReference: number
}

export interface DebugStackFrame {
    id: number
    name: string
    line: number
    column: number
    path: string
}

export interface DebugThread {
    id: number
    name: string
}

class DebuggerService {
    private sessions: Map<string, DebugSession> = new Map()
    private sessionIdCounter = 0
    private breakpointIdCounter = 0

    async startSession(
        name: string,
        type: string,
        request: string,
        program: string,
        args: string[] = []
    ): Promise<string> {
        const sessionId = `debug-${++this.sessionIdCounter}`
        
        try {
            // For now, we'll start with a basic node debugger
            // This can be extended to support other languages
            const debugArgs = this.getDebugArgs(type, request, program, args)
            const process = spawn('node', debugArgs, {
                stdio: ['pipe', 'pipe', 'pipe']
            })

            const session: DebugSession = {
                id: sessionId,
                name,
                type,
                request,
                program,
                process,
                connected: false,
                breakpoints: new Map()
            }

            this.setupProcessHandlers(session)
            this.sessions.set(sessionId, session)

            log.info(`Started debug session: ${name} (${sessionId})`)
            return sessionId
        } catch (error) {
            log.error(`Failed to start debug session ${name}:`, error)
            throw error
        }
    }

    private getDebugArgs(type: string, request: string, program: string, args: string[]): string[] {
        // Basic Node.js debugging configuration
        // This will be expanded for other languages
        if (type === 'node' || type === 'node2') {
            return ['--inspect-brk', program, ...args]
        }
        return [program, ...args]
    }

    private setupProcessHandlers(session: DebugSession) {
        if (!session.process) return

        session.process.stdout?.on('data', (data) => {
            try {
                // Parse VSCode Debug Protocol messages
                const messages = data.toString().split('\n').filter(Boolean)
                for (const msg of messages) {
                    if (msg.startsWith('Content-Length')) {
                        // Skip header lines
                        continue
                    }
                    if (msg.trim().startsWith('{')) {
                        const parsed = JSON.parse(msg)
                        this.handleDebugMessage(session, parsed)
                    }
                }
            } catch (error) {
                log.warn(`Failed to parse debug message from ${session.name}:`, error)
            }
        })

        session.process.stderr?.on('data', (data) => {
            log.error(`Debug session ${session.name} stderr:`, data.toString())
        })

        session.process.on('close', (code) => {
            log.info(`Debug session ${session.name} closed with code ${code}`)
            session.connected = false
            session.process = null
        })

        session.process.on('error', (error) => {
            log.error(`Debug session ${session.name} error:`, error)
            session.connected = false
        })
    }

    private handleDebugMessage(session: DebugSession, message: any) {
        log.info(`Debug message from ${session.name}:`, message)
        
        // Handle initialization response
        if (message.type === 'response' && message.command === 'initialize') {
            session.connected = true
            log.info(`Debug session ${session.name} initialized`)
        }
    }

    async setBreakpoint(sessionId: string, path: string, line: number, column: number = 0): Promise<string> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        const breakpointId = `bp-${++this.breakpointIdCounter}`
        const breakpoint: DebugBreakpoint = {
            id: breakpointId,
            line,
            column,
            path,
            verified: false
        }

        if (!session.breakpoints.has(path)) {
            session.breakpoints.set(path, [])
        }
        session.breakpoints.get(path)!.push(breakpoint)

        log.info(`Set breakpoint ${breakpointId} at ${path}:${line}`)
        return breakpointId
    }

    async removeBreakpoint(sessionId: string, breakpointId: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        for (const [path, breakpoints] of session.breakpoints) {
            const index = breakpoints.findIndex(bp => bp.id === breakpointId)
            if (index !== -1) {
                breakpoints.splice(index, 1)
                if (breakpoints.length === 0) {
                    session.breakpoints.delete(path)
                }
                log.info(`Removed breakpoint ${breakpointId}`)
                return
            }
        }

        throw new Error(`Breakpoint not found: ${breakpointId}`)
    }

    async getBreakpoints(sessionId: string): Promise<DebugBreakpoint[]> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        const allBreakpoints: DebugBreakpoint[] = []
        for (const breakpoints of session.breakpoints.values()) {
            allBreakpoints.push(...breakpoints)
        }
        return allBreakpoints
    }

    async continue(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session || !session.connected) {
            throw new Error(`Session not found or not connected: ${sessionId}`)
        }

        // Send continue command via DAP
        await this.sendDAPMessage(session, {
            seq: 1,
            type: 'request',
            command: 'continue'
        })

        log.info(`Continued debug session ${sessionId}`)
    }

    async pause(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session || !session.connected) {
            throw new Error(`Session not found or not connected: ${sessionId}`)
        }

        await this.sendDAPMessage(session, {
            seq: 1,
            type: 'request',
            command: 'pause'
        })

        log.info(`Paused debug session ${sessionId}`)
    }

    async stepOver(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session || !session.connected) {
            throw new Error(`Session not found or not connected: ${sessionId}`)
        }

        await this.sendDAPMessage(session, {
            seq: 1,
            type: 'request',
            command: 'next'
        })

        log.info(`Step over in debug session ${sessionId}`)
    }

    async stepInto(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session || !session.connected) {
            throw new Error(`Session not found or not connected: ${sessionId}`)
        }

        await this.sendDAPMessage(session, {
            seq: 1,
            type: 'request',
            command: 'stepIn'
        })

        log.info(`Step into in debug session ${sessionId}`)
    }

    async stepOut(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session || !session.connected) {
            throw new Error(`Session not found or not connected: ${sessionId}`)
        }

        await this.sendDAPMessage(session, {
            seq: 1,
            type: 'request',
            command: 'stepOut'
        })

        log.info(`Step out in debug session ${sessionId}`)
    }

    async getStackFrames(sessionId: string): Promise<DebugStackFrame[]> {
        const session = this.sessions.get(sessionId)
        if (!session || !session.connected) {
            throw new Error(`Session not found or not connected: ${sessionId}`)
        }

        // Send stackTrace request
        const response = await this.sendDAPMessage(session, {
            seq: 1,
            type: 'request',
            command: 'stackTrace',
            arguments: {
                threadId: 1,
                startFrame: 0,
                levels: 20
            }
        })

        // Parse stack frames from response
        return response.body?.stackFrames || []
    }

    async getVariables(sessionId: string, variablesReference: number): Promise<DebugVariable[]> {
        const session = this.sessions.get(sessionId)
        if (!session || !session.connected) {
            throw new Error(`Session not found or not connected: ${sessionId}`)
        }

        const response = await this.sendDAPMessage(session, {
            seq: 1,
            type: 'request',
            command: 'variables',
            arguments: {
                variablesReference
            }
        })

        return response.body?.variables || []
    }

    async getThreads(sessionId: string): Promise<DebugThread[]> {
        const session = this.sessions.get(sessionId)
        if (!session || !session.connected) {
            throw new Error(`Session not found or not connected: ${sessionId}`)
        }

        const response = await this.sendDAPMessage(session, {
            seq: 1,
            type: 'request',
            command: 'threads'
        })

        return response.body?.threads || []
    }

    private async sendDAPMessage(session: DebugSession, message: any): Promise<any> {
        if (!session.process) {
            throw new Error('Session process not available')
        }

        return new Promise((resolve, reject) => {
            const messageStr = JSON.stringify(message)
            const contentLength = Buffer.byteLength(messageStr, 'utf8')
            const fullMessage = `Content-Length: ${contentLength}\r\n\r\n${messageStr}`
            
            const timeout = setTimeout(() => {
                reject(new Error('DAP request timeout'))
            }, 30000)

            // Set up one-time response handler
            const responseHandler = (data: Buffer) => {
                try {
                    const dataStr = data.toString()
                    const match = dataStr.match(/\{[\s\S]*\}/)
                    if (match) {
                        const response = JSON.parse(match[0])
                        if (response.request_seq === message.seq) {
                            clearTimeout(timeout)
                            session.process?.stdout?.off('data', responseHandler)
                            resolve(response)
                        }
                    }
                } catch (error) {
                    // Ignore parse errors
                }
            }

            session.process.stdout?.once('data', responseHandler)
            session.process.stdin?.write(fullMessage)

            session.process.on('error', (error) => {
                clearTimeout(timeout)
                reject(error)
            })
        })
    }

    async stopSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (session && session.process) {
            session.process.kill()
            this.sessions.delete(sessionId)
            log.info(`Stopped debug session: ${session.name} (${sessionId})`)
        }
    }

    stopAllSessions(): void {
        for (const [sessionId, session] of this.sessions) {
            if (session.process) {
                session.process.kill()
            }
        }
        this.sessions.clear()
        log.info('Stopped all debug sessions')
    }

    getSessions(): DebugSession[] {
        return Array.from(this.sessions.values())
    }

    getSession(sessionId: string): DebugSession | undefined {
        return this.sessions.get(sessionId)
    }

    isSessionConnected(sessionId: string): boolean {
        const session = this.sessions.get(sessionId)
        return session ? session.connected : false
    }
}

// Singleton instance
let debuggerService: DebuggerService | null = null

export function getDebuggerService(): DebuggerService {
    if (!debuggerService) {
        debuggerService = new DebuggerService()
    }
    return debuggerService
}

export function destroyDebuggerService() {
    if (debuggerService) {
        debuggerService.stopAllSessions()
        debuggerService = null
    }
}
