# Cursor Component Migration Strategy

## Overview

This document provides a comprehensive migration strategy for extracting and reusing components from the Cursor.app codebase. The strategy is organized by component priority and includes specific implementation steps, dependencies, and considerations.

## Migration Phases

### Phase 1: Foundation Components (Week 1-2)

#### 1.1 Type Definitions Package
**Target**: `@cursor/types`

**Components**:
- Window state types (`src/features/window/state.ts`)
- Service interfaces
- Common utility types

**Steps**:
1. Create new npm package `@cursor/types`
2. Extract type definitions from `src/features/window/state.ts`
3. Add service interfaces (AI, File, Rules, etc.)
4. Remove Cursor-specific dependencies
5. Add JSDoc comments for documentation
6. Set up TypeScript configuration
7. Publish to npm or private registry

**Dependencies**: None
**Migration Complexity**: Very Low
**Value**: High - provides foundation for other packages

**Code Example**:
```typescript
// @cursor/types/src/window-state.ts
export interface File {
    parentFolderId: number
    name: string
    renameName: string | null
    isSelected: boolean
    saved: boolean
    // ... other properties
}

export interface Folder {
    parentFolderId: number | null
    name: string
    renameName: string | null
    fileIds: number[]
    folderIds: number[]
    loaded: boolean
    isOpen: boolean
}
```

#### 1.2 Utility Functions Package
**Target**: `@cursor/utils`

**Components**:
- Common utility functions
- Algorithm implementations
- Helper functions

**Steps**:
1. Create new npm package `@cursor/utils`
2. Extract pure functions from various files
3. Include dependency graph algorithms
4. Add search utilities
5. Include text processing functions
6. Add comprehensive unit tests
7. Document each function

**Dependencies**: `@cursor/types`
**Migration Complexity**: Low
**Value**: Medium - reduces code duplication

---

### Phase 2: Independent Services (Week 3-4)

#### 2.1 File Service
**Target**: `@cursor/file-service`

**Source**: `src/main/fileService/fileService.ts`

**Migration Steps**:

1. **Package Setup**:
   ```bash
   mkdir cursor-file-service
   cd cursor-file-service
   npm init -y
   npm install typescript @types/node --save-dev
   ```

2. **Extract Core Logic**:
   - Copy `fileService.ts` to new package
   - Remove Electron-specific logging (replace with console or generic logger)
   - Remove Electron-specific path handling
   - Add logging abstraction layer

3. **Create Logger Interface**:
   ```typescript
   // src/logger.ts
   export interface Logger {
       info(message: string, ...args: any[]): void
       warn(message: string, ...args: any[]): void
       error(message: string, ...args: any[]): void
   }

   export class ConsoleLogger implements Logger {
       info(message: string, ...args: any[]) {
           console.log(`[INFO] ${message}`, ...args)
       }
       warn(message: string, ...args: any[]) {
           console.warn(`[WARN] ${message}`, ...args)
       }
       error(message: string, ...args: any[]) {
           console.error(`[ERROR] ${message}`, ...args)
       }
   }
   ```

4. **Update FileService**:
   ```typescript
   // src/fileService.ts
   import { Logger } from './logger'
   
   class FileService {
       private logger: Logger
       
       constructor(logger?: Logger) {
           this.logger = logger || new ConsoleLogger()
       }
       
       // ... rest of implementation using this.logger
   }
   ```

5. **Add Configuration**:
   ```typescript
   // src/config.ts
   export interface FileServiceConfig {
       cachePath?: string
       defaultExcludePatterns?: string[]
       defaultMaxFileSize?: number
   }
   ```

6. **Create Factory Function**:
   ```typescript
   // src/index.ts
   export function createFileService(config?: FileServiceConfig, logger?: Logger): FileService {
       return new FileService(config, logger)
   }
   ```

7. **Add Tests**:
   ```typescript
   // tests/fileService.test.ts
   import { createFileService } from '../src'
   import { TempLogger } from './utils'
   
   describe('FileService', () => {
       it('should index directory', async () => {
           const service = createFileService({}, new TempLogger())
           await service.indexDirectory('./test-data')
           // assertions
       })
   })
   ```

