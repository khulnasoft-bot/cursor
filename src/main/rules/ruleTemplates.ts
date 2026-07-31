/**
 * Rule Templates
 * Pre-defined rule templates for common coding standards
 */

import type { RuleSet } from './ruleParser'

export interface RuleTemplate {
    id: string
    name: string
    description: string
    category: 'style' | 'security' | 'performance' | 'testing' | 'architecture' | 'custom'
    language: 'javascript' | 'typescript' | 'python' | 'go' | 'rust' | 'general'
    ruleSet: RuleSet
}

export class RuleTemplates {
    private templates: Map<string, RuleTemplate> = new Map()

    constructor() {
        this.initializeTemplates()
    }

    private initializeTemplates(): void {
        // JavaScript/TypeScript Best Practices
        this.addTemplate({
            id: 'js-best-practices',
            name: 'JavaScript/TypeScript Best Practices',
            description: 'Standard coding standards for JavaScript and TypeScript projects',
            category: 'style',
            language: 'typescript',
            ruleSet: {
                name: 'javascript-best-practices',
                version: '1.0.0',
                description: 'JavaScript/TypeScript best practices',
                rules: [
                    {
                        id: 'js-001',
                        name: 'Use const and let, avoid var',
                        description: 'Use const for constants and let for variables, avoid var',
                        category: 'style',
                        severity: 'error',
                        enabled: true,
                        priority: 1,
                        patterns: ['\\bvar\\s+'],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.jsx', '*.tsx'],
                        message: 'Use const or let instead of var',
                        fix: 'Replace var with const or let'
                    },
                    {
                        id: 'js-002',
                        name: 'Avoid console.log in production',
                        description: 'Remove console.log statements before committing',
                        category: 'style',
                        severity: 'error',
                        enabled: true,
                        priority: 2,
                        patterns: ['console\\.log'],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.jsx', '*.tsx'],
                        message: 'Remove console.log statement',
                        fix: 'Replace with proper logging or remove'
                    },
                    {
                        id: 'js-003',
                        name: 'Use template literals instead of concatenation',
                        description: 'Prefer template literals over string concatenation',
                        category: 'style',
                        severity: 'suggestion',
                        enabled: true,
                        priority: 3,
                        patterns: ['["\'][^"\']*[+][^"\']*["\']'],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.jsx', '*.tsx'],
                        message: 'Use template literals instead of string concatenation',
                        fix: 'Convert to template literal syntax'
                    },
                    {
                        id: 'js-004',
                        name: 'Add JSDoc comments for functions',
                        description: 'Functions should have JSDoc comments',
                        category: 'style',
                        severity: 'suggestion',
                        enabled: true,
                        priority: 4,
                        patterns: ['function\\s+\\w+', 'const\\s+\\w+\\s*=\\s*\\('],
                        exceptions: [],
                        appliesTo: ['*.ts', '*.tsx', '*.js'],
                        message: 'Add JSDoc comment for this function'
                    }
                ]
            }
        })

        // Python Style Guide
        this.addTemplate({
            id: 'python-style',
            name: 'Python Style Guide (PEP 8)',
            description: 'PEP 8 compliant Python coding standards',
            category: 'style',
            language: 'python',
            ruleSet: {
                name: 'python-style',
                version: '1.0.0',
                description: 'Python PEP 8 style guide',
                rules: [
                    {
                        id: 'py-001',
                        name: 'Use snake_case for variables and functions',
                        description: 'Python naming convention: snake_case for variables and functions',
                        category: 'naming',
                        severity: 'warning',
                        enabled: true,
                        priority: 1,
                        patterns: ['\\b[A-Z][a-z]+[A-Z]'],
                        exceptions: ['True', 'False', 'None'],
                        appliesTo: ['*.py'],
                        message: 'Use snake_case for variable and function names',
                        fix: 'Convert to snake_case naming convention'
                    },
                    {
                        id: 'py-002',
                        name: 'Use PascalCase for classes',
                        description: 'Python naming convention: PascalCase for class names',
                        category: 'naming',
                        severity: 'warning',
                        enabled: true,
                        priority: 2,
                        patterns: ['class\\s+[a-z]'],
                        exceptions: [],
                        appliesTo: ['*.py'],
                        message: 'Use PascalCase for class names',
                        fix: 'Convert class name to PascalCase'
                    },
                    {
                        id: 'py-003',
                        name: 'Avoid print statements in production',
                        description: 'Use proper logging instead of print statements',
                        category: 'style',
                        severity: 'error',
                        enabled: true,
                        priority: 3,
                        patterns: ['print\\s*\\('],
                        exceptions: [],
                        appliesTo: ['*.py'],
                        message: 'Use logging module instead of print',
                        fix: 'Replace print with logging.info/debug/error'
                    }
                ]
            }
        })

        // Security Standards
        this.addTemplate({
            id: 'security-standards',
            name: 'Security Standards',
            description: 'Security-focused coding rules',
            category: 'security',
            language: 'general',
            ruleSet: {
                name: 'security-standards',
                version: '1.0.0',
                description: 'Security coding standards',
                rules: [
                    {
                        id: 'sec-001',
                        name: 'Avoid hardcoded secrets',
                        description: 'Do not hardcode API keys, passwords, or secrets',
                        category: 'security',
                        severity: 'error',
                        enabled: true,
                        priority: 1,
                        patterns: ['api[_-]?key\\s*=\\s*["\']', 'password\\s*=\\s*["\']', 'secret\\s*=\\s*["\']'],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.py', '*.go', '*.rs'],
                        message: 'Hardcoded secrets detected - use environment variables',
                        fix: 'Move to environment variables or secure config'
                    },
                    {
                        id: 'sec-002',
                        name: 'Avoid eval()',
                        description: 'Do not use eval() as it can execute arbitrary code',
                        category: 'security',
                        severity: 'error',
                        enabled: true,
                        priority: 2,
                        patterns: ['\\beval\\s*\\('],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.jsx', '*.tsx'],
                        message: 'Avoid eval() - it can execute arbitrary code',
                        fix: 'Use safer alternatives or avoid dynamic code execution'
                    },
                    {
                        id: 'sec-003',
                        name: 'Use parameterized queries',
                        description: 'Use parameterized queries to prevent SQL injection',
                        category: 'security',
                        severity: 'error',
                        enabled: true,
                        priority: 3,
                        patterns: ['SELECT.*WHERE.*["\'].*\\+.*["\']'],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.py'],
                        message: 'Use parameterized queries to prevent SQL injection',
                        fix: 'Use prepared statements or parameterized queries'
                    }
                ]
            }
        })

        // Performance Guidelines
        this.addTemplate({
            id: 'performance-guidelines',
            name: 'Performance Guidelines',
            description: 'Performance optimization rules',
            category: 'performance',
            language: 'general',
            ruleSet: {
                name: 'performance-guidelines',
                version: '1.0.0',
                description: 'Performance optimization guidelines',
                rules: [
                    {
                        id: 'perf-001',
                        name: 'Avoid unnecessary loops',
                        description: 'Avoid nested loops when possible',
                        category: 'performance',
                        severity: 'warning',
                        enabled: true,
                        priority: 1,
                        patterns: ['for\\s*\\([^)]*\\)\\s*{[^}]*for\\s*\\('],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.py'],
                        message: 'Consider optimizing nested loops',
                        fix: 'Use more efficient algorithms or data structures'
                    },
                    {
                        id: 'perf-002',
                        name: 'Cache expensive operations',
                        description: 'Cache results of expensive computations',
                        category: 'performance',
                        severity: 'suggestion',
                        enabled: true,
                        priority: 2,
                        patterns: ['\\bMath\\.(random|sqrt|sin|cos)\\s*\\('],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts'],
                        message: 'Consider caching expensive operations',
                        fix: 'Cache the result if called repeatedly'
                    },
                    {
                        id: 'perf-003',
                        name: 'Use efficient data structures',
                        description: 'Use appropriate data structures for the use case',
                        category: 'performance',
                        severity: 'suggestion',
                        enabled: true,
                        priority: 3,
                        patterns: ['Array\\.prototype\\.find\\s*\\(.*\\)\\s*\\.includes'],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts'],
                        message: 'Consider using Set for membership tests',
                        fix: 'Use Set or Map for better performance'
                    }
                ]
            }
        })

        // Testing Standards
        this.addTemplate({
            id: 'testing-standards',
            name: 'Testing Standards',
            description: 'Testing best practices and standards',
            category: 'testing',
            language: 'general',
            ruleSet: {
                name: 'testing-standards',
                version: '1.0.0',
                description: 'Testing standards',
                rules: [
                    {
                        id: 'test-001',
                        name: 'Add test coverage for new functions',
                        description: 'Ensure new functions have test coverage',
                        category: 'testing',
                        severity: 'suggestion',
                        enabled: true,
                        priority: 1,
                        patterns: ['function\\s+\\w+', 'const\\s+\\w+\\s*=\\s*\\('],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.py'],
                        message: 'Add test coverage for this function'
                    },
                    {
                        id: 'test-002',
                        name: 'Use descriptive test names',
                        description: 'Test names should describe what they test',
                        category: 'testing',
                        severity: 'suggestion',
                        enabled: true,
                        priority: 2,
                        patterns: ['test\\s*\\(\\s*["\'][a-z]'],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.py'],
                        message: 'Use descriptive test names',
                        fix: 'Rename test to describe what it tests'
                    },
                    {
                        id: 'test-003',
                        name: 'Avoid testing implementation details',
                        description: 'Test behavior, not implementation details',
                        category: 'testing',
                        severity: 'warning',
                        enabled: true,
                        priority: 3,
                        patterns: ['expect\\(.*\\.length\\)', 'assertEqual\\(.*\\.length'],
                        exceptions: [],
                        appliesTo: ['*.js', '*.ts', '*.py'],
                        message: 'Test behavior instead of implementation details',
                        fix: 'Test the actual behavior/output'
                    }
                ]
            }
        })
    }

