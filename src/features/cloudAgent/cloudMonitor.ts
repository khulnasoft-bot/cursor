/**
 * Cloud Agent Monitoring and Logging
 * Service for monitoring cloud agents and collecting logs
 */

import log from 'electron-log'
import { getCloudAgentService } from './cloudAgentService'
import { getResourceManager } from './resourceManager'

export interface MonitorConfig {
    id: string
    name: string
    metricsInterval: number // seconds
    logsRetentionDays: number
    alertsEnabled: boolean
    alertThresholds: {
        cpuUtilization: number
        memoryUtilization: number
        errorRate: number
        responseTime: number
    }
}

export interface MetricData {
    timestamp: Date
    instanceId: string
    metrics: {
        cpu: number
        memory: number
        storage: number
        networkIn: number
        networkOut: number
        diskIO: number
    }
}

export interface LogEntry {
    id: string
    timestamp: Date
    instanceId: string
    level: 'info' | 'warn' | 'error' | 'debug'
    message: string
    context?: Record<string, any>
}

export interface Alert {
    id: string
    timestamp: Date
    severity: 'info' | 'warning' | 'error' | 'critical'
    type: string
    instanceId?: string
    message: string
    details?: Record<string, any>
    acknowledged: boolean
    resolvedAt?: Date
}

export class CloudMonitor {
    private cloudAgentService = getCloudAgentService()
    private resourceManager = getResourceManager()
    private configs: Map<string, MonitorConfig> = new Map()
    private metrics: MetricData[] = []
    private logs: LogEntry[] = []
    private alerts: Alert[] = []
    private configCounter = 0
    private logCounter = 0
    private alertCounter = 0
    private metricInterval: NodeJS.Timeout | null = null
    private active: boolean = false

    activate(): void {
        this.active = true
        this.startMetricsCollection()
        log.info('Cloud monitor activated')
    }

