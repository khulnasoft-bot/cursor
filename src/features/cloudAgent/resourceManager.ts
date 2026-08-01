/**
 * Cloud Agent Resource Manager
 * Service for managing cloud agent resources and quotas
 */

import log from 'electron-log'
import { getCloudAgentService } from './cloudAgentService'
import { getExecutionEnvironment } from './executionEnvironment'

export interface ResourceQuota {
    id: string
    name: string
    maxCpu: number
    maxMemory: number
    maxStorage: number
    maxInstances: number
    maxGpu?: number
    currentUsage: {
        cpu: number
        memory: number
        storage: number
        instances: number
        gpu?: number
    }
    softLimit?: {
        cpu?: number
        memory?: number
        storage?: number
    }
    alertThresholds?: {
        cpu: number
        memory: number
        storage: number
    }
}

export interface ResourcePool {
    id: string
    name: string
    type: 'shared' | 'dedicated' | 'spot'
    provider: string
    region: string
    availableResources: {
        cpu: number
        memory: number
        storage: number
        gpu?: number
    }
    allocatedResources: {
        cpu: number
        memory: number
        storage: number
        gpu?: number
    }
    instances: string[]
}

export interface ResourceAllocation {
    id: string
    instanceId: string
    poolId: string
    resources: {
        cpu: number
        memory: number
        storage: number
        gpu?: number
    }
    allocatedAt: Date
    releasedAt?: Date
}

export class ResourceManager {
    private cloudAgentService = getCloudAgentService()
    private executionEnvironment = getExecutionEnvironment()
    private quotas = new Map<string, ResourceQuota>()
    private pools = new Map<string, ResourcePool>()
    private quotaCache = new Map<string, { timestamp: number; result: ReturnType<typeof this.checkQuotaAvailability> }>()
    private readonly CACHE_TTL = 1000 // 1 second cache TTL
    private allocations: Map<string, ResourceAllocation> = new Map()
    private quotaCounter = 0
    private poolCounter = 0
    private allocationCounter = 0
    private active: boolean = false

    activate(): void {
        this.active = true
        log.info('Resource manager activated')
    }

    deactivate(): void {
        this.active = false
        log.info('Resource manager deactivated')
    }

    isActive(): boolean {
        return this.active
    }

    // Quota Management
    createQuota(quota: Omit<ResourceQuota, 'id' | 'currentUsage'>): ResourceQuota {
        const quotaId = `quota-${++this.quotaCounter}`

        const newQuota: ResourceQuota = {
            ...quota,
            id: quotaId,
            currentUsage: {
                cpu: 0,
                memory: 0,
                storage: 0,
                instances: 0,
                gpu: quota.maxGpu ? 0 : undefined
            }
        }

        this.quotas.set(quotaId, newQuota)
        log.info(`Created resource quota: ${quota.name}`)
        return newQuota
    }

    updateQuota(quotaId: string, updates: Partial<ResourceQuota>): ResourceQuota | null {
        const quota = this.quotas.get(quotaId)
        if (!quota) return null

        const updated = { ...quota, ...updates }
        this.quotas.set(quotaId, updated)
        log.info(`Updated resource quota: ${quota.name}`)
        return updated
    }

    deleteQuota(quotaId: string): boolean {
        const deleted = this.quotas.delete(quotaId)
        if (deleted) {
            log.info(`Deleted resource quota: ${quotaId}`)
        }
        return deleted
    }

    getQuota(quotaId: string): ResourceQuota | undefined {
        return this.quotas.get(quotaId)
    }

    getQuotas(): ResourceQuota[] {
        return Array.from(this.quotas.values())
    }

    checkQuotaAvailability(quotaId: string, requiredResources: { cpu: number; memory: number; storage: number; gpu?: number }): {
        available: boolean
        reason?: string
        warning?: string
    } {
        const cacheKey = `${quotaId}:${JSON.stringify(requiredResources)}`
        const cached = this.quotaCache.get(cacheKey)
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.result
        }

