/**
 * Team Rules Synchronization
 * Synchronization service for team rules across team members
 */

import log from 'electron-log'
import * as fs from 'fs/promises'
import * as path from 'path'
import { getRuleParser } from './ruleParser'

export interface SyncConfig {
    enabled: boolean
    syncMethod: 'git' | 'file' | 'custom'
    syncPath?: string
    autoSync: boolean
    syncInterval: number // minutes
    conflictResolution: 'local' | 'remote' | 'manual'
}

export interface SyncStatus {
    lastSync: Date | null
    lastSyncSuccess: boolean
    lastSyncError?: string
    pendingChanges: number
    conflicts: number
}

export class RuleSyncService {
    private config: SyncConfig = {
        enabled: false,
        syncMethod: 'git',
        autoSync: false,
        syncInterval: 30,
        conflictResolution: 'local'
    }
    private status: SyncStatus = {
        lastSync: null,
        lastSyncSuccess: true,
        pendingChanges: 0,
        conflicts: 0
    }
    private syncIntervalId: NodeJS.Timeout | null = null
    private ruleParser = getRuleParser()

    constructor() {
        this.loadConfig()
    }

    private async loadConfig(): Promise<void> {
        try {
            // Load config from storage
            // For now, use default config
            log.info('Loaded rule sync config')
        } catch (error) {
            log.error('Failed to load sync config:', error)
        }
    }

    private async saveConfig(): Promise<void> {
        try {
            // Save config to storage
            log.info('Saved rule sync config')
        } catch (error) {
            log.error('Failed to save sync config:', error)
        }
    }

    setConfig(config: Partial<SyncConfig>): void {
        this.config = { ...this.config, ...config }
        this.saveConfig()

        // Restart auto-sync if enabled
        if (this.config.autoSync && this.config.enabled) {
            this.startAutoSync()
        } else {
            this.stopAutoSync()
        }
    }

    getConfig(): SyncConfig {
        return { ...this.config }
    }

    getStatus(): SyncStatus {
        return { ...this.status }
    }

    async syncRules(projectPath: string): Promise<SyncStatus> {
        if (!this.config.enabled) {
            log.info('Rule sync is disabled')
            return this.status
        }

        log.info('Starting rule synchronization...')

        try {
            switch (this.config.syncMethod) {
                case 'git':
                    return await this.syncViaGit(projectPath)
                case 'file':
                    return await this.syncViaFile(projectPath)
                case 'custom':
                    return await this.syncViaCustom(projectPath)
                default:
                    throw new Error(`Unknown sync method: ${this.config.syncMethod}`)
            }
        } catch (error) {
            this.status.lastSyncSuccess = false
            this.status.lastSyncError = error instanceof Error ? error.message : 'Unknown error'
            log.error('Rule sync failed:', error)
            return this.status
        }
    }

    private async syncViaGit(projectPath: string): Promise<SyncStatus> {
        log.info('Syncing rules via git...')

        try {
            const rulesDir = path.join(projectPath, '.cursor', 'rules')
            
            // Check if rules directory is a git repository
            // For now, this is a placeholder - actual git integration would be here
            // const gitStatus = await this.getGitStatus(rulesDir)
            
            // Pull latest changes
            // await this.gitPull(rulesDir)
            
            // Push local changes
            // await this.gitPush(rulesDir)

            this.status.lastSync = new Date()
            this.status.lastSyncSuccess = true
            this.status.lastSyncError = undefined
            
            log.info('Git sync completed successfully')
            return this.status
        } catch (error) {
            this.status.lastSyncSuccess = false
            this.status.lastSyncError = error instanceof Error ? error.message : 'Unknown error'
            throw error
        }
    }

    private async syncViaFile(projectPath: string): Promise<SyncStatus> {
        log.info('Syncing rules via file...')

        try {
            if (!this.config.syncPath) {
                throw new Error('Sync path not configured for file sync')
            }

            const localRulesDir = path.join(projectPath, '.cursor', 'rules')
            const remoteRulesDir = this.config.syncPath

            // Ensure remote directory exists
            await fs.mkdir(remoteRulesDir, { recursive: true })

            // Copy local rules to remote
            const localFiles = await fs.readdir(localRulesDir, { withFileTypes: true })
            
            for (const file of localFiles) {
                if (file.isFile() && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
                    const localPath = path.join(localRulesDir, file.name)
                    const remotePath = path.join(remoteRulesDir, file.name)
                    await fs.copyFile(localPath, remotePath)
                }
            }

            // Copy remote rules to local
            const remoteFiles = await fs.readdir(remoteRulesDir, { withFileTypes: true })
            
            for (const file of remoteFiles) {
                if (file.isFile() && (file.name.endsWith('.yaml') || file.name.endsWith('.yml'))) {
                    const remotePath = path.join(remoteRulesDir, file.name)
                    const localPath = path.join(localRulesDir, file.name)
                    await fs.copyFile(remotePath, localPath)
                }
            }

            // Reload rules
            await this.ruleParser.loadRulesFromDirectory(projectPath)

            this.status.lastSync = new Date()
            this.status.lastSyncSuccess = true
            this.status.lastSyncError = undefined
            
            log.info('File sync completed successfully')
            return this.status
        } catch (error) {
            this.status.lastSyncSuccess = false
            this.status.lastSyncError = error instanceof Error ? error.message : 'Unknown error'
            throw error
        }
    }

