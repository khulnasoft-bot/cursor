/**
 * Agent Sandbox
 * Sandbox and safety boundaries for autonomous agent execution
 */

import log from 'electron-log'
import * as path from 'path'
import * as fs from 'fs/promises'

export interface SandboxConfig {
    allowedPaths: string[]
    blockedPaths: string[]
    maxExecutionTime: number
    maxMemoryUsage: number
    maxFileSize: number
    allowNetworkAccess: boolean
    allowSystemCommands: boolean
    requireConfirmation: boolean
    logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export interface SandboxViolation {
    type: 'path_access' | 'command_execution' | 'resource_limit' | 'network_access' | 'system_command'
    severity: 'warning' | 'error' | 'critical'
    message: string
    details?: any
    timestamp: Date
}

export class AgentSandbox {
    private config: SandboxConfig
    private violations: SandboxViolation[] = []
    private active: boolean = true

    constructor(config?: Partial<SandboxConfig>) {
        this.config = {
            allowedPaths: [],
            blockedPaths: [],
            maxExecutionTime: 30000, // 30 seconds
            maxMemoryUsage: 512 * 1024 * 1024, // 512MB
            maxFileSize: 10 * 1024 * 1024, // 10MB
            allowNetworkAccess: false,
            allowSystemCommands: false,
            requireConfirmation: true,
            logLevel: 'info',
            ...config
        }
    }

    activate(): void {
        this.active = true
        log.info('Agent sandbox activated')
    }

