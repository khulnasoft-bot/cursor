/**
 * Action Registry
 * Registry for available automation actions with validation and execution
 */

import log from 'electron-log'
import type { AutomationAction } from './automationService'

export interface ActionDefinition {
    type: string
    name: string
    description: string
    category: 'system' | 'file' | 'git' | 'ai' | 'notification' | 'custom'
    configSchema: Record<string, { type: string; required: boolean; description: string }>
    execute: (config: Record<string, any>) => Promise<string>
}

export class ActionRegistry {
    private actions: Map<string, ActionDefinition> = new Map()

    constructor() {
        this.registerDefaultActions()
    }

    private registerDefaultActions(): void {
        // System actions
        this.registerAction({
            type: 'log',
            name: 'Log Message',
            description: 'Log a message to the console',
            category: 'system',
            configSchema: {
                message: { type: 'string', required: true, description: 'Message to log' },
                level: { type: 'string', required: false, description: 'Log level (info, warn, error)' }
            },
            execute: async (config) => {
                const level = config.level || 'info'
                log[level](config.message)
                return `Logged: ${config.message}`
            }
        })

        this.registerAction({
            type: 'delay',
            name: 'Delay',
            description: 'Wait for a specified duration',
            category: 'system',
            configSchema: {
                duration: { type: 'number', required: true, description: 'Duration in milliseconds' }
            },
            execute: async (config) => {
                await new Promise(resolve => setTimeout(resolve, config.duration))
                return `Delayed for ${config.duration}ms`
            }
        })

        // File actions
        this.registerAction({
            type: 'file_read',
            name: 'Read File',
            description: 'Read content from a file',
            category: 'file',
            configSchema: {
                filePath: { type: 'string', required: true, description: 'Path to the file' }
            },
            execute: async (config) => {
                // Placeholder for actual file reading
                return `Read file: ${config.filePath}`
            }
        })

        this.registerAction({
            type: 'file_write',
            name: 'Write File',
            description: 'Write content to a file',
            category: 'file',
            configSchema: {
                filePath: { type: 'string', required: true, description: 'Path to the file' },
                content: { type: 'string', required: true, description: 'Content to write' },
                append: { type: 'boolean', required: false, description: 'Append to file instead of overwrite' }
            },
            execute: async (config) => {
                // Placeholder for actual file writing
                return `Wrote to file: ${config.filePath}`
            }
        })

        this.registerAction({
            type: 'file_delete',
            name: 'Delete File',
            description: 'Delete a file',
            category: 'file',
            configSchema: {
                filePath: { type: 'string', required: true, description: 'Path to the file' }
            },
            execute: async (config) => {
                // Placeholder for actual file deletion
                return `Deleted file: ${config.filePath}`
            }
        })

        // Git actions
        this.registerAction({
            type: 'git_add',
            name: 'Git Add',
            description: 'Stage files for commit',
            category: 'git',
            configSchema: {
                files: { type: 'array', required: true, description: 'Files to stage' }
            },
            execute: async (config) => {
                // Placeholder for actual git add
                return `Staged files: ${config.files.join(', ')}`
            }
        })

        this.registerAction({
            type: 'git_commit',
            name: 'Git Commit',
            description: 'Create a commit',
            category: 'git',
            configSchema: {
                message: { type: 'string', required: true, description: 'Commit message' }
            },
            execute: async (config) => {
                // Placeholder for actual git commit
                return `Committed: ${config.message}`
            }
        })

        this.registerAction({
            type: 'git_push',
            name: 'Git Push',
            description: 'Push commits to remote',
            category: 'git',
            configSchema: {
                branch: { type: 'string', required: false, description: 'Branch to push' },
                remote: { type: 'string', required: false, description: 'Remote to push to' }
            },
            execute: async (config) => {
                // Placeholder for actual git push
                return `Pushed to ${config.remote || 'origin'}`
            }
        })

        // AI actions
        this.registerAction({
            type: 'ai_generate',
            name: 'AI Generate',
            description: 'Generate content using AI',
            category: 'ai',
            configSchema: {
                prompt: { type: 'string', required: true, description: 'Prompt for AI' },
                context: { type: 'object', required: false, description: 'Additional context' }
            },
            execute: async (config) => {
                // Placeholder for actual AI generation
                return `Generated content for: ${config.prompt}`
            }
        })

        this.registerAction({
            type: 'ai_refactor',
            name: 'AI Refactor',
            description: 'Refactor code using AI',
            category: 'ai',
            configSchema: {
                code: { type: 'string', required: true, description: 'Code to refactor' },
                instructions: { type: 'string', required: true, description: 'Refactoring instructions' }
            },
            execute: async (config) => {
                // Placeholder for actual AI refactoring
                return `Refactored code with instructions: ${config.instructions}`
            }
        })

        // Notification actions
        this.registerAction({
            type: 'notify',
            name: 'Send Notification',
            description: 'Send a desktop notification',
            category: 'notification',
            configSchema: {
                title: { type: 'string', required: true, description: 'Notification title' },
                body: { type: 'string', required: true, description: 'Notification body' }
            },
            execute: async (config) => {
                // Placeholder for actual notification
                return `Sent notification: ${config.title}`
            }
        })

        this.registerAction({
            type: 'alert',
            name: 'Show Alert',
            description: 'Show an alert dialog',
            category: 'notification',
            configSchema: {
                message: { type: 'string', required: true, description: 'Alert message' }
            },
            execute: async (config) => {
                // Placeholder for actual alert
                return `Showed alert: ${config.message}`
            }
        })
    }

