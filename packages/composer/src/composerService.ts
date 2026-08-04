/**
 * Cursor Composer Service
 * Multi-file editing orchestration engine for coordinated changes across files
 * Extracted and adapted from Cursor's composer service
 */

import {
    FileChange,
    ComposerRequest,
    ComposerResult,
    ComposerExecution,
    ExecutionStatus,
    ComposerConfig
} from './types'
import { Logger, ConsoleLogger } from './logger'

// AI Service interface for integration
export interface AIService {
    sendMessage(message: string, context?: any): Promise<string>
}

export class ComposerService {
    private aiService: AIService | null = null
    private activeExecutions: Map<string, ComposerExecution> = new Map()
    private executionCounter = 0
    private config: ComposerConfig
    private logger: Logger

    constructor(config: ComposerConfig = {}, logger?: Logger) {
        this.config = {
            maxConcurrentExecutions: 3,
            executionTimeoutMs: 300000, // 5 minutes
            defaultMaxFiles: 10,
            enableRollback: true,
            logLevel: 'info',
            ...config
        }
        this.logger = logger || new ConsoleLogger()
    }

    setAIService(aiService: AIService): void {
        this.aiService = aiService
        this.logger.info('AI service set for composer')
    }

    updateConfig(config: Partial<ComposerConfig>): void {
        this.config = { ...this.config, ...config }
        this.logger.info('Composer service configuration updated')
    }

    getConfig(): ComposerConfig {
        return { ...this.config }
    }

    async planChanges(request: ComposerRequest): Promise<ComposerResult> {
        if (!this.aiService) {
            throw new Error('AI service not set. Call setAIService() first.')
        }

        this.logger.info('Planning multi-file changes for prompt:', request.prompt)

        // Build AI context with all relevant files
        const aiContext = {
            files: Array.from(request.context.files.keys()),
            projectPath: request.context.projectPath,
            language: request.context.language
        }

        // Build prompt for AI to generate coordinated changes
        const planningPrompt = this.buildPlanningPrompt(request)

        try {
            const response = await this.aiService.sendMessage(planningPrompt, aiContext)

            // Parse the AI response to extract file changes
            const changes = this.parseChangesResponse(response, request.context.files)

            // Validate constraints
            this.validateConstraints(changes, request.constraints)

            // Build dependency graph
            const dependencies = this.buildDependencyGraph(changes)

            // Determine execution order (topological sort)
            const executionOrder = this.topologicalSort(changes, dependencies)

            // Generate summary
            const summary = this.generateSummary(changes, request.prompt)

            return {
                changes,
                summary,
                estimatedTime: this.estimateExecutionTime(changes),
                dependencies,
                executionOrder
            }
        } catch (error) {
            this.logger.error('Failed to plan changes:', error)
            throw error
        }
    }

    async executeChanges(result: ComposerResult): Promise<ComposerExecution> {
        const requestId = `composer-exec-${++this.executionCounter}`

        const execution: ComposerExecution = {
            requestId,
            status: 'pending',
            changes: result.changes,
            executedChanges: [],
            failedChanges: [],
            currentStep: 0,
            totalSteps: result.executionOrder.length,
            startTime: new Date(),
            appliedChanges: new Map(),
            rollbackData: new Map(),
            canRollback: this.config.enableRollback ?? true
        }

        this.activeExecutions.set(requestId, execution)

        try {
            execution.status = 'in_progress'

            // Execute changes in dependency order
            for (const changeId of result.executionOrder) {
                execution.currentStep++

                const change = result.changes.find(c => c.filePath === changeId)
                if (!change) {
                    throw new Error(`Change not found: ${changeId}`)
                }

                // Store original content for rollback
                if (execution.canRollback && execution.rollbackData) {
                    execution.rollbackData.set(change.filePath, change.originalContent)
                }

                // Apply the change (placeholder - would integrate with file system)
                await this.executeSingleChange(change)
                execution.appliedChanges.set(change.filePath, change.proposedContent)
                execution.executedChanges.push(changeId)
            }

            execution.status = 'completed'
            this.logger.info(`Composer execution completed: ${requestId}`)
        } catch (error) {
            execution.status = 'failed'
            execution.error = error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(`Composer execution failed: ${requestId}`, error)
        } finally {
            execution.endTime = new Date()
        }

        return execution
    }