8. **Package Configuration**:
   ```json
   {
     "name": "@cursor/file-service",
     "version": "1.0.0",
     "main": "dist/index.js",
     "types": "dist/index.d.ts",
     "scripts": {
       "build": "tsc",
       "test": "jest"
     }
   }
   ```

**Dependencies**: 
- `@cursor/types` (optional)
- Node.js built-in modules only

**Migration Complexity**: Low
**Estimated Effort**: 2-3 days
**Value**: Very High - useful for many projects

---

#### 2.2 React CodeMirror Component
**Target**: `@cursor/react-codemirror`

**Source**: `src/components/react-codemirror/`

**Migration Steps**:

1. **Package Setup**:
   ```bash
   mkdir cursor-react-codemirror
   cd cursor-react-codemirror
   npm init -y
   npm install react @codemirror/state @codemirror/view --save
   npm install typescript @types/react --save-dev
   ```

2. **Extract Components**:
   - Copy entire `react-codemirror` directory
   - Extract theme files
   - Separate setup logic

3. **Create Package Structure**:
   ```
   src/
   ├── index.tsx          # Main export
   ├── ReactCodeMirror.tsx
   ├── useCodeMirror.ts
   ├── setup.ts
   ├── utils.ts
   └── theme/
       ├── index.ts
       ├── cursor-dark.ts
       ├── cursor-light.ts
       └── cursor-midnight.ts
   ```

4. **Remove Cursor Dependencies**:
   - Remove viewKey dependency (make optional)
   - Remove tabId dependency (make optional)
   - Simplify custom dispatch logic

5. **Update Props Interface**:
   ```typescript
   export interface ReactCodeMirrorProps {
       // Required props
       value?: string
       onChange?: (value: string, viewUpdate: ViewUpdate) => void
       
       // Optional props (previously required)
       viewKey?: number
       tabId?: number
       fileName?: string
       filePath?: string
       
       // ... other props
   }
   ```

6. **Create Standalone Themes**:
   ```typescript
   // src/theme/index.ts
   export { cursorDark } from './cursor-dark'
   export { cursorLight } from './cursor-light'
   export { cursorMidnight } from './cursor-midnight'
   
   export type Theme = 'cursor-dark' | 'cursor-light' | 'cursor-midnight'
   ```

7. **Add Storybook Stories**:
   ```typescript
   // stories/ReactCodeMirror.stories.tsx
   import { ReactCodeMirror } from '../src'
   
   export default {
       title: 'ReactCodeMirror',
       component: ReactCodeMirror
   }
   
   export const Default = () => (
       <ReactCodeMirror value="Hello World" />
   )
   
   export const WithTheme = () => (
       <ReactCodeMirror value="Hello World" theme="cursor-dark" />
   )
   ```

8. **Package Configuration**:
   ```json
   {
     "name": "@cursor/react-codemirror",
     "version": "1.0.0",
     "peerDependencies": {
       "react": "^18.0.0",
       "@codemirror/state": "^6.0.0",
       "@codemirror/view": "^6.0.0"
     }
   }
   ```

**Dependencies**:
- React 18+
- CodeMirror 6 packages
- `@cursor/types` (optional)

**Migration Complexity**: Low
**Estimated Effort**: 3-4 days
**Value**: Very High - reusable editor component

---

### Phase 3: Business Logic Services (Week 5-6)

#### 3.1 Automations Engine
**Target**: `@cursor/automations`

**Source**: `src/features/automations/automationService.ts`

**Migration Steps**:

1. **Package Setup**:
   ```bash
   mkdir cursor-automations
   cd cursor-automations
   npm init -y
   npm install typescript --save-dev
   ```

2. **Extract Core Service**:
   - Copy `automationService.ts`
   - Extract trigger/action interfaces
   - Create scheduler abstraction