    registerAction(definition: ActionDefinition): void {
        this.actions.set(definition.type, definition)
        log.info(`Registered action: ${definition.type}`)
    }

    unregisterAction(type: string): boolean {
        const deleted = this.actions.delete(type)
        if (deleted) {
            log.info(`Unregistered action: ${type}`)
        }
        return deleted
    }

    getAction(type: string): ActionDefinition | undefined {
        return this.actions.get(type)
    }

    getActions(): ActionDefinition[] {
        return Array.from(this.actions.values())
    }

    getActionsByCategory(category: ActionDefinition['category']): ActionDefinition[] {
        return this.getActions().filter(a => a.category === category)
    }

    validateAction(action: AutomationAction): { valid: boolean; errors: string[] } {
        const definition = this.actions.get(action.type)
        if (!definition) {
            return { valid: false, errors: [`Unknown action type: ${action.type}`] }
        }

        const errors: string[] = []

        for (const [key, schema] of Object.entries(definition.configSchema)) {
            if (schema.required && action.config[key] === undefined) {
                errors.push(`Missing required config: ${key}`)
            }

            if (action.config[key] !== undefined) {
                const value = action.config[key]
                const expectedType = schema.type

                if (expectedType === 'string' && typeof value !== 'string') {
                    errors.push(`Config ${key} must be a string`)
                } else if (expectedType === 'number' && typeof value !== 'number') {
                    errors.push(`Config ${key} must be a number`)
                } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
                    errors.push(`Config ${key} must be a boolean`)
                } else if (expectedType === 'array' && !Array.isArray(value)) {
                    errors.push(`Config ${key} must be an array`)
                } else if (expectedType === 'object' && typeof value !== 'object') {
                    errors.push(`Config ${key} must be an object`)
                }
            }
        }

        return { valid: errors.length === 0, errors }
    }

    async executeAction(action: AutomationAction): Promise<string> {
        const definition = this.actions.get(action.type)
        if (!definition) {
            throw new Error(`Unknown action type: ${action.type}`)
        }

        const validation = this.validateAction(action)
        if (!validation.valid) {
            throw new Error(`Invalid action config: ${validation.errors.join(', ')}`)
        }

        log.info(`Executing action: ${action.type}`)
        return await definition.execute(action.config)
    }

    searchActions(query: string): ActionDefinition[] {
        const queryLower = query.toLowerCase()
        return this.getActions().filter(action =>
            action.name.toLowerCase().includes(queryLower) ||
            action.description.toLowerCase().includes(queryLower) ||
            action.type.toLowerCase().includes(queryLower)
        )
    }

    getCategories(): ActionDefinition['category'][] {
        const categories = new Set<ActionDefinition['category']>()
        for (const action of this.actions.values()) {
            categories.add(action.category)
        }
        return Array.from(categories)
    }

    clearCustomActions(): void {
        const defaultActions = new Set([
            'log', 'delay', 'file_read', 'file_write', 'file_delete',
            'git_add', 'git_commit', 'git_push',
            'ai_generate', 'ai_refactor', 'notify', 'alert'
        ])

        for (const [type] of this.actions) {
            if (!defaultActions.has(type)) {
                this.actions.delete(type)
            }
        }

        log.info('Cleared custom actions')
    }

    reset(): void {
        this.actions.clear()
        this.registerDefaultActions()
        log.info('Reset action registry')
    }
}

// Singleton instance
let actionRegistry: ActionRegistry | null = null

export function getActionRegistry(): ActionRegistry {
    if (!actionRegistry) {
        actionRegistry = new ActionRegistry()
    }
    return actionRegistry
}

export function destroyActionRegistry() {
    if (actionRegistry) {
        actionRegistry.reset()
        actionRegistry = null
    }
}