    private addTemplate(template: RuleTemplate): void {
        this.templates.set(template.id, template)
    }

    getTemplate(id: string): RuleTemplate | undefined {
        return this.templates.get(id)
    }

    getTemplates(): RuleTemplate[] {
        return Array.from(this.templates.values())
    }

    getTemplatesByCategory(category: RuleTemplate['category']): RuleTemplate[] {
        return this.getTemplates().filter(t => t.category === category)
    }

    getTemplatesByLanguage(language: RuleTemplate['language']): RuleTemplate[] {
        return this.getTemplates().filter(t => t.language === language)
    }

    searchTemplates(query: string): RuleTemplate[] {
        const queryLower = query.toLowerCase()
        return this.getTemplates().filter(t =>
            t.name.toLowerCase().includes(queryLower) ||
            t.description.toLowerCase().includes(queryLower)
        )
    }

    async exportTemplate(id: string): Promise<string> {
        const template = this.getTemplate(id)
        if (!template) {
            throw new Error(`Template not found: ${id}`)
        }
        return JSON.stringify(template.ruleSet, null, 2)
    }

    async importTemplate(json: string): Promise<RuleTemplate> {
        const ruleSet = JSON.parse(json) as RuleSet
        const template: RuleTemplate = {
            id: `custom-${Date.now()}`,
            name: ruleSet.name,
            description: ruleSet.description,
            category: 'custom',
            language: 'general',
            ruleSet
        }
        this.addTemplate(template)
        return template
    }

    createCustomTemplate(name: string, description: string, category: RuleTemplate['category']): RuleTemplate {
        const template: RuleTemplate = {
            id: `custom-${Date.now()}`,
            name,
            description,
            category,
            language: 'general',
            ruleSet: {
                name: name.toLowerCase().replace(/\s+/g, '-'),
                version: '1.0.0',
                description,
                rules: []
            }
        }
        this.addTemplate(template)
        return template
    }

    deleteTemplate(id: string): boolean {
        return this.templates.delete(id)
    }
}

// Singleton instance
let ruleTemplates: RuleTemplates | null = null

export function getRuleTemplates(): RuleTemplates {
    if (!ruleTemplates) {
        ruleTemplates = new RuleTemplates()
    }
    return ruleTemplates
}

export function destroyRuleTemplates() {
    if (ruleTemplates) {
        ruleTemplates = null
    }
}
