/**
 * Automation Templates
 * Pre-built automation templates for common workflows
 */

import { AutomationWorkflow, AutomationTrigger, AutomationAction } from '../types'

export interface AutomationTemplate {
    id: string
    name: string
    description: string
    category: string
    tags: string[]
    createWorkflow: (params: Record<string, any>) => AutomationWorkflow
}

export class AutomationTemplates {
    private templates: Map<string, AutomationTemplate> = new Map()

    constructor() {
        this.registerDefaultTemplates()
    }

    private registerDefaultTemplates(): void {
        // File monitoring template
        this.registerTemplate({
            id: 'file-monitor',
            name: 'File Change Monitor',
            description: 'Monitor file changes and run actions',
            category: 'file',
            tags: ['monitoring', 'file', 'automation'],
            createWorkflow: (params) => {
                const filePath = params.filePath || '**/*'
                const actions = params.actions || []

                return {
                    id: 'workflow-file-monitor',
                    name: 'File Change Monitor',
                    description: 'Monitor file changes and execute actions',
                    triggers: [
                        {
                            id: 'trigger-file-change',
                            type: 'file_change',
                            config: { filePath },
                            enabled: true
                        }
                    ],
                    actions,
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    runCount: 0
                }
            }
        })

        // Git automation template
        this.registerTemplate({
            id: 'git-auto-commit',
            name: 'Auto Commit on Save',
            description: 'Automatically commit changes when files are saved',
            category: 'git',
            tags: ['git', 'commit', 'automation'],
            createWorkflow: (params) => {
                const commitMessage = params.commitMessage || 'Auto commit on save'
                const files = params.files || ['*']

                return {
                    id: 'workflow-git-auto-commit',
                    name: 'Auto Commit on Save',
                    description: 'Automatically commit changes when files are saved',
                    triggers: [
                        {
                            id: 'trigger-file-save',
                            type: 'file_save',
                            config: { files },
                            enabled: true
                        }
                    ],
                    actions: [
                        {
                            id: 'action-git-add',
                            type: 'git_operation',
                            config: { operation: 'add', files },
                            enabled: true
                        },
                        {
                            id: 'action-git-commit',
                            type: 'git_operation',
                            config: { operation: 'commit', message: commitMessage },
                            enabled: true
                        }
                    ],
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    runCount: 0
                }
            }
        })

        // Build automation template
        this.registerTemplate({
            id: 'auto-build',
            name: 'Auto Build on Change',
            description: 'Automatically build project when source files change',
            category: 'build',
            tags: ['build', 'development', 'automation'],
            createWorkflow: (params) => {
                const buildCommand = params.buildCommand || 'npm run build'
                const sourceFiles = params.sourceFiles || ['src/**/*']

                return {
                    id: 'workflow-auto-build',
                    name: 'Auto Build on Change',
                    description: 'Automatically build project when source files change',
                    triggers: [
                        {
                            id: 'trigger-file-change',
                            type: 'file_change',
                            config: { files: sourceFiles },
                            enabled: true
                        }
                    ],
                    actions: [
                        {
                            id: 'action-build',
                            type: 'command',
                            config: { command: buildCommand },
                            enabled: true
                        },
                        {
                            id: 'action-notify',
                            type: 'notification',
                            config: { message: 'Build completed successfully' },
                            enabled: true
                        }
                    ],
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    runCount: 0
                }
            }
        })

        // Test automation template
        this.registerTemplate({
            id: 'auto-test',
            name: 'Auto Test on Change',
            description: 'Automatically run tests when source files change',
            category: 'testing',
            tags: ['testing', 'development', 'automation'],
            createWorkflow: (params) => {
                const testCommand = params.testCommand || 'npm test'
                const sourceFiles = params.sourceFiles || ['src/**/*', 'test/**/*']

                return {
                    id: 'workflow-auto-test',
                    name: 'Auto Test on Change',
                    description: 'Automatically run tests when source files change',
                    triggers: [
                        {
                            id: 'trigger-file-change',
                            type: 'file_change',
                            config: { files: sourceFiles },
                            enabled: true
                        }
                    ],
                    actions: [
                        {
                            id: 'action-test',
                            type: 'command',
                            config: { command: testCommand },
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
            }
        })

        // Code quality template
        this.registerTemplate({
            id: 'code-quality',
            name: 'Code Quality Check',
            description: 'Run code quality checks on file save',
            category: 'quality',
            tags: ['quality', 'linting', 'automation'],
            createWorkflow: (params) => {
                const lintCommand = params.lintCommand || 'npm run lint'
                const formatCommand = params.formatCommand || 'npm run format'

                return {
                    id: 'workflow-code-quality',
                    name: 'Code Quality Check',
                    description: 'Run code quality checks on file save',
                    triggers: [
                        {
                            id: 'trigger-file-save',
                            type: 'file_save',
                            config: { files: ['src/**/*'] },
                            enabled: true
                        }
                    ],
                    actions: [
                        {
                            id: 'action-lint',
                            type: 'command',
                            config: { command: lintCommand },
                            enabled: true
                        },
                        {
                            id: 'action-format',
                            type: 'command',
                            config: { command: formatCommand },
                            enabled: true
                        }
                    ],
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    runCount: 0
                }
            }
        })

        // Deployment template
        this.registerTemplate({
            id: 'auto-deploy',
            name: 'Auto Deploy on Commit',
            description: 'Automatically deploy when commits are pushed',
            category: 'deployment',
            tags: ['deployment', 'git', 'automation'],
            createWorkflow: (params) => {
                const deployCommand = params.deployCommand || 'npm run deploy'
                const branch = params.branch || 'main'

                return {
                    id: 'workflow-auto-deploy',
                    name: 'Auto Deploy on Commit',
                    description: 'Automatically deploy when commits are pushed',
                    triggers: [
                        {
                            id: 'trigger-git-commit',
                            type: 'git_commit',
                            config: { branch },
                            enabled: true
                        }
                    ],
                    actions: [
                        {
                            id: 'action-deploy',
                            type: 'command',
                            config: { command: deployCommand },
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
            }
        })

        // Scheduled backup template
        this.registerTemplate({
            id: 'scheduled-backup',
            name: 'Scheduled Backup',
            description: 'Run backup operations on a schedule',
            category: 'backup',
            tags: ['backup', 'scheduled', 'automation'],
            createWorkflow: (params) => {
                const backupCommand = params.backupCommand || 'npm run backup'
                const schedule = params.schedule || 'daily'

                return {
                    id: 'workflow-scheduled-backup',
                    name: 'Scheduled Backup',
                    description: 'Run backup operations on a schedule',
                    triggers: [
                        {
                            id: 'trigger-time',
                            type: 'time',
                            config: { schedule },
                            enabled: true
                        }
                    ],
                    actions: [
                        {
                            id: 'action-backup',
                            type: 'command',
                            config: { command: backupCommand },
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
            }
        })

        // AI code review template
        this.registerTemplate({
            id: 'ai-code-review',
            name: 'AI Code Review',
            description: 'Use AI to review code changes',
            category: 'ai',
            tags: ['ai', 'review', 'automation'],
            createWorkflow: (params) => {
                const reviewPrompt = params.reviewPrompt || 'Review this code for quality and best practices'

                return {
                    id: 'workflow-ai-code-review',
                    name: 'AI Code Review',
                    description: 'Use AI to review code changes',
                    triggers: [
                        {
                            id: 'trigger-file-save',
                            type: 'file_save',
                            config: { files: ['src/**/*'] },
                            enabled: true
                        }
                    ],
                    actions: [
                        {
                            id: 'action-ai-review',
                            type: 'ai_task',
                            config: { prompt: reviewPrompt },
                            enabled: true
                        }
                    ],
                    enabled: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    runCount: 0
                }
            }
        })
    }

    registerTemplate(template: AutomationTemplate): void {
        this.templates.set(template.id, template)
    }

    unregisterTemplate(templateId: string): boolean {
        return this.templates.delete(templateId)
    }

    getTemplate(templateId: string): AutomationTemplate | undefined {
        return this.templates.get(templateId)
    }

    getTemplates(): AutomationTemplate[] {
        return Array.from(this.templates.values())
    }

    getTemplatesByCategory(category: string): AutomationTemplate[] {
        return this.getTemplates().filter(t => t.category === category)
    }

    getTemplatesByTag(tag: string): AutomationTemplate[] {
        return this.getTemplates().filter(t => t.tags.includes(tag))
    }

    searchTemplates(query: string): AutomationTemplate[] {
        const queryLower = query.toLowerCase()
        return this.getTemplates().filter(template =>
            template.name.toLowerCase().includes(queryLower) ||
            template.description.toLowerCase().includes(queryLower) ||
            template.tags.some(tag => tag.toLowerCase().includes(queryLower))
        )
    }

    createWorkflowFromTemplate(templateId: string, params: Record<string, any>): AutomationWorkflow | null {
        const template = this.templates.get(templateId)
        if (!template) return null

        return template.createWorkflow(params)
    }

    getCategories(): string[] {
        const categories = new Set<string>()
        for (const template of this.templates.values()) {
            categories.add(template.category)
        }
        return Array.from(categories)
    }

    getAllTags(): string[] {
        const tags = new Set<string>()
        for (const template of this.templates.values()) {
            template.tags.forEach(tag => tags.add(tag))
        }
        return Array.from(tags)
    }

    reset(): void {
        this.templates.clear()
        this.registerDefaultTemplates()
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

export function destroyAutomationTemplates(): void {
    if (automationTemplates) {
        automationTemplates.reset()
        automationTemplates = null
    }
}

export function createAutomationTemplates(): AutomationTemplates {
    return new AutomationTemplates()
}