    deactivate(): void {
        this.active = false
        this.stopMetricsCollection()
        log.info('Cloud monitor deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    private startMetricsCollection(): void {
        if (this.metricInterval) return

        this.metricInterval = setInterval(() => {
            this.collectMetrics()
        }, 60000) // Collect every minute

        log.info('Metrics collection started')
    }

    private stopMetricsCollection(): void {
        if (this.metricInterval) {
            clearInterval(this.metricInterval)
            this.metricInterval = null
            log.info('Metrics collection stopped')
        }
    }

    // Monitor Config Management
    createMonitorConfig(config: Omit<MonitorConfig, 'id'>): MonitorConfig {
        const configId = `monitor-${++this.configCounter}`

        const newConfig: MonitorConfig = {
            ...config,
            id: configId
        }

        this.configs.set(configId, newConfig)
        log.info(`Created monitor config: ${config.name}`)
        return newConfig
    }

    updateMonitorConfig(configId: string, updates: Partial<MonitorConfig>): MonitorConfig | null {
        const config = this.configs.get(configId)
        if (!config) return null

        const updated = { ...config, ...updates }
        this.configs.set(configId, updated)
        log.info(`Updated monitor config: ${config.name}`)
        return updated
    }

    deleteMonitorConfig(configId: string): boolean {
        const deleted = this.configs.delete(configId)
        if (deleted) {
            log.info(`Deleted monitor config: ${configId}`)
        }
        return deleted
    }

    getMonitorConfig(configId: string): MonitorConfig | undefined {
        return this.configs.get(configId)
    }

    getMonitorConfigs(): MonitorConfig[] {
        return Array.from(this.configs.values())
    }

    // Metrics Collection
    private async collectMetrics(): Promise<void> {
        if (!this.active) return

        const instances = this.cloudAgentService.getRunningInstances()

        for (const instance of instances) {
            const metrics = await this.getInstanceMetrics(instance.id)
            if (metrics) {
                const metricData: MetricData = {
                    timestamp: new Date(),
                    instanceId: instance.id,
                    metrics
                }

                this.metrics.push(metricData)

                // Trim metrics if exceeding limit
                if (this.metrics.length > 100000) {
                    this.metrics = this.metrics.slice(-100000)
                }

                // Check for alerts
                await this.checkAlertThresholds(instance.id, metrics)
            }
        }
    }

    private async getInstanceMetrics(_instanceId: string): Promise<MetricData['metrics'] | null> {
        // Placeholder for actual metrics collection
        return {
            cpu: Math.random() * 100,
            memory: Math.random() * 100,
            storage: Math.random() * 100,
            networkIn: Math.random() * 1000,
            networkOut: Math.random() * 1000,
            diskIO: Math.random() * 100
        }
    }

    getMetrics(instanceId?: string): MetricData[] {
        if (instanceId) {
            return this.metrics.filter(m => m.instanceId === instanceId)
        }
        return [...this.metrics]
    }

    getMetricsByTimeRange(start: Date, end: Date, instanceId?: string): MetricData[] {
        let filtered = this.metrics.filter(m => m.timestamp >= start && m.timestamp <= end)
        if (instanceId) {
            filtered = filtered.filter(m => m.instanceId === instanceId)
        }
        return filtered
    }

    getAggregatedMetrics(instanceId: string, duration: number = 3600000): {
        avgCpu: number
        avgMemory: number
        avgStorage: number
        avgNetworkIn: number
        avgNetworkOut: number
        avgDiskIO: number
    } | null {
        const now = new Date()
        const start = new Date(now.getTime() - duration)
        const metrics = this.getMetricsByTimeRange(start, now, instanceId)

        if (metrics.length === 0) return null

        const sum = metrics.reduce((acc, m) => ({
            cpu: acc.cpu + m.metrics.cpu,
            memory: acc.memory + m.metrics.memory,
            storage: acc.storage + m.metrics.storage,
            networkIn: acc.networkIn + m.metrics.networkIn,
            networkOut: acc.networkOut + m.metrics.networkOut,
            diskIO: acc.diskIO + m.metrics.diskIO
        }), { cpu: 0, memory: 0, storage: 0, networkIn: 0, networkOut: 0, diskIO: 0 })

        const count = metrics.length

        return {
            avgCpu: sum.cpu / count,
            avgMemory: sum.memory / count,
            avgStorage: sum.storage / count,
            avgNetworkIn: sum.networkIn / count,
            avgNetworkOut: sum.networkOut / count,
            avgDiskIO: sum.diskIO / count
        }
    }

    // Logging
    log(instanceId: string, level: LogEntry['level'], message: string, context?: Record<string, any>): void {
        const entry: LogEntry = {
            id: `log-${++this.logCounter}`,
            timestamp: new Date(),
            instanceId,
            level,
            message,
            context
        }

        this.logs.push(entry)

        // Trim logs if exceeding limit
        if (this.logs.length > 100000) {
            this.logs = this.logs.slice(-100000)
        }

        log[level](`[Instance ${instanceId}] ${message}`, context || '')
    }

    getLogs(instanceId?: string, level?: LogEntry['level']): LogEntry[] {
        let filtered = [...this.logs]

        if (instanceId) {
            filtered = filtered.filter(l => l.instanceId === instanceId)
        }

        if (level) {
            filtered = filtered.filter(l => l.level === level)
        }

        return filtered
    }

    getLogsByTimeRange(start: Date, end: Date, instanceId?: string): LogEntry[] {
        let filtered = this.logs.filter(l => l.timestamp >= start && l.timestamp <= end)
        if (instanceId) {
            filtered = filtered.filter(l => l.instanceId === instanceId)
        }
        return filtered
    }

    searchLogs(query: string): LogEntry[] {
        const queryLower = query.toLowerCase()
        return this.logs.filter(l =>
            l.message.toLowerCase().includes(queryLower) ||
            JSON.stringify(l.context || {}).toLowerCase().includes(queryLower)
        )
    }

    clearLogs(instanceId?: string): void {
        if (instanceId) {
            this.logs = this.logs.filter(l => l.instanceId !== instanceId)
        } else {
            this.logs = []
            this.logCounter = 0
        }
        log.info(`Cleared logs${instanceId ? ` for instance ${instanceId}` : ''}`)
    }

    // Alerts
    private async checkAlertThresholds(instanceId: string, metrics: MetricData['metrics']): Promise<void> {
        const configs = this.getMonitorConfigs()

        for (const config of configs.values()) {
            if (!config.alertsEnabled) continue

            const thresholds = config.alertThresholds

            if (metrics.cpu > thresholds.cpuUtilization) {
                this.createAlert('warning', 'cpu_utilization', instanceId,
                    `CPU utilization exceeded threshold: ${metrics.cpu.toFixed(1)}%`,
                    { current: metrics.cpu, threshold: thresholds.cpuUtilization }
                )
            }

            if (metrics.memory > thresholds.memoryUtilization) {
                this.createAlert('warning', 'memory_utilization', instanceId,
                    `Memory utilization exceeded threshold: ${metrics.memory.toFixed(1)}%`,
                    { current: metrics.memory, threshold: thresholds.memoryUtilization }
                )
            }
        }
    }

    createAlert(
        severity: Alert['severity'],
        type: string,
        instanceId?: string,
        message: string,
        details?: Record<string, any>
    ): Alert {
        const alert: Alert = {
            id: `alert-${++this.alertCounter}`,
            timestamp: new Date(),
            severity,
            type,
            instanceId,
            message,
            details,
            acknowledged: false
        }

        this.alerts.push(alert)
        log[severity](`[Alert] ${message}`, details || {})

        return alert
    }

    acknowledgeAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId)
        if (!alert) return false

