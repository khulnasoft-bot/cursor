/**
 * Cursor Checkout Service
 * Git checkout operations for branch and file management
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import log from 'electron-log'

const execAsync = promisify(exec)

export interface CheckoutOptions {
    createBranch?: boolean
    force?: boolean
    track?: boolean
}

class CheckoutService {
    async checkoutBranch(repoPath: string, branchName: string, options?: CheckoutOptions): Promise<void> {
        try {
            let command = `git checkout`
            
            if (options?.createBranch) {
                command += ` -b ${branchName}`
            } else {
                command += ` ${branchName}`
            }
            
            if (options?.force) {
                command += ` --force`
            }
            
            if (options?.track) {
                command += ` --track`
            }

            await execAsync(command, { cwd: repoPath })
            log.info(`Checked out branch: ${branchName}`)
        } catch (error) {
            log.error('Failed to checkout branch:', error)
            throw error
        }
    }

    async checkoutFile(repoPath: string, filePath: string): Promise<void> {
        try {
            await execAsync(`git checkout -- ${filePath}`, { cwd: repoPath })
            log.info(`Checked out file: ${filePath}`)
        } catch (error) {
            log.error('Failed to checkout file:', error)
            throw error
        }
    }

    async checkoutCommit(repoPath: string, commitHash: string): Promise<void> {
        try {
            await execAsync(`git checkout ${commitHash}`, { cwd: repoPath })
            log.info(`Checked out commit: ${commitHash}`)
        } catch (error) {
            log.error('Failed to checkout commit:', error)
            throw error
        }
    }

    async getCurrentBranch(repoPath: string): Promise<string> {
        try {
            const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: repoPath })
            return stdout.trim()
        } catch (error) {
            log.error('Failed to get current branch:', error)
            throw error
        }
    }

    async getCurrentCommit(repoPath: string): Promise<string> {
        try {
            const { stdout } = await execAsync('git rev-parse HEAD', { cwd: repoPath })
            return stdout.trim()
        } catch (error) {
            log.error('Failed to get current commit:', error)
            throw error
        }
    }

    async getBranches(repoPath: string): Promise<string[]> {
        try {
            const { stdout } = await execAsync('git branch -a', { cwd: repoPath })
            return stdout.trim().split('\n').map(b => b.replace(/^\*?\s*/, '').trim())
        } catch (error) {
            log.error('Failed to get branches:', error)
            throw error
        }
    }

    async createBranch(repoPath: string, branchName: string, startPoint?: string): Promise<void> {
        try {
            const command = startPoint 
                ? `git branch ${branchName} ${startPoint}`
                : `git branch ${branchName}`
            
            await execAsync(command, { cwd: repoPath })
            log.info(`Created branch: ${branchName}`)
        } catch (error) {
            log.error('Failed to create branch:', error)
            throw error
        }
    }

    async deleteBranch(repoPath: string, branchName: string, force: boolean = false): Promise<void> {
        try {
            const command = force 
                ? `git branch -D ${branchName}`
                : `git branch -d ${branchName}`
            
            await execAsync(command, { cwd: repoPath })
            log.info(`Deleted branch: ${branchName}`)
        } catch (error) {
            log.error('Failed to delete branch:', error)
            throw error
        }
    }

    async discardChanges(repoPath: string, filePath?: string): Promise<void> {
        try {
            const command = filePath 
                ? `git checkout -- ${filePath}`
                : `git checkout -- .`
            
            await execAsync(command, { cwd: repoPath })
            log.info(`Discarded changes${filePath ? ` for ${filePath}` : ''}`)
        } catch (error) {
            log.error('Failed to discard changes:', error)
            throw error
        }
    }

    async stashChanges(repoPath: string, message?: string): Promise<string> {
        try {
            const command = message 
                ? `git stash push -m "${message}"`
                : `git stash`
            
            const { stdout } = await execAsync(command, { cwd: repoPath })
            log.info('Stashed changes')
            return stdout.trim()
        } catch (error) {
            log.error('Failed to stash changes:', error)
            throw error
        }
    }

    async stashPop(repoPath: string, stashRef?: string): Promise<void> {
        try {
            const command = stashRef 
                ? `git stash pop ${stashRef}`
                : `git stash pop`
            
            await execAsync(command, { cwd: repoPath })
            log.info('Popped stashed changes')
        } catch (error) {
            log.error('Failed to pop stash:', error)
            throw error
        }
    }
}

// Singleton instance
let checkoutService: CheckoutService | null = null

export function getCheckoutService(): CheckoutService {
    if (!checkoutService) {
        checkoutService = new CheckoutService()
    }
    return checkoutService
}

export function destroyCheckoutService() {
    checkoutService = null
}