        const quota = this.quotas.get(quotaId)
        if (!quota) {
            return { available: false, reason: 'Quota not found' }
        }

        // Check hard limits
        if (quota.currentUsage.cpu + requiredResources.cpu > quota.maxCpu) {
            return { available: false, reason: 'CPU quota exceeded' }
        }
        if (quota.currentUsage.memory + requiredResources.memory > quota.maxMemory) {
            return { available: false, reason: 'Memory quota exceeded' }
        }
        if (quota.currentUsage.storage + requiredResources.storage > quota.maxStorage) {
            return { available: false, reason: 'Storage quota exceeded' }
        }
        if (quota.currentUsage.instances + 1 > quota.maxInstances) {
            return { available: false, reason: 'Instance quota exceeded' }
        }
        if (requiredResources.gpu && quota.maxGpu && quota.currentUsage.gpu + requiredResources.gpu > quota.maxGpu) {
            return { available: false, reason: 'GPU quota exceeded' }
        }

        // Check soft limits and generate warnings
        let warning: string | undefined
        if (quota.softLimit) {
            if (quota.softLimit.cpu && quota.currentUsage.cpu + requiredResources.cpu > quota.softLimit.cpu) {
                warning = 'Approaching CPU soft limit'
            } else if (quota.softLimit.memory && quota.currentUsage.memory + requiredResources.memory > quota.softLimit.memory) {
                warning = 'Approaching memory soft limit'
            } else if (quota.softLimit.storage && quota.currentUsage.storage + requiredResources.storage > quota.softLimit.storage) {
                warning = 'Approaching storage soft limit'
            }
        }

        // Check alert thresholds
        if (quota.alertThresholds && !warning) {
            const cpuPercent = ((quota.currentUsage.cpu + requiredResources.cpu) / quota.maxCpu) * 100
            const memoryPercent = ((quota.currentUsage.memory + requiredResources.memory) / quota.maxMemory) * 100
            const storagePercent = ((quota.currentUsage.storage + requiredResources.storage) / quota.maxStorage) * 100

            if (cpuPercent > quota.alertThresholds.cpu) {
                warning = `CPU usage at ${cpuPercent.toFixed(1)}%`
            } else if (memoryPercent > quota.alertThresholds.memory) {
                warning = `Memory usage at ${memoryPercent.toFixed(1)}%`
            } else if (storagePercent > quota.alertThresholds.storage) {
                warning = `Storage usage at ${storagePercent.toFixed(1)}%`
            }
        }

