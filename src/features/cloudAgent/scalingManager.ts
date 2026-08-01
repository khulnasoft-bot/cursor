/**
 * Cloud Agent Scaling and Load Balancing
 * Service for auto-scaling and load balancing cloud agents
 */

import log from 'electron-log'
import { getCloudAgentService } from './cloudAgentService'
import { getResourceManager } from './resourceManager'
import type { CloudAgentInstance } from './cloudAgentService'

export interface ScalingPolicy {
    id: string
    name: string
    configId: string
    minInstances: number
    maxInstances: number
    targetCpuUtilization: number
    targetMemoryUtilization: number
    scaleUpCooldown: number // seconds
    scaleDownCooldown: number // seconds
    scaleUpThreshold: number // percentage above target to scale up
    scaleDownThreshold: number // percentage below target to scale down
    enabled: boolean
    lastScaleAction?: Date
}

export interface ScalingEvent {
    id: string
    timestamp: Date
    policyId: string
    action: 'scale_up' | 'scale_down' | 'no_action'
    reason: string
    previousInstanceCount: number
    newInstanceCount: number
}

export interface LoadBalancerConfig {
    id: string
    name: string
    algorithm: 'round_robin' | 'least_connections' | 'resource_based' | 'weighted'
    healthCheckInterval: number
    unhealthyThreshold: number
    healthyThreshold: number
    enabled: boolean
}

export class ScalingManager {
    private cloudAgentService = getCloudAgentService()
    private resourceManager = getResourceManager()
    private scalingPolicies: Map<string, ScalingPolicy> = new Map()
    private scalingEvents: ScalingEvent[] = []
    private loadBalancers: Map<string, LoadBalancerConfig> = new Map()
    private policyCounter = 0
    private eventCounter = 0
    private balancerCounter = 0
    private scalingInterval: NodeJS.Timeout | null = null
    private active: boolean = false

    activate(): void {
        this.active = true
        this.startScalingMonitor()
        log.info('Scaling manager activated')
    }

