/**
 * Commits Service IPC Handlers
 * IPC communication layer for commits service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getCommitsService } from './commitsService'

export function setupCommitsServiceIpcs() {
    const commitsService = getCommitsService()

    // Get repository info
    ipcMain.handle(
        'commits-service-get-repo-info',
        async (_event: IpcMainInvokeEvent, repoPath: string) => {
            try {
                const info = await commitsService.getRepositoryInfo(repoPath)
                return { success: true, info }
            } catch (error) {
                log.error('Failed to get repository info:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Create commit
    ipcMain.handle(
        'commits-service-create-commit',
        async (_event: IpcMainInvokeEvent, repoPath: string, message: string, files?: string[]) => {
            try {
                const hash = await commitsService.createCommit(repoPath, message, files)
                return { success: true, hash }
            } catch (error) {
                log.error('Failed to create commit:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Switch branch
    ipcMain.handle(
        'commits-service-switch-branch',
        async (_event: IpcMainInvokeEvent, repoPath: string, branchName: string) => {
            try {
                await commitsService.switchBranch(repoPath, branchName)
                return { success: true }
            } catch (error) {
                log.error('Failed to switch branch:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Create branch
    ipcMain.handle(
        'commits-service-create-branch',
        async (_event: IpcMainInvokeEvent, repoPath: string, branchName: string) => {
            try {
                await commitsService.createBranch(repoPath, branchName)
                return { success: true }
            } catch (error) {
                log.error('Failed to create branch:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Pull changes
    ipcMain.handle(
        'commits-service-pull',
        async (_event: IpcMainInvokeEvent, repoPath: string) => {
            try {
                await commitsService.pull(repoPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to pull:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Push changes
    ipcMain.handle(
        'commits-service-push',
        async (_event: IpcMainInvokeEvent, repoPath: string, branch?: string) => {
            try {
                await commitsService.push(repoPath, branch)
                return { success: true }
            } catch (error) {
                log.error('Failed to push:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Track metric
    ipcMain.handle(
        'commits-service-track-metric',
        async (_event: IpcMainInvokeEvent, metricName: string, value: any) => {
            try {
                commitsService.trackMetric(metricName, value)
                return { success: true }
            } catch (error) {
                log.error('Failed to track metric:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get metrics
    ipcMain.handle(
        'commits-service-get-metrics',
        async () => {
            try {
                const metrics = commitsService.getMetrics()
                return { success: true, metrics: Array.from(metrics.entries()) }
            } catch (error) {
                log.error('Failed to get metrics:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear cache
    ipcMain.handle(
        'commits-service-clear-cache',
        async (_event: IpcMainInvokeEvent, repoPath?: string) => {
            try {
                commitsService.clearCache(repoPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to clear cache:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Commits service IPC handlers registered')
}
