/**
 * Trigger System
 * Manages automation triggers and event handling
 */

import { AutomationTrigger, TriggerType } from '../types'
import { Logger, ConsoleLogger } from '../logger'

export interface TriggerHandler {
    trigger: AutomationTrigger
    handler: (context?: Record<string, any>) => void
    enabled: boolean
}

export class TriggerSystem {
    private handlers: Map<string, TriggerHandler> = new Map()
    private handlerCounter = 0
    private logger: Logger
    private eventListeners: Map<string, Function[]> = new Map()

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
    }

    registerTrigger(
        trigger: AutomationTrigger,
        handler: (context?: Record<string, any>) => void
    ): string {
        const handlerId = `handler-${++this.handlerCounter}`

        const triggerHandler: TriggerHandler = {
            trigger,
            handler,
            enabled: trigger.enabled
        }

        this.handlers.set(handlerId, triggerHandler)
        this.logger.info(`Registered trigger handler: ${handlerId} for trigger type: ${trigger.type}`)

        // Register event listener if needed
        if (trigger.type === 'event' || trigger.type === 'api' || trigger.type === 'webhook') {
            this.registerEventListener(trigger, handlerId, handler)
        }

        return handlerId
    }

    unregisterTrigger(handlerId: string): boolean {
        const handler = this.handlers.get(handlerId)
        if (!handler) return false

        // Remove event listener if registered
        if (handler.trigger.type === 'event' || handler.trigger.type === 'api' || handler.trigger.type === 'webhook') {
            this.unregisterEventListener(handler.trigger, handlerId)
        }

        const deleted = this.handlers.delete(handlerId)
        if (deleted) {
            this.logger.info(`Unregistered trigger handler: ${handlerId}`)
        }
        return deleted
    }

    enableTrigger(handlerId: string): boolean {
        const handler = this.handlers.get(handlerId)
        if (!handler) return false

        handler.enabled = true
        this.logger.info(`Enabled trigger handler: ${handlerId}`)
        return true
    }

    disableTrigger(handlerId: string): boolean {
        const handler = this.handlers.get(handlerId)
        if (!handler) return false

        handler.enabled = false
        this.logger.info(`Disabled trigger handler: ${handlerId}`)
        return true
    }

    triggerManual(triggerId: string, context?: Record<string, any>): void {
        const handler = this.handlers.get(triggerId)
        if (!handler) {
            this.logger.warn(`Trigger handler not found: ${triggerId}`)
            return
        }

        if (!handler.enabled) {
            this.logger.warn(`Trigger handler is disabled: ${triggerId}`)
            return
        }

        if (handler.trigger.type !== 'manual') {
            this.logger.warn(`Trigger is not manual: ${triggerId}`)
            return
        }

        this.logger.info(`Executing manual trigger: ${triggerId}`)
        handler.handler(context)
    }

    triggerFileSave(filePath: string, context?: Record<string, any>): void {
        this.triggerByType('file_save', { filePath, ...context })
    }

    triggerFileChange(filePath: string, changeType: string, context?: Record<string, any>): void {
        this.triggerByType('file_change', { filePath, changeType, ...context })
    }

    triggerGitCommit(commitHash: string, message: string, context?: Record<string, any>): void {
        this.triggerByType('git_commit', { commitHash, message, ...context })
    }

    triggerTime(scheduledTime: Date, context?: Record<string, any>): void {
        this.triggerByType('time', { scheduledTime, ...context })
    }

    triggerEvent(eventName: string, eventContext?: Record<string, any>): void {
        this.triggerByType('event', { eventName, ...eventContext })
    }

    triggerApi(endpoint: string, method: string, context?: Record<string, any>): void {
        this.triggerByType('api', { endpoint, method, ...context })
    }

    triggerWebhook(webhookId: string, payload: any, context?: Record<string, any>): void {
        this.triggerByType('webhook', { webhookId, payload, ...context })
    }

    private triggerByType(triggerType: TriggerType, context?: Record<string, any>): void {
        for (const [handlerId, handler] of this.handlers) {
            if (!handler.enabled) continue
            if (handler.trigger.type !== triggerType) continue

            // Check if trigger conditions match
            if (this.matchesTriggerConfig(handler.trigger, context)) {
                this.logger.info(`Triggering handler: ${handlerId} for type: ${triggerType}`)
                handler.handler(context)
            }
        }
    }

    private matchesTriggerConfig(trigger: AutomationTrigger, context?: Record<string, any>): boolean {
        if (!context) return true

        // Check if all required config keys match
        for (const [key, expectedValue] of Object.entries(trigger.config)) {
            if (context[key] !== expectedValue) {
                return false
            }
        }

        return true
    }

    private registerEventListener(
        trigger: AutomationTrigger,
        handlerId: string,
        handler: (context?: Record<string, any>) => void
    ): void {
        const eventKey = trigger.config.eventName || trigger.type
        const listeners = this.eventListeners.get(eventKey) || []
        listeners.push(handler)
        this.eventListeners.set(eventKey, listeners)
    }

    private unregisterEventListener(trigger: AutomationTrigger, handlerId: string): void {
        const eventKey = trigger.config.eventName || trigger.type
        const listeners = this.eventListeners.get(eventKey)
        if (listeners) {
            const index = listeners.findIndex(l => l.toString().includes(handlerId))
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }

    getTriggerHandlers(): TriggerHandler[] {
        return Array.from(this.handlers.values())
    }

    getTriggerHandlersByType(triggerType: TriggerType): TriggerHandler[] {
        return this.getTriggerHandlers().filter(h => h.trigger.type === triggerType)
    }

    getEnabledTriggerHandlers(): TriggerHandler[] {
        return this.getTriggerHandlers().filter(h => h.enabled)
    }

    reset(): void {
        this.handlers.clear()
        this.eventListeners.clear()
        this.handlerCounter = 0
        this.logger.info('Reset trigger system')
    }
}

// Singleton instance
let triggerSystem: TriggerSystem | null = null

export function getTriggerSystem(logger?: Logger): TriggerSystem {
    if (!triggerSystem) {
        triggerSystem = new TriggerSystem(logger)
    }
    return triggerSystem
}

export function destroyTriggerSystem(): void {
    if (triggerSystem) {
        triggerSystem.reset()
        triggerSystem = null
    }
}

export function createTriggerSystem(logger?: Logger): TriggerSystem {
    return new TriggerSystem(logger)
}