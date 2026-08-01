/**
 * Cloud Agent IPC Handlers
 * IPC handlers for cloud agent services
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getCloudAgentService } from './cloudAgentService'
import { getCloudSecurity } from './cloudSecurity'
import { getExecutionEnvironment } from './executionEnvironment'
import { getResourceManager } from './resourceManager'
import { getScalingManager } from './scalingManager'
import { getCloudMonitor } from './cloudMonitor'

export function setupCloudAgentIpcs(): void {
    const cloudAgentService = getCloudAgentService()
    const cloudSecurity = getCloudSecurity()
    const executionEnvironment = getExecutionEnvironment()
    const resourceManager = getResourceManager()
    const scalingManager = getScalingManager()
    const cloudMonitor = getCloudMonitor()

    // Cloud Agent Service
    ipcMain.handle(
        'cloud-agent-activate',
        async () => {
            try {
                cloudAgentService.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate cloud agent service:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-agent-deactivate',
        async () => {
            try {
                cloudAgentService.deactivate()
                return { success: true }
            } catch (error) {
                log.error('Failed to deactivate cloud agent service:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-agent-create-config',
        async (_event: IpcMainInvokeEvent, config: any) => {
            try {
                const created = cloudAgentService.createConfig(config)
                return { success: true, config: created }
            } catch (error) {
                log.error('Failed to create config:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-agent-get-configs',
        async () => {
            try {
                const configs = cloudAgentService.getConfigs()
                return { success: true, configs }
            } catch (error) {
                log.error('Failed to get configs:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-agent-provision-instance',
        async (_event: IpcMainInvokeEvent, configId: string) => {
            try {
                const instance = await cloudAgentService.provisionInstance(configId)
                return { success: true, instance }
            } catch (error) {
                log.error('Failed to provision instance:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-agent-deprovision-instance',
        async (_event: IpcMainInvokeEvent, instanceId: string) => {
            try {
                const instance = await cloudAgentService.deprovisionInstance(instanceId)
                return { success: true, instance }
            } catch (error) {
                log.error('Failed to deprovision instance:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-agent-get-instances',
        async () => {
            try {
                const instances = cloudAgentService.getInstances()
                return { success: true, instances }
            } catch (error) {
                log.error('Failed to get instances:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Cloud Security
    ipcMain.handle(
        'cloud-security-activate',
        async () => {
            try {
                cloudSecurity.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate cloud security:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-security-create-api-key',
        async (_event: IpcMainInvokeEvent, name: string, scopes: string[]) => {
            try {
                const apiKey = cloudSecurity.createApiKey(name, scopes)
                return { success: true, apiKey }
            } catch (error) {
                log.error('Failed to create API key:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-security-validate-api-key',
        async (_event: IpcMainInvokeEvent, apiKey: string) => {
            try {
                const valid = cloudSecurity.validateApiKey(apiKey)
                return { success: true, valid }
            } catch (error) {
                log.error('Failed to validate API key:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-security-get-api-keys',
        async () => {
            try {
                const apiKeys = cloudSecurity.getApiKeys()
                return { success: true, apiKeys }
            } catch (error) {
                log.error('Failed to get API keys:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Execution Environment
    ipcMain.handle(
        'execution-environment-activate',
        async () => {
            try {
                executionEnvironment.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate execution environment:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'execution-environment-create',
        async (_event: IpcMainInvokeEvent, config: any) => {
            try {
                const environment = executionEnvironment.createEnvironment(config)
                return { success: true, environment }
            } catch (error) {
                log.error('Failed to create environment:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'execution-environment-get-environments',
        async () => {
            try {
                const environments = executionEnvironment.getEnvironments()
                return { success: true, environments }
            } catch (error) {
                log.error('Failed to get environments:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'execution-environment-stop',
        async (_event: IpcMainInvokeEvent, envId: string) => {
            try {
                await executionEnvironment.stopEnvironment(envId)
                return { success: true }
            } catch (error) {
                log.error('Failed to stop environment:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'execution-environment-start',
        async (_event: IpcMainInvokeEvent, envId: string) => {
            try {
                await executionEnvironment.startEnvironment(envId)
                return { success: true }
            } catch (error) {
                log.error('Failed to start environment:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Resource Manager
    ipcMain.handle(
        'resource-manager-activate',
        async () => {
            try {
                resourceManager.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate resource manager:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'resource-manager-create-quota',
        async (_event: IpcMainInvokeEvent, quota: any) => {
            try {
                const created = resourceManager.createQuota(quota)
                return { success: true, quota: created }
            } catch (error) {
                log.error('Failed to create quota:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'resource-manager-get-quotas',
        async () => {
            try {
                const quotas = resourceManager.getQuotas()
                return { success: true, quotas }
            } catch (error) {
                log.error('Failed to get quotas:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'resource-manager-create-pool',
        async (_event: IpcMainInvokeEvent, pool: any) => {
            try {
                const created = resourceManager.createPool(pool)
                return { success: true, pool: created }
            } catch (error) {
                log.error('Failed to create pool:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'resource-manager-get-usage',
        async () => {
            try {
                const usage = resourceManager.getResourceUsage()
                return { success: true, usage }
            } catch (error) {
                log.error('Failed to get resource usage:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Scaling Manager
    ipcMain.handle(
        'scaling-manager-activate',
        async () => {
            try {
                scalingManager.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate scaling manager:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'scaling-manager-create-policy',
        async (_event: IpcMainInvokeEvent, policy: any) => {
            try {
                const created = scalingManager.createScalingPolicy(policy)
                return { success: true, policy: created }
            } catch (error) {
                log.error('Failed to create scaling policy:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'scaling-manager-get-policies',
        async () => {
            try {
                const policies = scalingManager.getScalingPolicies()
                return { success: true, policies }
            } catch (error) {
                log.error('Failed to get scaling policies:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'scaling-manager-create-load-balancer',
        async (_event: IpcMainInvokeEvent, config: any) => {
            try {
                const created = scalingManager.createLoadBalancer(config)
                return { success: true, balancer: created }
            } catch (error) {
                log.error('Failed to create load balancer:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Cloud Monitor
    ipcMain.handle(
        'cloud-monitor-activate',
        async () => {
            try {
                cloudMonitor.activate()
                return { success: true }
            } catch (error) {
                log.error('Failed to activate cloud monitor:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-monitor-create-config',
        async (_event: IpcMainInvokeEvent, config: any) => {
            try {
                const created = cloudMonitor.createMonitorConfig(config)
                return { success: true, config: created }
            } catch (error) {
                log.error('Failed to create monitor config:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-monitor-get-metrics',
        async (_event: IpcMainInvokeEvent, instanceId?: string) => {
            try {
                const metrics = cloudMonitor.getMetrics(instanceId)
                return { success: true, metrics }
            } catch (error) {
                log.error('Failed to get metrics:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-monitor-get-logs',
        async (_event: IpcMainInvokeEvent, instanceId?: string, level?: string) => {
            try {
                const logs = cloudMonitor.getLogs(instanceId, level as any)
                return { success: true, logs }
            } catch (error) {
                log.error('Failed to get logs:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-monitor-get-alerts',
        async () => {
            try {
                const alerts = cloudMonitor.getAlerts()
                return { success: true, alerts }
            } catch (error) {
                log.error('Failed to get alerts:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    ipcMain.handle(
        'cloud-monitor-get-health',
        async () => {
            try {
                const health = cloudMonitor.getOverallHealth()
                return { success: true, health }
            } catch (error) {
                log.error('Failed to get health:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Cloud agent IPC handlers registered')
}
