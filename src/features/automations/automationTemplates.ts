/**
 * Automation Templates Library
 * Pre-built automation templates for common workflows
 */

import type { AutomationWorkflow } from './automationService'

export interface AutomationTemplate {
    id: string
    name: string
    description: string
    category: 'development' | 'testing' | 'deployment' | 'maintenance' | 'productivity' | 'custom'
    workflow: AutomationWorkflow
}

export class AutomationTemplates {
    private templates: Map<string, AutomationTemplate> = new Map()

    constructor() {
        this.initializeTemplates()
    }

    private initializeTemplates(): void {
        // Development templates
        this.addTemplate({
            id: 'dev-format-on-save',
            name: 'Format on Save',
            description: 'Automatically format code when files are saved',
            category: 'development',
            workflow: {
                id: 'template-dev-format-on-save',
                name: 'Format on Save',
                description: 'Automatically format code when files are saved',
                triggers: [
                    {
                        id: 'trigger-file-save',
                        type: 'file_save',
                        config: { filePattern: '*.{js,ts,jsx,tsx,py,go,rs}' },
                        enabled: true
                    }
                ],
                actions: [
                    {
                        id: 'action-format',
                        type: 'command',
                        config: { command: 'npm run format' },
                        enabled: true
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                runCount: 0
            }
        })

        this.addTemplate({
            id: 'dev-lint-on-save',
            name: 'Lint on Save',
            description: 'Run linter when files are saved',
            category: 'development',
            workflow: {
                id: 'template-dev-lint-on-save',
                name: 'Lint on Save',
                description: 'Run linter when files are saved',
                triggers: [
                    {
                        id: 'trigger-file-save',
                        type: 'file_save',
                        config: { filePattern: '*.{js,ts,jsx,tsx}' },
                        enabled: true
                    }
                ],
                actions: [
                    {
                        id: 'action-lint',
                        type: 'command',
                        config: { command: 'npm run lint' },
                        enabled: true
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                runCount: 0
            }
        })

        // Testing templates
        this.addTemplate({
            id: 'test-run-on-change',
            name: 'Run Tests on Change',
            description: 'Run relevant tests when files change',
            category: 'testing',
            workflow: {
                id: 'template-test-run-on-change',
                name: 'Run Tests on Change',
                description: 'Run relevant tests when files change',
                triggers: [
                    {
                        id: 'trigger-file-change',
                        type: 'file_change',
                        config: { filePattern: '*.{js,ts,jsx,tsx,py}' },
                        enabled: true
                    }
                ],
                actions: [
                    {
                        id: 'action-test',
                        type: 'command',
                        config: { command: 'npm test' },
                        enabled: true
                    },
                    {
                        id: 'action-notify',
                        type: 'notification',
                        config: { message: 'Tests completed' },
                        enabled: true
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                runCount: 0
            }
        })

        // Deployment templates
        this.addTemplate({
            id: 'deploy-on-commit',
            name: 'Deploy on Commit',
            description: 'Automatically deploy when committing to main branch',
            category: 'deployment',
            workflow: {
                id: 'template-deploy-on-commit',
                name: 'Deploy on Commit',
                description: 'Automatically deploy when committing to main branch',
                triggers: [
                    {
                        id: 'trigger-git-commit',
                        type: 'git_commit',
                        config: { branch: 'main' },
                        enabled: true
                    }
                ],
                actions: [
                    {
                        id: 'action-build',
                        type: 'command',
                        config: { command: 'npm run build' },
                        enabled: true
                    },
                    {
                        id: 'action-deploy',
                        type: 'command',
                        config: { command: 'npm run deploy' },
                        enabled: true
                    },
                    {
                        id: 'action-notify',
                        type: 'notification',
                        config: { message: 'Deployment completed' },
                        enabled: true
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                runCount: 0
            }
        })

        // Maintenance templates
        this.addTemplate({
            id: 'maint-daily-backup',
            name: 'Daily Backup',
            description: 'Create daily backups of the project',
            category: 'maintenance',
            workflow: {
                id: 'template-maint-daily-backup',
                name: 'Daily Backup',
                description: 'Create daily backups of the project',
                triggers: [
                    {
                        id: 'trigger-time',
                        type: 'time',
                        config: { schedule: 'every 1 day' },
                        enabled: true
                    }
                ],
                actions: [
                    {
                        id: 'action-backup',
                        type: 'command',
                        config: { command: 'npm run backup' },
                        enabled: true
                    },
                    {
                        id: 'action-notify',
                        type: 'notification',
                        config: { message: 'Backup completed' },
                        enabled: true
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                runCount: 0
            }
        })

        this.addTemplate({
            id: 'maint-cleanup-temp',
            name: 'Cleanup Temp Files',
            description: 'Clean up temporary files weekly',
            category: 'maintenance',
            workflow: {
                id: 'template-maint-cleanup-temp',
                name: 'Cleanup Temp Files',
                description: 'Clean up temporary files weekly',
                triggers: [
                    {
                        id: 'trigger-time',
                        type: 'time',
                        config: { schedule: 'every 7 day' },
                        enabled: true
                    }
                ],
                actions: [
                    {
                        id: 'action-cleanup',
                        type: 'command',
                        config: { command: 'rm -rf /tmp/*' },
                        enabled: true
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                runCount: 0
            }
        })

        // Productivity templates
        this.addTemplate({
            id: 'prod-git-commit-reminder',
            name: 'Git Commit Reminder',
            description: 'Remind to commit changes periodically',
            category: 'productivity',
            workflow: {
                id: 'template-prod-git-commit-reminder',
                name: 'Git Commit Reminder',
                description: 'Remind to commit changes periodically',
                triggers: [
                    {
                        id: 'trigger-time',
                        type: 'time',
                        config: { schedule: 'every 2 hour' },
                        enabled: true
                    }
                ],
                actions: [
                    {
                        id: 'action-notify',
                        type: 'notification',
                        config: { message: 'Don\'t forget to commit your changes!' },
                        enabled: true
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                runCount: 0
            }
        })

        this.addTemplate({
            id: 'prod-daily-summary',
            name: 'Daily Summary',
            description: 'Generate a daily summary of work',
            category: 'productivity',
            workflow: {
                id: 'template-prod-daily-summary',
                name: 'Daily Summary',
                description: 'Generate a daily summary of work',
                triggers: [
                    {
                        id: 'trigger-time',
                        type: 'time',
                        config: { schedule: 'every 1 day' },
                        enabled: true
                    }
                ],
                actions: [
                    {
                        id: 'action-ai-summary',
                        type: 'ai_task',
                        config: { prompt: 'Generate a summary of today\'s work based on git commits' },
                        enabled: true
                    },
                    {
                        id: 'action-notify',
                        type: 'notification',
                        config: { message: 'Daily summary generated' },
                        enabled: true
                    }
                ],
                enabled: true,
                createdAt: new Date(),
                updatedAt: new Date(),
                runCount: 0
            }
        })
    }

    private addTemplate(template: AutomationTemplate): void {
        this.templates.set(template.id, template)
    }

    getTemplate(id: string): AutomationTemplate | undefined {
        return this.templates.get(id)
    }

    getTemplates(): AutomationTemplate[] {
        return Array.from(this.templates.values())
    }

    getTemplatesByCategory(category: AutomationTemplate['category']): AutomationTemplate[] {
        return this.getTemplates().filter(t => t.category === category)
    }

    searchTemplates(query: string): AutomationTemplate[] {
        const queryLower = query.toLowerCase()
        return this.getTemplates().filter(template =>
            template.name.toLowerCase().includes(queryLower) ||
            template.description.toLowerCase().includes(queryLower)
        )
    }

    async useTemplate(templateId: string, customizations?: Partial<AutomationWorkflow>): Promise<AutomationWorkflow> {
        const template = this.getTemplate(templateId)
        if (!template) {
            throw new Error(`Template not found: ${templateId}`)
        }

        const workflow: AutomationWorkflow = {
            ...template.workflow,
            id: `workflow-${Date.now()}`,
            ...customizations,
            createdAt: new Date(),
            updatedAt: new Date(),
            runCount: 0
        }

        return workflow
    }

    createCustomTemplate(
        name: string,
        description: string,
        category: AutomationTemplate['category'],
        workflow: AutomationWorkflow
    ): AutomationTemplate {
        const template: AutomationTemplate = {
            id: `custom-${Date.now()}`,
            name,
            description,
            category,
            workflow
        }
        this.addTemplate(template)
        return template
    }

    deleteTemplate(id: string): boolean {
        return this.templates.delete(id)
    }

    exportTemplate(id: string): string {
        const template = this.getTemplate(id)
        if (!template) {
            throw new Error(`Template not found: ${id}`)
        }
        return JSON.stringify(template, null, 2)
    }

    importTemplate(json: string): AutomationTemplate {
        const template = JSON.parse(json) as AutomationTemplate
        this.addTemplate(template)
        return template
    }

    exportAllTemplates(): string {
        return JSON.stringify(this.getTemplates(), null, 2)
    }

    importAllTemplates(json: string): number {
        const templates = JSON.parse(json) as AutomationTemplate[]
        let count = 0
        for (const template of templates) {
            this.addTemplate(template)
            count++
        }
        return count
    }

    getCategories(): AutomationTemplate['category'][] {
        const categories = new Set<AutomationTemplate['category']>()
        for (const template of this.templates.values()) {
            categories.add(template.category)
        }
        return Array.from(categories)
    }

    getStatistics(): {
        totalTemplates: number
        templatesByCategory: Record<AutomationTemplate['category'], number>
    } {
        const templatesByCategory: Record<AutomationTemplate['category'], number> = {
            development: 0,
            testing: 0,
            deployment: 0,
            maintenance: 0,
            productivity: 0,
            custom: 0
        }

        for (const template of this.templates.values()) {
            templatesByCategory[template.category]++
        }

        return {
            totalTemplates: this.templates.size,
            templatesByCategory
        }
    }

    clearCustomTemplates(): void {
        const defaultTemplateIds = new Set([
            'dev-format-on-save',
            'dev-lint-on-save',
            'test-run-on-change',
            'deploy-on-commit',
            'maint-daily-backup',
            'maint-cleanup-temp',
            'prod-git-commit-reminder',
            'prod-daily-summary'
        ])

        for (const [id] of this.templates) {
            if (!defaultTemplateIds.has(id)) {
                this.templates.delete(id)
            }
        }
    }

    reset(): void {
        this.templates.clear()
        this.initializeTemplates()
    }
}

// Singleton instance
let automationTemplates: AutomationTemplates | null = null

export function getAutomationTemplates(): AutomationTemplates {
    if (!automationTemplates) {
        automationTemplates = new AutomationTemplates()
    }
    return automationTemplates
}

export function destroyAutomationTemplates() {
    if (automationTemplates) {
        automationTemplates.reset()
        automationTemplates = null
    }
}
