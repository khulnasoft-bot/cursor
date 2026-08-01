import os from 'os'
import * as pty from 'node-pty'
import * as path from 'path'
import log from 'electron-log'

import { ipcMain } from 'electron'

export interface TerminalSession {
    id: string
    ptyProcess: any
    cwd: string
    shell: string
    commandHistory: string[]
    currentDirectory: string
    theme: string
}

export interface TerminalConfig {
    cols: number
    rows: number
    shellIntegration: boolean
    theme: string
}

class TerminalService {
    private sessions: Map<string, TerminalSession> = new Map()
    private sessionIdCounter = 0
    private defaultConfig: TerminalConfig = {
        cols: 80,
        rows: 24,
        shellIntegration: true,
        theme: 'default'
    }

    createSession(rootPath?: string, config?: Partial<TerminalConfig>): string {
        const sessionId = `terminal-${++this.sessionIdCounter}`
        const terminalConfig = { ...this.defaultConfig, ...config }

        const shells = os.platform() === 'win32' ? ['powershell.exe'] : ['zsh', 'bash']
        const filteredEnv: { [key: string]: string } = Object.entries(process.env).reduce((acc, [key, value]) => {
            if (typeof value === 'string') {
                acc[key] = value
            }
            return acc
        }, {} as { [key: string]: string })

        let ptyProcess: any = null
        let selectedShell = ''

        for (const shell of shells) {
            try {
                if (process.platform !== 'win32') {
                    require('child_process').execSync(`command -v ${shell}`)
                }
                const res = pty.spawn(shell, [], {
                    name: 'xterm-color',
                    cols: terminalConfig.cols,
                    rows: terminalConfig.rows,
                    cwd: rootPath || process.env.HOME,
                    env: filteredEnv,
                })
                ptyProcess = res
                selectedShell = shell
                break
            } catch (e) {
                // ignore errors
            }
        }

        if (ptyProcess == null) {
            throw new Error('Failed to create terminal session - no suitable shell found')
        }

        const session: TerminalSession = {
            id: sessionId,
            ptyProcess,
            cwd: rootPath || process.env.HOME,
            shell: selectedShell,
            commandHistory: [],
            currentDirectory: rootPath || process.env.HOME,
            theme: terminalConfig.theme
        }

        this.sessions.set(sessionId, session)
        this.setupSessionHandlers(sessionId)

        log.info(`Created terminal session: ${sessionId} with shell: ${selectedShell}`)
        return sessionId
    }

    private setupSessionHandlers(sessionId: string): void {
        const session = this.sessions.get(sessionId)
        if (!session) return

        session.ptyProcess.on('data', (data: any) => {
            // Track directory changes if shell integration is enabled
            this.trackDirectoryChange(session, data)
        })

        session.ptyProcess.on('exit', (code: number) => {
            log.info(`Terminal session ${sessionId} exited with code ${code}`)
            this.sessions.delete(sessionId)
        })
    }

    private trackDirectoryChange(session: TerminalSession, data: string): void {
        // Simple directory tracking - can be enhanced with proper shell integration
        const cdMatch = data.match(/cd\s+(.+)/)
        if (cdMatch) {
            const newPath = cdMatch[1].trim()
            if (path.isAbsolute(newPath)) {
                session.currentDirectory = newPath
            } else {
                session.currentDirectory = path.join(session.currentDirectory, newPath)
            }
        }
    }

