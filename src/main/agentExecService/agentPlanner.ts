/**
 * Agent Planner
 * Planning and decision-making framework for autonomous agents
 */

import log from 'electron-log'
import { getToolRegistry } from './toolRegistry'
import type { AgentTool } from './toolRegistry'

export interface AgentGoal {
    id: string
    description: string
    priority: 'low' | 'medium' | 'high' | 'critical'
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    dependencies: string[]
    createdAt: Date
    completedAt?: Date
}

export interface AgentPlan {
    id: string
    goal: string
    steps: AgentStep[]
    estimatedDuration: number
    status: 'pending' | 'in_progress' | 'completed' | 'failed'
    currentStep: number
    createdAt: Date
    startedAt?: Date
    completedAt?: Date
}

export interface AgentStep {
    id: string
    description: string
    toolName: string
    toolParams: Record<string, any>
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped'
    result?: any
    error?: string
    estimatedDuration: number
    dependencies: string[]
}

export class AgentPlanner {
    private toolRegistry = getToolRegistry()
    private plans: Map<string, AgentPlan> = new Map()
    private goals: Map<string, AgentGoal> = new Map()
    private planCounter = 0
    private goalCounter = 0

    async createPlan(goal: string, context?: Record<string, any>): Promise<AgentPlan> {
        const planId = `plan-${++this.planCounter}`
        
        log.info(`Creating plan for goal: ${goal}`)
        
        // Analyze the goal and decompose it into steps
        const steps = await this.decomposeGoal(goal, context)
        
        const plan: AgentPlan = {
            id: planId,
            goal,
            steps,
            estimatedDuration: steps.reduce((sum, step) => sum + step.estimatedDuration, 0),
            status: 'pending',
            currentStep: 0,
            createdAt: new Date()
        }

        this.plans.set(planId, plan)
        log.info(`Created plan ${planId} with ${steps.length} steps`)
        
        return plan
    }

    async decomposeGoal(goal: string, context?: Record<string, any>): Promise<AgentStep[]> {
        const steps: AgentStep[] = []
        const availableTools = this.toolRegistry.getTools()

        // Simple goal decomposition based on keyword analysis
        // In production, this would use AI to plan
        const goalLower = goal.toLowerCase()

        // File operations
        if (goalLower.includes('read') && goalLower.includes('file')) {
            const filePath = this.extractFilePath(goal)
            if (filePath) {
                steps.push({
                    id: `step-${steps.length + 1}`,
                    description: `Read file: ${filePath}`,
                    toolName: 'read_file',
                    toolParams: { filePath },
                    status: 'pending',
                    estimatedDuration: 1000,
                    dependencies: []
                })
            }
        }

        if (goalLower.includes('write') || goalLower.includes('create') && goalLower.includes('file')) {
            const filePath = this.extractFilePath(goal)
            if (filePath) {
                steps.push({
                    id: `step-${steps.length + 1}`,
                    description: `Write file: ${filePath}`,
                    toolName: 'write_file',
                    toolParams: { filePath, content: '' },
                    status: 'pending',
                    estimatedDuration: 1000,
                    dependencies: []
                })
            }
        }

        if (goalLower.includes('delete') && goalLower.includes('file')) {
            const filePath = this.extractFilePath(goal)
            if (filePath) {
                steps.push({
                    id: `step-${steps.length + 1}`,
                    description: `Delete file: ${filePath}`,
                    toolName: 'delete_file',
                    toolParams: { filePath },
                    status: 'pending',
                    estimatedDuration: 500,
                    dependencies: []
                })
            }
        }

        // Directory operations
        if (goalLower.includes('list') && goalLower.includes('directory')) {
            const dirPath = this.extractFilePath(goal) || '.'
            steps.push({
                id: `step-${steps.length + 1}`,
                description: `List directory: ${dirPath}`,
                toolName: 'list_directory',
                toolParams: { dirPath },
                status: 'pending',
                estimatedDuration: 500,
                dependencies: []
            })
        }

        if (goalLower.includes('create') && goalLower.includes('directory')) {
            const dirPath = this.extractFilePath(goal)
            if (dirPath) {
                steps.push({
                    id: `step-${steps.length + 1}`,
                    description: `Create directory: ${dirPath}`,
                    toolName: 'create_directory',
                    toolParams: { dirPath },
                    status: 'pending',
                    estimatedDuration: 500,
                    dependencies: []
                })
            }
        }

        // Search operations
        if (goalLower.includes('search') || goalLower.includes('find')) {
            const directory = context?.directory || '.'
            const pattern = this.extractPattern(goal)
            if (pattern) {
                steps.push({
                    id: `step-${steps.length + 1}`,
                    description: `Search for files matching: ${pattern}`,
                    toolName: 'search_files',
                    toolParams: { directory, pattern },
                    status: 'pending',
                    estimatedDuration: 5000,
                    dependencies: []
                })
            }
        }

        // If no specific steps were generated, create a generic plan
        if (steps.length === 0) {
            steps.push({
                id: `step-${steps.length + 1}`,
                description: `Analyze goal: ${goal}`,
                toolName: 'read_file',
                toolParams: { filePath: '.' },
                status: 'pending',
                estimatedDuration: 1000,
                dependencies: []
            })
        }

        return steps
    }

