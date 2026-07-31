/**
 * Composer Service
 * Multi-file editing orchestration engine for coordinated changes across files
 */

import log from 'electron-log'
import { getAIService } from '../../main/aiService'
import type { AIContext } from '../../main/aiService'

export interface FileChange {
    filePath: string
    originalContent: string
    proposedContent: string
    changeType: 'insert' | 'delete' | 'replace' | 'move'
    lineRange: { start: number; end: number }
    description: string
    dependencies: string[] // Other file changes this depends on
    dependents: string[] // Other file changes that depend on this
}

export interface ComposerRequest {
    prompt: string
    context: {
        projectPath: string
        files: Map<string, string> // filePath -> content
        language?: string
    }
    constraints?: {
        maxFiles?: number
        allowedPaths?: string[]
        forbiddenPaths?: string[]
    }
}

export interface ComposerResult {
    changes: FileChange[]
    summary: string
    estimatedTime: number
    dependencies: Map<string, string[]> // changeId -> dependent changeIds
    executionOrder: string[]
}

export interface ComposerExecution {
    requestId: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
    changes: FileChange[]
    executedChanges: string[]
    failedChanges: string[]
    currentStep: number
    totalSteps: number
    error?: string
}

export class ComposerService {
    private aiService = getAIService()
    private activeExecutions: Map<string, ComposerExecution> = new Map()
    private executionCounter = 0

    async planChanges(request: ComposerRequest): Promise<ComposerResult> {
        log.info('Planning multi-file changes for prompt:', request.prompt)

        // Build AI context with all relevant files
        const aiContext: AIContext = {
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
            log.error('Failed to plan changes:', error)
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
            totalSteps: result.executionOrder.length
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

                // Execute the change
                await this.executeSingleChange(change)
                execution.executedChanges.push(changeId)
            }

            execution.status = 'completed'
            log.info(`Composer execution completed: ${requestId}`)
        } catch (error) {
            execution.status = 'failed'
            execution.error = error instanceof Error ? error.message : 'Unknown error'
            log.error(`Composer execution failed: ${requestId}`, error)
        }

        return execution
    }

    private async executeSingleChange(change: FileChange): Promise<void> {
        // This would integrate with the file system to apply changes
        // For now, this is a placeholder
        // TODO: Implement actual file modification
        log.info(`Executing change for ${change.filePath}: ${change.description}`)
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

        prompt += `\nGenerate a plan of changes needed to fulfill the user's request.\n`
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
                currentChange = {
                    filePath: line.substring(5).trim(),
                    originalContent: files.get(line.substring(5).trim()) || '',
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
                currentChange.dependencies = line.substring(13).trim().split(',').map(s => s.trim())
            }
        }
        
        if (currentChange && currentChange.filePath && currentChange.originalContent !== undefined) {
            changes.push(currentChange as FileChange)
        }

        return changes
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
            log.info(`Cancelled composer execution: ${requestId}`)
            return true
        }
        return false
    }

    getActiveExecutions(): ComposerExecution[] {
        return Array.from(this.activeExecutions.values()).filter(
            e => e.status === 'pending' || e.status === 'in_progress'
        )
    }
}

// Singleton instance
let composerService: ComposerService | null = null

export function getComposerService(): ComposerService {
    if (!composerService) {
        composerService = new ComposerService()
    }
    return composerService
}

export function destroyComposerService() {
    if (composerService) {
        composerService = null
    }
}
