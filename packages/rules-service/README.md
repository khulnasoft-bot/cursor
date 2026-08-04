# @cursor/rules-service

Code analysis rules engine for team conventions and code quality enforcement.

## Installation

```bash
npm install @cursor/rules-service
```

## Usage

```typescript
import { RuleService, ConsoleLogger } from '@cursor/rules-service'

// Create rules service
const service = new RuleService({}, new ConsoleLogger())

// Initialize with project path
await service.initialize('./my-project')

// Apply rules to code
const result = await service.applyRulesToCode(
    'console.log("hello")',
    'src/main.ts'
)

console.log(`Found ${result.violations.length} violations`)
```

## Features

### Rule Management
- Load rules from project configuration
- Create, update, delete rule sets
- Enable/disable individual rules
- Import/export rules as JSON

### Code Analysis
- Pattern-based rule matching
- File-specific rule application
- Line and column reporting
- Exception handling for false positives

### AI Context Integration
- Automatically adds team rules to AI context
- Categorized rule presentation
- Fix suggestions included

### Rule Validation
- Comprehensive rule validation
- Pattern syntax checking
- Conflict detection
- Improvement suggestions

### Default Rules
- Style rules (no console, no debugger)
- Naming conventions
- Security rules (no hardcoded secrets)
- Extensible custom rules

## API

### RuleService

#### Configuration
```typescript
interface RuleServiceConfig {
    maxViolations?: number
    cacheEnabled?: boolean
    logLevel?: 'debug' | 'info' | 'warn' | 'error'
    autoLoad?: boolean
}
```

#### Initialization
- `initialize(projectPath)` - Load rules from project directory
- `reset()` - Reset service state

#### Rule Application
- `applyRulesToCode(code, filePath)` - Apply rules to code
- `applyRulesToAIContext(context, filePath)` - Add rules to AI context

#### Rule Management
- `getActiveRules()` - Get all active rules
- `getRulesByCategory(category)` - Get rules by category
- `getRulesBySeverity(severity)` - Get rules by severity
- `getRuleSet(name)` - Get specific rule set
- `getAllRuleSets()` - Get all rule sets
- `createRuleSet(ruleSet, projectPath)` - Create new rule set
- `updateRuleSet(name, updates, projectPath)` - Update rule set
- `deleteRuleSet(name, projectPath)` - Delete rule set
- `enableRule(ruleId, projectPath)` - Enable rule
- `disableRule(ruleId, projectPath)` - Disable rule

#### Validation & Statistics
- `validateRule(rule)` - Validate rule definition
- `getStatistics()` - Get rule statistics
- `exportRules()` - Export rules as JSON
- `importRules(json, projectPath)` - Import rules from JSON

### RuleValidator

#### Validation
- `validateRule(rule)` - Validate single rule
- `validateRuleSet(ruleSet)` - Validate rule set
- `validateRuleJSON(json)` - Validate JSON rule definition
- `checkRuleConflicts(rules)` - Check for rule conflicts
- `suggestRuleImprovements(rule)` - Get improvement suggestions

## Examples

### Basic Usage
```typescript
import { RuleService } from '@cursor/rules-service'

const service = new RuleService()
await service.initialize('./my-project')

const result = await service.applyRulesToCode(
    'console.log("debug")',
    'src/main.ts'
)

for (const violation of result.violations) {
    console.log(`${violation.severity}: ${violation.message} at line ${violation.lineNumber}`)
}
```

### Custom Rules
```typescript
const customRuleSet = {
    name: 'custom',
    description: 'Custom project rules',
    version: '1.0.0',
    rules: [
        {
            id: 'custom-no-todo',
            name: 'No TODO comments',
            description: 'Remove TODO comments before committing',
            category: 'style',
            severity: 'warning',
            patterns: ['TODO'],
            message: 'Remove TODO comment',
            fix: 'Address the TODO or remove the comment',
            exceptions: [],
            enabled: true,
            language: ['javascript', 'typescript'],
            filePatterns: ['src/**/*']
        }
    ]
}

await service.createRuleSet(customRuleSet, './my-project')
```

