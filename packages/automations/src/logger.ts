/**
 * Logger Abstraction
 * Provides flexible logging interface for the automations service
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export interface Logger {
    debug(message: string, ...args: any[]): void
    info(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
    setLevel(level: LogLevel): void
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
    private level: LogLevel = LogLevel.INFO

    constructor(level: LogLevel = LogLevel.INFO) {
        this.level = level
    }

    setLevel(level: LogLevel): void {
        this.level = level
    }

    debug(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[Automations DEBUG] ${message}`, ...args)
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.INFO) {
            console.info(`[Automations INFO] ${message}`, ...args)
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[Automations WARN] ${message}`, ...args)
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[Automations ERROR] ${message}`, ...args)
        }
    }
}

/**
 * No-op logger for testing or when logging is disabled
 */
export class NoOpLogger implements Logger {
    setLevel(level: LogLevel): void {
        // No-op
    }

    debug(message: string, ...args: any[]): void {
        // No-op
    }

    info(message: string, ...args: any[]): void {
        // No-op
    }

    warn(message: string, ...args: any[]): void {
        // No-op
    }

    error(message: string, ...args: any[]): void {
        // No-op
    }
}

/**
 * Memory logger for testing
 */
export class MemoryLogger implements Logger {
    private level: LogLevel = LogLevel.INFO
    private logs: Array<{ level: LogLevel; message: string; args: any[]; timestamp: Date }> = []

    setLevel(level: LogLevel): void {
        this.level = level
    }

    private log(level: LogLevel, message: string, args: any[]): void {
        if (this.level <= level) {
            this.logs.push({
                level,
                message,
                args,
                timestamp: new Date()
            })
        }
    }

    debug(message: string, ...args: any[]): void {
        this.log(LogLevel.DEBUG, message, args)
    }

    info(message: string, ...args: any[]): void {
        this.log(LogLevel.INFO, message, args)
    }

    warn(message: string, ...args: any[]): void {
        this.log(LogLevel.WARN, message, args)
    }

    error(message: string, ...args: any[]): void {
        this.log(LogLevel.ERROR, message, args)
    }

    getLogs(): Array<{ level: LogLevel; message: string; args: any[]; timestamp: Date }> {
        return [...this.logs]
    }

    clear(): void {
        this.logs = []
    }

    getLogsByLevel(level: LogLevel): Array<{ level: LogLevel; message: string; args: any[]; timestamp: Date }> {
        return this.logs.filter(log => log.level === level)
    }
}