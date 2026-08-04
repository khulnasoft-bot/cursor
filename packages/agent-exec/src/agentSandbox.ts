/**
 * Agent Sandbox
 * Execution isolation and resource management for agent tasks
 */

import { AgentConfig } from './types'
import { Logger, ConsoleLogger } from './logger'

export interface SandboxConfig {
    resourceLimits: {
        maxMemoryMB?: number
        maxCpuPercent?: number
        maxDiskMB?: number
        maxTimeMs?: number
    }
    allowedPaths: string[]
    forbiddenPaths: string[]
    networkAccess: boolean
    environment: Record<string, string>
}

export interface SandboxInstance {
    id: string
    status: 'active' | 'suspended' | 'terminated'
    resourceUsage: {
        memoryMB: number
        cpuPercent: number
        diskMB: number
    }
    config: SandboxConfig
}

export class AgentSandbox {
    private sandboxes: Map<string, SandboxInstance> = new Map()
    private sandboxCounter = 0
    private defaultConfig: SandboxConfig
    private logger: Logger

    constructor(config: AgentConfig = {}, logger?: Logger) {
        this.defaultConfig = {
            resourceLimits: {
                maxMemoryMB: 512,
                maxCpuPercent: 80,
                maxDiskMB: 1024,
                maxTimeMs: 300000
            },
            allowedPaths: ['/tmp', '/home'],
            forbiddenPaths: ['/etc', '/sys', '/proc'],
            networkAccess: false,
            environment: {}
        }
        this.logger = logger || new ConsoleLogger()
    }

    createSandbox(customConfig?: Partial<SandboxConfig>): SandboxInstance {
        const sandboxId = `sandbox-${++this.sandboxCounter}`

        const config: SandboxConfig = {
            ...this.defaultConfig,
            ...customConfig,
            resourceLimits: {
                ...this.defaultConfig.resourceLimits,
                ...customConfig?.resourceLimits
            }
        }

        const sandbox: SandboxInstance = {
            id: sandboxId,
            status: 'active',
            resourceUsage: {
                memoryMB: 0,
                cpuPercent: 0,
                diskMB: 0
            },
            config
        }

        this.sandboxes.set(sandboxId, sandbox)
        this.logger.info(`Created sandbox ${sandboxId}`)
        return sandbox
    }

    suspendSandbox(sandboxId: string): boolean {
        const sandbox = this.sandboxes.get(sandboxId)
        if (!sandbox || sandbox.status !== 'active') return false

        sandbox.status = 'suspended'
        this.logger.info(`Suspended sandbox ${sandboxId}`)
        return true
    }

    resumeSandbox(sandboxId: string): boolean {
        const sandbox = this.sandboxes.get(sandboxId)
        if (!sandbox || sandbox.status !== 'suspended') return false

        sandbox.status = 'active'
        this.logger.info(`Resumed sandbox ${sandboxId}`)
        return true
    }

    terminateSandbox(sandboxId: string): boolean {
        const sandbox = this.sandboxes.get(sandboxId)
        if (!sandbox) return false

        sandbox.status = 'terminated'
        this.sandboxes.delete(sandboxId)
        this.logger.info(`Terminated sandbox ${sandboxId}`)
        return true
    }

    getSandbox(sandboxId: string): SandboxInstance | undefined {
        return this.sandboxes.get(sandboxId)
    }

    getSandboxes(): SandboxInstance[] {
        return Array.from(this.sandboxes.values())
    }

    getActiveSandboxes(): SandboxInstance[] {
        return this.getSandboxes().filter(s => s.status === 'active')
    }

    validatePath(sandboxId: string, path: string): { allowed: boolean; reason?: string } {
        const sandbox = this.sandboxes.get(sandboxId)
        if (!sandbox) {
            return { allowed: false, reason: 'Sandbox not found' }
        }

        // Check forbidden paths
        for (const forbidden of sandbox.config.forbiddenPaths) {
            if (path.startsWith(forbidden)) {
                return { allowed: false, reason: `Path is forbidden: ${forbidden}` }
            }
        }

        // Check allowed paths (if specified, only allow those)
        if (sandbox.config.allowedPaths.length > 0) {
            const allowed = sandbox.config.allowedPaths.some(allowed => path.startsWith(allowed))
            if (!allowed) {
                return { allowed: false, reason: 'Path not in allowed list' }
            }
        }

        return { allowed: true }
    }

    updateResourceUsage(sandboxId: string, usage: Partial<SandboxInstance['resourceUsage']>): void {
        const sandbox = this.sandboxes.get(sandboxId)
        if (!sandbox) return

        sandbox.resourceUsage = { ...sandbox.resourceUsage, ...usage }

        // Check resource limits
        if (sandbox.config.resourceLimits.maxMemoryMB && sandbox.resourceUsage.memoryMB > sandbox.config.resourceLimits.maxMemoryMB) {
            this.logger.warn(`Sandbox ${sandboxId} exceeded memory limit`)
            this.suspendSandbox(sandboxId)
        }

        if (sandbox.config.resourceLimits.maxCpuPercent && sandbox.resourceUsage.cpuPercent > sandbox.config.resourceLimits.maxCpuPercent) {
            this.logger.warn(`Sandbox ${sandboxId} exceeded CPU limit`)
            this.suspendSandbox(sandboxId)
        }
    }

    cleanupSandboxes(): void {
        for (const [sandboxId, sandbox] of this.sandboxes) {
            if (sandbox.status === 'suspended' || sandbox.status === 'terminated') {
                this.sandboxes.delete(sandboxId)
            }
        }
        this.logger.info('Cleaned up inactive sandboxes')
    }

    reset(): void {
        this.sandboxes.clear()
        this.sandboxCounter = 0
        this.logger.info('Reset agent sandbox')
    }
}

// Singleton instance
let agentSandbox: AgentSandbox | null = null

export function getAgentSandbox(config?: AgentConfig, logger?: Logger): AgentSandbox {
    if (!agentSandbox) {
        agentSandbox = new AgentSandbox(config, logger)
    }
    return agentSandbox
}

export function destroyAgentSandbox(): void {
    if (agentSandbox) {
        agentSandbox.reset()
        agentSandbox = null
    }
}

export function createAgentSandbox(config?: AgentConfig, logger?: Logger): AgentSandbox {
    return new AgentSandbox(config, logger)
}