### AI Context Integration
```typescript
const code = 'function example() { console.log("test"); }'
const context = 'Please review this code'

const enhancedContext = service.applyRulesToAIContext(context, 'src/example.ts')

// Now includes team rules in the context
console.log(enhancedContext)
```

### Rule Validation
```typescript
import { RuleValidator } from '@cursor/rules-service'

const validator = new RuleValidator()

const validation = validator.validateRule({
    id: 'test-rule',
    name: 'Test Rule',
    description: 'A test rule',
    category: 'style',
    severity: 'warning',
    patterns: ['test'],
    message: 'Test found',
    exceptions: [],
    enabled: true
})

if (!validation.valid) {
    console.error('Validation errors:', validation.errors)
}
console.log('Warnings:', validation.warnings)
```

### Statistics
```typescript
const stats = service.getStatistics()
console.log(`Total rules: ${stats.totalRules}`)
console.log(`Active rules: ${stats.activeRules}`)
console.log(`Rules by category:`, stats.rulesByCategory)
console.log(`Rules by severity:`, stats.rulesBySeverity)
```

### Import/Export
```typescript
// Export rules
const json = service.exportRules()
console.log(json)

// Import rules
await service.importRules(json, './my-project')
```

## Rule Structure

### Rule Definition
```typescript
interface Rule {
    id: string                    // Unique identifier
    name: string                  // Human-readable name
    description: string          // Rule description
    category: RuleCategory        // Rule category
    severity: RuleSeverity        // Rule severity
    patterns: string[]            // Regex patterns to match
    message: string              // Violation message
    fix?: string                 // Suggested fix
    exceptions: string[]         // Exception patterns
    enabled: boolean             // Whether rule is active
    language?: string[]          // Target languages
    filePatterns?: string[]      // File patterns to match
}
```

### Rule Categories
- `style` - Code style and formatting
- `naming` - Naming conventions
- `architecture` - Architectural guidelines
- `security` - Security-related rules
- `performance` - Performance guidelines
- `testing` - Testing requirements
- `custom` - Custom rules

### Severity Levels
- `error` - Critical issues that must be fixed
- `warning` - Issues that should be addressed
- `suggestion` - Optional improvements
- `info` - Informational messages

## Best Practices

### Rule Design
- Keep rules focused and specific
- Provide clear, actionable messages
- Include fix suggestions when possible
- Use appropriate severity levels
- Add exceptions for common false positives

### Performance
- Use specific patterns to avoid false positives
- Limit rule scope with file patterns
- Set appropriate max violations limit
- Enable caching for repeated analysis

### Team Collaboration
- Use descriptive rule names and descriptions
- Categorize rules logically
- Document rule rationale
- Review rules regularly for relevance

## Advanced Features

### Custom Rule Categories
```typescript
const customRule = {
    id: 'custom-category',
    category: 'custom',
    // ... other properties
}
```

### Language-Specific Rules
```typescript
const tsRule = {
    id: 'typescript-rule',
    language: ['typescript'],
    filePatterns: ['**/*.ts', '**/*.tsx'],
    // ... other properties
}
```

### Pattern Exceptions
```typescript
const rule = {
    id: 'no-console',
    patterns: ['console\\.log'],
    exceptions: ['console.error', 'console.warn'],
    // ... other properties
}
```

### Conflict Detection
```typescript
const validator = new RuleValidator()
const conflicts = validator.checkRuleConflicts(rules)
for (const conflict of conflicts) {
    console.log(`Conflict between ${conflict.rule1.id} and ${conflict.rule2.id}`)
}
```

## Default Rules

The service includes default rules for common scenarios:

### Style Rules
- No console statements in production code
- No debugger statements

### Naming Rules
- CamelCase for variables (suggestion)

### Security Rules
- No hardcoded API keys or secrets

## Error Handling

The service provides detailed error information:

```typescript
const result = await service.applyRulesToCode(code, filePath)

if (result.errors.length > 0) {
    console.error('Errors:', result.errors)
}

for (const violation of result.violations) {
    console.log(`${violation.severity}: ${violation.message}`)
    console.log(`  File: ${violation.filePath}:${violation.lineNumber}`)
    if (violation.fix) {
        console.log(`  Fix: ${violation.fix}`)
    }
}
```

## License

MIT