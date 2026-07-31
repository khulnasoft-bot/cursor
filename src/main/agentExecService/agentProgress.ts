/**
 * Agent Progress Reporter
 * Progress reporting and visualization for agent execution
 */

import log from 'electron-log'
import { EventEmitter } from 'events'

export interface ProgressUpdate {
    agentId: string
    stepId: string
    stepName: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    progress: number // 0-100
    message?: string
    data?: any
    timestamp: Date
}

export interface AgentExecution {
    id: string
    goal: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
    startTime: Date
    endTime?: Date
    currentStep: number
    totalSteps: number
    progress: number
    steps: ExecutionStep[]
    error?: string
}

export interface ExecutionStep {
    id: string
    name: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
    startTime?: Date
    endTime?: Date
    duration?: number
    output?: string
    error?: string
}

export class AgentProgressReporter extends EventEmitter {
    private executions: Map<string, AgentExecution> = new Map()
    private executionCounter = 0

    createExecution(goal: string, totalSteps: number): AgentExecution {
        const executionId = `exec-${++this.executionCounter}`
        
        const execution: AgentExecution = {
            id: executionId,
            goal,
            status: 'pending',
            startTime: new Date(),
            currentStep: 0,
            totalSteps,
            progress: 0,
            steps: Array.from({ length: totalSteps }, (_, i) => ({
                id: `step-${i}`,
                name: `Step ${i + 1}`,
                status: 'pending'
            }))
        }

        this.executions.set(executionId, execution)
        this.emit('execution-created', execution)
        
        log.info(`Created execution ${executionId}: ${goal}`)
        return execution
    }

    startExecution(executionId: string): void {
        const execution = this.executions.get(executionId)
        if (!execution) return

        execution.status = 'in_progress'
        this.emit('execution-started', execution)
        log.info(`Started execution ${executionId}`)
    }

    updateProgress(executionId: string, stepIndex: number, stepName: string, progress: number, message?: string): void {
        const execution = this.executions.get(executionId)
        if (!execution) return

        const step = execution.steps[stepIndex]
        if (step) {
            step.name = stepName
            step.status = 'in_progress'
            step.startTime = new Date()
        }

        execution.currentStep = stepIndex
        execution.progress = progress

        const update: ProgressUpdate = {
            agentId: executionId,
            stepId: step?.id || '',
            stepName,
            status: 'in_progress',
            progress,
            message,
            timestamp: new Date()
        }

        this.emit('progress-update', update)
        log.info(`Progress update ${executionId}: ${progress}% - ${message || stepName}`)
    }

    completeStep(executionId: string, stepIndex: number, output?: string): void {
        const execution = this.executions.get(executionId)
        if (!execution) return

        const step = execution.steps[stepIndex]
        if (step) {
            step.status = 'completed'
            step.endTime = new Date()
            step.duration = step.endTime.getTime() - (step.startTime?.getTime() || step.endTime.getTime())
            step.output = output
        }

        // Update overall progress
        const completedSteps = execution.steps.filter(s => s.status === 'completed').length
        execution.progress = (completedSteps / execution.totalSteps) * 100

        this.emit('step-completed', { executionId, stepIndex, step })
        log.info(`Completed step ${stepIndex} of execution ${executionId}`)
    }

    failStep(executionId: string, stepIndex: number, error: string): void {
        const execution = this.executions.get(executionId)
        if (!execution) return

        const step = execution.steps[stepIndex]
        if (step) {
            step.status = 'failed'
            step.endTime = new Date()
            step.duration = step.endTime.getTime() - (step.startTime?.getTime() || step.endTime.getTime())
            step.error = error
        }

        execution.status = 'failed'
        execution.error = error
        execution.endTime = new Date()

        this.emit('step-failed', { executionId, stepIndex, step, error })
        log.error(`Failed step ${stepIndex} of execution ${executionId}: ${error}`)
    }

