/**
 * Rules Service Type Definitions
 * Core types for the code analysis rules engine
 */

/**
 * Rule severity levels
 */
export type RuleSeverity = 'error' | 'warning' | 'suggestion' | 'info'

/**
 * Rule categories
 */
export type RuleCategory = 'style' | 'naming' | 'architecture' | 'security' | 'performance' | 'testing' | 'custom'

/**
 * Rule definition
 */
export interface Rule {
    id: string
    name: string
    description: string
    category: RuleCategory
    severity: RuleSeverity
    patterns: string[]
    message: string
    fix?: string
    exceptions: string[]
    enabled: boolean
    language?: string[]
    filePatterns?: string[]
}

/**
 * Rule set containing multiple rules
 */
export interface RuleSet {
    name: string
    description: string
    version: string
    rules: Rule[]
    tags?: string[]
}

/**
 * Parsed rules from configuration
 */
export interface ParsedRules {
    ruleSets: Map<string, RuleSet>
    errors: string[]
    lastUpdated: Date
}

/**
 * Rule violation
 */
export interface RuleViolation {
    ruleId: string
    ruleName: string
    severity: RuleSeverity
    message: string
    filePath: string
    lineNumber?: number
    column?: number
    fix?: string
    category: RuleCategory
    matchedText?: string
}

/**
 * Rule application result
 */
export interface RuleApplicationResult {
    violations: RuleViolation[]
    appliedRules: number
    skippedRules: number
    errors: string[]
    duration?: number
}

/**
 * Rule validation result
 */
export interface RuleValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

/**
 * Rule statistics
 */
export interface RuleStatistics {
    totalRuleSets: number
    totalRules: number
    activeRules: number
    rulesByCategory: Record<RuleCategory, number>
    rulesBySeverity: Record<RuleSeverity, number>
    mostViolatedRule?: string
}

/**
 * Rule service configuration
 */
export interface RuleServiceConfig {
    maxViolations?: number
    cacheEnabled?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    autoLoad?: boolean
}