/**
 * Rule Validator and Tester
 * Validation and testing framework for team rules
 */

import { getRuleParser } from './ruleParser'
import { getRuleService } from './ruleService'
import type { Rule } from './ruleParser'

export interface TestCodeSample {
    name: string
    code: string
    filePath: string
    expectedViolations: number
    description: string
}

export interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

export interface TestResult {
    ruleId: string
    ruleName: string
    passed: boolean
    expectedViolations: number
    actualViolations: number
    sampleName: string
    error?: string
}

export class RuleValidator {
    private ruleParser = getRuleParser()
    private ruleService = getRuleService()

    validateRule(rule: Rule): ValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        // Validate required fields
        if (!rule.id) {
            errors.push('Rule must have an id')
        }

        if (!rule.name) {
            errors.push('Rule must have a name')
        }

        if (!rule.description) {
            warnings.push('Rule should have a description')
        }

        if (!rule.category) {
            errors.push('Rule must have a category')
        }

        if (!rule.severity) {
            errors.push('Rule must have a severity')
        }

        // Validate patterns
        if (!Array.isArray(rule.patterns)) {
            errors.push('Rule patterns must be an array')
        } else if (rule.patterns.length === 0) {
            warnings.push('Rule has no patterns defined')
        } else {
            for (const pattern of rule.patterns) {
                try {
                    new RegExp(pattern)
                } catch (error) {
                    errors.push(`Invalid regex pattern: ${pattern}`)
                }
            }
        }

        // Validate appliesTo
        if (!Array.isArray(rule.appliesTo)) {
            errors.push('Rule appliesTo must be an array')
        } else if (rule.appliesTo.length === 0) {
            warnings.push('Rule has no file patterns defined')
        }

        // Validate priority
        if (typeof rule.priority !== 'number' || rule.priority < 0) {
            errors.push('Rule priority must be a non-negative number')
        }