3. **Create Trigger System**:
   ```typescript
   // src/triggers/index.ts
   export interface Trigger {
       id: string
       type: TriggerType
       config: Record<string, any>
       enabled: boolean
   }
   
   export interface TriggerHandler {
       register(trigger: Trigger): void
       unregister(triggerId: string): void
       fire(triggerId: string, context?: any): void
   }
   
   export class FileWatchTrigger implements TriggerHandler {
       // Implementation for file system triggers
   }
   
   export class TimeTrigger implements TriggerHandler {
       // Implementation for time-based triggers
   }
   ```

4. **Create Action System**:
   ```typescript
   // src/actions/index.ts
   export interface Action {
       id: string
       type: ActionType
       config: Record<string, any>
       enabled: boolean
   }
   
   export interface ActionHandler {
       execute(action: Action, context?: any): Promise<ActionResult>
   }
   
   export class CommandAction implements ActionHandler {
       // Implementation for command execution
   }
   
   export class ScriptAction implements ActionHandler {
       // Implementation for script execution
   }
   ```

5. **Add Plugin System**:
   ```typescript
   // src/plugins.ts
   export interface AutomationPlugin {
       name: string
       triggers?: TriggerHandler[]
       actions?: ActionHandler[]
   }
   
   export class AutomationEngine {
       private plugins: AutomationPlugin[] = []
       
       registerPlugin(plugin: AutomationPlugin): void {
           this.plugins.push(plugin)
           // Register triggers and actions
       }
   }
   ```

6. **Remove Electron Dependencies**:
   - Replace electron-log with generic logger
   - Abstract file system operations
   - Remove IPC communication

7. **Add Storage Abstraction**:
   ```typescript
   // src/storage.ts
   export interface WorkflowStorage {
       save(workflow: AutomationWorkflow): Promise<void>
       load(id: string): Promise<AutomationWorkflow | null>
       list(): Promise<AutomationWorkflow[]>
       delete(id: string): Promise<void>
   }
   
   export class MemoryStorage implements WorkflowStorage {
       private workflows: Map<string, AutomationWorkflow> = new Map()
       // Implementation
   }
   
   export class FileStorage implements WorkflowStorage {
       // Implementation for file-based storage
   }
   ```

8. **Add Tests**:
   ```typescript
   // tests/automationService.test.ts
   import { AutomationEngine, MemoryStorage } from '../src'
   
   describe('AutomationEngine', () => {
       it('should execute workflow', async () => {
           const engine = new AutomationEngine(new MemoryStorage())
           const workflow = engine.createWorkflow('test', 'description', [], [])
           const result = await engine.executeWorkflow(workflow.id, mockTrigger)
           expect(result.status).toBe('completed')
       })
   })
   ```

**Dependencies**:
- `@cursor/types` (optional)
- Generic logger interface

**Migration Complexity**: Medium
**Estimated Effort**: 4-5 days
**Value**: High - flexible automation system

---

#### 3.2 AI Service
**Target**: `@cursor/ai-service`

**Source**: `src/main/aiService/aiService.ts`

**Migration Steps**:

1. **Package Setup**:
   ```bash
   mkdir cursor-ai-service
   cd cursor-ai-service
   npm init -y
   npm install node-fetch --save
   npm install typescript @types/node --save-dev
   ```

2. **Extract Core AI Logic**:
   - Copy `aiService.ts`
   - Remove Electron-specific logging
   - Remove Cursor-specific rule integration

3. **Create HTTP Client Abstraction**:
   ```typescript
   // src/http.ts
   export interface HttpClient {
       post(url: string, body: any, headers?: Record<string, string>): Promise<any>
       stream(url: string, body: any, headers?: Record<string, string>, onChunk: (chunk: string) => void): Promise<void>
   }
   
   export class FetchHttpClient implements HttpClient {
       async post(url: string, body: any, headers?: Record<string, string>) {
           const response = await fetch(url, {
               method: 'POST',
               headers: { 'Content-Type': 'application/json', ...headers },
               body: JSON.stringify(body)
           })
           return response.json()
       }
       
       async stream(url: string, body: any, headers?: Record<string, string>, onChunk: (chunk: string) => void) {
           // Streaming implementation
       }
   }
   ```