    async rollbackExecution(requestId: string): Promise<ComposerExecution> {
        const execution = this.activeExecutions.get(requestId)
        if (!execution) {
            throw new Error(`Execution not found: ${requestId}`)
        }

        if (!execution.canRollback) {
            throw new Error(`Execution cannot be rolled back: ${requestId}`)
        }

        if (!execution.rollbackData || execution.rollbackData.size === 0) {
            throw new Error(`No rollback data available for execution: ${requestId}`)
        }

        this.logger.info(`Rolling back execution: ${requestId}`)

        try {
            // Rollback changes in reverse order
            const reversedOrder = [...execution.executedChanges].reverse()

            for (const filePath of reversedOrder) {
                const originalContent = execution.rollbackData.get(filePath)
                if (originalContent !== undefined) {
                    // Restore original content (placeholder - would integrate with file system)
                    await this.restoreFileContent(filePath, originalContent)
                    this.logger.info(`Rolled back file: ${filePath}`)
                }
            }

            execution.canRollback = false
            this.logger.info(`Rollback completed for execution: ${requestId}`)
        } catch (error) {
            this.logger.error(`Rollback failed for execution ${requestId}:`, error)
            throw error
        }

        return execution
    }

    private async executeSingleChange(change: FileChange): Promise<void> {
        // This would integrate with the file system to apply changes
        // For now, this is a placeholder
        this.logger.info(`Executing change for ${change.filePath}: ${change.description}`)
        
        // In a real implementation, this would:
        // 1. Read the current file content
        // 2. Apply the change based on changeType
        // 3. Write the new content back to the file
        // 4. Handle merge conflicts if they arise
    }

    private async restoreFileContent(filePath: string, content: string): Promise<void> {
        // This would integrate with the file system to restore content
        this.logger.info(`Restoring content for ${filePath}`)
        
        // In a real implementation, this would:
        // 1. Write the original content back to the file
        // 2. Verify the restoration was successful
    }

    private buildPlanningPrompt(request: ComposerRequest): string {
        let prompt = `You are an AI coding assistant that can make coordinated changes across multiple files.\n\n`
        prompt += `User request: ${request.prompt}\n\n`
        prompt += `Available files:\n`

        for (const [filePath, content] of request.context.files) {
            const preview = content.substring(0, 500) + (content.length > 500 ? '...' : '')
            prompt += `- ${filePath}\n`
            prompt += `  Preview: ${preview}\n\n`
        }

        const maxFiles = request.constraints?.maxFiles || this.config.defaultMaxFiles
        prompt += `\nGenerate a plan of changes needed to fulfill the user's request.\n`
        prompt += `Limit changes to at most ${maxFiles} files.\n`
        prompt += `For each change, specify:\n`
        prompt += `- File path\n`
        prompt += `- Type of change (insert, delete, replace, move)\n`
        prompt += `- Line range affected\n`
        prompt += `- Description of the change\n`
        prompt += `- Dependencies on other changes\n\n`

        prompt += `Format your response as a structured list that can be parsed programmatically.\n`
        prompt += `Be specific about line numbers and exact changes.`

        return prompt
    }

    private parseChangesResponse(response: string, files: Map<string, string>): FileChange[] {
        const changes: FileChange[] = []

        // Parse the AI response to extract file changes
        // This is a simplified parser - in production, would use more robust parsing
        const lines = response.split('\n')
        let currentChange: Partial<FileChange> | null = null

        for (const line of lines) {
            if (line.startsWith('File:')) {
                if (currentChange) {
                    if (currentChange.filePath && currentChange.originalContent !== undefined) {
                        changes.push(currentChange as FileChange)
                    }
                }
                const filePath = line.substring(5).trim()
                currentChange = {
                    filePath,
                    originalContent: files.get(filePath) || '',
                    proposedContent: '',
                    changeType: 'replace',
                    lineRange: { start: 0, end: 0 },
                    description: '',
                    dependencies: [],
                    dependents: []
                }
            } else if (line.startsWith('Type:') && currentChange) {
                currentChange.changeType = line.substring(5).trim() as any
            } else if (line.startsWith('Lines:') && currentChange) {
                const range = line.substring(6).trim().split('-')
                currentChange.lineRange = {
                    start: parseInt(range[0]) || 0,
                    end: parseInt(range[1]) || 0
                }
            } else if (line.startsWith('Description:') && currentChange) {
                currentChange.description = line.substring(12).trim()
            } else if (line.startsWith('Dependencies:') && currentChange) {
                currentChange.dependencies = line.substring(13).trim().split(',').map(s => s.trim()).filter(s => s.length > 0)
            }
        }

        if (currentChange && currentChange.filePath && currentChange.originalContent !== undefined) {
            changes.push(currentChange as FileChange)
        }

        return changes
    }

