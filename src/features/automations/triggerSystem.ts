/**
 * Automation Trigger System
 * System for managing and firing automation triggers
 */

import log from 'electron-log'
import { EventEmitter } from 'events'
import { getAutomationService } from './automationService'
import type { AutomationTrigger, AutomationWorkflow } from './automationService'

export interface TriggerEvent {
    type: string
    data: Record<string, any>
    timestamp: Date
}

export class TriggerSystem extends EventEmitter {
    private automationService = getAutomationService()
    private active: boolean = false
    private listeners: Map<string, Set<Function>> = new Map()

    activate(): void {
        this.active = true
        this.setupEventListeners()
        log.info('Trigger system activated')
    }

    deactivate(): void {
        this.active = false
        this.teardownEventListeners()
        log.info('Trigger system deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    private setupEventListeners(): void {
        // File system events
        this.on('file-save', this.handleFileSave.bind(this))
        this.on('file-change', this.handleFileChange.bind(this))
        
        // Git events
        this.on('git-commit', this.handleGitCommit.bind(this))
        this.on('git-push', this.handleGitPush.bind(this))
        this.on('git-pull', this.handleGitPull.bind(this))
        
        // Time-based events
        this.on('time-trigger', this.handleTimeTrigger.bind(this))
        
        // Manual events
        this.on('manual-trigger', this.handleManualTrigger.bind(this))
        
        // Custom events
        this.on('custom-event', this.handleCustomEvent.bind(this))

        log.info('Event listeners set up')
    }

    private teardownEventListeners(): void {
        this.removeAllListeners()
        this.listeners.clear()
        log.info('Event listeners torn down')
    }

    registerListener(eventType: string, callback: Function): void {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, new Set())
        }
        this.listeners.get(eventType)!.add(callback)
        log.info(`Registered listener for event: ${eventType}`)
    }

    unregisterListener(eventType: string, callback: Function): void {
        const listeners = this.listeners.get(eventType)
        if (listeners) {
            listeners.delete(callback)
            if (listeners.size === 0) {
                this.listeners.delete(eventType)
            }
            log.info(`Unregistered listener for event: ${eventType}`)
        }
    }

    async fireTrigger(eventType: string, data: Record<string, any> = {}): Promise<void> {
        if (!this.active) return

        const event: TriggerEvent = {
            type: eventType,
            data,
            timestamp: new Date()
        }

        log.info(`Firing trigger: ${eventType}`, data)

        // Find workflows with matching triggers
        const workflows = this.automationService.getWorkflowsByTrigger(eventType as any)
        
        for (const workflow of workflows) {
            const trigger = workflow.triggers.find(t => t.type === eventType && t.enabled)
            if (trigger && this.matchesTriggerConfig(trigger, data)) {
                try {
                    await this.automationService.executeWorkflow(workflow.id, trigger)
                } catch (error) {
                    log.error(`Failed to execute workflow ${workflow.name} on trigger ${eventType}:`, error)
                }
            }
        }

        // Emit event for external listeners
        this.emit(eventType, event)
    }

    private matchesTriggerConfig(trigger: AutomationTrigger, data: Record<string, any>): boolean {
        // Check if trigger configuration matches the event data
        for (const [key, expectedValue] of Object.entries(trigger.config)) {
            if (data[key] !== expectedValue) {
                return false
            }
        }
        return true
    }

    // Event handlers
    private async handleFileSave(data: { filePath: string; content: string }): Promise<void> {
        await this.fireTrigger('file-save', data)
    }

    private async handleFileChange(data: { filePath: string; oldContent: string; newContent: string }): Promise<void> {
        await this.fireTrigger('file-change', data)
    }

    private async handleGitCommit(data: { message: string; files: string[] }): Promise<void> {
        await this.fireTrigger('git-commit', data)
    }

    private async handleGitPush(data: { branch: string; remote: string }): Promise<void> {
        await this.fireTrigger('git-push', data)
    }

    private async handleGitPull(data: { branch: string; remote: string }): Promise<void> {
        await this.fireTrigger('git-pull', data)
    }

    private async handleTimeTrigger(data: { schedule: string }): Promise<void> {
        await this.fireTrigger('time-trigger', data)
    }

    private async handleManualTrigger(data: { workflowId?: string }): Promise<void> {
        await this.fireTrigger('manual-trigger', data)
    }

    private async handleCustomEvent(data: { eventName: string; eventData: any }): Promise<void> {
        await this.fireTrigger('custom-event', data)
    }

    // Public API for triggering events
    async triggerFileSave(filePath: string, content: string): Promise<void> {
        await this.fireTrigger('file-save', { filePath, content })
    }

    async triggerFileChange(filePath: string, oldContent: string, newContent: string): Promise<void> {
        await this.fireTrigger('file-change', { filePath, oldContent, newContent })
    }

    async triggerGitCommit(message: string, files: string[]): Promise<void> {
        await this.fireTrigger('git-commit', { message, files })
    }

    async triggerGitPush(branch: string, remote: string): Promise<void> {
        await this.fireTrigger('git-push', { branch, remote })
    }

    async triggerGitPull(branch: string, remote: string): Promise<void> {
        await this.fireTrigger('git-pull', { branch, remote })
    }

    async triggerManual(workflowId?: string): Promise<void> {
        await this.fireTrigger('manual-trigger', { workflowId })
    }

    async triggerCustom(eventName: string, eventData: any): Promise<void> {
        await this.fireTrigger('custom-event', { eventName, eventData })
    }

    // Schedule-based triggers
    private scheduledTriggers: Map<string, NodeJS.Timeout> = new Map()

    scheduleTrigger(triggerId: string, schedule: string, callback: () => void): void {
        // Parse schedule (cron-like format)
        // For simplicity, this is a placeholder - would need proper cron parsing
        const interval = this.parseSchedule(schedule)
        
        if (interval) {
            const timeout = setInterval(callback, interval)
            this.scheduledTriggers.set(triggerId, timeout)
            log.info(`Scheduled trigger ${triggerId} with interval ${interval}ms`)
        }
    }

    unscheduleTrigger(triggerId: string): void {
        const timeout = this.scheduledTriggers.get(triggerId)
        if (timeout) {
            clearInterval(timeout)
            this.scheduledTriggers.delete(triggerId)
            log.info(`Unscheduled trigger ${triggerId}`)
        }
    }

    private parseSchedule(schedule: string): number | null {
        // Simple schedule parsing
        // Format: "every X minutes/hours/days"
        const match = schedule.match(/every (\d+) (minute|hour|day)/i)
        if (match) {
            const value = parseInt(match[1])
            const unit = match[2].toLowerCase()
            
            switch (unit) {
                case 'minute':
                    return value * 60 * 1000
                case 'hour':
                    return value * 60 * 60 * 1000
                case 'day':
                    return value * 24 * 60 * 60 * 1000
            }
        }
        return null
    }

    clearScheduledTriggers(): void {
        for (const [triggerId, timeout] of this.scheduledTriggers) {
            clearInterval(timeout)
        }
        this.scheduledTriggers.clear()
        log.info('Cleared all scheduled triggers')
    }

    getActiveListeners(): string[] {
        return Array.from(this.listeners.keys())
    }

    getListenerCount(eventType: string): number {
        return this.listeners.get(eventType)?.size || 0
    }

    getScheduledTriggers(): string[] {
        return Array.from(this.scheduledTriggers.keys())
    }

    reset(): void {
        this.clearScheduledTriggers()
        this.teardownEventListeners()
        log.info('Trigger system reset')
    }
}

// Singleton instance
let triggerSystem: TriggerSystem | null = null

export function getTriggerSystem(): TriggerSystem {
    if (!triggerSystem) {
        triggerSystem = new TriggerSystem()
    }
    return triggerSystem
}

export function destroyTriggerSystem() {
    if (triggerSystem) {
        triggerSystem.reset()
        triggerSystem = null
    }
}
