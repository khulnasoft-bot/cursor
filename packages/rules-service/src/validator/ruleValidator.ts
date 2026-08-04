/**
 * Rule Validator
 * Validates rule definitions and provides detailed feedback
 */

import { Rule, RuleValidationResult } from '../types'
import { Logger, ConsoleLogger } from '../logger'

export class RuleValidator {
    private logger: Logger

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
    }

    validateRule(rule: Rule): RuleValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        // Required fields
        if (!rule.id || rule.id.trim() === '') {
            errors.push('Rule ID is required')
        } else if (!/^[a-z0-9-]+$/.test(rule.id)) {
            errors.push('Rule ID must contain only lowercase letters, numbers, and hyphens')
        }

        if (!rule.name || rule.name.trim() === '') {
            errors.push('Rule name is required')
        }

        if (!rule.description || rule.description.trim() === '') {
            errors.push('Rule description is required')
        }

        if (!rule.message || rule.message.trim() === '') {
            errors.push('Rule message is required')
        }

        // Patterns validation
        if (!rule.patterns || rule.patterns.length === 0) {
            errors.push('Rule patterns are required')
        } else {
            for (const pattern of rule.patterns) {
                try {
                    new RegExp(pattern)
                } catch (error) {
                    errors.push(`Invalid regex pattern: ${pattern}`)
                }
            }
        }

        // Category validation
        const validCategories: Rule['category'][] = ['style', 'naming', 'architecture', 'security', 'performance', 'testing', 'custom']
        if (!validCategories.includes(rule.category)) {
            errors.push(`Invalid category: ${rule.category}. Must be one of: ${validCategories.join(', ')}`)
        }

        // Severity validation
        const validSeverities: Rule['severity'][] = ['error', 'warning', 'suggestion', 'info']
        if (!validSeverities.includes(rule.severity)) {
            errors.push(`Invalid severity: ${rule.severity}. Must be one of: ${validSeverities.join(', ')}`)
        }

        // Warnings
        if (rule.exceptions && rule.exceptions.length > 10) {
            warnings.push('Large number of exceptions may reduce rule effectiveness')
        }

        if (rule.patterns && rule.patterns.length > 20) {
            warnings.push('Large number of patterns may impact performance')
        }

        if (!rule.fix && rule.severity === 'error') {
            warnings.push('Error-level rules should include a fix suggestion')
        }

        if (rule.language && rule.language.length === 0) {
            warnings.push('Empty language array - rule will apply to all languages')
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    validateRuleSet(ruleSet: { name: string; description: string; version: string; rules: Rule[] }): RuleValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        if (!ruleSet.name || ruleSet.name.trim() === '') {
            errors.push('Rule set name is required')
        }

        if (!ruleSet.description || ruleSet.description.trim() === '') {
            errors.push('Rule set description is required')
        }

        if (!ruleSet.version || ruleSet.version.trim() === '') {
            errors.push('Rule set version is required')
        } else if (!/^\d+\.\d+\.\d+$/.test(ruleSet.version)) {
            errors.push('Rule set version must be in semantic versioning format (e.g., 1.0.0)')
        }

        if (!ruleSet.rules || ruleSet.rules.length === 0) {
            warnings.push('Rule set contains no rules')
        } else {
            const ruleIds = new Set<string>()
            
            for (const rule of ruleSet.rules) {
                const validation = this.validateRule(rule)
                errors.push(...validation.errors.map(e => `${rule.id}: ${e}`))
                warnings.push(...validation.warnings.map(w => `${rule.id}: ${w}`))

                // Check for duplicate rule IDs
                if (ruleIds.has(rule.id)) {
                    errors.push(`Duplicate rule ID: ${rule.id}`)
                } else {
                    ruleIds.add(rule.id)
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    validateRuleJSON(json: string): RuleValidationResult {
        try {
            const parsed = JSON.parse(json)
            
            if (Array.isArray(parsed)) {
                // Array of rules
                let allValid = true
                const allErrors: string[] = []
                const allWarnings: string[] = []

                for (const rule of parsed) {
                    const validation = this.validateRule(rule)
                    if (!validation.valid) {
                        allValid = false
                    }
                    allErrors.push(...validation.errors)
                    allWarnings.push(...validation.warnings)
                }

                return {
                    valid: allValid,
                    errors: allErrors,
                    warnings: allWarnings
                }
            } else if (parsed.rules && Array.isArray(parsed.rules)) {
                // Rule set
                return this.validateRuleSet(parsed)
            } else {
                // Single rule
                return this.validateRule(parsed)
            }
        } catch (error) {
            return {
                valid: false,
                errors: ['Invalid JSON format'],
                warnings: []
            }
        }
    }

    checkRuleConflicts(rules: Rule[]): Array<{ rule1: Rule; rule2: Rule; conflict: string }> {
        const conflicts: Array<{ rule1: Rule; rule2: Rule; conflict: string }> = []

        for (let i = 0; i < rules.length; i++) {
            for (let j = i + 1; j < rules.length; j++) {
                const rule1 = rules[i]
                const rule2 = rules[j]

                // Check for duplicate patterns
                for (const pattern1 of rule1.patterns) {
                    for (const pattern2 of rule2.patterns) {
                        if (pattern1 === pattern2) {
                            conflicts.push({
                                rule1,
                                rule2,
                                conflict: `Duplicate pattern: ${pattern1}`
                            })
                        }
                    }
                }

                // Check for contradictory severities
                if (rule1.id === rule2.id && rule1.severity !== rule2.severity) {
                    conflicts.push({
                        rule1,
                        rule2,
                        conflict: 'Contradictory severity for same rule ID'
                    })
                }
            }
        }

        return conflicts
    }

    suggestRuleImprovements(rule: Rule): string[] {
        const suggestions: string[] = []

        if (!rule.fix) {
            suggestions.push('Add a fix suggestion to help users resolve violations')
        }

        if (rule.exceptions.length === 0 && rule.patterns.some(p => p.includes('\\b'))) {
            suggestions.push('Consider adding exceptions for common false positives')
        }

        if (!rule.language || rule.language.length === 0) {
            suggestions.push('Specify target languages to avoid false positives')
        }

        if (!rule.filePatterns || rule.filePatterns.length === 0) {
            suggestions.push('Add file patterns to limit rule scope')
        }

        if (rule.patterns.length === 1 && rule.patterns[0].length < 5) {
            suggestions.push('Pattern may be too generic - consider making it more specific')
        }

        if (rule.severity === 'error' && !rule.description.includes('must') && !rule.description.includes('required')) {
            suggestions.push('Error-level rules should use stronger language in description')
        }

        return suggestions
    }
}

// Singleton instance
let ruleValidator: RuleValidator | null = null

export function getRuleValidator(logger?: Logger): RuleValidator {
    if (!ruleValidator) {
        ruleValidator = new RuleValidator(logger)
    }
    return ruleValidator
}

export function destroyRuleValidator(): void {
    if (ruleValidator) {
        ruleValidator = null
    }
}

export function createRuleValidator(logger?: Logger): RuleValidator {
    return new RuleValidator(logger)
}