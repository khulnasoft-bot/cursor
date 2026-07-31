/**
 * Automation Scheduler
 * Service for scheduling and executing automated workflows
 */

import log from 'electron-log'
import { getAutomationService } from './automationService'
import { getTriggerSystem } from './triggerSystem'
import type { AutomationWorkflow } from './automationService'

export interface ScheduledTask {
    id: string
    workflowId: string
    schedule: string // cron-like expression
    nextRun: Date
    lastRun?: Date
    enabled: boolean
}

export class AutomationScheduler {
    private automationService = getAutomationService()
    private triggerSystem = getTriggerSystem()
    private scheduledTasks: Map<string, ScheduledTask> = new Map()
    private taskCounter = 0
    private active: boolean = false
    private checkInterval: NodeJS.Timeout | null = null
    private checkIntervalMs = 60000 // Check every minute

    activate(): void {
        this.active = true
        this.startScheduler()
        log.info('Automation scheduler activated')
    }

    deactivate(): void {
        this.active = false
        this.stopScheduler()
        log.info('Automation scheduler deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    private startScheduler(): void {
        if (this.checkInterval) return

        this.checkInterval = setInterval(() => {
            this.checkAndRunScheduledTasks()
        }, this.checkIntervalMs)

        log.info('Scheduler started')
    }

    private stopScheduler(): void {
        if (this.checkInterval) {
            clearInterval(this.checkInterval)
            this.checkInterval = null
            log.info('Scheduler stopped')
        }
    }

    scheduleWorkflow(workflowId: string, schedule: string): ScheduledTask {
        const taskId = `task-${++this.taskCounter}`
        const nextRun = this.calculateNextRun(schedule)

        const task: ScheduledTask = {
            id: taskId,
            workflowId,
            schedule,
            nextRun,
            enabled: true
        }

        this.scheduledTasks.set(taskId, task)
        log.info(`Scheduled workflow ${workflowId} with schedule: ${schedule}`)
        return task
    }

    unscheduleTask(taskId: string): boolean {
        const deleted = this.scheduledTasks.delete(taskId)
        if (deleted) {
            log.info(`Unscheduled task: ${taskId}`)
        }
        return deleted
    }

    unscheduleWorkflow(workflowId: string): number {
        let count = 0
        for (const [taskId, task] of this.scheduledTasks) {
            if (task.workflowId === workflowId) {
                this.scheduledTasks.delete(taskId)
                count++
            }
        }
        log.info(`Unscheduled ${count} tasks for workflow ${workflowId}`)
        return count
    }

    enableTask(taskId: string): boolean {
        const task = this.scheduledTasks.get(taskId)
        if (task) {
            task.enabled = true
            log.info(`Enabled task: ${taskId}`)
            return true
        }
        return false
    }

    disableTask(taskId: string): boolean {
        const task = this.scheduledTasks.get(taskId)
        if (task) {
            task.enabled = false
            log.info(`Disabled task: ${taskId}`)
            return true
        }
        return false
    }

    private calculateNextRun(schedule: string): Date {
        // Simple schedule parsing
        // Format: "every X minutes/hours/days" or cron-like
        const now = new Date()

        const match = schedule.match(/every (\d+) (minute|hour|day)/i)
        if (match) {
            const value = parseInt(match[1])
            const unit = match[2].toLowerCase()

            const nextRun = new Date(now)

            switch (unit) {
                case 'minute':
                    nextRun.setMinutes(nextRun.getMinutes() + value)
                    break
                case 'hour':
                    nextRun.setHours(nextRun.getHours() + value)
                    break
                case 'day':
                    nextRun.setDate(nextRun.getDate() + value)
                    break
            }

            return nextRun
        }

        // Default to 1 hour if parsing fails
        const nextRun = new Date(now)
        nextRun.setHours(nextRun.getHours() + 1)
        return nextRun
    }

    private async checkAndRunScheduledTasks(): Promise<void> {
        if (!this.active) return

        const now = new Date()

        for (const [taskId, task] of this.scheduledTasks) {
            if (!task.enabled) continue

            if (now >= task.nextRun) {
                try {
                    await this.runScheduledTask(task)

                    // Update next run time
                    task.lastRun = now
                    task.nextRun = this.calculateNextRun(task.schedule)

                    log.info(`Task ${task.id} completed, next run: ${task.nextRun}`)
                } catch (error) {
                    log.error(`Failed to run scheduled task ${task.id}:`, error)
                }
            }
        }
    }

    private async runScheduledTask(task: ScheduledTask): Promise<void> {
        const workflow = this.automationService.getWorkflow(task.workflowId)
        if (!workflow) {
            log.error(`Workflow not found for task ${task.id}: ${task.workflowId}`)
            return
        }

        if (!workflow.enabled) {
            log.info(`Workflow ${workflow.name} is disabled, skipping scheduled execution`)
            return
        }

        // Create a trigger for this execution
        const trigger = {
            id: `trigger-${Date.now()}`,
            type: 'time' as const,
            config: { schedule: task.schedule },
            enabled: true
        }

        await this.automationService.executeWorkflow(workflow.id, trigger)
    }

    getScheduledTasks(): ScheduledTask[] {
        return Array.from(this.scheduledTasks.values())
    }

    getScheduledTasksForWorkflow(workflowId: string): ScheduledTask[] {
        return this.getScheduledTasks().filter(t => t.workflowId === workflowId)
    }

    getTask(taskId: string): ScheduledTask | undefined {
        return this.scheduledTasks.get(taskId)
    }

    updateTaskSchedule(taskId: string, newSchedule: string): boolean {
        const task = this.scheduledTasks.get(taskId)
        if (task) {
            task.schedule = newSchedule
            task.nextRun = this.calculateNextRun(newSchedule)
            log.info(`Updated schedule for task ${taskId}: ${newSchedule}`)
            return true
        }
        return false
    }

    getStatistics(): {
        totalTasks: number
        enabledTasks: number
        disabledTasks: number
        tasksDueSoon: number
    } {
        const tasks = this.getScheduledTasks()
        const now = new Date()
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)

        return {
            totalTasks: tasks.length,
            enabledTasks: tasks.filter(t => t.enabled).length,
            disabledTasks: tasks.filter(t => !t.enabled).length,
            tasksDueSoon: tasks.filter(t => t.enabled && t.nextRun <= oneHourFromNow).length
        }
    }

    clearTasks(): void {
        this.scheduledTasks.clear()
        log.info('Cleared all scheduled tasks')
    }

    clearTasksForWorkflow(workflowId: string): number {
        return this.unscheduleWorkflow(workflowId)
    }

    exportTasks(): string {
        return JSON.stringify(this.getScheduledTasks(), null, 2)
    }

    importTasks(json: string): number {
        try {
            const tasks = JSON.parse(json) as ScheduledTask[]
            let count = 0
            for (const task of tasks) {
                this.scheduledTasks.set(task.id, task)
                count++
            }
            log.info(`Imported ${count} scheduled tasks`)
            return count
        } catch (error) {
            log.error('Failed to import scheduled tasks:', error)
            return 0
        }
    }

    reset(): void {
        this.stopScheduler()
        this.scheduledTasks.clear()
        this.taskCounter = 0
        log.info('Automation scheduler reset')
    }
}

// Singleton instance
let automationScheduler: AutomationScheduler | null = null

export function getAutomationScheduler(): AutomationScheduler {
    if (!automationScheduler) {
        automationScheduler = new AutomationScheduler()
    }
    return automationScheduler
}

export function destroyAutomationScheduler() {
    if (automationScheduler) {
        automationScheduler.reset()
        automationScheduler = null
    }
}