4. **Add Configuration Management**:
   ```typescript
   // src/config.ts
   export interface AIConfig {
       apiKey: string
       provider: AIProvider
       model: string
       endpoint?: string
       temperature?: number
       maxTokens?: number
       streamingEnabled?: boolean
   }
   
   export class ConfigManager {
       private configs: Map<AIProvider, AIConfig> = new Map()
       
       setProvider(provider: AIProvider, config: AIConfig): void {
           this.configs.set(provider, config)
       }
       
       getProvider(provider: AIProvider): AIConfig | undefined {
           return this.configs.get(provider)
       }
   }
   ```

5. **Create Provider Registry**:
   ```typescript
   // src/providers/registry.ts
   export interface AIProvider {
       name: string
       call(messages: AIMessage[], config: AIConfig): Promise<string>
       stream(messages: AIMessage[], config: AIConfig, onChunk: (chunk: string) => void): Promise<void>
   }
   
   export class ProviderRegistry {
       private providers: Map<string, AIProvider> = new Map()
       
       register(provider: AIProvider): void {
           this.providers.set(provider.name, provider)
       }
       
       get(name: string): AIProvider | undefined {
           return this.providers.get(name)
       }
   }
   ```

6. **Implement Standard Providers**:
   ```typescript
   // src/providers/openai.ts
   export class OpenAIProvider implements AIProvider {
       name = 'openai'
       
       async call(messages: AIMessage[], config: AIConfig): Promise<string> {
           // OpenAI API implementation
       }
       
       async stream(messages: AIMessage[], config: AIConfig, onChunk: (chunk: string) => void): Promise<void> {
           // OpenAI streaming implementation
       }
   }
   
   // Similar implementations for Anthropic, Google, etc.
   ```

7. **Add Context Enhancement Hook**:
   ```typescript
   // src/context.ts
   export interface ContextEnhancer {
       enhance(context: string, aiContext: AIContext): string
   }
   
   export class RulesContextEnhancer implements ContextEnhancer {
       enhance(context: string, aiContext: AIContext): string {
           // Implementation for rule-based context enhancement
           return context
       }
   }
   ```

8. **Update AIService**:
   ```typescript
   // src/aiService.ts
   export class AIService {
       private httpClient: HttpClient
       private configManager: ConfigManager
       private providerRegistry: ProviderRegistry
       private contextEnhancers: ContextEnhancer[] = []
       
       constructor(httpClient?: HttpClient) {
           this.httpClient = httpClient || new FetchHttpClient()
           this.configManager = new ConfigManager()
           this.providerRegistry = new ProviderRegistry()
           this.registerDefaultProviders()
       }
       
       addContextEnhancer(enhancer: ContextEnhancer): void {
           this.contextEnhancers.push(enhancer)
       }
       
       private buildSystemContext(context: AIContext): string {
           let systemPrompt = 'You are an AI coding assistant.'
           
           for (const enhancer of this.contextEnhancers) {
               systemPrompt = enhancer.enhance(systemPrompt, context)
           }
           
           return systemPrompt
       }
   }
   ```

9. **Add Environment Variable Support**:
   ```typescript
   // src/env.ts
   export function loadConfigFromEnv(): Partial<AIConfig> {
       return {
           apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
           provider: (process.env.AI_PROVIDER as AIProvider) || 'openai',
           model: process.env.AI_MODEL || 'gpt-4o'
       }
   }
   ```

10. **Add Tests**:
    ```typescript
    // tests/aiService.test.ts
    import { AIService, MockHttpClient } from '../src'
    
    describe('AIService', () => {
        it('should send message', async () => {
            const mockClient = new MockHttpClient()
            const service = new AIService(mockClient)
            service.setProvider('openai', { apiKey: 'test-key', provider: 'openai', model: 'gpt-4' })
            
            const response = await service.sendMessage('Hello')
            expect(response).toBeDefined()
        })
    })
    ```

**Dependencies**:
- `node-fetch` or equivalent
- `@cursor/types` (optional)
- Generic logger interface

**Migration Complexity**: Medium
**Estimated Effort**: 5-7 days
**Value**: Very High - multi-provider AI integration

---

### Phase 4: Complex Integrations (Week 7-8)

