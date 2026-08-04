/**
 * Automation Scheduler
 * Manages scheduled execution of automations
 */

import { AutomationWorkflow, AutomationTrigger } from '../types'
import { Logger, ConsoleLogger } from '../logger'

export interface ScheduledTask {
    id: string
    workflowId: string
    workflow: AutomationWorkflow
    schedule: Date
    recurring?: RecurringSchedule
    lastRun?: Date
    nextRun?: Date
    enabled: boolean
}

export interface RecurringSchedule {
    type: 'interval' | 'cron' | 'daily' | 'weekly' | 'monthly'
    config: Record<string, any>
}

export class AutomationScheduler {
    private scheduledTasks: Map<string, ScheduledTask> = new Map()
    private taskCounter = 0
    private logger: Logger
    private timer: NodeJS.Timeout | null = null
    private checkInterval: number = 60000 // 1 minute

    constructor(checkIntervalMs: number = 60000, logger?: Logger) {
        this.checkInterval = checkIntervalMs
        this.logger = logger || new ConsoleLogger()
    }

    start(): void {
        if (this.timer) {
            this.logger.warn('Scheduler already running')
            return
        }

        this.timer = setInterval(() => {
            this.checkAndExecute()
        }, this.checkInterval)

        this.logger.info('Automation scheduler started')
    }

    stop(): void {
        if (this.timer) {
            clearInterval(this.timer)
            this.timer = null
            this.logger.info('Automation scheduler stopped')
        }
    }

    isRunning(): boolean {
        return this.timer !== null
    }

    scheduleWorkflow(
        workflow: AutomationWorkflow,
        schedule: Date,
        recurring?: RecurringSchedule
    ): string {
        const taskId = `task-${++this.taskCounter}`

        const task: ScheduledTask = {
            id: taskId,
            workflowId: workflow.id,
            workflow,
            schedule,
            recurring,
            enabled: true
        }

        this.scheduledTasks.set(taskId, task)
        this.logger.info(`Scheduled workflow: ${workflow.name} at ${schedule.toISOString()}`)

        return taskId
    }

    scheduleAtInterval(
        workflow: AutomationWorkflow,
        intervalMs: number
    ): string {
        const schedule = new Date(Date.now() + intervalMs)

        return this.scheduleWorkflow(workflow, schedule, {
            type: 'interval',
            config: { intervalMs }
        })
    }

    scheduleDaily(
        workflow: AutomationWorkflow,
        hour: number,
        minute: number = 0
    ): string {
        const schedule = this.getNextDailySchedule(hour, minute)

        return this.scheduleWorkflow(workflow, schedule, {
            type: 'daily',
            config: { hour, minute }
        })
    }

    scheduleWeekly(
        workflow: AutomationWorkflow,
        dayOfWeek: number,
        hour: number,
        minute: number = 0
    ): string {
        const schedule = this.getNextWeeklySchedule(dayOfWeek, hour, minute)

        return this.scheduleWorkflow(workflow, schedule, {
            type: 'weekly',
            config: { dayOfWeek, hour, minute }
        })
    }

    scheduleMonthly(
        workflow: AutomationWorkflow,
        dayOfMonth: number,
        hour: number,
        minute: number = 0
    ): string {
        const schedule = this.getNextMonthlySchedule(dayOfMonth, hour, minute)

        return this.scheduleWorkflow(workflow, schedule, {
            type: 'monthly',
            config: { dayOfMonth, hour, minute }
        })
    }

    private getNextDailySchedule(hour: number, minute: number): Date {
        const now = new Date()
        const schedule = new Date()
        schedule.setHours(hour, minute, 0, 0)

        if (schedule <= now) {
            schedule.setDate(schedule.getDate() + 1)
        }

        return schedule
    }

    private getNextWeeklySchedule(dayOfWeek: number, hour: number, minute: number): Date {
        const now = new Date()
        const schedule = new Date()
        schedule.setHours(hour, minute, 0, 0)

        const currentDay = schedule.getDay()
        let daysUntilTarget = (dayOfWeek - currentDay + 7) % 7

        if (daysUntilTarget === 0 && schedule <= now) {
            daysUntilTarget = 7
        }

        schedule.setDate(schedule.getDate() + daysUntilTarget)

        return schedule
    }