        const result = { available: true, warning }
        this.quotaCache.set(cacheKey, { timestamp: Date.now(), result })
        return result
    }

    // Resource Pool Management
    createPool(pool: Omit<ResourcePool, 'id' | 'allocatedResources' | 'instances'>): ResourcePool {
        const poolId = `pool-${++this.poolCounter}`

        const newPool: ResourcePool = {
            ...pool,
            id: poolId,
            allocatedResources: {
                cpu: 0,
                memory: 0,
                storage: 0,
                gpu: pool.availableResources.gpu
            },
            instances: []
        }

        this.pools.set(poolId, newPool)
        log.info(`Created resource pool: ${pool.name}`)
        return newPool
    }

    updatePool(poolId: string, updates: Partial<ResourcePool>): ResourcePool | null {
        const pool = this.pools.get(poolId)
        if (!pool) return null

        const updated = { ...pool, ...updates }
        this.pools.set(poolId, updated)
        log.info(`Updated resource pool: ${pool.name}`)
        return updated
    }

    deletePool(poolId: string): boolean {
        const pool = this.pools.get(poolId)
        if (!pool) return false

        if (pool.instances.length > 0) {
            log.warn(`Cannot delete pool ${poolId} with active instances`)
            return false
        }

        this.pools.delete(poolId)
        log.info(`Deleted resource pool: ${poolId}`)
        return true
    }

    getPool(poolId: string): ResourcePool | undefined {
        return this.pools.get(poolId)
    }

    getPools(): ResourcePool[] {
        return Array.from(this.pools.values())
    }

    getAvailablePools(): ResourcePool[] {
        return this.getPools().filter(pool => {
            const availableCpu = pool.availableResources.cpu - pool.allocatedResources.cpu
            const availableMemory = pool.availableResources.memory - pool.allocatedResources.memory
            return availableCpu > 0 && availableMemory > 0
        })
    }

    // Resource Allocation
    allocateResources(instanceId: string, poolId: string, resources: { cpu: number; memory: number; storage: number; gpu?: number }): ResourceAllocation | null {
        const pool = this.pools.get(poolId)
        if (!pool) return null

        const availableCpu = pool.availableResources.cpu - pool.allocatedResources.cpu
        const availableMemory = pool.availableResources.memory - pool.allocatedResources.memory
        const availableStorage = pool.availableResources.storage - pool.allocatedResources.storage

        if (resources.cpu > availableCpu || resources.memory > availableMemory || resources.storage > availableStorage) {
            log.warn(`Insufficient resources in pool ${poolId}`)
            return null
        }

        const allocationId = `alloc-${++this.allocationCounter}`

        const allocation: ResourceAllocation = {
            id: allocationId,
            instanceId,
            poolId,
            resources,
            allocatedAt: new Date()
        }

        this.allocations.set(allocationId, allocation)

        // Update pool allocation
        pool.allocatedResources.cpu += resources.cpu
        pool.allocatedResources.memory += resources.memory
        pool.allocatedResources.storage += resources.storage
        if (resources.gpu && pool.allocatedResources.gpu !== undefined) {
            pool.allocatedResources.gpu += resources.gpu
        }
        pool.instances.push(instanceId)

        log.info(`Allocated resources for instance ${instanceId} in pool ${poolId}`)
        return allocation
    }

    releaseResources(allocationId: string): boolean {
        const allocation = this.allocations.get(allocationId)
        if (!allocation) return false

        if (allocation.releasedAt) {
            log.warn(`Allocation ${allocationId} already released`)
            return false
        }

        const pool = this.pools.get(allocation.poolId)
        if (pool) {
            pool.allocatedResources.cpu -= allocation.resources.cpu
            pool.allocatedResources.memory -= allocation.resources.memory
            pool.allocatedResources.storage -= allocation.resources.storage
            if (allocation.resources.gpu && pool.allocatedResources.gpu !== undefined) {
                pool.allocatedResources.gpu -= allocation.resources.gpu
            }

            const instanceIndex = pool.instances.indexOf(allocation.instanceId)
            if (instanceIndex > -1) {
                pool.instances.splice(instanceIndex, 1)
            }
        }

        allocation.releasedAt = new Date()
        log.info(`Released resources for allocation ${allocationId}`)
        return true
    }

    getAllocation(allocationId: string): ResourceAllocation | undefined {
        return this.allocations.get(allocationId)
    }

    getAllocations(): ResourceAllocation[] {
        return Array.from(this.allocations.values())
    }

    getAllocationsByInstance(instanceId: string): ResourceAllocation[] {
        return this.getAllocations().filter(a => a.instanceId === instanceId)
    }

    getAllocationsByPool(poolId: string): ResourceAllocation[] {
        return this.getAllocations().filter(a => a.poolId === poolId)
    }

    // Resource Monitoring
    getResourceUsage(): {
        totalCpu: number
        totalMemory: number
        totalStorage: number
        totalGpu: number
        allocatedCpu: number
        allocatedMemory: number
        allocatedStorage: number
        allocatedGpu: number
        utilization: {
            cpu: number
            memory: number
            storage: number
            gpu: number
        }
    } {
        const pools = this.getPools()

        let totalCpu = 0
        let totalMemory = 0
        let totalStorage = 0
        let totalGpu = 0
        let allocatedCpu = 0
        let allocatedMemory = 0
        let allocatedStorage = 0
        let allocatedGpu = 0

        for (const pool of pools) {
            totalCpu += pool.availableResources.cpu
            totalMemory += pool.availableResources.memory
            totalStorage += pool.availableResources.storage
            totalGpu += pool.availableResources.gpu || 0

            allocatedCpu += pool.allocatedResources.cpu
            allocatedMemory += pool.allocatedResources.memory
            allocatedStorage += pool.allocatedResources.storage
            allocatedGpu += pool.allocatedResources.gpu || 0
        }

        return {
            totalCpu,
            totalMemory,
            totalStorage,
            totalGpu,
            allocatedCpu,
            allocatedMemory,
            allocatedStorage,
            allocatedGpu,
            utilization: {
                cpu: totalCpu > 0 ? (allocatedCpu / totalCpu) * 100 : 0,
                memory: totalMemory > 0 ? (allocatedMemory / totalMemory) * 100 : 0,
                storage: totalStorage > 0 ? (allocatedStorage / totalStorage) * 100 : 0,
                gpu: totalGpu > 0 ? (allocatedGpu / totalGpu) * 100 : 0
            }
        }
    }

    getInstanceResourceUsage(instanceId: string): {
        cpu: number
        memory: number
        storage: number
        gpu?: number
    } | null {
        const allocations = this.getAllocationsByInstance(instanceId)
        if (allocations.length === 0) return null

        const allocation = allocations[0]
        return allocation.resources
    }

    getPoolUtilization(poolId: string): {
        cpu: number
        memory: number
        storage: number
        gpu: number
    } | null {
        const pool = this.pools.get(poolId)
        if (!pool) return null

        return {
            cpu: pool.availableResources.cpu > 0 ? (pool.allocatedResources.cpu / pool.availableResources.cpu) * 100 : 0,
            memory: pool.availableResources.memory > 0 ? (pool.allocatedResources.memory / pool.availableResources.memory) * 100 : 0,
            storage: pool.availableResources.storage > 0 ? (pool.allocatedResources.storage / pool.availableResources.storage) * 100 : 0,
            gpu: pool.availableResources.gpu && pool.allocatedResources.gpu !== undefined ?
                (pool.allocatedResources.gpu / pool.availableResources.gpu) * 100 : 0
        }
    }

    optimizeResourceAllocation(): void {
        const utilization = this.getResourceUsage()

        log.info(`Resource utilization - CPU: ${utilization.utilization.cpu.toFixed(1)}%, Memory: ${utilization.utilization.memory.toFixed(1)}%`)

        // Placeholder for optimization logic
        // Could implement:
        // - Consolidate underutilized instances
        // - Move instances to more suitable pools
        // - Scale down over-provisioned resources
    }

    getStatistics(): {
        totalQuotas: number
        totalPools: number
        totalAllocations: number
        activeAllocations: number
        totalResources: ReturnType<typeof this.getResourceUsage>
    } {
        const allocations = this.getAllocations()
        const activeAllocations = allocations.filter(a => !a.releasedAt).length

        return {
            totalQuotas: this.quotas.size,
            totalPools: this.pools.size,
            totalAllocations: allocations.length,
            activeAllocations,
            totalResources: this.getResourceUsage()
        }
    }

    reset(): void {
        this.quotas.clear()
        this.pools.clear()
        this.allocations.clear()
        this.quotaCounter = 0
        this.poolCounter = 0
        this.allocationCounter = 0
        log.info('Resource manager reset')
    }
}

// Singleton instance
let resourceManager: ResourceManager | null = null

export function getResourceManager(): ResourceManager {
    if (!resourceManager) {
        resourceManager = new ResourceManager()
    }
    return resourceManager
}

export function destroyResourceManager() {
    if (resourceManager) {
        resourceManager.reset()
        resourceManager = null
    }
}