    deactivate(): void {
        this.active = false
        this.stopScalingMonitor()
        log.info('Scaling manager deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    private startScalingMonitor(): void {
        if (this.scalingInterval) return

        this.scalingInterval = setInterval(() => {
            this.evaluateScalingPolicies()
        }, 60000) // Check every minute

        log.info('Scaling monitor started')
    }

    private stopScalingMonitor(): void {
        if (this.scalingInterval) {
            clearInterval(this.scalingInterval)
            this.scalingInterval = null
            log.info('Scaling monitor stopped')
        }
    }

    // Scaling Policy Management
    createScalingPolicy(policy: Omit<ScalingPolicy, 'id'>): ScalingPolicy {
        const policyId = `policy-${++this.policyCounter}`

        const newPolicy: ScalingPolicy = {
            ...policy,
            id: policyId
        }

        this.scalingPolicies.set(policyId, newPolicy)
        log.info(`Created scaling policy: ${policy.name}`)
        return newPolicy
    }

    updateScalingPolicy(policyId: string, updates: Partial<ScalingPolicy>): ScalingPolicy | null {
        const policy = this.scalingPolicies.get(policyId)
        if (!policy) return null

        const updated = { ...policy, ...updates }
        this.scalingPolicies.set(policyId, updated)
        log.info(`Updated scaling policy: ${policy.name}`)
        return updated
    }

    deleteScalingPolicy(policyId: string): boolean {
        const deleted = this.scalingPolicies.delete(policyId)
        if (deleted) {
            log.info(`Deleted scaling policy: ${policyId}`)
        }
        return deleted
    }

    getScalingPolicy(policyId: string): ScalingPolicy | undefined {
        return this.scalingPolicies.get(policyId)
    }

    getScalingPolicies(): ScalingPolicy[] {
        return Array.from(this.scalingPolicies.values())
    }

    enableScalingPolicy(policyId: string): boolean {
        const policy = this.scalingPolicies.get(policyId)
        if (!policy) return false

        policy.enabled = true
        log.info(`Enabled scaling policy: ${policy.name}`)
        return true
    }

    disableScalingPolicy(policyId: string): boolean {
        const policy = this.scalingPolicies.get(policyId)
        if (!policy) return false

        policy.enabled = false
        log.info(`Disabled scaling policy: ${policy.name}`)
        return true
    }

    // Scaling Evaluation
    private async evaluateScalingPolicies(): Promise<void> {
        if (!this.active) return

        for (const policy of this.scalingPolicies.values()) {
            if (!policy.enabled) continue

            await this.evaluatePolicy(policy)
        }
    }

    private async evaluatePolicy(policy: ScalingPolicy): Promise<void> {
        const instances = this.cloudAgentService.getInstancesByConfig(policy.configId)
        const runningInstances = instances.filter(i => i.status === 'running')

        const currentInstanceCount = runningInstances.length

        // Check cooldown period
        if (policy.lastScaleAction) {
            const cooldownMs = policy.lastScaleAction.getTime() + (policy.scaleUpCooldown * 1000)
            if (Date.now() < cooldownMs) {
                return // Still in cooldown period
            }
        }

        if (currentInstanceCount === 0) {
            // Scale up to minimum
            if (currentInstanceCount < policy.minInstances) {
                await this.scaleUp(policy, policy.minInstances - currentInstanceCount, 'Below minimum instances')
            }
            return
        }

        // Get resource utilization
        const utilization = this.resourceManager.getResourceUsage()
        const cpuUtil = utilization.utilization.cpu
        const memUtil = utilization.utilization.memory

        let action: 'scale_up' | 'scale_down' | 'no_action' = 'no_action'
        let reason = ''

        const scaleUpThreshold = policy.scaleUpThreshold || 10
        const scaleDownThreshold = policy.scaleDownThreshold || 20

        // Check scale up conditions
        if (cpuUtil > policy.targetCpuUtilization + scaleUpThreshold || memUtil > policy.targetMemoryUtilization + scaleUpThreshold) {
            if (currentInstanceCount < policy.maxInstances) {
                action = 'scale_up'
                reason = `High utilization: CPU ${cpuUtil.toFixed(1)}%, Memory ${memUtil.toFixed(1)}%`
            }
        }
        // Check scale down conditions
        else if (cpuUtil < policy.targetCpuUtilization - scaleDownThreshold && memUtil < policy.targetMemoryUtilization - scaleDownThreshold) {
            if (currentInstanceCount > policy.minInstances) {
                action = 'scale_down'
                reason = `Low utilization: CPU ${cpuUtil.toFixed(1)}%, Memory ${memUtil.toFixed(1)}%`
            }
        }

        if (action !== 'no_action') {
            await this.executeScalingAction(policy, action, reason)
        }
    }

    private async executeScalingAction(policy: ScalingPolicy, action: 'scale_up' | 'scale_down', reason: string): Promise<void> {
        const instances = this.cloudAgentService.getInstancesByConfig(policy.configId)
        const runningInstances = instances.filter(i => i.status === 'running')
        const currentCount = runningInstances.length

        let newCount = currentCount

        if (action === 'scale_up') {
            newCount = Math.min(currentCount + 1, policy.maxInstances)
            await this.scaleUp(policy, newCount - currentCount, reason)
        } else if (action === 'scale_down') {
            newCount = Math.max(currentCount - 1, policy.minInstances)
            await this.scaleDown(policy, currentCount - newCount, reason)
        }

        // Log scaling event
        const event: ScalingEvent = {
            id: `event-${++this.eventCounter}`,
            timestamp: new Date(),
            policyId: policy.id,
            action,
            reason,
            previousInstanceCount: currentCount,
            newInstanceCount: newCount
        }

        this.scalingEvents.push(event)
        log.info(`Scaling event: ${action} from ${currentCount} to ${newCount} instances`)
    }

    private async scaleUp(policy: ScalingPolicy, count: number, _reason: string): Promise<void> {
        for (let i = 0; i < count; i++) {
            try {
                await this.cloudAgentService.provisionInstance(policy.configId)
                policy.lastScaleAction = new Date()
            } catch (error) {
                log.error(`Failed to scale up: ${error}`)
            }
        }
    }

    private async scaleDown(policy: ScalingPolicy, count: number, _reason: string): Promise<void> {
        const instances = this.cloudAgentService.getInstancesByConfig(policy.configId)
        const runningInstances = instances.filter(i => i.status === 'running')

        for (let i = 0; i < count && i < runningInstances.length; i++) {
            try {
                await this.cloudAgentService.deprovisionInstance(runningInstances[i].id)
                policy.lastScaleAction = new Date()
            } catch (error) {
                log.error(`Failed to scale down: ${error}`)
            }
        }
    }

    // Load Balancer Management
    createLoadBalancer(config: Omit<LoadBalancerConfig, 'id'>): LoadBalancerConfig {
        const balancerId = `balancer-${++this.balancerCounter}`

        const newBalancer: LoadBalancerConfig = {
            ...config,
            id: balancerId
        }

        this.loadBalancers.set(balancerId, newBalancer)
        log.info(`Created load balancer: ${config.name}`)
        return newBalancer
    }

    updateLoadBalancer(balancerId: string, updates: Partial<LoadBalancerConfig>): LoadBalancerConfig | null {
        const balancer = this.loadBalancers.get(balancerId)
        if (!balancer) return null

        const updated = { ...balancer, ...updates }
        this.loadBalancers.set(balancerId, updated)
        log.info(`Updated load balancer: ${balancer.name}`)
        return updated
    }

    deleteLoadBalancer(balancerId: string): boolean {
        const deleted = this.loadBalancers.delete(balancerId)
        if (deleted) {
            log.info(`Deleted load balancer: ${balancerId}`)
        }
        return deleted
    }

    getLoadBalancer(balancerId: string): LoadBalancerConfig | undefined {
        return this.loadBalancers.get(balancerId)
    }

    getLoadBalancers(): LoadBalancerConfig[] {
        return Array.from(this.loadBalancers.values())
    }

    // Load Balancing
    selectInstance(configId: string, algorithm: LoadBalancerConfig['algorithm']): string | null {
        const instances = this.cloudAgentService.getInstancesByConfig(configId)
        const runningInstances = instances.filter(i => i.status === 'running')

        if (runningInstances.length === 0) return null

        switch (algorithm) {
            case 'round_robin':
                return this.roundRobinSelect(runningInstances)
            case 'least_connections':
                return this.leastConnectionsSelect(runningInstances)
            case 'resource_based':
                return this.resourceBasedSelect(runningInstances)
            case 'weighted':
                return this.weightedSelect(runningInstances)
            default:
                return runningInstances[0].id
        }
    }

    private roundRobinIndex = 0
    private roundRobinSelect(instances: CloudAgentInstance[]): string {
        const instance = instances[this.roundRobinIndex % instances.length]
        this.roundRobinIndex++
        return instance.id
    }

    private leastConnectionsSelect(instances: CloudAgentInstance[]): string {
        const instance = instances.reduce((min, current) =>
            current.tasks.length < min.tasks.length ? current : min
        )
        return instance.id
    }

    private resourceBasedSelect(instances: CloudAgentInstance[]): string {
        let bestInstance = instances[0]
        let lowestUtil = Infinity

        for (const instance of instances) {
            const utilization = this.resourceManager.getInstanceResourceUsage(instance.id)
            if (utilization) {
                const totalUtil = utilization.cpu + utilization.memory
                if (totalUtil < lowestUtil) {
                    lowestUtil = totalUtil
                    bestInstance = instance
                }
            }
        }

        return bestInstance.id
    }

    private weightedSelect(instances: CloudAgentInstance[]): string {
        // Simple weighted selection based on resources
        const totalResources = instances.reduce((sum, i) =>
            sum + i.resources.cpu + i.resources.memory / 1024, 0
        )

        let random = Math.random() * totalResources
        for (const instance of instances) {
            const weight = instance.resources.cpu + instance.resources.memory / 1024
            random -= weight
            if (random <= 0) {
                return instance.id
            }
        }

        return instances[instances.length - 1].id
    }

    // Scaling Events
    getScalingEvents(): ScalingEvent[] {
        return [...this.scalingEvents]
    }

    getScalingEventsByPolicy(policyId: string): ScalingEvent[] {
        return this.scalingEvents.filter(e => e.policyId === policyId)
    }

    getRecentScalingEvents(minutes: number = 60): ScalingEvent[] {
        const cutoff = new Date(Date.now() - minutes * 60 * 1000)
        return this.scalingEvents.filter(e => e.timestamp >= cutoff)
    }

    clearScalingEvents(): void {
        this.scalingEvents = []
        this.eventCounter = 0
        log.info('Cleared scaling events')
    }

    getStatistics(): {
        totalPolicies: number
        enabledPolicies: number
        totalLoadBalancers: number
        enabledLoadBalancers: number
        totalScalingEvents: number
        scaleUpEvents: number
        scaleDownEvents: number
    } {
        const policies = this.getScalingPolicies()
        const balancers = this.getLoadBalancers()

        return {
            totalPolicies: policies.length,
            enabledPolicies: policies.filter(p => p.enabled).length,
            totalLoadBalancers: balancers.length,
            enabledLoadBalancers: balancers.filter(b => b.enabled).length,
            totalScalingEvents: this.scalingEvents.length,
            scaleUpEvents: this.scalingEvents.filter(e => e.action === 'scale_up').length,
            scaleDownEvents: this.scalingEvents.filter(e => e.action === 'scale_down').length
        }
    }

    reset(): void {
        this.stopScalingMonitor()
        this.scalingPolicies.clear()
        this.scalingEvents = []
        this.loadBalancers.clear()
        this.policyCounter = 0
        this.eventCounter = 0
        this.balancerCounter = 0
        this.roundRobinIndex = 0
        log.info('Scaling manager reset')
    }
}

// Singleton instance
let scalingManager: ScalingManager | null = null

export function getScalingManager(): ScalingManager {
    if (!scalingManager) {
        scalingManager = new ScalingManager()
    }
    return scalingManager
}

export function destroyScalingManager() {
    if (scalingManager) {
        scalingManager.reset()
        scalingManager = null
    }
}
