/**
 * Rule Parser
 * Parses and loads rule definitions from configuration files
 */

import {
    Rule,
    RuleSet,
    ParsedRules,
    RuleCategory,
    RuleSeverity
} from '../types'
import { Logger, ConsoleLogger } from '../logger'

export class RuleParser {
    private logger: Logger
    private ruleSets: Map<string, RuleSet> = new Map()

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
    }

    async loadRulesFromDirectory(projectPath: string): Promise<ParsedRules> {
        this.logger.info(`Loading rules from directory: ${projectPath}`)
        
        const errors: string[] = []
        
        try {
            // Try to load rules from .cursor/rules directory
            const rulesPath = `${projectPath}/.cursor/rules`
            
            // Placeholder for actual file system operations
            // In a real implementation, this would read files from the directory
            this.logger.info(`Loading rules from: ${rulesPath}`)
            
            // Load default rules if no custom rules found
            if (this.ruleSets.size === 0) {
                this.loadDefaultRules()
            }
            
            return {
                ruleSets: this.ruleSets,
                errors,
                lastUpdated: new Date()
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(`Failed to load rules: ${errorMsg}`)
            errors.push(errorMsg)
            
            // Load default rules as fallback
            this.loadDefaultRules()
            
            return {
                ruleSets: this.ruleSets,
                errors,
                lastUpdated: new Date()
            }
        }
    }

    private loadDefaultRules(): void {
        this.logger.info('Loading default rules')
        
        // Default style rules
        const styleRuleSet: RuleSet = {
            name: 'style',
            description: 'Code style and formatting rules',
            version: '1.0.0',
            rules: [
                {
                    id: 'style-no-console',
                    name: 'No console statements',
                    description: 'Disallow console statements in production code',
                    category: 'style',
                    severity: 'warning',
                    patterns: ['console\\.log', 'console\\.error', 'console\\.warn'],
                    message: 'Remove console statements before committing',
                    fix: 'Remove console statement or replace with proper logging',
                    exceptions: [],
                    enabled: true,
                    language: ['javascript', 'typescript'],
                    filePatterns: ['src/**/*']
                },
                {
                    id: 'style-no-debugger',
                    name: 'No debugger statements',
                    description: 'Disallow debugger statements',
                    category: 'style',
                    severity: 'error',
                    patterns: ['debugger'],
                    message: 'Remove debugger statement',
                    fix: 'Remove debugger statement',
                    exceptions: [],
                    enabled: true,
                    language: ['javascript', 'typescript'],
                    filePatterns: ['src/**/*']
                }
            ]
        }
        
        // Default naming rules
        const namingRuleSet: RuleSet = {
            name: 'naming',
            description: 'Naming convention rules',
            version: '1.0.0',
            rules: [
                {
                    id: 'naming-camel-case',
                    name: 'Use camelCase for variables',
                    description: 'Variables should use camelCase naming',
                    category: 'naming',
                    severity: 'suggestion',
                    patterns: ['\\b[A-Z]{2,}\\b'], // Simplified pattern
                    message: 'Consider using camelCase for variable names',
                    fix: 'Rename to camelCase',
                    exceptions: ['URL', 'HTTP', 'API'], // Common acronyms
                    enabled: true,
                    language: ['javascript', 'typescript'],
                    filePatterns: ['src/**/*']
                }
            ]
        }
        
        // Default security rules
        const securityRuleSet: RuleSet = {
            name: 'security',
            description: 'Security-related rules',
            version: '1.0.0',
            rules: [
                {
                    id: 'security-no-hardcoded-secrets',
                    name: 'No hardcoded secrets',
                    description: 'Disallow hardcoded API keys and secrets',
                    category: 'security',
                    severity: 'error',
                    patterns: ['api_key\\s*=', 'secret\\s*=', 'password\\s*='],
                    message: 'Remove hardcoded secrets',
                    fix: 'Use environment variables for secrets',
                    exceptions: [],
                    enabled: true,
                    language: ['javascript', 'typescript', 'python'],
                    filePatterns: ['src/**/*']
                }
            ]
        }
        
        this.ruleSets.set(styleRuleSet.name, styleRuleSet)
        this.ruleSets.set(namingRuleSet.name, namingRuleSet)
        this.ruleSets.set(securityRuleSet.name, securityRuleSet)
        
        this.logger.info(`Loaded ${this.ruleSets.size} default rule sets`)
    }

    async saveRuleSet(ruleSet: RuleSet, projectPath: string): Promise<void> {
        this.logger.info(`Saving rule set: ${ruleSet.name}`)
        
        try {
            // Placeholder for actual file system operations
            // In a real implementation, this would write to the .cursor/rules directory
            this.ruleSets.set(ruleSet.name, ruleSet)
            this.logger.info(`Saved rule set: ${ruleSet.name}`)
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(`Failed to save rule set: ${errorMsg}`)
            throw error
        }
    }

    async deleteRuleSet(name: string, projectPath: string): Promise<void> {
        this.logger.info(`Deleting rule set: ${name}`)
        
        try {
            // Placeholder for actual file system operations
            const deleted = this.ruleSets.delete(name)
            if (deleted) {
                this.logger.info(`Deleted rule set: ${name}`)
            } else {
                this.logger.warn(`Rule set not found: ${name}`)
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error'
            this.logger.error(`Failed to delete rule set: ${errorMsg}`)
            throw error
        }
    }

    getRulesForFile(filePath: string): Rule[] {
        const allRules: Rule[] = []
        
        for (const ruleSet of this.ruleSets.values()) {
            for (const rule of ruleSet.rules) {
                if (this.matchesFilePattern(filePath, rule.filePatterns)) {
                    allRules.push(rule)
                }
            }
        }
        
        return allRules
    }

    private matchesFilePattern(filePath: string, patterns?: string[]): boolean {
        if (!patterns || patterns.length === 0) {
            return true
        }
        
        // Simplified pattern matching
        // In a real implementation, this would use proper glob matching
        for (const pattern of patterns) {
            if (filePath.includes(pattern.replace('**/', '').replace('*', ''))) {
                return true
            }
        }
        
        return false
    }

    getActiveRules(): Rule[] {
        const allRules: Rule[] = []
        
        for (const ruleSet of this.ruleSets.values()) {
            allRules.push(...ruleSet.rules.filter(r => r.enabled))
        }
        
        return allRules
    }

    getRulesByCategory(category: RuleCategory): Rule[] {
        const allRules: Rule[] = []
        
        for (const ruleSet of this.ruleSets.values()) {
            allRules.push(...ruleSet.rules.filter(r => r.category === category))
        }
        
        return allRules
    }

    getRulesBySeverity(severity: RuleSeverity): Rule[] {
        const allRules: Rule[] = []
        
        for (const ruleSet of this.ruleSets.values()) {
            allRules.push(...ruleSet.rules.filter(r => r.severity === severity))
        }
        
        return allRules
    }

    validateRule(rule: Rule): { valid: boolean; error?: string } {
        if (!rule.id || rule.id.trim() === '') {
            return { valid: false, error: 'Rule ID is required' }
        }
        
        if (!rule.name || rule.name.trim() === '') {
            return { valid: false, error: 'Rule name is required' }
        }
        
        if (!rule.description || rule.description.trim() === '') {
            return { valid: false, error: 'Rule description is required' }
        }
        
        if (!rule.patterns || rule.patterns.length === 0) {
            return { valid: false, error: 'Rule patterns are required' }
        }
        
        if (!rule.message || rule.message.trim() === '') {
            return { valid: false, error: 'Rule message is required' }
        }
        
        // Validate regex patterns
        for (const pattern of rule.patterns) {
            try {
                new RegExp(pattern)
            } catch (error) {
                return { valid: false, error: `Invalid regex pattern: ${pattern}` }
            }
        }
        
        return { valid: true }
    }

    getRuleSet(name: string): RuleSet | undefined {
        return this.ruleSets.get(name)
    }

    getAllRuleSets(): RuleSet[] {
        return Array.from(this.ruleSets.values())
    }

    reset(): void {
        this.ruleSets.clear()
        this.logger.info('Reset rule parser')
    }
}

// Singleton instance
let ruleParser: RuleParser | null = null

export function getRuleParser(logger?: Logger): RuleParser {
    if (!ruleParser) {
        ruleParser = new RuleParser(logger)
    }
    return ruleParser
}

export function destroyRuleParser(): void {
    if (ruleParser) {
        ruleParser.reset()
        ruleParser = null
    }
}

export function createRuleParser(logger?: Logger): RuleParser {
    return new RuleParser(logger)
}