#### 4.1 Rules Service
**Target**: `@cursor/rules-service`

**Source**: `src/main/rules/ruleService.ts`

**Migration Steps**:

1. **Extract Rule Parser**:
   - Separate rule parsing logic
   - Create rule validation system
   - Add rule DSL documentation

2. **Create File Watcher**:
   ```typescript
   // src/watcher.ts
   export interface RuleWatcher {
       watch(directory: string, callback: (filePath: string) => void): void
       unwatch(directory: string): void
   }
   
   export class FSWatcher implements RuleWatcher {
       // Implementation using chokidar or fs.watch
   }
   ```

3. **Add Rule Formats**:
   ```typescript
   // src/formats/index.ts
   export interface RuleFormat {
       name: string
       parse(content: string): Rule[]
       serialize(rules: Rule[]): string
       validate(content: string): ValidationResult
   }
   
   export class JSONRuleFormat implements RuleFormat {
       // JSON format implementation
   }
   
   export class YAMLRuleFormat implements RuleFormat {
       // YAML format implementation
   }
   
   export class MarkdownRuleFormat implements RuleFormat {
       // Markdown format implementation (like Cursor's .cursor/rules/)
   }
   ```

**Dependencies**:
- `@cursor/types` (optional)
- YAML parser (for YAML format)
- File watcher library

**Migration Complexity**: Medium
**Estimated Effort**: 4-5 days
**Value**: High - code quality enforcement

---

#### 4.2 Agent Execution Service
**Target**: `@cursor/agent-exec`

**Source**: `src/main/agentExecService/agentExecService.ts`

**Migration Steps**:

1. **Create Sandbox Abstraction**:
   ```typescript
   // src/sandbox.ts
   export interface ExecutionSandbox {
       execute(command: string, args: string[], options: ExecutionOptions): Promise<ExecutionResult>
       cleanup(): Promise<void>
   }
   
   export class ProcessSandbox implements ExecutionSandbox {
       // Implementation using child_process
   }
   
   export class DockerSandbox implements ExecutionSandbox {
       // Implementation using Docker containers
   }
   
   export class WebWorkerSandbox implements ExecutionSandbox {
       // Implementation using Web Workers
   }
   ```

2. **Add Security Layer**:
   ```typescript
   // src/security.ts
   export interface SecurityPolicy {
       validateCommand(command: string, args: string[]): boolean
       validatePath(path: string): boolean
       validateEnv(env: Record<string, string>): boolean
   }
   
   export class StrictSecurityPolicy implements SecurityPolicy {
       // Implementation with strict validation
   }
   ```

3. **Create Tool Registry**:
   ```typescript
   // src/tools/registry.ts
   export interface Tool {
       name: string
       description: string
       execute(params: any): Promise<any>
       schema: any // JSON schema for parameters
   }
   
   export class ToolRegistry {
       private tools: Map<string, Tool> = new Map()
       
       register(tool: Tool): void {
           this.tools.set(tool.name, tool)
       }
       
       async execute(name: string, params: any): Promise<any> {
           const tool = this.tools.get(name)
           if (!tool) throw new Error(`Tool not found: ${name}`)
           return tool.execute(params)
       }
   }
   ```

**Dependencies**:
- Node.js child_process
- Docker (optional, for Docker sandbox)
- `@cursor/types` (optional)

**Migration Complexity**: High
**Estimated Effort**: 6-8 days
**Value**: Medium - specific to agent systems

---

## Integration Strategy

### Usage Examples

#### Using File Service
```typescript
import { createFileService, ConsoleLogger } from '@cursor/file-service'

const fileService = createFileService({
    cachePath: './.file-cache',
    defaultExcludePatterns: ['node_modules', '.git']
}, new ConsoleLogger())

await fileService.indexDirectory('./my-project')
const results = await fileService.search({
    query: 'function',
    caseSensitive: false
})
```

#### Using React CodeMirror
```typescript
import { ReactCodeMirror } from '@cursor/react-codemirror'
import { cursorDark } from '@cursor/react-codemirror/theme'

function MyEditor() {
    const [code, setCode] = useState('Hello World')
    
    return (
        <ReactCodeMirror
            value={code}
            onChange={setCode}
            theme={cursorDark}
            height="500px"
        />
    )
}
```

