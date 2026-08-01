/**
 * Checkout Service IPC Handlers
 * IPC communication layer for checkout service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getCheckoutService } from './checkoutService'
import type { CheckoutOptions } from './checkoutService'

export function setupCheckoutServiceIpcs() {
    const checkoutService = getCheckoutService()

    // Checkout branch
    ipcMain.handle(
        'checkout-service-branch',
        async (_event: IpcMainInvokeEvent, repoPath: string, branchName: string, options?: CheckoutOptions) => {
            try {
                await checkoutService.checkoutBranch(repoPath, branchName, options)
                return { success: true }
            } catch (error) {
                log.error('Failed to checkout branch:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Checkout file
    ipcMain.handle(
        'checkout-service-file',
        async (_event: IpcMainInvokeEvent, repoPath: string, filePath: string) => {
            try {
                await checkoutService.checkoutFile(repoPath, filePath)
                return { success: true }
            } catch (error) {
                log.error('Failed to checkout file:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Checkout commit
    ipcMain.handle(
        'checkout-service-commit',
        async (_event: IpcMainInvokeEvent, repoPath: string, commitHash: string) => {
            try {
                await checkoutService.checkoutCommit(repoPath, commitHash)
                return { success: true }
            } catch (error) {
                log.error('Failed to checkout commit:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get current branch
    ipcMain.handle(
        'checkout-service-current-branch',
        async (_event: IpcMainInvokeEvent, repoPath: string) => {
            try {
                const branch = await checkoutService.getCurrentBranch(repoPath)
                return { success: true, branch }
            } catch (error) {
                log.error('Failed to get current branch:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get current commit
    ipcMain.handle(
        'checkout-service-current-commit',
        async (_event: IpcMainInvokeEvent, repoPath: string) => {
            try {
                const commit = await checkoutService.getCurrentCommit(repoPath)
                return { success: true, commit }
            } catch (error) {
                log.error('Failed to get current commit:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get branches
    ipcMain.handle(
        'checkout-service-branches',
        async (_event: IpcMainInvokeEvent, repoPath: string) => {
            try {
                const branches = await checkoutService.getBranches(repoPath)
                return { success: true, branches }
            } catch (error) {
                log.error('Failed to get branches:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Create branch
    ipcMain.handle(
        'checkout-service-create-branch',
        async (_event: IpcMainInvokeEvent, repoPath: string, branchName: string, startPoint?: string) => {
            try {
                await checkoutService.createBranch(repoPath, branchName, startPoint)
                return { success: true }
            } catch (error) {
                log.error('Failed to create branch:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Delete branch
    ipcMain.handle(
        'checkout-service-delete-branch',
        async (_event: IpcMainInvokeEvent, repoPath: string, branchName: string, force?: boolean) => {
            try {
                await checkoutService.deleteBranch(repoPath, branchName, force)
                return { success: true }
            } catch (error) {
                log.error('Failed to delete branch:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Discard changes
    ipcMain.handle(
        'checkout-service-discard',
        async (_event: IpcMainInvokeEvent, repoPath: string, filePath?: string) => {
            try {
                await checkoutService.discardChanges(repoPath, filePath)
                return { success: true }
            } catch (error) {
                log.error('Failed to discard changes:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stash changes
    ipcMain.handle(
        'checkout-service-stash',
        async (_event: IpcMainInvokeEvent, repoPath: string, message?: string) => {
            try {
                const result = await checkoutService.stashChanges(repoPath, message)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to stash changes:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stash pop
    ipcMain.handle(
        'checkout-service-stash-pop',
        async (_event: IpcMainInvokeEvent, repoPath: string, stashRef?: string) => {
            try {
                await checkoutService.stashPop(repoPath, stashRef)
                return { success: true }
            } catch (error) {
                log.error('Failed to pop stash:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Checkout service IPC handlers registered')
}