    completeExecution(executionId: string): void {
        const execution = this.executions.get(executionId)
        if (!execution) return

        execution.status = 'completed'
        execution.endTime = new Date()
        execution.progress = 100

        this.emit('execution-completed', execution)
        log.info(`Completed execution ${executionId}`)
    }

    cancelExecution(executionId: string): void {
        const execution = this.executions.get(executionId)
        if (!execution) return

        execution.status = 'cancelled'
        execution.endTime = new Date()

        this.emit('execution-cancelled', execution)
        log.info(`Cancelled execution ${executionId}`)
    }

    getExecution(executionId: string): AgentExecution | undefined {
        return this.executions.get(executionId)
    }

    getExecutions(): AgentExecution[] {
        return Array.from(this.executions.values())
    }

    getActiveExecutions(): AgentExecution[] {
        return this.getExecutions().filter(e => e.status === 'in_progress')
    }

    getCompletedExecutions(): AgentExecution[] {
        return this.getExecutions().filter(e => e.status === 'completed')
    }

    getFailedExecutions(): AgentExecution[] {
        return this.getExecutions().filter(e => e.status === 'failed')
    }

    getExecutionProgress(executionId: string): number {
        const execution = this.executions.get(executionId)
        return execution ? execution.progress : 0
    }

    getExecutionStatus(executionId: string): AgentExecution['status'] | undefined {
        const execution = this.executions.get(executionId)
        return execution?.status
    }

    deleteExecution(executionId: string): void {
        this.executions.delete(executionId)
        log.info(`Deleted execution ${executionId}`)
    }

    clearCompletedExecutions(): void {
        for (const execution of this.getCompletedExecutions()) {
            this.deleteExecution(execution.id)
        }
        log.info('Cleared completed executions')
    }

    clearFailedExecutions(): void {
        for (const execution of this.getFailedExecutions()) {
            this.deleteExecution(execution.id)
        }
        log.info('Cleared failed executions')
    }

    clearAllExecutions(): void {
        this.executions.clear()
        log.info('Cleared all executions')
    }

    getExecutionSummary(executionId: string): {
        id: string
        goal: string
        status: AgentExecution['status']
        duration: number
        stepsCompleted: number
        stepsFailed: number
        averageStepDuration: number
    } | null {
        const execution = this.executions.get(executionId)
        if (!execution) return null

        const duration = (execution.endTime?.getTime() || Date.now()) - execution.startTime.getTime()
        const stepsCompleted = execution.steps.filter(s => s.status === 'completed').length
        const stepsFailed = execution.steps.filter(s => s.status === 'failed').length
        const completedStepsWithDuration = execution.steps.filter(s => s.status === 'completed' && s.duration)
        const averageStepDuration = completedStepsWithDuration.length > 0
            ? completedStepsWithDuration.reduce((sum, s) => sum + (s.duration || 0), 0) / completedStepsWithDuration.length
            : 0

        return {
            id: execution.id,
            goal: execution.goal,
            status: execution.status,
            duration,
            stepsCompleted,
            stepsFailed,
            averageStepDuration
        }
    }

    getAllExecutionsSummary(): Array<{
        id: string
        goal: string
        status: AgentExecution['status']
        duration: number
        progress: number
    }> {
        return this.getExecutions().map(exec => {
            const duration = (exec.endTime?.getTime() || Date.now()) - exec.startTime.getTime()
            return {
                id: exec.id,
                goal: exec.goal,
                status: exec.status,
                duration,
                progress: exec.progress
            }
        })
    }
}

// Singleton instance
let agentProgressReporter: AgentProgressReporter | null = null

export function getAgentProgressReporter(): AgentProgressReporter {
    if (!agentProgressReporter) {
        agentProgressReporter = new AgentProgressReporter()
    }
    return agentProgressReporter
}

export function destroyAgentProgressReporter() {
    if (agentProgressReporter) {
        agentProgressReporter.removeAllListeners()
        agentProgressReporter.clearAllExecutions()
        agentProgressReporter = null
    }
}
