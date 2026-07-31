/**
 * Rules IPC Handlers
 * IPC handlers for team rules service
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getRuleService } from './ruleService'

export function setupRulesIpcs(): void {
    const ruleService = getRuleService()

    // Initialize rules for project
    ipcMain.handle(
        'rules-initialize',
        async (_event: IpcMainInvokeEvent, projectPath: string) => {
            try {
                await ruleService.initialize(projectPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to initialize rules:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Apply rules to code
    ipcMain.handle(
        'rules-apply-to-code',
        async (_event: IpcMainInvokeEvent, code: string, filePath: string) => {
            try {
                const result = await ruleService.applyRulesToCode(code, filePath)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to apply rules to code:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Apply rules to AI context
    ipcMain.handle(
        'rules-apply-to-context',
        async (_event: IpcMainInvokeEvent, context: string, filePath: string) => {
            try {
                const enhancedContext = ruleService.applyRulesToAIContext(context, filePath)
                return { success: true, context: enhancedContext }
            } catch (error) {
                log.error('Failed to apply rules to context:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get active rules
    ipcMain.handle(
        'rules-get-active',
        async () => {
            try {
                const rules = ruleService.getActiveRules()
                return { success: true, rules }
            } catch (error) {
                log.error('Failed to get active rules:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get rules by category
    ipcMain.handle(
        'rules-get-by-category',
        async (_event: IpcMainInvokeEvent, category: string) => {
            try {
                const rules = ruleService.getRulesByCategory(category as any)
                return { success: true, rules }
            } catch (error) {
                log.error('Failed to get rules by category:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get rules by severity
    ipcMain.handle(
        'rules-get-by-severity',
        async (_event: IpcMainInvokeEvent, severity: string) => {
            try {
                const rules = ruleService.getRulesBySeverity(severity as any)
                return { success: true, rules }
            } catch (error) {
                log.error('Failed to get rules by severity:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all rule sets
    ipcMain.handle(
        'rules-get-rule-sets',
        async () => {
            try {
                const ruleSets = ruleService.getAllRuleSets()
                return { success: true, ruleSets }
            } catch (error) {
                log.error('Failed to get rule sets:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Create rule set
    ipcMain.handle(
        'rules-create-rule-set',
        async (_event: IpcMainInvokeEvent, ruleSet: any, projectPath: string) => {
            try {
                await ruleService.createRuleSet(ruleSet, projectPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to create rule set:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Update rule set
    ipcMain.handle(
        'rules-update-rule-set',
        async (_event: IpcMainInvokeEvent, name: string, updates: any, projectPath: string) => {
            try {
                await ruleService.updateRuleSet(name, updates, projectPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to update rule set:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Delete rule set
    ipcMain.handle(
        'rules-delete-rule-set',
        async (_event: IpcMainInvokeEvent, name: string, projectPath: string) => {
            try {
                await ruleService.deleteRuleSet(name, projectPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to delete rule set:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Enable rule
    ipcMain.handle(
        'rules-enable-rule',
        async (_event: IpcMainInvokeEvent, ruleId: string, projectPath: string) => {
            try {
                await ruleService.enableRule(ruleId, projectPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to enable rule:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Disable rule
    ipcMain.handle(
        'rules-disable-rule',
        async (_event: IpcMainInvokeEvent, ruleId: string, projectPath: string) => {
            try {
                await ruleService.disableRule(ruleId, projectPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to disable rule:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get statistics
    ipcMain.handle(
        'rules-get-statistics',
        async () => {
            try {
                const stats = ruleService.getStatistics()
                return { success: true, stats }
            } catch (error) {
                log.error('Failed to get statistics:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Validate rule
    ipcMain.handle(
        'rules-validate-rule',
        async (_event: IpcMainInvokeEvent, rule: any) => {
            try {
                const validation = ruleService.validateRule(rule)
                return { success: true, validation }
            } catch (error) {
                log.error('Failed to validate rule:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Export rules
    ipcMain.handle(
        'rules-export',
        async () => {
            try {
                const exported = ruleService.exportRules()
                return { success: true, data: exported }
            } catch (error) {
                log.error('Failed to export rules:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Import rules
    ipcMain.handle(
        'rules-import',
        async (_event: IpcMainInvokeEvent, json: string, projectPath: string) => {
            try {
                await ruleService.importRules(json, projectPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to import rules:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Rules IPC handlers registered')
}