#### Using AI Service
```typescript
import { AIService, FetchHttpClient } from '@cursor/ai-service'

const aiService = new AIService(new FetchHttpClient())
aiService.setProvider('openai', {
    apiKey: process.env.OPENAI_API_KEY,
    provider: 'openai',
    model: 'gpt-4o'
})

const response = await aiService.sendMessage('Explain this code', {
    files: ['src/main.ts'],
    projectPath: './my-project'
})
```

#### Using Automations Engine
```typescript
import { AutomationEngine, MemoryStorage } from '@cursor/automations'

const engine = new AutomationEngine(new MemoryStorage())

const workflow = engine.createWorkflow(
    'Run Tests on Save',
    'Run tests when test files are saved',
    [{
        id: 'file-save-trigger',
        type: 'file_save',
        config: { pattern: '**/*.test.ts' },
        enabled: true
    }],
    [{
        id: 'run-tests',
        type: 'command',
        config: { command: 'npm', args: ['test'] },
        enabled: true
    }]
)

await engine.executeWorkflow(workflow.id, workflow.triggers[0])
```

## Testing Strategy

### Unit Testing
- Jest for unit tests
- Mock external dependencies
- Test edge cases and error handling

### Integration Testing
- Test service interactions
- Use test doubles for external services
- Test with real file systems when possible

### End-to-End Testing
- Create example applications
- Test real-world usage scenarios
- Performance testing for large codebases

## Documentation Requirements

### Each Package Must Include:
1. README with installation instructions
2. API documentation (JSDoc or TypeDoc)
3. Usage examples
4. Migration guide from Cursor
5. Changelog
6. Contributing guidelines

### Documentation Structure:
```
package/
├── README.md
├── docs/
│   ├── installation.md
│   ├── api.md
│   ├── examples.md
│   └── migration.md
├── src/
└── tests/
```

## Versioning Strategy

### Semantic Versioning
- Major version for breaking changes
- Minor version for new features
- Patch version for bug fixes

### Compatibility Matrix
| Package | Cursor Version | Notes |
|---------|---------------|-------|
| @cursor/types | 3.9.16 | Initial extraction |
| @cursor/utils | 3.9.16 | Initial extraction |
| @cursor/file-service | 3.9.16 | Core features |
| @cursor/react-codemirror | 3.9.16 | Basic editor |

## Rollout Plan

### Internal Testing (Week 1-2)
- Use packages in Cursor development
- Identify issues and fix
- Gather feedback from team

### Beta Release (Week 3-4)
- Release as beta versions
- Invite external testers
- Collect feedback and iterate

### Stable Release (Week 5-6)
- Release stable versions
- Publish to npm
- Create migration guides

### Maintenance (Ongoing)
- Bug fixes and updates
- Feature requests
- Community support

## Risk Mitigation

### Technical Risks
- **Dependency Hell**: Use peer dependencies where possible
- **Breaking Changes**: Maintain backward compatibility when possible
- **Performance Issues**: Profile and optimize before release

### Process Risks
- **Scope Creep**: Focus on core features first
- **Resource Constraints**: Prioritize high-value components
- **Quality Issues**: Comprehensive testing before release

## Success Metrics

### Adoption Metrics
- Number of packages published
- Download counts from npm
- GitHub stars and forks
- Community contributions

### Quality Metrics
- Test coverage percentage
- Number of open issues
- Resolution time for issues
- User satisfaction scores

## Conclusion

This migration strategy provides a phased approach to extracting and packaging Cursor's reusable components. Starting with low-complexity, high-value components like the File Service and React CodeMirror will provide immediate benefits while building toward more complex integrations.

The key to success is:
1. Maintaining clear interfaces between components
2. Providing comprehensive documentation
3. Ensuring backward compatibility
4. Gathering and acting on user feedback

By following this strategy, we can create a set of high-quality, reusable packages that benefit both Cursor and the broader development community.