    deactivate(): void {
        this.active = false
        log.info('Agent sandbox deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    checkPathAccess(filePath: string, operation: 'read' | 'write' | 'delete'): { allowed: boolean; violation?: SandboxViolation } {
        if (!this.active) return { allowed: true }

        const normalizedPath = path.normalize(filePath)

        // Check blocked paths first
        for (const blockedPath of this.config.blockedPaths) {
            if (normalizedPath.startsWith(path.normalize(blockedPath))) {
                const violation: SandboxViolation = {
                    type: 'path_access',
                    severity: 'error',
                    message: `Access to blocked path denied: ${filePath}`,
                    details: { path: filePath, operation },
                    timestamp: new Date()
                }
                this.violations.push(violation)
                log.warn(`Path access violation: ${filePath}`)
                return { allowed: false, violation }
            }
        }

        // If allowed paths are specified, check against them
        if (this.config.allowedPaths.length > 0) {
            let allowed = false
            for (const allowedPath of this.config.allowedPaths) {
                if (normalizedPath.startsWith(path.normalize(allowedPath))) {
                    allowed = true
                    break
                }
            }
            
            if (!allowed) {
                const violation: SandboxViolation = {
                    type: 'path_access',
                    severity: 'warning',
                    message: `Access to path outside allowed directories: ${filePath}`,
                    details: { path: filePath, operation },
                    timestamp: new Date()
                }
                this.violations.push(violation)
                log.warn(`Path access violation: ${filePath}`)
                return { allowed: false, violation }
            }
        }

        // Check file size for write operations
        if (operation === 'write') {
            // This would check the file size before writing
            // For now, we'll assume it's okay
        }

        return { allowed: true }
    }

    checkCommandExecution(command: string): { allowed: boolean; violation?: SandboxViolation } {
        if (!this.active) return { allowed: true }

        if (!this.config.allowSystemCommands) {
            const violation: SandboxViolation = {
                type: 'system_command',
                severity: 'error',
                message: 'System command execution is disabled',
                details: { command },
                timestamp: new Date()
            }
            this.violations.push(violation)
            log.warn(`System command violation: ${command}`)
            return { allowed: false, violation }
        }

        // Check for dangerous commands
        const dangerousCommands = ['rm', 'dd', 'mkfs', 'format', 'fdisk', 'shutdown', 'reboot', 'halt']
        const commandParts = command.split(' ')
        const baseCommand = commandParts[0]

        if (dangerousCommands.includes(baseCommand)) {
            const violation: SandboxViolation = {
                type: 'command_execution',
                severity: 'critical',
                message: `Dangerous command blocked: ${baseCommand}`,
                details: { command },
                timestamp: new Date()
            }
            this.violations.push(violation)
            log.error(`Dangerous command violation: ${command}`)
            return { allowed: false, violation }
        }

        return { allowed: true }
    }

    checkNetworkAccess(url: string): { allowed: boolean; violation?: SandboxViolation } {
        if (!this.active) return { allowed: true }

        if (!this.config.allowNetworkAccess) {
            const violation: SandboxViolation = {
                type: 'network_access',
                severity: 'error',
                message: 'Network access is disabled',
                details: { url },
                timestamp: new Date()
            }
            this.violations.push(violation)
            log.warn(`Network access violation: ${url}`)
            return { allowed: false, violation }
        }

        // Check for allowed domains if needed
        // For now, just check if network access is enabled

        return { allowed: true }
    }

    checkResourceUsage(operation: string, size?: number): { allowed: boolean; violation?: SandboxViolation } {
        if (!this.active) return { allowed: true }

        if (size && operation === 'file_write' && size > this.config.maxFileSize) {
            const violation: SandboxViolation = {
                type: 'resource_limit',
                severity: 'error',
                message: `File size exceeds maximum allowed: ${size} > ${this.config.maxFileSize}`,
                details: { operation, size, maxSize: this.config.maxFileSize },
                timestamp: new Date()
            }
            this.violations.push(violation)
            log.warn(`Resource limit violation: file size ${size}`)
            return { allowed: false, violation }
        }

        // Memory usage would be checked here
        // For now, we'll assume it's okay

        return { allowed: true }
    }

    addAllowedPath(path: string): void {
        this.config.allowedPaths.push(path)
        log.info(`Added allowed path: ${path}`)
    }

    removeAllowedPath(path: string): void {
        this.config.allowedPaths = this.config.allowedPaths.filter(p => p !== path)
        log.info(`Removed allowed path: ${path}`)
    }

    addBlockedPath(path: string): void {
        this.config.blockedPaths.push(path)
        log.info(`Added blocked path: ${path}`)
    }

    removeBlockedPath(path: string): void {
        this.config.blockedPaths = this.config.blockedPaths.filter(p => p !== path)
        log.info(`Removed blocked path: ${path}`)
    }

    setMaxExecutionTime(time: number): void {
        this.config.maxExecutionTime = time
        log.info(`Set max execution time: ${time}ms`)
    }

    setMaxMemoryUsage(size: number): void {
        this.config.maxMemoryUsage = size
        log.info(`Set max memory usage: ${size} bytes`)
    }

    setMaxFileSize(size: number): void {
        this.config.maxFileSize = size
        log.info(`Set max file size: ${size} bytes`)
    }

    setAllowNetworkAccess(allow: boolean): void {
        this.config.allowNetworkAccess = allow
        log.info(`Set network access: ${allow}`)
    }

    setAllowSystemCommands(allow: boolean): void {
        this.config.allowSystemCommands = allow
        log.info(`Set system commands: ${allow}`)
    }

    setRequireConfirmation(require: boolean): void {
        this.config.requireConfirmation = require
        log.info(`Set require confirmation: ${require}`)
    }

    getViolations(): SandboxViolation[] {
        return [...this.violations]
    }

    getViolationsByType(type: SandboxViolation['type']): SandboxViolation[] {
        return this.violations.filter(v => v.type === type)
    }

    getViolationsBySeverity(severity: SandboxViolation['severity']): SandboxViolation[] {
        return this.violations.filter(v => v.severity === severity)
    }

    clearViolations(): void {
        this.violations = []
        log.info('Cleared sandbox violations')
    }

    getViolationCount(): number {
        return this.violations.length
    }

    getCriticalViolationCount(): number {
        return this.getViolationsBySeverity('critical').length
    }

    hasCriticalViolations(): boolean {
        return this.getCriticalViolationCount() > 0
    }

    getConfig(): SandboxConfig {
        return { ...this.config }
    }

    updateConfig(config: Partial<SandboxConfig>): void {
        this.config = { ...this.config, ...config }
        log.info('Updated sandbox configuration')
    }

    resetToDefaults(): void {
        this.config = {
            allowedPaths: [],
            blockedPaths: [],
            maxExecutionTime: 30000,
            maxMemoryUsage: 512 * 1024 * 1024,
            maxFileSize: 10 * 1024 * 1024,
            allowNetworkAccess: false,
            allowSystemCommands: false,
            requireConfirmation: true,
            logLevel: 'info'
        }
        this.violations = []
        log.info('Reset sandbox to defaults')
    }

    async createSandboxDirectory(basePath: string): Promise<string> {
        const sandboxDir = path.join(basePath, '.sandbox')
        
        try {
            await fs.mkdir(sandboxDir, { recursive: true })
            this.addAllowedPath(sandboxDir)
            log.info(`Created sandbox directory: ${sandboxDir}`)
            return sandboxDir
        } catch (error) {
            log.error(`Failed to create sandbox directory: ${error}`)
            throw error
        }
    }

    async cleanupSandboxDirectory(sandboxDir: string): Promise<void> {
        try {
            await fs.rm(sandboxDir, { recursive: true, force: true })
            this.removeAllowedPath(sandboxDir)
            log.info(`Cleaned up sandbox directory: ${sandboxDir}`)
        } catch (error) {
            log.error(`Failed to cleanup sandbox directory: ${error}`)
        }
    }

    getSummary(): {
        active: boolean
        violations: number
        criticalViolations: number
        allowedPaths: number
        blockedPaths: number
        config: SandboxConfig
    } {
        return {
            active: this.active,
            violations: this.violations.length,
            criticalViolations: this.getCriticalViolationCount(),
            allowedPaths: this.config.allowedPaths.length,
            blockedPaths: this.config.blockedPaths.length,
            config: this.getConfig()
        }
    }
}

// Singleton instance
let agentSandbox: AgentSandbox | null = null

export function getAgentSandbox(): AgentSandbox {
    if (!agentSandbox) {
        agentSandbox = new AgentSandbox()
    }
    return agentSandbox
}

export function destroyAgentSandbox() {
    if (agentSandbox) {
        agentSandbox.deactivate()
        agentSandbox = null
    }
}