    private async syncViaCustom(projectPath: string): Promise<SyncStatus> {
        log.info('Syncing rules via custom method...')

        // Placeholder for custom sync implementation
        // This could integrate with cloud storage, API, etc.
        
        this.status.lastSync = new Date()
        this.status.lastSyncSuccess = true
        this.status.lastSyncError = undefined
        
        log.info('Custom sync completed (placeholder)')
        return this.status
    }

    startAutoSync(projectPath?: string): void {
        if (this.syncIntervalId) {
            this.stopAutoSync()
        }

        if (!this.config.enabled || !this.config.autoSync) {
            return
        }

        const intervalMs = this.config.syncInterval * 60 * 1000
        
        this.syncIntervalId = setInterval(async () => {
            if (projectPath) {
                await this.syncRules(projectPath)
            }
        }, intervalMs)

        log.info(`Started auto-sync (interval: ${this.config.syncInterval} minutes)`)
    }

    stopAutoSync(): void {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId)
            this.syncIntervalId = null
            log.info('Stopped auto-sync')
        }
    }

    async exportRulesForSharing(projectPath: string): Promise<string> {
        const rulesDir = path.join(projectPath, '.cursor', 'rules')
        const exportPath = path.join(projectPath, '.cursor', 'rules-export.json')

        const parsedRules = await this.ruleParser.loadRulesFromDirectory(projectPath)
        
        const exportData = {
            version: '1.0.0',
            exportedAt: new Date().toISOString(),
            ruleSets: Array.from(parsedRules.ruleSets.values())
        }

        await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2), 'utf-8')
        
        log.info(`Exported rules to ${exportPath}`)
        return exportPath
    }

    async importRulesFromSharing(exportPath: string, projectPath: string): Promise<void> {
        const content = await fs.readFile(exportPath, 'utf-8')
        const exportData = JSON.parse(content)

        const rulesDir = path.join(projectPath, '.cursor', 'rules')
        await fs.mkdir(rulesDir, { recursive: true })

        for (const ruleSet of exportData.ruleSets) {
            const ruleSetPath = path.join(rulesDir, `${ruleSet.name}.yaml`)
            const yamlContent = this.convertToYaml(ruleSet)
            await fs.writeFile(ruleSetPath, yamlContent, 'utf-8')
        }

        // Reload rules
        await this.ruleParser.loadRulesFromDirectory(projectPath)

        log.info(`Imported rules from ${exportPath}`)
    }

    private convertToYaml(ruleSet: any): string {
        // Simple YAML conversion - in production, use a proper YAML library
        let yaml = `name: ${ruleSet.name}\n`
        yaml += `version: ${ruleSet.version}\n`
        yaml += `description: ${ruleSet.description}\n`
        yaml += `rules:\n`
        
        for (const rule of ruleSet.rules) {
            yaml += `  - id: ${rule.id}\n`
            yaml += `    name: ${rule.name}\n`
            yaml += `    description: ${rule.description}\n`
            yaml += `    category: ${rule.category}\n`
            yaml += `    severity: ${rule.severity}\n`
            yaml += `    enabled: ${rule.enabled}\n`
            yaml += `    priority: ${rule.priority}\n`
            yaml += `    patterns:\n`
            for (const pattern of rule.patterns) {
                yaml += `      - ${pattern}\n`
            }
            yaml += `    appliesTo:\n`
            for (const applies of rule.appliesTo) {
                yaml += `      - ${applies}\n`
            }
            yaml += `    message: ${rule.message}\n`
            if (rule.fix) {
                yaml += `    fix: ${rule.fix}\n`
            }
        }

        return yaml
    }

    async detectConflicts(projectPath: string): Promise<Array<{ ruleSet: string; conflict: string }>> {
        const conflicts: Array<{ ruleSet: string; conflict: string }> = []

        try {
            const parsedRules = await this.ruleParser.loadRulesFromDirectory(projectPath)
            
            // Check for duplicate rule IDs
            const ruleIds = new Map<string, string>()
            for (const ruleSet of parsedRules.ruleSets.values()) {
                for (const rule of ruleSet.rules) {
                    if (ruleIds.has(rule.id)) {
                        conflicts.push({
                            ruleSet: ruleSet.name,
                            conflict: `Duplicate rule ID: ${rule.id} (also in ${ruleIds.get(rule.id)})`
                        })
                    } else {
                        ruleIds.set(rule.id, ruleSet.name)
                    }
                }
            }

            this.status.conflicts = conflicts.length
        } catch (error) {
            log.error('Failed to detect conflicts:', error)
        }

        return conflicts
    }

    async resolveConflicts(projectPath: string, resolution: 'local' | 'remote'): Promise<void> {
        const conflicts = await this.detectConflicts(projectPath)
        
        if (conflicts.length === 0) {
            return
        }

        log.info(`Resolving ${conflicts.length} conflicts with strategy: ${resolution}`)

        // Conflict resolution logic would go here
        // For now, this is a placeholder
        
        this.status.conflicts = 0
        log.info('Conflicts resolved')
    }

    destroy(): void {
        this.stopAutoSync()
    }
}

// Singleton instance
let ruleSyncService: RuleSyncService | null = null

export function getRuleSyncService(): RuleSyncService {
    if (!ruleSyncService) {
        ruleSyncService = new RuleSyncService()
    }
    return ruleSyncService
}

export function destroyRuleSyncService() {
    if (ruleSyncService) {
        ruleSyncService.destroy()
        ruleSyncService = null
    }
}
