/**
 * Rules Service
 * Service for applying team rules to AI context and code analysis
 */

import {
    RuleViolation,
    RuleApplicationResult,
    Rule,
    RuleSet,
    RuleStatistics,
    RuleServiceConfig
} from './types'
import { RuleParser, getRuleParser } from './parser/ruleParser'
import { Logger, ConsoleLogger } from './logger'

export class RuleService {
    private ruleParser: RuleParser
    private currentRules: { ruleSets: Map<string, RuleSet>; errors: string[]; lastUpdated: Date } | null = null
    private config: RuleServiceConfig
    private logger: Logger

    constructor(config: RuleServiceConfig = {}, logger?: Logger) {
        this.config = {
            maxViolations: 1000,
            cacheEnabled: true,
            logLevel: 'info',
            autoLoad: true,
            ...config
        }
        this.logger = logger || new ConsoleLogger()
        this.ruleParser = getRuleParser(this.logger)
    }

    updateConfig(config: Partial<RuleServiceConfig>): void {
        this.config = { ...this.config, ...config }
        this.logger.info('Rules service configuration updated')
    }

    getConfig(): RuleServiceConfig {
        return { ...this.config }
    }

    async initialize(projectPath: string): Promise<void> {
        this.logger.info('Initializing rule service for project:', projectPath)
        this.currentRules = await this.ruleParser.loadRulesFromDirectory(projectPath)
    }

    async applyRulesToCode(code: string, filePath: string): Promise<RuleApplicationResult> {
        if (!this.currentRules) {
            return { violations: [], appliedRules: 0, skippedRules: 0, errors: ['Rules not initialized'] }
        }

        const startTime = Date.now()
        const violations: RuleViolation[] = []
        const applicableRules = this.ruleParser.getRulesForFile(filePath)
        let appliedRules = 0
        let skippedRules = 0

        for (const rule of applicableRules) {
            if (!rule.enabled) {
                skippedRules++
                continue
            }

            appliedRules++

            for (const pattern of rule.patterns) {
                try {
                    const regex = new RegExp(pattern, 'g')
                    const matches = code.matchAll(regex)

                    for (const match of matches) {
                        const violation: RuleViolation = {
                            ruleId: rule.id,
                            ruleName: rule.name,
                            severity: rule.severity,
                            message: rule.message,
                            filePath,
                            lineNumber: this.getLineNumber(code, match.index || 0),
                            column: this.getColumnNumber(code, match.index || 0),
                            fix: rule.fix,
                            category: rule.category,
                            matchedText: match[0]
                        }

                        // Check if this match is in the exceptions list
                        const matchedText = match[0]
                        if (!rule.exceptions.includes(matchedText)) {
                            violations.push(violation)
                            
                            // Check max violations limit
                            if (this.config.maxViolations && violations.length >= this.config.maxViolations) {
                                this.logger.warn(`Max violations limit reached: ${this.config.maxViolations}`)
                                break
                            }
                        }
                    }
                } catch (error) {
                    this.logger.warn(`Invalid regex pattern in rule ${rule.id}: ${pattern}`)
                }
            }
        }

        const duration = Date.now() - startTime

        return {
            violations,
            appliedRules,
            skippedRules,
            errors: this.currentRules.errors,
            duration
        }
    }

    private getLineNumber(code: string, index: number): number {
        const beforeIndex = code.substring(0, index)
        return beforeIndex.split('\n').length
    }

    private getColumnNumber(code: string, index: number): number {
        const beforeIndex = code.substring(0, index)
        const lastNewline = beforeIndex.lastIndexOf('\n')
        if (lastNewline === -1) {
            return index + 1
        }
        return index - lastNewline
    }

    applyRulesToAIContext(context: string, filePath: string): string {
        if (!this.currentRules) {
            return context
        }

        const applicableRules = this.ruleParser.getRulesForFile(filePath)
        const activeRules = applicableRules.filter(r => r.enabled)

        if (activeRules.length === 0) {
            return context
        }

        // Build rules context for AI
        let rulesContext = '\n\n--- Team Rules ---\n'
        
        // Group rules by category
        const rulesByCategory = new Map<Rule['category'], Rule[]>()
        for (const rule of activeRules) {
            const categoryRules = rulesByCategory.get(rule.category) || []
            categoryRules.push(rule)
            rulesByCategory.set(rule.category, categoryRules)
        }

        for (const [category, rules] of rulesByCategory) {
            rulesContext += `\n${category.toUpperCase()}:\n`
            for (const rule of rules) {
                rulesContext += `- ${rule.name}: ${rule.message}\n`
                if (rule.fix) {
                    rulesContext += `  Fix: ${rule.fix}\n`
                }
            }
        }

        return context + rulesContext
    }