    private validateConstraints(changes: FileChange[], constraints?: ComposerRequest['constraints']): void {
        if (!constraints) return

        if (constraints.maxFiles && changes.length > constraints.maxFiles) {
            throw new Error(`Too many files: ${changes.length} (max: ${constraints.maxFiles})`)
        }

        if (constraints.allowedPaths) {
            for (const change of changes) {
                const allowed = constraints.allowedPaths.some(path => change.filePath.startsWith(path))
                if (!allowed) {
                    throw new Error(`File not in allowed paths: ${change.filePath}`)
                }
            }
        }

        if (constraints.forbiddenPaths) {
            for (const change of changes) {
                const forbidden = constraints.forbiddenPaths.some(path => change.filePath.startsWith(path))
                if (forbidden) {
                    throw new Error(`File in forbidden paths: ${change.filePath}`)
                }
            }
        }
    }

    private buildDependencyGraph(changes: FileChange[]): Map<string, string[]> {
        const dependencies = new Map<string, string[]>()

        for (const change of changes) {
            dependencies.set(change.filePath, change.dependencies)

            // Build reverse dependencies
            for (const dep of change.dependencies) {
                if (!dependencies.has(dep)) {
                    dependencies.set(dep, [])
                }
                const existing = dependencies.get(dep)!
                if (!existing.includes(change.filePath)) {
                    existing.push(change.filePath)
                }
            }
        }

        return dependencies
    }

    private topologicalSort(changes: FileChange[], dependencies: Map<string, string[]>): string[] {
        const visited = new Set<string>()
        const temp = new Set<string>()
        const order: string[] = []

        const visit = (node: string) => {
            if (temp.has(node)) {
                throw new Error(`Circular dependency detected involving ${node}`)
            }
            if (visited.has(node)) {
                return
            }

            temp.add(node)

            const deps = dependencies.get(node) || []
            for (const dep of deps) {
                visit(dep)
            }

            temp.delete(node)
            visited.add(node)
            order.push(node)
        }

        for (const change of changes) {
            if (!visited.has(change.filePath)) {
                visit(change.filePath)
            }
        }

        return order.reverse()
    }

    private generateSummary(changes: FileChange[], prompt: string): string {
        const changeCount = changes.length
        const fileCount = new Set(changes.map(c => c.filePath)).size

        let summary = `Planned ${changeCount} change${changeCount !== 1 ? 's' : ''} across ${fileCount} file${fileCount !== 1 ? 's' : ''}.\n`
        summary += `Request: "${prompt}"\n\n`

        for (const change of changes) {
            summary += `- ${change.filePath}: ${change.description}\n`
        }

        return summary
    }

    private estimateExecutionTime(changes: FileChange[]): number {
        // Simple heuristic: 1 second per change + 0.5 seconds per dependency
        let time = changes.length * 1000
        for (const change of changes) {
            time += change.dependencies.length * 500
        }
        return time
    }

    getExecution(requestId: string): ComposerExecution | undefined {
        return this.activeExecutions.get(requestId)
    }

    cancelExecution(requestId: string): boolean {
        const execution = this.activeExecutions.get(requestId)
        if (execution && (execution.status === 'pending' || execution.status === 'in_progress')) {
            execution.status = 'cancelled'
            this.logger.info(`Cancelled composer execution: ${requestId}`)
            return true
        }
        return false
    }

    getActiveExecutions(): ComposerExecution[] {
        return Array.from(this.activeExecutions.values()).filter(
            e => e.status === 'pending' || e.status === 'in_progress'
        )
    }

    clearExecutions(): void {
        this.activeExecutions.clear()
        this.logger.info('Cleared all composer executions')
    }

    reset(): void {
        this.activeExecutions.clear()
        this.executionCounter = 0
        this.logger.info('Reset composer service')
    }
}

// Singleton instance
let composerService: ComposerService | null = null

export function getComposerService(config?: ComposerConfig, logger?: Logger): ComposerService {
    if (!composerService) {
        composerService = new ComposerService(config, logger)
    }
    return composerService
}

export function destroyComposerService(): void {
    if (composerService) {
        composerService.reset()
        composerService = null
    }
}

export function createComposerService(config?: ComposerConfig, logger?: Logger): ComposerService {
    return new ComposerService(config, logger)
}