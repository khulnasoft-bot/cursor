/**
 * Logger Abstraction
 * Provides flexible logging interface for the composer service
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
            console.debug(`[Composer DEBUG] ${message}`, ...args)
        }
    }

    info(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.INFO) {
            console.info(`[Composer INFO] ${message}`, ...args)
        }
    }

    warn(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[Composer WARN] ${message}`, ...args)
        }
    }

    error(message: string, ...args: any[]): void {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[Composer ERROR] ${message}`, ...args)
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