/**
 * Cursor Commits Service
 * Tracks requests and commits for Cursor online metrics
 */

import * as fs from 'fs'
import * as path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import log from 'electron-log'

const execAsync = promisify(exec)

export interface CommitInfo {
    hash: string
    author: string
    message: string
    date: Date
    files: string[]
}

export interface BranchInfo {
    name: string
    isCurrent: boolean
}

export interface RepositoryInfo {
    path: string
    branch: string
    commits: CommitInfo[]
    branches: BranchInfo[]
    status: string
}

class CommitsService {
    private repositories: Map<string, RepositoryInfo> = new Map()
    private metricsCache: Map<string, any> = new Map()

    async getRepositoryInfo(repoPath: string): Promise<RepositoryInfo> {
        const cached = this.repositories.get(repoPath)
        if (cached) {
            return cached
        }

        try {
            const [branch, commits, branches, status] = await Promise.all([
                this.getCurrentBranch(repoPath),
                this.getRecentCommits(repoPath, 20),
                this.getBranches(repoPath),
                this.getRepositoryStatus(repoPath)
            ])

            const repoInfo: RepositoryInfo = {
                path: repoPath,
                branch,
                commits,
                branches,
                status
            }

            this.repositories.set(repoPath, repoInfo)
            return repoInfo
        } catch (error) {
            log.error('Failed to get repository info:', error)
            throw error
        }
    }

    private async getCurrentBranch(repoPath: string): Promise<string> {
        try {
            const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', {
                cwd: repoPath
            })
            return stdout.trim()
        } catch (error) {
            return 'unknown'
        }
    }

    private async getRecentCommits(repoPath: string, limit: number): Promise<CommitInfo[]> {
        try {
            const { stdout } = await execAsync(
                `git log -${limit} --pretty=format:"%H|%an|%s|%ai" --name-only`,
                { cwd: repoPath }
            )

            const commits: CommitInfo[] = []
            const lines = stdout.trim().split('\n')
            let currentCommit: Partial<CommitInfo> | null = null

            for (const line of lines) {
                if (line.includes('|')) {
                    if (currentCommit) {
                        commits.push(currentCommit as CommitInfo)
                    }
                    const [hash, author, message, date] = line.split('|')
                    currentCommit = {
                        hash,
                        author,
                        message,
                        date: new Date(date),
                        files: []
                    }
                } else if (currentCommit && line.trim()) {
                    currentCommit.files!.push(line.trim())
                }
            }

            if (currentCommit) {
                commits.push(currentCommit as CommitInfo)
            }

            return commits
        } catch (error) {
            log.error('Failed to get commits:', error)
            return []
        }
    }

    private async getBranches(repoPath: string): Promise<BranchInfo[]> {
        try {
            const { stdout } = await execAsync('git branch -a', { cwd: repoPath })
            const currentBranch = await this.getCurrentBranch(repoPath)
            
            return stdout.trim().split('\n').map(line => {
                const name = line.replace(/^\*?\s*/, '').trim()
                const isCurrent = line.startsWith('*')
                return { name, isCurrent }
            })
        } catch (error) {
            log.error('Failed to get branches:', error)
            return []
        }
    }

    private async getRepositoryStatus(repoPath: string): Promise<string> {
        try {
            const { stdout } = await execAsync('git status --porcelain', { cwd: repoPath })
            return stdout.trim()
        } catch (error) {
            return ''
        }
    }

    async createCommit(repoPath: string, message: string, files?: string[]): Promise<string> {
        try {
            if (files && files.length > 0) {
                await execAsync(`git add ${files.join(' ')}`, { cwd: repoPath })
            } else {
                await execAsync('git add .', { cwd: repoPath })
            }

            const { stdout } = await execAsync(`git commit -m "${message}"`, { cwd: repoPath })
            const hashMatch = stdout.match(/\[([a-f0-9]+)\]/)
            const hash = hashMatch ? hashMatch[1] : 'unknown'

            // Clear cache to force refresh
            this.repositories.delete(repoPath)

            return hash
        } catch (error) {
            log.error('Failed to create commit:', error)
            throw error
        }
    }

    async switchBranch(repoPath: string, branchName: string): Promise<void> {
        try {
            await execAsync(`git checkout ${branchName}`, { cwd: repoPath })
            this.repositories.delete(repoPath)
        } catch (error) {
            log.error('Failed to switch branch:', error)
            throw error
        }
    }

    async createBranch(repoPath: string, branchName: string): Promise<void> {
        try {
            await execAsync(`git checkout -b ${branchName}`, { cwd: repoPath })
            this.repositories.delete(repoPath)
        } catch (error) {
            log.error('Failed to create branch:', error)
            throw error
        }
    }

    async pull(repoPath: string): Promise<void> {
        try {
            await execAsync('git pull', { cwd: repoPath })
            this.repositories.delete(repoPath)
        } catch (error) {
            log.error('Failed to pull:', error)
            throw error
        }
    }

    async push(repoPath: string, branch?: string): Promise<void> {
        try {
            const branchName = branch || await this.getCurrentBranch(repoPath)
            await execAsync(`git push origin ${branchName}`, { cwd: repoPath })
        } catch (error) {
            log.error('Failed to push:', error)
            throw error
        }
    }

    trackMetric(metricName: string, value: any): void {
        this.metricsCache.set(metricName, {
            value,
            timestamp: Date.now()
        })
        log.info(`Tracked metric: ${metricName}`)
    }

    getMetrics(): Map<string, any> {
        return this.metricsCache
    }

    clearCache(repoPath?: string): void {
        if (repoPath) {
            this.repositories.delete(repoPath)
        } else {
            this.repositories.clear()
        }
    }
}

// Singleton instance
let commitsService: CommitsService | null = null

export function getCommitsService(): CommitsService {
    if (!commitsService) {
        commitsService = new CommitsService()
    }
    return commitsService
}

export function destroyCommitsService() {
    if (commitsService) {
        commitsService.clearCache()
        commitsService = null
    }
}