    writeToTerminal(sessionId: string, data: string): void {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Terminal session not found: ${sessionId}`)
        }

        // Track commands in history
        if (data.trim() && !data.startsWith('\x03')) {
            session.commandHistory.push(data.trim())
            // Keep last 100 commands
            if (session.commandHistory.length > 100) {
                session.commandHistory.shift()
            }
        }

        session.ptyProcess.write(data)
    }

    resizeTerminal(sessionId: string, cols: number, rows: number): void {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Terminal session not found: ${sessionId}`)
        }

        session.ptyProcess.resize(cols, rows)
    }

    getCommandHistory(sessionId: string): string[] {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Terminal session not found: ${sessionId}`)
        }

        return session.commandHistory
    }

    searchCommandHistory(sessionId: string, query: string): string[] {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Terminal session not found: ${sessionId}`)
        }

        return session.commandHistory.filter(cmd =>
            cmd.toLowerCase().includes(query.toLowerCase())
        )
    }

    getCurrentDirectory(sessionId: string): string {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Terminal session not found: ${sessionId}`)
        }

        return session.currentDirectory
    }

    setTheme(sessionId: string, theme: string): void {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Terminal session not found: ${sessionId}`)
        }

        session.theme = theme
        log.info(`Set theme for terminal ${sessionId}: ${theme}`)
    }

    getTheme(sessionId: string): string {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Terminal session not found: ${sessionId}`)
        }

        return session.theme
    }

    closeSession(sessionId: string): void {
        const session = this.sessions.get(sessionId)
        if (session) {
            session.ptyProcess.kill()
            this.sessions.delete(sessionId)
            log.info(`Closed terminal session: ${sessionId}`)
        }
    }

    getSession(sessionId: string): TerminalSession | undefined {
        return this.sessions.get(sessionId)
    }

    getSessions(): TerminalSession[] {
        return Array.from(this.sessions.values())
    }

    closeAllSessions(): void {
        for (const [sessionId, session] of this.sessions) {
            session.ptyProcess.kill()
        }
        this.sessions.clear()
        log.info('Closed all terminal sessions')
    }
}

// Singleton instance
let terminalService: TerminalService | null = null

export function getTerminalService(): TerminalService {
    if (!terminalService) {
        terminalService = new TerminalService()
    }
    return terminalService
}

export function destroyTerminalService() {
    if (terminalService) {
        terminalService.closeAllSessions()
        terminalService = null
    }
}

// Legacy setup function for backward compatibility
export function setupTerminal(mainWindow: any, rootPath?: string) {
    const terminalService = getTerminalService()

    try {
        const sessionId = terminalService.createSession(rootPath)
        const session = terminalService.getSession(sessionId)

        if (!session) return

        ipcMain.handle('terminal-into', (event, data) => {
            terminalService.writeToTerminal(sessionId, data)
        })

        session.ptyProcess.on('data', (data: any) => {
            mainWindow.webContents.send('terminal-incData', data)
        })

        ipcMain.handle('terminal-resize', (event, size) => {
            terminalService.resizeTerminal(sessionId, size.cols, size.rows)
        })

        // New enhanced features
        ipcMain.handle('terminal-create-session', (event, rootPath?: string, config?: any) => {
            try {
                const newSessionId = terminalService.createSession(rootPath, config)
                return { success: true, sessionId: newSessionId }
            } catch (error) {
                log.error('Failed to create terminal session:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        })

        ipcMain.handle('terminal-close-session', (event, sessionId: string) => {
            try {
                terminalService.closeSession(sessionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to close terminal session:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        })

        ipcMain.handle('terminal-get-history', (event, sessionId: string) => {
            try {
                const history = terminalService.getCommandHistory(sessionId)
                return { success: true, history }
            } catch (error) {
                log.error('Failed to get command history:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        })

        ipcMain.handle('terminal-search-history', (event, sessionId: string, query: string) => {
            try {
                const results = terminalService.searchCommandHistory(sessionId, query)
                return { success: true, results }
            } catch (error) {
                log.error('Failed to search command history:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        })

        ipcMain.handle('terminal-get-directory', (event, sessionId: string) => {
            try {
                const directory = terminalService.getCurrentDirectory(sessionId)
                return { success: true, directory }
            } catch (error) {
                log.error('Failed to get current directory:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        })

        ipcMain.handle('terminal-set-theme', (event, sessionId: string, theme: string) => {
            try {
                terminalService.setTheme(sessionId, theme)
                return { success: true }
            } catch (error) {
                log.error('Failed to set terminal theme:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        })

        ipcMain.handle('terminal-get-theme', (event, sessionId: string) => {
            try {
                const theme = terminalService.getTheme(sessionId)
                return { success: true, theme }
            } catch (error) {
                log.error('Failed to get terminal theme:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        })

        log.info('Terminal service setup complete')
    } catch (error) {
        log.error('Failed to setup terminal:', error)
    }
}