    getActiveRules(): Rule[] {
        return this.ruleParser.getActiveRules()
    }

    getRulesByCategory(category: Rule['category']): Rule[] {
        return this.ruleParser.getRulesByCategory(category)
    }

    getRulesBySeverity(severity: Rule['severity']): Rule[] {
        return this.ruleParser.getRulesBySeverity(severity)
    }

    getRuleSet(name: string): RuleSet | undefined {
        return this.currentRules?.ruleSets.get(name)
    }

    getAllRuleSets(): RuleSet[] {
        return Array.from(this.currentRules?.ruleSets.values() || [])
    }

    async createRuleSet(ruleSet: RuleSet, projectPath: string): Promise<void> {
        await this.ruleParser.saveRuleSet(ruleSet, projectPath)
        // Reload rules
        await this.initialize(projectPath)
    }

    async updateRuleSet(name: string, updates: Partial<RuleSet>, projectPath: string): Promise<void> {
        const existing = this.getRuleSet(name)
        if (!existing) {
            throw new Error(`Rule set not found: ${name}`)
        }

        const updated: RuleSet = { ...existing, ...updates }
        await this.ruleParser.saveRuleSet(updated, projectPath)
        await this.initialize(projectPath)
    }

    async deleteRuleSet(name: string, projectPath: string): Promise<void> {
        await this.ruleParser.deleteRuleSet(name, projectPath)
        await this.initialize(projectPath)
    }

    async enableRule(ruleId: string, projectPath: string): Promise<void> {
        await this.toggleRule(ruleId, true, projectPath)
    }

    async disableRule(ruleId: string, projectPath: string): Promise<void> {
        await this.toggleRule(ruleId, false, projectPath)
    }

    private async toggleRule(ruleId: string, enabled: boolean, projectPath: string): Promise<void> {
        const ruleSets = this.getAllRuleSets()
        
        for (const ruleSet of ruleSets) {
            const rule = ruleSet.rules.find(r => r.id === ruleId)
            if (rule) {
                rule.enabled = enabled
                await this.ruleParser.saveRuleSet(ruleSet, projectPath)
                await this.initialize(projectPath)
                return
            }
        }

        throw new Error(`Rule not found: ${ruleId}`)
    }

    getStatistics(): RuleStatistics {
        const ruleSets = this.getAllRuleSets()
        const allRules = ruleSets.flatMap(rs => rs.rules)
        const activeRules = allRules.filter(r => r.enabled)

        const rulesByCategory: Record<Rule['category'], number> = {
            style: 0,
            naming: 0,
            architecture: 0,
            security: 0,
            performance: 0,
            testing: 0,
            custom: 0
        }

        const rulesBySeverity: Record<Rule['severity'], number> = {
            error: 0,
            warning: 0,
            suggestion: 0,
            info: 0
        }

        for (const rule of allRules) {
            rulesByCategory[rule.category]++
            rulesBySeverity[rule.severity]++
        }

        return {
            totalRuleSets: ruleSets.length,
            totalRules: allRules.length,
            activeRules: activeRules.length,
            rulesByCategory,
            rulesBySeverity
        }
    }

    validateRule(rule: Rule): { valid: boolean; error?: string } {
        return this.ruleParser.validateRule(rule)
    }

    exportRules(): string {
        return JSON.stringify(this.currentRules, null, 2)
    }

    async importRules(json: string, projectPath: string): Promise<void> {
        try {
            const parsed = JSON.parse(json) as { ruleSets: Map<string, RuleSet>; errors: string[]; lastUpdated: Date }
            
            for (const ruleSet of Object.values(parsed.ruleSets)) {
                await this.ruleParser.saveRuleSet(ruleSet as RuleSet, projectPath)
            }

            await this.initialize(projectPath)
            this.logger.info('Imported rules successfully')
        } catch (error) {
            this.logger.error('Failed to import rules:', error)
            throw error
        }
    }

    reset(): void {
        this.currentRules = null
        this.ruleParser.reset()
        this.logger.info('Reset rules service')
    }
}

// Singleton instance
let ruleService: RuleService | null = null

export function getRuleService(config?: RuleServiceConfig, logger?: Logger): RuleService {
    if (!ruleService) {
        ruleService = new RuleService(config, logger)
    }
    return ruleService
}

export function destroyRuleService(): void {
    if (ruleService) {
        ruleService.reset()
        ruleService = null
    }
}

export function createRuleService(config?: RuleServiceConfig, logger?: Logger): RuleService {
    return new RuleService(config, logger)
}