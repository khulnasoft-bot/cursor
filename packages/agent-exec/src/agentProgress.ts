/**
 * Agent Progress Tracking
 * Progress monitoring and milestone tracking for agent execution
 */

import { AgentPlan, AgentStep, PlanStatus } from './types'
import { Logger, ConsoleLogger } from './logger'

export interface ProgressSnapshot {
    executionId: string
    planId: string
    goal: string
    currentStep: number
    totalSteps: number
    status: PlanStatus
    percentage: number
    currentStepDescription: string
    estimatedTimeRemaining: number
    errors: string[]
    stepsCompleted: string[]
    stepsFailed: string[]
}

export class AgentProgress {
    private executions: Map<string, ProgressSnapshot> = new Map()
    private logger: Logger

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
    }

    startExecution(executionId: string, plan: AgentPlan): void {
        const snapshot: ProgressSnapshot = {
            executionId,
            planId: plan.id,
            goal: plan.goal,
            currentStep: 0,
            totalSteps: plan.steps.length,
            status: plan.status,
            percentage: 0,
            currentStepDescription: plan.steps[0]?.description || 'Starting',
            estimatedTimeRemaining: plan.estimatedDuration,
            errors: [],
            stepsCompleted: [],
            stepsFailed: []
        }

        this.executions.set(executionId, snapshot)
        this.logger.info(`Started tracking execution: ${executionId}`)
    }

    updateProgress(executionId: string, plan: AgentPlan): void {
        const snapshot = this.executions.get(executionId)
        if (!snapshot) return

        const completedSteps = plan.steps.filter(s => s.status === 'completed')
        const failedSteps = plan.steps.filter(s => s.status === 'failed')

        snapshot.currentStep = plan.currentStep
        snapshot.status = plan.status
        snapshot.percentage = (plan.currentStep / plan.totalSteps) * 100
        snapshot.currentStepDescription = plan.steps[plan.currentStep]?.description || 'Processing'
        snapshot.estimatedTimeRemaining = this.calculateRemainingTime(plan)
        snapshot.errors = failedSteps.map(s => s.error || '').filter(e => e.length > 0)
        snapshot.stepsCompleted = completedSteps.map(s => s.id)
        snapshot.stepsFailed = failedSteps.map(s => s.id)

        this.logger.debug(`Updated progress for ${executionId}: ${snapshot.percentage.toFixed(1)}%`)
    }

    completeExecution(executionId: string, plan: AgentPlan): void {
        const snapshot = this.executions.get(executionId)
        if (!snapshot) return

        snapshot.status = plan.status
        snapshot.percentage = 100
        snapshot.currentStep = plan.totalSteps
        snapshot.currentStepDescription = plan.status === 'completed' ? 'Completed' : 'Failed'
        snapshot.estimatedTimeRemaining = 0

        const completedSteps = plan.steps.filter(s => s.status === 'completed')
        const failedSteps = plan.steps.filter(s => s.status === 'failed')
        snapshot.stepsCompleted = completedSteps.map(s => s.id)
        snapshot.stepsFailed = failedSteps.map(s => s.id)

        this.logger.info(`Completed tracking execution: ${executionId} (${snapshot.status})`)
    }

    getProgress(executionId: string): ProgressSnapshot | undefined {
        return this.executions.get(executionId)
    }

    getAllProgress(): ProgressSnapshot[] {
        return Array.from(this.executions.values())
    }

    getActiveProgress(): ProgressSnapshot[] {
        return this.getAllProgress().filter(p => p.status === 'in_progress')
    }

    getCompletedProgress(): ProgressSnapshot[] {
        return this.getAllProgress().filter(p => p.status === 'completed' || p.status === 'failed')
    }

    private calculateRemainingTime(plan: AgentPlan): number {
        const remainingSteps = plan.totalSteps - plan.currentStep
        let remainingTime = 0

        for (let i = plan.currentStep; i < plan.steps.length; i++) {
            remainingTime += plan.steps[i].estimatedDuration
        }

        return remainingTime
    }

    clearProgress(executionId: string): void {
        this.executions.delete(executionId)
        this.logger.info(`Cleared progress for execution: ${executionId}`)
    }

    clearAllProgress(): void {
        this.executions.clear()
        this.logger.info('Cleared all progress tracking')
    }

    getProgressSummary(): {
        totalExecutions: number
        activeExecutions: number
        completedExecutions: number
        failedExecutions: number
        averageCompletionTime?: number
    } {
        const allProgress = this.getAllProgress()
        const completed = this.getCompletedProgress()

        return {
            totalExecutions: allProgress.length,
            activeExecutions: this.getActiveProgress().length,
            completedExecutions: completed.filter(p => p.status === 'completed').length,
            failedExecutions: completed.filter(p => p.status === 'failed').length
        }
    }

    reset(): void {
        this.executions.clear()
        this.logger.info('Reset agent progress tracker')
    }
}

// Singleton instance
let agentProgress: AgentProgress | null = null

export function getAgentProgress(logger?: Logger): AgentProgress {
    if (!agentProgress) {
        agentProgress = new AgentProgress(logger)
    }
    return agentProgress
}

export function destroyAgentProgress(): void {
    if (agentProgress) {
        agentProgress.reset()
        agentProgress = null
    }
}

export function createAgentProgress(logger?: Logger): AgentProgress {
    return new AgentProgress(logger)
}