        alert.acknowledged = true
        log.info(`Acknowledged alert: ${alertId}`)
        return true
    }

    resolveAlert(alertId: string): boolean {
        const alert = this.alerts.find(a => a.id === alertId)
        if (!alert) return false

        alert.acknowledged = true
        alert.resolvedAt = new Date()
        log.info(`Resolved alert: ${alertId}`)
        return true
    }

    getAlerts(): Alert[] {
        return [...this.alerts]
    }

    getUnacknowledgedAlerts(): Alert[] {
        return this.alerts.filter(a => !a.acknowledged)
    }

    getAlertsBySeverity(severity: Alert['severity']): Alert[] {
        return this.alerts.filter(a => a.severity === severity)
    }

    getAlertsByInstance(instanceId: string): Alert[] {
        return this.alerts.filter(a => a.instanceId === instanceId)
    }

    getRecentAlerts(minutes: number = 60): Alert[] {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000)
        return this.alerts.filter(a => a.timestamp >= cutoff)
    }

    clearAlerts(): void {
        this.alerts = []
        this.alertCounter = 0
        log.info('Cleared all alerts')
    }

    // Health Monitoring
    getInstanceHealth(instanceId: string): {
        healthy: boolean
        issues: string[]
        metrics: MetricData['metrics'] | null
    } {
        const metrics = this.getAggregatedMetrics(instanceId, 300000) // Last 5 minutes
        const issues: string[] = []

        if (metrics) {
            if (metrics.avgCpu > 90) issues.push('High CPU utilization')
            if (metrics.avgMemory > 90) issues.push('High memory utilization')
            if (metrics.avgStorage > 90) issues.push('High storage utilization')
        }

        const recentAlerts = this.getRecentAlerts(30).filter(a => a.instanceId === instanceId && a.severity === 'error')
        if (recentAlerts.length > 0) {
            issues.push('Recent error alerts')
        }

        return {
            healthy: issues.length === 0,
            issues,
            metrics
        }
    }

    getOverallHealth(): {
        healthy: boolean
        totalInstances: number
        healthyInstances: number
        unhealthyInstances: number
        issues: string[]
    } {
        const instances = this.cloudAgentService.getRunningInstances()
        let healthyInstances = 0
        const allIssues: string[] = []

        for (const instance of instances) {
            const health = this.getInstanceHealth(instance.id)
            if (health.healthy) {
                healthyInstances++
            } else {
                allIssues.push(...health.issues.map(i => `${instance.id}: ${i}`))
            }
        }

        return {
            healthy: allIssues.length === 0,
            totalInstances: instances.length,
            healthyInstances,
            unhealthyInstances: instances.length - healthyInstances,
            issues: allIssues
        }
    }

    getStatistics(): {
        totalConfigs: number
        totalMetrics: number
        totalLogs: number
        totalAlerts: number
        unacknowledgedAlerts: number
        criticalAlerts: number
        errorAlerts: number
        warningAlerts: number
    } {
        return {
            totalConfigs: this.configs.size,
            totalMetrics: this.metrics.length,
            totalLogs: this.logs.length,
            totalAlerts: this.alerts.length,
            unacknowledgedAlerts: this.getUnacknowledgedAlerts().length,
            criticalAlerts: this.alerts.filter(a => a.severity === 'critical').length,
            errorAlerts: this.alerts.filter(a => a.severity === 'error').length,
            warningAlerts: this.alerts.filter(a => a.severity === 'warning').length
        }
    }

    exportMetrics(instanceId?: string): string {
        return JSON.stringify(this.getMetrics(instanceId), null, 2)
    }

    exportLogs(instanceId?: string): string {
        return JSON.stringify(this.getLogs(instanceId), null, 2)
    }

    exportAlerts(): string {
        return JSON.stringify(this.alerts, null, 2)
    }

    reset(): void {
        this.stopMetricsCollection()
        this.configs.clear()
        this.metrics = []
        this.logs = []
        this.alerts = []
        this.configCounter = 0
        this.logCounter = 0
        this.alertCounter = 0
        log.info('Cloud monitor reset')
    }
}

// Singleton instance
let cloudMonitor: CloudMonitor | null = null

export function getCloudMonitor(): CloudMonitor {
    if (!cloudMonitor) {
        cloudMonitor = new CloudMonitor()
    }
    return cloudMonitor
}

export function destroyCloudMonitor() {
    if (cloudMonitor) {
        cloudMonitor.reset()
        cloudMonitor = null
    }
}
