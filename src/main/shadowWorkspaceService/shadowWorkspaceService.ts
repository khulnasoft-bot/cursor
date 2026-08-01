/**
 * Cursor Shadow Workspace Service
 * Shadow workspace management for isolated development environments
 */

import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'

export interface ShadowWorkspace {
    id: string
    originalPath: string
    shadowPath: string
    isActive: boolean
    createdAt: Date
}

class ShadowWorkspaceService {
    private workspaces: Map<string, ShadowWorkspace> = new Map()
    private workspaceIdCounter = 0

    async createShadowWorkspace(originalPath: string): Promise<string> {
        const workspaceId = `shadow-${++this.workspaceIdCounter}`
        
        try {
            const shadowPath = path.join(path.dirname(originalPath), `.shadow-${path.basename(originalPath)}`)
            
            // Create shadow directory
            if (!fs.existsSync(shadowPath)) {
                fs.mkdirSync(shadowPath, { recursive: true })
            }

            const workspace: ShadowWorkspace = {
                id: workspaceId,
                originalPath,
                shadowPath,
                isActive: true,
                createdAt: new Date()
            }

            this.workspaces.set(workspaceId, workspace)
            log.info(`Created shadow workspace: ${workspaceId}`)
            return workspaceId
        } catch (error) {
            log.error(`Failed to create shadow workspace:`, error)
            throw error
        }
    }

    async syncToShadow(workspaceId: string): Promise<void> {
        const workspace = this.workspaces.get(workspaceId)
        if (!workspace) {
            throw new Error(`Shadow workspace not found: ${workspaceId}`)
        }

        // Placeholder for sync logic
        log.info(`Syncing to shadow workspace ${workspaceId}`)
    }

    async syncFromShadow(workspaceId: string): Promise<void> {
        const workspace = this.workspaces.get(workspaceId)
        if (!workspace) {
            throw new Error(`Shadow workspace not found: ${workspaceId}`)
        }

        // Placeholder for sync logic
        log.info(`Syncing from shadow workspace ${workspaceId}`)
    }

    async deleteShadowWorkspace(workspaceId: string): Promise<void> {
        const workspace = this.workspaces.get(workspaceId)
        if (!workspace) {
            throw new Error(`Shadow workspace not found: ${workspaceId}`)
        }

        try {
            if (fs.existsSync(workspace.shadowPath)) {
                fs.rmSync(workspace.shadowPath, { recursive: true })
            }
            this.workspaces.delete(workspaceId)
            log.info(`Deleted shadow workspace: ${workspaceId}`)
        } catch (error) {
            log.error('Failed to delete shadow workspace:', error)
            throw error
        }
    }

    getWorkspace(workspaceId: string): ShadowWorkspace | undefined {
        return this.workspaces.get(workspaceId)
    }

    getWorkspaces(): ShadowWorkspace[] {
        return Array.from(this.workspaces.values())
    }

    async activateWorkspace(workspaceId: string): Promise<void> {
        const workspace = this.workspaces.get(workspaceId)
        if (!workspace) {
            throw new Error(`Shadow workspace not found: ${workspaceId}`)
        }

        workspace.isActive = true
        log.info(`Activated shadow workspace ${workspaceId}`)
    }

    async deactivateWorkspace(workspaceId: string): Promise<void> {
        const workspace = this.workspaces.get(workspaceId)
        if (!workspace) {
            throw new Error(`Shadow workspace not found: ${workspaceId}`)
        }

        workspace.isActive = false
        log.info(`Deactivated shadow workspace ${workspaceId}`)
    }
}

// Singleton instance
let shadowWorkspaceService: ShadowWorkspaceService | null = null

export function getShadowWorkspaceService(): ShadowWorkspaceService {
    if (!shadowWorkspaceService) {
        shadowWorkspaceService = new ShadowWorkspaceService()
    }
    return shadowWorkspaceService
}

export function destroyShadowWorkspaceService() {
    if (shadowWorkspaceService) {
        shadowWorkspaceService = null
    }
}