    private getNextMonthlySchedule(dayOfMonth: number, hour: number, minute: number): Date {
        const now = new Date()
        const schedule = new Date()
        schedule.setHours(hour, minute, 0, 0)
        schedule.setDate(dayOfMonth)

        if (schedule <= now) {
            schedule.setMonth(schedule.getMonth() + 1)
        }

        return schedule
    }

    unscheduleTask(taskId: string): boolean {
        const deleted = this.scheduledTasks.delete(taskId)
        if (deleted) {
            this.logger.info(`Unscheduled task: ${taskId}`)
        }
        return deleted
    }

    enableTask(taskId: string): boolean {
        const task = this.scheduledTasks.get(taskId)
        if (!task) return false

        task.enabled = true
        this.logger.info(`Enabled scheduled task: ${taskId}`)
        return true
    }

    disableTask(taskId: string): boolean {
        const task = this.scheduledTasks.get(taskId)
        if (!task) return false

        task.enabled = false
        this.logger.info(`Disabled scheduled task: ${taskId}`)
        return true
    }

    private async checkAndExecute(): Promise<void> {
        const now = new Date()

        for (const [taskId, task] of this.scheduledTasks) {
            if (!task.enabled) continue
            if (task.schedule > now) continue

            this.logger.info(`Executing scheduled task: ${taskId}`)

            // Create a manual trigger for the execution
            const trigger: AutomationTrigger = {
                id: `trigger-${taskId}`,
                type: 'time',
                config: { scheduledTime: task.schedule },
                enabled: true
            }

            // The actual execution would be handled by the automation service
            // This is a placeholder for triggering the workflow
            this.logger.info(`Triggering workflow: ${task.workflow.name}`)

            // Update task for recurring schedules
            if (task.recurring) {
                task.lastRun = now
                task.nextRun = this.calculateNextRun(task.recurring, now)
                task.schedule = task.nextRun
            } else {
                // Remove one-time tasks after execution
                this.scheduledTasks.delete(taskId)
            }
        }
    }

    private calculateNextRun(recurring: RecurringSchedule, after: Date): Date {
        const now = new Date(after)

        switch (recurring.type) {
            case 'interval':
                const intervalMs = recurring.config.intervalMs
                return new Date(now.getTime() + intervalMs)

            case 'daily':
                return this.getNextDailySchedule(recurring.config.hour, recurring.config.minute)

            case 'weekly':
                return this.getNextWeeklySchedule(
                    recurring.config.dayOfWeek,
                    recurring.config.hour,
                    recurring.config.minute
                )

            case 'monthly':
                return this.getNextMonthlySchedule(
                    recurring.config.dayOfMonth,
                    recurring.config.hour,
                    recurring.config.minute
                )

            case 'cron':
                // Placeholder for cron expression parsing
                // Would need a cron library for full implementation
                return new Date(now.getTime() + 86400000) // Default to 1 day

            default:
                return new Date(now.getTime() + 86400000)
        }
    }

    getScheduledTasks(): ScheduledTask[] {
        return Array.from(this.scheduledTasks.values())
    }

    getTask(taskId: string): ScheduledTask | undefined {
        return this.scheduledTasks.get(taskId)
    }

    getTasksByWorkflow(workflowId: string): ScheduledTask[] {
        return this.getScheduledTasks().filter(t => t.workflowId === workflowId)
    }

    reset(): void {
        this.stop()
        this.scheduledTasks.clear()
        this.taskCounter = 0
        this.logger.info('Reset automation scheduler')
    }
}

// Singleton instance
let automationScheduler: AutomationScheduler | null = null

export function getAutomationScheduler(checkIntervalMs?: number, logger?: Logger): AutomationScheduler {
    if (!automationScheduler) {
        automationScheduler = new AutomationScheduler(checkIntervalMs, logger)
    }
    return automationScheduler
}

export function destroyAutomationScheduler(): void {
    if (automationScheduler) {
        automationScheduler.reset()
        automationScheduler = null
    }
}

export function createAutomationScheduler(checkIntervalMs?: number, logger?: Logger): AutomationScheduler {
    return new AutomationScheduler(checkIntervalMs, logger)
}