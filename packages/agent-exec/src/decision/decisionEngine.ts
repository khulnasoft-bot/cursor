/**
 * Decision Engine
 * Autonomous decision-making and self-correction for agents
 */

import { AgentPlan, AgentStep, StepStatus } from '../types'
import { Logger, ConsoleLogger } from '../logger'

export interface DecisionContext {
    plan: AgentPlan
    step: AgentStep
    history: DecisionHistory[]
    availableTools: string[]
    resourceLimits: Record<string, any>
}

export interface Decision {
    action: 'continue' | 'retry' | 'skip' | 'abort' | 'adapt'
    reasoning: string
    adaptedStep?: Partial<AgentStep>
    newSteps?: AgentStep[]
}

export interface DecisionHistory {
    stepId: string
    step: AgentStep
    decision: Decision
    timestamp: Date
    outcome: 'success' | 'failure' | 'skip'
}

export class DecisionEngine {
    private logger: Logger
    private learningRate: number
    private maxRetries: number

    constructor(logger?: Logger, learningRate: number = 0.1, maxRetries: number = 3) {
        this.logger = logger || new ConsoleLogger()
        this.learningRate = learningRate
        this.maxRetries = maxRetries
    }

    makeDecision(context: DecisionContext): Decision {
        const { step, plan, history } = context

        // Analyze current situation
        const analysis = this.analyzeSituation(context)

        // Make decision based on analysis
        if (analysis.shouldAbort) {
            return {
                action: 'abort',
                reasoning: analysis.reasoning
            }
        }

        if (analysis.shouldRetry && this.canRetry(step, history)) {
            return {
                action: 'retry',
                reasoning: analysis.reasoning
            }
        }

        if (analysis.shouldSkip) {
            return {
                action: 'skip',
                reasoning: analysis.reasoning
            }
        }

        if (analysis.shouldAdapt) {
            const adaptedStep = this.generateAdaptation(step, analysis)
            return {
                action: 'adapt',
                reasoning: analysis.reasoning,
                adaptedStep
            }
        }

        return {
            action: 'continue',
            reasoning: 'Step appears viable, continuing execution'
        }
    }

    private analyzeSituation(context: DecisionContext): {
        shouldAbort: boolean
        shouldRetry: boolean
        shouldSkip: boolean
        shouldAdapt: boolean
        reasoning: string
    } {
        const { step, plan, history } = context

        // Check for repeated failures
        const recentFailures = history.filter(h => h.outcome === 'failure' && h.stepId === step.id)
        if (recentFailures.length >= this.maxRetries) {
            return {
                shouldAbort: true,
                shouldRetry: false,
                shouldSkip: false,
                shouldAdapt: false,
                reasoning: `Step ${step.id} has failed ${recentFailures.length} times, aborting`
            }
        }

        // Check for dependency failures
        const dependencyFailures = this.checkDependencyFailures(step, plan)
        if (dependencyFailures.length > 0) {
            return {
                shouldAbort: true,
                shouldRetry: false,
                shouldSkip: false,
                shouldAdapt: false,
                reasoning: `Step ${step.id} has failed dependencies: ${dependencyFailures.join(', ')}`
            }
        }

        // Check if step is skippable
        if (this.isStepSkippable(step, plan)) {
            return {
                shouldAbort: false,
                shouldRetry: false,
                shouldSkip: true,
                shouldAdapt: false,
                reasoning: `Step ${step.id} is marked as optional, skipping`
            }
        }

        // Check if adaptation is needed
        const adaptationNeeded = this.checkAdaptationNeed(step, history)
        if (adaptationNeeded.needsAdaptation) {
            return {
                shouldAbort: false,
                shouldRetry: false,
                shouldSkip: false,
                shouldAdapt: true,
                reasoning: adaptationNeeded.reasoning
            }
        }

        // Default: continue
        return {
            shouldAbort: false,
            shouldRetry: false,
            shouldSkip: false,
            shouldAdapt: false,
            reasoning: 'No issues detected, continuing execution'
        }
    }

    private checkDependencyFailures(step: AgentStep, plan: AgentPlan): string[] {
        const failedDeps: string[] = []

        for (const depId of step.dependencies) {
            const depStep = plan.steps.find(s => s.id === depId)
            if (depStep && depStep.status === 'failed') {
                failedDeps.push(depId)
            }
        }

        return failedDeps
    }

    private canRetry(step: AgentStep, history: DecisionHistory[]): boolean {
        const attempts = history.filter(h => h.stepId === step.id).length
        return attempts < this.maxRetries
    }

    private isStepSkippable(step: AgentStep, plan: AgentPlan): boolean {
        // A step is skippable if it has no dependents and is not critical
        const hasDependents = plan.steps.some(s => s.dependencies.includes(step.id))
        const isCritical = step.toolName === 'write_file' || step.toolName === 'delete_file'
        return !hasDependents && !isCritical
    }

    private checkAdaptationNeed(step: AgentStep, history: DecisionHistory[]): {
    needsAdaptation: boolean
    reasoning: string
} {
        // Check if previous attempts with similar steps succeeded with different parameters
        const similarSteps = history.filter(h => 
            h.step.toolName === step.toolName && 
            h.outcome === 'success'
        )

        if (similarSteps.length > 0) {
            const lastSuccess = similarSteps[similarSteps.length - 1]
            const successfulParams = lastSuccess.decision.adaptedStep?.toolParams || {}
            
            if (JSON.stringify(successfulParams) !== JSON.stringify(step.toolParams)) {
                return {
                    needsAdaptation: true,
                    reasoning: `Previous success with different parameters: ${JSON.stringify(successfulParams)}`
                }
            }
        }

        return {
            needsAdaptation: false,
            reasoning: 'No adaptation needed'
        }
    }

    private generateAdaptation(step: AgentStep, analysis: { reasoning: string }): Partial<AgentStep> {
        // Generate an adaptation based on the analysis
        const adaptedStep: Partial<AgentStep> = {}

        // Simple adaptation: try with empty parameters if they might be causing issues
        if (Object.keys(step.toolParams).length > 0) {
            adaptedStep.toolParams = {}
        }

        // Add retry logic to adaptation
        adaptedStep.estimatedDuration = step.estimatedDuration * 1.5

        return adaptedStep
    }

    recordDecision(decision: Decision, outcome: 'success' | 'failure' | 'skip'): void {
        // In a full implementation, this would store decisions for learning
        this.logger.info(`Recorded decision: ${decision.action} -> ${outcome}`)
    }

    getLearningRate(): number {
        return this.learningRate
    }

    setLearningRate(rate: number): void {
        this.learningRate = rate
        this.logger.info(`Updated learning rate to ${rate}`)
    }

    reset(): void {
        this.logger.info('Reset decision engine')
    }
}

// Singleton instance
let decisionEngine: DecisionEngine | null = null

export function getDecisionEngine(logger?: Logger, learningRate?: number, maxRetries?: number): DecisionEngine {
    if (!decisionEngine) {
        decisionEngine = new DecisionEngine(logger, learningRate, maxRetries)
    }
    return decisionEngine
}

export function destroyDecisionEngine(): void {
    if (decisionEngine) {
        decisionEngine.reset()
        decisionEngine = null
    }
}

export function createDecisionEngine(logger?: Logger, learningRate?: number, maxRetries?: number): DecisionEngine {
    return new DecisionEngine(logger, learningRate, maxRetries)
}