    private extractFilePath(text: string): string | null {
        // Simple extraction of file paths from text
        const pathMatch = text.match(/[\w\-\.\/]+[\w\-\.\/]*/)
        return pathMatch ? pathMatch[0] : null
    }

    private extractPattern(text: string): string | null {
        // Simple extraction of search patterns
        const patternMatch = text.match(/["']([^"']+)["']/)
        return patternMatch ? patternMatch[1] : null
    }

    async executePlan(planId: string, onProgress?: (step: AgentStep, progress: number) => void): Promise<AgentPlan> {
        const plan = this.plans.get(planId)
        if (!plan) {
            throw new Error(`Plan not found: ${planId}`)
        }

        plan.status = 'in_progress'
        plan.startedAt = new Date()

        log.info(`Executing plan ${planId}`)

        for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i]
            plan.currentStep = i

            // Check dependencies
            if (!this.checkDependencies(step, plan.steps)) {
                step.status = 'skipped'
                log.info(`Step ${step.id} skipped due to unmet dependencies`)
                continue
            }

            step.status = 'in_progress'
            if (onProgress) {
                onProgress(step, (i / plan.steps.length) * 100)
            }

            try {
                const result = await this.toolRegistry.executeTool(step.toolName, step.toolParams)
                step.result = result
                step.status = result.success ? 'completed' : 'failed'
                
                if (!result.success) {
                    step.error = result.error
                    log.error(`Step ${step.id} failed: ${result.error}`)
                    
                    // Decide whether to continue or abort
                    if (this.shouldAbortOnFailure(step)) {
                        plan.status = 'failed'
                        plan.completedAt = new Date()
                        return plan
                    }
                }
            } catch (error) {
                step.status = 'failed'
                step.error = error instanceof Error ? error.message : 'Unknown error'
                log.error(`Step ${step.id} error:`, error)
                
                if (this.shouldAbortOnFailure(step)) {
                    plan.status = 'failed'
                    plan.completedAt = new Date()
                    return plan
                }
            }

            if (onProgress) {
                onProgress(step, ((i + 1) / plan.steps.length) * 100)
            }
        }

        plan.status = 'completed'
        plan.completedAt = new Date()
        log.info(`Plan ${planId} completed successfully`)
        
        return plan
    }

    private checkDependencies(step: AgentStep, allSteps: AgentStep[]): boolean {
        for (const depId of step.dependencies) {
            const depStep = allSteps.find(s => s.id === depId)
            if (!depStep || depStep.status !== 'completed') {
                return false
            }
        }
        return true
    }

    private shouldAbortOnFailure(step: AgentStep): boolean {
        // Abort if the step is critical or has many dependencies
        return step.dependencies.length > 0
    }

    createGoal(description: string, priority: AgentGoal['priority'] = 'medium', dependencies: string[] = []): AgentGoal {
        const goalId = `goal-${++this.goalCounter}`
        
        const goal: AgentGoal = {
            id: goalId,
            description,
            priority,
            status: 'pending',
            dependencies,
            createdAt: new Date()
        }

        this.goals.set(goalId, goal)
        log.info(`Created goal ${goalId}: ${description}`)
        
        return goal
    }

    completeGoal(goalId: string): void {
        const goal = this.goals.get(goalId)
        if (goal) {
            goal.status = 'completed'
            goal.completedAt = new Date()
            log.info(`Completed goal ${goalId}`)
        }
    }

    getPlan(planId: string): AgentPlan | undefined {
        return this.plans.get(planId)
    }

    getPlans(): AgentPlan[] {
        return Array.from(this.plans.values())
    }

    getGoal(goalId: string): AgentGoal | undefined {
        return this.goals.get(goalId)
    }

    getGoals(): AgentGoal[] {
        return Array.from(this.goals.values())
    }

    getGoalsByStatus(status: AgentGoal['status']): AgentGoal[] {
        return this.getGoals().filter(g => g.status === status)
    }

    getGoalsByPriority(priority: AgentGoal['priority']): AgentGoal[] {
        return this.getGoals().filter(g => g.priority === priority)
    }

    deletePlan(planId: string): void {
        this.plans.delete(planId)
    }

    deleteGoal(goalId: string): void {
        this.goals.delete(goalId)
    }

    clearCompletedPlans(): void {
        for (const plan of this.getPlans()) {
            if (plan.status === 'completed' || plan.status === 'failed') {
                this.deletePlan(plan.id)
            }
        }
    }

    clearCompletedGoals(): void {
        for (const goal of this.getGoals()) {
            if (goal.status === 'completed' || goal.status === 'failed') {
                this.deleteGoal(goal.id)
            }
        }
    }
}

// Singleton instance
let agentPlanner: AgentPlanner | null = null

export function getAgentPlanner(): AgentPlanner {
    if (!agentPlanner) {
        agentPlanner = new AgentPlanner()
    }
    return agentPlanner
}

export function destroyAgentPlanner() {
    if (agentPlanner) {
        agentPlanner = null
    }
}
