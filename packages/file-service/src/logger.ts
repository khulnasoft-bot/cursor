/**
 * Logger abstraction for file service
 * Provides a consistent logging interface that can be implemented with different backends
 */

/**
 * Logger interface for file service operations
 */
export interface Logger {
    info(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
    debug(message: string, ...args: any[]): void
}

/**
 * Console logger implementation
 * Outputs to standard console methods
 */
export class ConsoleLogger implements Logger {
    private enabled: boolean

    constructor(enabled: boolean = true) {
        this.enabled = enabled
    }

    info(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.log(`[INFO] ${message}`, ...args)
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.warn(`[WARN] ${message}`, ...args)
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.error(`[ERROR] ${message}`, ...args)
        }
    }

    debug(message: string, ...args: any[]): void {
        if (this.enabled) {
            console.debug(`[DEBUG] ${message}`, ...args)
        }
    }

    setEnabled(enabled: boolean): void {
        this.enabled = enabled
    }
}

/**
 * No-op logger implementation
 * Useful for disabling logging or testing
 */
export class NoOpLogger implements Logger {
    info(message: string, ...args: any[]): void {
        // Do nothing
    }

    warn(message: string, ...args: any[]): void {
        // Do nothing
    }

    error(message: string, ...args: any[]): void {
        // Do nothing
    }

    debug(message: string, ...args: any[]): void {
        // Do nothing
    }
}

/**
 * Memory logger implementation
 * Stores log messages in memory for testing and debugging
 */
export class MemoryLogger implements Logger {
    private logs: Array<{ level: string; message: string; args: any[]; timestamp: Date }> = []

    info(message: string, ...args: any[]): void {
        this.logs.push({
            level: 'info',
            message,
            args,
            timestamp: new Date()
        })
    }

    warn(message: string, ...args: any[]): void {
        this.logs.push({
            level: 'warn',
            message,
            args,
            timestamp: new Date()
        })
    }

    error(message: string, ...args: any[]): void {
        this.logs.push({
            level: 'error',
            message,
            args,
            timestamp: new Date()
        })
    }

    debug(message: string, ...args: any[]): void {
        this.logs.push({
            level: 'debug',
            message,
            args,
            timestamp: new Date()
        })
    }

    getLogs(): Array<{ level: string; message: string; args: any[]; timestamp: Date }> {
        return [...this.logs]
    }

    clearLogs(): void {
        this.logs = []
    }

    getLogsByLevel(level: string): Array<{ level: string; message: string; args: any[]; timestamp: Date }> {
        return this.logs.filter(log => log.level === level)
    }
}