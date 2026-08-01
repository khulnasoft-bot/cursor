/**
 * Automation Logger and Monitor
 * Service for logging and monitoring automation executions
 */

import log from 'electron-log'
import { getAutomationService } from './automationService'

export interface LogEntry {
    id: string
    timestamp: Date
    level: 'info' | 'warn' | 'error' | 'debug'
    workflowId?: string
    executionId?: string
    message: string
    data?: Record<string, any>
}

export interface MonitoringMetrics {
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
    executionsByWorkflow: Record<string, number>
    executionsByHour: Record<number, number>
    errorRate: number
}

export class AutomationLogger {
    private automationService = getAutomationService()
    private logs: LogEntry[] = new Array<LogEntry>()
    private logCounter = 0
    private maxLogs = 10000
    private active: boolean = false

    activate(): void {
        this.active = true
        log.info('Automation logger activated')
    }

    deactivate(): void {
        this.active = false
        log.info('Automation logger deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    log(level: LogEntry['level'], message: string, data?: Record<string, any>, workflowId?: string, executionId?: string): void {
        if (!this.active) return

        const entry: LogEntry = {
            id: `log-${++this.logCounter}`,
            timestamp: new Date(),
            level,
            workflowId,
            executionId,
            message,
            data
        }

        this.logs.push(entry)

        // Trim logs if exceeding max
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs)
        }

        // Also log to electron-log
        log[level](`[Automation] ${message}`, data || '')
    }

    info(message: string, data?: Record<string, any>, workflowId?: string, executionId?: string): void {
        this.log('info', message, data, workflowId, executionId)
    }

    warn(message: string, data?: Record<string, any>, workflowId?: string, executionId?: string): void {
        this.log('warn', message, data, workflowId, executionId)
    }

    error(message: string, data?: Record<string, any>, workflowId?: string, executionId?: string): void {
        this.log('error', message, data, workflowId, executionId)
    }

    debug(message: string, data?: Record<string, any>, workflowId?: string, executionId?: string): void {
        this.log('debug', message, data, workflowId, executionId)
    }

    getLogs(): LogEntry[] {
        return [...this.logs]
    }

    getLogsByLevel(level: LogEntry['level']): LogEntry[] {
        return this.logs.filter(l => l.level === level)
    }

    getLogsByWorkflow(workflowId: string): LogEntry[] {
        return this.logs.filter(l => l.workflowId === workflowId)
    }

    getLogsByExecution(executionId: string): LogEntry[] {
        return this.logs.filter(l => l.executionId === executionId)
    }

    getLogsByTimeRange(start: Date, end: Date): LogEntry[] {
        return this.logs.filter(l => l.timestamp >= start && l.timestamp <= end)
    }

    searchLogs(query: string): LogEntry[] {
        const queryLower = query.toLowerCase()
        return this.logs.filter(l =>
            l.message.toLowerCase().includes(queryLower) ||
            JSON.stringify(l.data || {}).toLowerCase().includes(queryLower)
        )
    }

    clearLogs(): void {
        this.logs = []
        this.logCounter = 0
        log.info('Cleared all automation logs')
    }

    clearLogsBefore(date: Date): number {
        const beforeCount = this.logs.length
        this.logs = this.logs.filter(l => l.timestamp >= date)
        const cleared = beforeCount - this.logs.length
        log.info(`Cleared ${cleared} logs before ${date}`)
        return cleared
    }

    getMonitoringMetrics(): MonitoringMetrics {
        const executions = this.automationService.getExecutions()
        const totalExecutions = executions.length
        const successfulExecutions = executions.filter(e => e.status === 'completed').length
        const failedExecutions = executions.filter(e => e.status === 'failed').length

        // Calculate average execution time
        const completedExecutions = executions.filter(e => e.status === 'completed' && e.endTime)
        const averageExecutionTime = completedExecutions.length > 0
            ? completedExecutions.reduce((sum, e) => {
                const duration = e.endTime!.getTime() - e.startTime.getTime()
                return sum + duration
            }, 0) / completedExecutions.length
            : 0

        // Count executions by workflow
        const executionsByWorkflow: Record<string, number> = {}
        for (const execution of executions) {
            executionsByWorkflow[execution.workflowId] = (executionsByWorkflow[execution.workflowId] || 0) + 1
        }

        // Count executions by hour (last 24 hours)
        const executionsByHour: Record<number, number> = {}
        const now = new Date()
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

        for (const execution of executions) {
            if (execution.startTime >= oneDayAgo) {
                const hour = execution.startTime.getHours()
                executionsByHour[hour] = (executionsByHour[hour] || 0) + 1
            }
        }

        // Calculate error rate
        const errorRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0

        return {
            totalExecutions,
            successfulExecutions,
            failedExecutions,
            averageExecutionTime,
            executionsByWorkflow,
            executionsByHour,
            errorRate
        }
    }

    getWorkflowHealth(workflowId: string): {
        workflowId: string
        totalRuns: number
        successfulRuns: number
        failedRuns: number
        successRate: number
        averageExecutionTime: number
        lastRun?: Date
        lastStatus?: string
    } {
        const executions = this.automationService.getExecutionsByWorkflow(workflowId)
        const _workflow = this.automationService.getWorkflow(workflowId)

        const totalRuns = executions.length
        const successfulRuns = executions.filter(e => e.status === 'completed').length
        const failedRuns = executions.filter(e => e.status === 'failed').length

        const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0

        const completedExecutions = executions.filter(e => e.status === 'completed' && e.endTime)
        const averageExecutionTime = completedExecutions.length > 0
            ? completedExecutions.reduce((sum, e) => {
                const duration = e.endTime!.getTime() - e.startTime.getTime()
                return sum + duration
            }, 0) / completedExecutions.length
            : 0

        const lastExecution = executions[executions.length - 1]

        return {
            workflowId,
            totalRuns,
            successfulRuns,
            failedRuns,
            successRate,
            averageExecutionTime,
            lastRun: lastExecution?.startTime,
            lastStatus: lastExecution?.status
        }
    }

    getAllWorkflowHealth(): Record<string, ReturnType<typeof this.getWorkflowHealth>> {
        const workflows = this.automationService.getWorkflows()
        const health: Record<string, ReturnType<typeof this.getWorkflowHealth>> = {}

        for (const workflow of workflows) {
            health[workflow.id] = this.getWorkflowHealth(workflow.id)
        }

        return health
    }

    exportLogs(): string {
        return JSON.stringify(this.logs, null, 2)
    }

    importLogs(json: string): number {
        try {
            const logs = JSON.parse(json) as LogEntry[]
            let count = 0
            for (const logEntry of logs) {
                this.logs.push(logEntry)
                count++
            }
            log.info(`Imported ${count} logs`)
            return count
        } catch (error) {
            log.error('Failed to import logs:', error)
            return 0
        }
    }

    exportMetrics(): string {
        return JSON.stringify(this.getMonitoringMetrics(), null, 2)
    }

    setMaxLogs(max: number): void {
        this.maxLogs = max
        log.info(`Set max logs to ${max}`)
    }

    getMaxLogs(): number {
        return this.maxLogs
    }

    reset(): void {
        this.logs = []
        this.logCounter = 0
        log.info('Automation logger reset')
    }
}

// Singleton instance
let automationLogger: AutomationLogger | null = null

export function getAutomationLogger(): AutomationLogger {
    if (!automationLogger) {
        automationLogger = new AutomationLogger()
    }
    return automationLogger
}

export function destroyAutomationLogger() {
    if (automationLogger) {
        automationLogger.reset()
        automationLogger = null
    }
}
