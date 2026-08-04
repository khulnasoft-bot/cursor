/**
 * Change Orchestrator
 * Coordinates the application of multi-file changes with dependency management
 */

import { FileChange, ComposerExecution } from './types'
import { Logger, ConsoleLogger } from './logger'

export interface OrchestrationPlan {
    steps: OrchestrationStep[]
    rollbackSteps: OrchestrationStep[]
    estimatedDuration: number
    canRollback: boolean
}

export interface OrchestrationStep {
    stepId: string
    filePath: string
    change: FileChange
    dependencies: string[]
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    result?: string
    error?: string
}

export class ChangeOrchestrator {
    private logger: Logger

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
    }

    createPlan(changes: FileChange[], executionOrder: string[]): OrchestrationPlan {
        const steps: OrchestrationStep[] = []
        const rollbackSteps: OrchestrationStep[] = []

        // Create execution steps in order
        for (let i = 0; i < executionOrder.length; i++) {
            const filePath = executionOrder[i]
            const change = changes.find(c => c.filePath === filePath)
            if (!change) continue

            steps.push({
                stepId: `step-${i}`,
                filePath,
                change,
                dependencies: change.dependencies,
                status: 'pending'
            })
        }

        // Create rollback steps in reverse order
        for (let i = steps.length - 1; i >= 0; i--) {
            const step = steps[i]
            rollbackSteps.push({
                stepId: `rollback-${step.stepId}`,
                filePath: step.filePath,
                change: step.change,
                dependencies: [],
                status: 'pending'
            })
        }

        return {
            steps,
            rollbackSteps,
            estimatedDuration: this.estimateDuration(steps),
            canRollback: true
        }
    }

    async executePlan(
        plan: OrchestrationPlan,
        execution: ComposerExecution,
        applyChange: (change: FileChange) => Promise<void>
    ): Promise<void> {
        this.logger.info(`Executing orchestration plan with ${plan.steps.length} steps`)

        for (const step of plan.steps) {
            step.status = 'in_progress'
            execution.currentStep++

            try {
                // Check dependencies
                for (const depId of step.dependencies) {
                    const depStep = plan.steps.find(s => s.filePath === depId)
                    if (depStep && depStep.status === 'failed') {
                        throw new Error(`Dependency failed: ${depId}`)
                    }
                }

                // Apply the change
                await applyChange(step.change)
                step.status = 'completed'
                step.result = 'Successfully applied change'
                execution.executedChanges.push(step.filePath)

                this.logger.info(`Completed step: ${step.stepId} for ${step.filePath}`)
            } catch (error) {
                step.status = 'failed'
                step.error = error instanceof Error ? error.message : 'Unknown error'
                execution.failedChanges.push(step.filePath)
                throw error
            }
        }
    }

    async rollbackPlan(
        plan: OrchestrationPlan,
        execution: ComposerExecution,
        restoreFile: (filePath: string, content: string) => Promise<void>
    ): Promise<void> {
        this.logger.info(`Rolling back orchestration plan with ${plan.rollbackSteps.length} steps`)

        for (const step of plan.rollbackSteps) {
            step.status = 'in_progress'

            try {
                // Restore original content
                const originalContent = execution.rollbackData?.get(step.filePath)
                if (originalContent !== undefined) {
                    await restoreFile(step.filePath, originalContent)
                    step.status = 'completed'
                    step.result = 'Successfully restored file'
                    this.logger.info(`Rolled back step: ${step.stepId} for ${step.filePath}`)
                }
            } catch (error) {
                step.status = 'failed'
                step.error = error instanceof Error ? error.message : 'Unknown error'
                this.logger.error(`Rollback failed for step ${step.stepId}:`, error)
                throw error
            }
        }
    }

    private estimateDuration(steps: OrchestrationStep[]): number {
        // Simple heuristic: 500ms per step + 100ms per dependency
        let duration = steps.length * 500
        for (const step of steps) {
            duration += step.dependencies.length * 100
        }
        return duration
    }

    validatePlan(plan: OrchestrationPlan): { valid: boolean; errors: string[] } {
        const errors: string[] = []

        // Check for circular dependencies
        const visited = new Set<string>()
        const visiting = new Set<string>()

        const checkCircular = (stepId: string, steps: OrchestrationStep[]): boolean => {
            if (visiting.has(stepId)) {
                errors.push(`Circular dependency detected involving ${stepId}`)
                return true
            }
            if (visited.has(stepId)) {
                return false
            }

            visiting.add(stepId)
            const step = steps.find(s => s.stepId === stepId)
            if (step) {
                for (const dep of step.dependencies) {
                    const depStep = steps.find(s => s.filePath === dep)
                    if (depStep && checkCircular(depStep.stepId, steps)) {
                        return true
                    }
                }
            }
            visiting.delete(stepId)
            visited.add(stepId)
            return false
        }

        for (const step of plan.steps) {
            checkCircular(step.stepId, plan.steps)
        }

        // Check that all dependencies exist
        for (const step of plan.steps) {
            for (const dep of step.dependencies) {
                const depExists = plan.steps.some(s => s.filePath === dep)
                if (!depExists) {
                    errors.push(`Dependency not found: ${dep}`)
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        }
    }

    getExecutionProgress(plan: OrchestrationPlan): {
        completed: number
        total: number
        percentage: number
    } {
        const completed = plan.steps.filter(s => s.status === 'completed').length
        const total = plan.steps.length
        return {
            completed,
            total,
            percentage: total > 0 ? (completed / total) * 100 : 0
        }
    }
}

// Singleton instance
let changeOrchestrator: ChangeOrchestrator | null = null

export function getChangeOrchestrator(logger?: Logger): ChangeOrchestrator {
    if (!changeOrchestrator) {
        changeOrchestrator = new ChangeOrchestrator(logger)
    }
    return changeOrchestrator
}

export function destroyChangeOrchestrator(): void {
    if (changeOrchestrator) {
        changeOrchestrator = null
    }
}

export function createChangeOrchestrator(logger?: Logger): ChangeOrchestrator {
    return new ChangeOrchestrator(logger)
}