        // Validate exceptions
        if (rule.exceptions && !Array.isArray(rule.exceptions)) {
            errors.push('Rule exceptions must be an array')
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    validateRuleSet(ruleSet: any): ValidationResult {
        const errors: string[] = []
        const warnings: string[] = []

        // Validate required fields
        if (!ruleSet.name) {
            errors.push('Rule set must have a name')
        }

        if (!ruleSet.version) {
            warnings.push('Rule set should have a version')
        }

        if (!Array.isArray(ruleSet.rules)) {
            errors.push('Rule set rules must be an array')
        } else if (ruleSet.rules.length === 0) {
            warnings.push('Rule set has no rules defined')
        } else {
            // Validate each rule
            for (const rule of ruleSet.rules) {
                const validation = this.validateRule(rule)
                if (!validation.valid) {
                    errors.push(`Rule ${rule.id || 'unnamed'}: ${validation.errors.join(', ')}`)
                }
                warnings.push(...validation.warnings.map(w => `Rule ${rule.id || 'unnamed'}: ${w}`))
            }
        }

        // Validate inheritance
        if (ruleSet.inherits && !Array.isArray(ruleSet.inherits)) {
            errors.push('Rule set inherits must be an array')
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        }
    }

    async testRule(rule: Rule, testSamples: TestCodeSample[]): Promise<TestResult[]> {
        const results: TestResult[] = []

        for (const sample of testSamples) {
            try {
                const applicationResult = await this.ruleService.applyRulesToCode(sample.code, sample.filePath)

                const ruleViolations = applicationResult.violations.filter(v => v.ruleId === rule.id)
                const passed = ruleViolations.length === sample.expectedViolations

                results.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    passed,
                    expectedViolations: sample.expectedViolations,
                    actualViolations: ruleViolations.length,
                    sampleName: sample.name
                })
            } catch (error) {
                results.push({
                    ruleId: rule.id,
                    ruleName: rule.name,
                    passed: false,
                    expectedViolations: sample.expectedViolations,
                    actualViolations: 0,
                    sampleName: sample.name,
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        return results
    }

    async testRuleSet(ruleSetName: string, testSamples: TestCodeSample[]): Promise<Map<string, TestResult[]>> {
        const ruleSet = this.ruleParser.getRuleSet(ruleSetName)
        if (!ruleSet) {
            throw new Error(`Rule set not found: ${ruleSetName}`)
        }

        const results = new Map<string, TestResult[]>()

        for (const rule of ruleSet.rules) {
            const ruleResults = await this.testRule(rule, testSamples)
            results.set(rule.id, ruleResults)
        }

        return results
    }

    generateTestSamples(rule: Rule): TestCodeSample[] {
        const samples: TestCodeSample[] = []

        // Generate positive test (should trigger violation)
        const positiveCode = this.generatePositiveSample(rule)
        if (positiveCode) {
            samples.push({
                name: `Positive test for ${rule.id}`,
                code: positiveCode,
                filePath: rule.appliesTo[0] || 'test.js',
                expectedViolations: 1,
                description: 'Code that should trigger the rule'
            })
        }

        // Generate negative test (should not trigger violation)
        const negativeCode = this.generateNegativeSample(rule)
        if (negativeCode) {
            samples.push({
                name: `Negative test for ${rule.id}`,
                code: negativeCode,
                filePath: rule.appliesTo[0] || 'test.js',
                expectedViolations: 0,
                description: 'Code that should not trigger the rule'
            })
        }

        return samples
    }

    private generatePositiveSample(rule: Rule): string | null {
        // Generate code that should trigger the rule
        if (rule.patterns.length === 0) return null

        const pattern = rule.patterns[0]

        // Simple pattern-based sample generation
        if (pattern.includes('var ')) {
            return 'var x = 5;'
        }
        if (pattern.includes('console.log')) {
            return 'console.log("test");'
        }
        if (pattern.includes('eval')) {
            return 'eval("code");'
        }
        if (pattern.includes('api_key')) {
            return 'const api_key = "secret";'
        }

        return `// Sample code for ${rule.id}\n${pattern.replace(/\\\\/g, '')}`
    }

    private generateNegativeSample(rule: Rule): string | null {
        // Generate code that should not trigger the rule
        if (rule.patterns.length === 0) return null

        const pattern = rule.patterns[0]

        if (pattern.includes('var ')) {
            return 'const x = 5;'
        }
        if (pattern.includes('console.log')) {
            return '// console.log("test");'
        }
        if (pattern.includes('eval')) {
            return '// eval("code");'
        }
        if (pattern.includes('api_key')) {
            return 'const apiKey = process.env.API_KEY;'
        }

        return `// Safe code for ${rule.id}\n// No violations expected`
    }

    async runFullValidation(ruleSet: any): Promise<{
        ruleSetValidation: ValidationResult
        ruleValidations: Map<string, ValidationResult>
        testResults: Map<string, TestResult[]>
    }> {
        const ruleSetValidation = this.validateRuleSet(ruleSet)
        const ruleValidations = new Map<string, ValidationResult>()
        const testResults = new Map<string, TestResult[]>()

        if (Array.isArray(ruleSet.rules)) {
            for (const rule of ruleSet.rules) {
                const validation = this.validateRule(rule)
                ruleValidations.set(rule.id, validation)

                // Generate and run tests if validation passes
                if (validation.valid) {
                    const testSamples = this.generateTestSamples(rule)
                    const results = await this.testRule(rule, testSamples)
                    testResults.set(rule.id, results)
                }
            }
        }

        return {
            ruleSetValidation,
            ruleValidations,
            testResults
        }
    }

    getValidationSummary(validationResults: Map<string, ValidationResult>): {
        total: number
        valid: number
        invalid: number
        warnings: number
        errors: number
    } {
        let total = 0
        let valid = 0
        let invalid = 0
        let warnings = 0
        let errors = 0

        for (const validation of validationResults.values()) {
            total++
            if (validation.valid) {
                valid++
            } else {
                invalid++
            }
            warnings += validation.warnings.length
            errors += validation.errors.length
        }

        return { total, valid, invalid, warnings, errors }
    }

    getTestSummary(testResults: Map<string, TestResult[]>): {
        totalTests: number
        passed: number
        failed: number
        passRate: number
    } {
        let totalTests = 0
        let passed = 0

        for (const results of testResults.values()) {
            for (const result of results) {
                totalTests++
                if (result.passed) {
                    passed++
                }
            }
        }

        const passRate = totalTests > 0 ? (passed / totalTests) * 100 : 0

        return { totalTests, passed, failed: totalTests - passed, passRate }
    }
}

// Singleton instance
let ruleValidator: RuleValidator | null = null

export function getRuleValidator(): RuleValidator {
    if (!ruleValidator) {
        ruleValidator = new RuleValidator()
    }
    return ruleValidator
}

export function destroyRuleValidator() {
    if (ruleValidator) {
        ruleValidator = null
    }
}
