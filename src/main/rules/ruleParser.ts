/**
 * Team Rules Parser
 * Parser for .cursor/rules/ specification files
 */

import log from 'electron-log'
import * as fs from 'fs/promises'
import * as path from 'path'
import * as yaml from 'js-yaml'

export interface Rule {
    id: string
    name: string
    description: string
    category: 'style' | 'naming' | 'architecture' | 'security' | 'performance' | 'testing' | 'custom'
    severity: 'error' | 'warning' | 'suggestion' | 'info'
    enabled: boolean
    priority: number
    patterns: string[]
    exceptions: string[]
    appliesTo: string[] // file patterns
    message: string
    fix?: string // suggested fix
    metadata?: Record<string, any>
}

export interface RuleSet {
    name: string
    version: string
    description: string
    rules: Rule[]
    inherits?: string[] // parent rule sets to inherit from
    overrides?: Record<string, Partial<Rule>> // override inherited rules
}

export interface ParsedRules {
    ruleSets: Map<string, RuleSet>
    activeRules: Rule[]
    errors: string[]
}

export class RuleParser {
    private ruleSets: Map<string, RuleSet> = new Map()
    private errors: string[] = []

    async loadRulesFromDirectory(directory: string): Promise<ParsedRules> {
        this.ruleSets.clear()
        this.errors = []

        try {
            const rulesDir = path.join(directory, '.cursor', 'rules')

            // Check if rules directory exists
            try {
                await fs.access(rulesDir)
            } catch {
                log.info('No .cursor/rules directory found, using default rules')
                await this.loadDefaultRules()
                return this.getParsedRules()
            }

            // Load all .yaml and .yml files
            const entries = await fs.readdir(rulesDir, { withFileTypes: true })

            for (const entry of entries) {
                if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
                    const filePath = path.join(rulesDir, entry.name)
                    await this.loadRuleFile(filePath)
                }
            }

            // Process inheritance and overrides
            await this.processInheritance()

            // Build active rules
            const activeRules = this.buildActiveRules()

            log.info(`Loaded ${this.ruleSets.size} rule sets with ${activeRules.length} active rules`)
            return { ruleSets: this.ruleSets, activeRules, errors: this.errors }
        } catch (error) {
            log.error('Failed to load rules:', error)
            this.errors.push(`Failed to load rules: ${error instanceof Error ? error.message : 'Unknown error'}`)
            return { ruleSets: this.ruleSets, activeRules: [], errors: this.errors }
        }
    }

    private async loadRuleFile(filePath: string): Promise<void> {
        try {
            const content = await fs.readFile(filePath, 'utf-8')
            const parsed = yaml.load(content) as RuleSet

            if (!parsed || !parsed.name || !parsed.rules) {
                this.errors.push(`Invalid rule file format: ${filePath}`)
                return
            }

            // Validate rule set
            const validation = this.validateRuleSet(parsed)
            if (!validation.valid) {
                this.errors.push(`Validation failed for ${filePath}: ${validation.error}`)
                return
            }

            this.ruleSets.set(parsed.name, parsed)
            log.info(`Loaded rule set: ${parsed.name} from ${filePath}`)
        } catch (error) {
            this.errors.push(`Failed to parse rule file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
    }

    private async loadDefaultRules(): Promise<void> {
        const defaultRuleSet: RuleSet = {
            name: 'default',
            version: '1.0.0',
            description: 'Default coding standards',
            rules: [
                {
                    id: 'default-001',
                    name: 'Use meaningful variable names',
                    description: 'Variable names should be descriptive and meaningful',
                    category: 'naming',
                    severity: 'warning',
                    enabled: true,
                    priority: 1,
                    patterns: ['\\b[a-z]\\b', '\\b[A-Z]{2,}\\b'],
                    exceptions: ['i', 'j', 'k', 'x', 'y', 'z', 'ID', 'URL', 'API'],
                    appliesTo: ['*.ts', '*.tsx', '*.js', '*.jsx', '*.py'],
                    message: 'Consider using more descriptive variable names'
                },
                {
                    id: 'default-002',
                    name: 'Avoid console.log in production',
                    description: 'Remove console.log statements before committing',
                    category: 'style',
                    severity: 'error',
                    enabled: true,
                    priority: 2,
                    patterns: ['console\\.log'],
                    exceptions: [],
                    appliesTo: ['*.ts', '*.tsx', '*.js', '*.jsx'],
                    message: 'Remove console.log statement',
                    fix: 'Replace with proper logging or remove'
                },
                {
                    id: 'default-003',
                    name: 'Add JSDoc comments for functions',
                    description: 'Functions should have JSDoc comments',
                    category: 'style',
                    severity: 'suggestion',
                    enabled: true,
                    priority: 3,
                    patterns: ['function\\s+\\w+', 'const\\s+\\w+\\s*=\\s*\\('],
                    exceptions: [],
                    appliesTo: ['*.ts', '*.tsx', '*.js'],
                    message: 'Add JSDoc comment for this function'
                }
            ]
        }

        this.ruleSets.set('default', defaultRuleSet)
    }

    private validateRuleSet(ruleSet: RuleSet): { valid: boolean; error?: string } {
        if (!ruleSet.name) {
            return { valid: false, error: 'Rule set must have a name' }
        }

        if (!Array.isArray(ruleSet.rules)) {
            return { valid: false, error: 'Rules must be an array' }
        }

        for (const rule of ruleSet.rules) {
            const validation = this.validateRule(rule)
            if (!validation.valid) {
                return { valid: false, error: `Invalid rule: ${validation.error}` }
            }
        }

        return { valid: true }
    }

    validateRule(rule: Rule): { valid: boolean; error?: string } {
        if (!rule.id) {
            return { valid: false, error: 'Rule must have an id' }
        }

        if (!rule.name) {
            return { valid: false, error: 'Rule must have a name' }
        }

        if (!rule.category) {
            return { valid: false, error: 'Rule must have a category' }
        }

        if (!rule.severity) {
            return { valid: false, error: 'Rule must have a severity' }
        }

        if (!Array.isArray(rule.patterns)) {
            return { valid: false, error: 'Rule patterns must be an array' }
        }

        return { valid: true }
    }

    private async processInheritance(): Promise<void> {
        // Process rule set inheritance
        for (const [name, ruleSet] of this.ruleSets) {
            if (ruleSet.inherits && ruleSet.inherits.length > 0) {
                const inheritedRules: Rule[] = []

                for (const parentName of ruleSet.inherits) {
                    const parentSet = this.ruleSets.get(parentName)
                    if (parentSet) {
                        inheritedRules.push(...parentSet.rules)
                    } else {
                        this.errors.push(`Parent rule set not found: ${parentName}`)
                    }
                }

                // Apply overrides
                if (ruleSet.overrides) {
                    for (const [ruleId, override] of Object.entries(ruleSet.overrides)) {
                        const ruleIndex = inheritedRules.findIndex(r => r.id === ruleId)
                        if (ruleIndex !== -1) {
                            inheritedRules[ruleIndex] = { ...inheritedRules[ruleIndex], ...override }
                        }
                    }
                }

                // Merge with own rules (own rules take precedence)
                ruleSet.rules = [...inheritedRules, ...ruleSet.rules]
            }
        }
    }

    private buildActiveRules(): Rule[] {
        const activeRules: Rule[] = []

        for (const ruleSet of this.ruleSets.values()) {
            for (const rule of ruleSet.rules) {
                if (rule.enabled) {
                    activeRules.push(rule)
                }
            }
        }

        // Sort by priority
        activeRules.sort((a, b) => a.priority - b.priority)

        return activeRules
    }

    getParsedRules(): ParsedRules {
        return {
            ruleSets: this.ruleSets,
            activeRules: this.buildActiveRules(),
            errors: this.errors
        }
    }

    getActiveRules(): Rule[] {
        return this.buildActiveRules()
    }

    getRulesByCategory(category: Rule['category']): Rule[] {
        return this.getActiveRules().filter(r => r.category === category)
    }

    getRulesBySeverity(severity: Rule['severity']): Rule[] {
        return this.getActiveRules().filter(r => r.severity === severity)
    }

    getRulesForFile(filePath: string): Rule[] {
        const fileName = path.basename(filePath)
        return this.getActiveRules().filter(rule => {
            return rule.appliesTo.some(pattern => this.matchesPattern(fileName, pattern))
        })
    }

    private matchesPattern(fileName: string, pattern: string): boolean {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))
        return regex.test(fileName)
    }

    async saveRuleSet(ruleSet: RuleSet, directory: string): Promise<void> {
        const rulesDir = path.join(directory, '.cursor', 'rules')

        // Create directory if it doesn't exist
        await fs.mkdir(rulesDir, { recursive: true })

        const filePath = path.join(rulesDir, `${ruleSet.name}.yaml`)
        const yamlContent = yaml.dump(ruleSet, { indent: 2 })

        await fs.writeFile(filePath, yamlContent, 'utf-8')
        this.ruleSets.set(ruleSet.name, ruleSet)

        log.info(`Saved rule set: ${ruleSet.name} to ${filePath}`)
    }

    async deleteRuleSet(name: string, directory: string): Promise<void> {
        const rulesDir = path.join(directory, '.cursor', 'rules')
        const filePath = path.join(rulesDir, `${name}.yaml`)

        try {
            await fs.unlink(filePath)
            this.ruleSets.delete(name)
            log.info(`Deleted rule set: ${name}`)
        } catch (error) {
            log.error(`Failed to delete rule set ${name}:`, error)
            throw error
        }
    }

    clearRules(): void {
        this.ruleSets.clear()
        this.errors = []
    }
}

// Singleton instance
let ruleParser: RuleParser | null = null

export function getRuleParser(): RuleParser {
    if (!ruleParser) {
        ruleParser = new RuleParser()
    }
    return ruleParser
}

export function destroyRuleParser() {
    if (ruleParser) {
        ruleParser.clearRules()
        ruleParser = null
    }
}
