/**
 * Service Interface Definitions
 * Common interfaces for Cursor services to enable dependency injection and testing
 */

/**
 * Logger interface for service logging
 */
export interface Logger {
    info(message: string, ...args: any[]): void
    warn(message: string, ...args: any[]): void
    error(message: string, ...args: any[]): void
    debug?(message: string, ...args: any[]): void
}

/**
 * File Service Interface
 */
export interface FileIndex {
    path: string
    content: string
    lastModified: number
    size: number
    language: string
}

export interface IndexingOptions {
    includePatterns?: string[]
    excludePatterns?: string[]
    maxFileSize?: number
}

export interface SearchOptions {
    query: string
    caseSensitive?: boolean
    regex?: boolean
    fileTypes?: string[]
}

export interface SearchResult {
    path: string
    matches: Array<{
        line: number
        content: string
        startIndex: number
        endIndex: number
    }>
}

export interface IFileService {
    indexDirectory(directoryPath: string, options?: IndexingOptions): Promise<void>
    search(options: SearchOptions): Promise<SearchResult[]>
    getFileContent(filePath: string): string | null
    updateFile(filePath: string): Promise<void>
    removeFile(filePath: string): Promise<void>
    clearIndex(): void
    getIndexStats(): {
        totalFiles: number
        totalSize: number
        languages: Record<string, number>
    }
}

/**
 * AI Service Interface
 */
export interface AIMessage {
    role: 'system' | 'user' | 'assistant' | 'tool'
    content: string
    toolCalls?: ToolCall[]
    toolCallId?: string
}

export interface ToolCall {
    id: string
    type: string
    function: {
        name: string
        arguments: string
    }
}

export interface Tool {
    name: string
    description: string
    parameters: any
}

export interface AIContext {
    files: string[]
    projectPath?: string
    language?: string
    symbols?: any[]
}

export interface AIStreamChunk {
    content: string
    done: boolean
    toolCalls?: ToolCall[]
}

export interface AIConfig {
    apiKey?: string
    model?: string
    provider?: AIProvider
    endpoint?: string
    temperature?: number
    maxTokens?: number
    streamingEnabled?: boolean
    fallbackEnabled?: boolean
    fallbackProvider?: AIProvider
}

export type AIProvider = 'openai' | 'anthropic' | 'google' | 'custom' | 'cursor'

export interface ModelCapabilities {
    streaming: boolean
    toolCalling: boolean
    maxContextTokens: number
    supportsImages: boolean
    supportsSystemMessages: boolean
    costPer1kTokens: number
}

export interface ModelConfig {
    id: string
    name: string
    provider: AIProvider
    capabilities: ModelCapabilities
    defaultParams: {
        temperature?: number
        maxTokens?: number
        topP?: number
    }
}

export interface IAIService {
    sendMessage(message: string, context?: AIContext, conversationId?: string): Promise<string>
    sendMessageStream(
        message: string,
        context?: AIContext,
        conversationId?: string,
        onChunk?: (chunk: AIStreamChunk) => void
    ): Promise<string>
    updateConfig(config: Partial<AIConfig>): void
    setProvider(provider: AIProvider, apiKey?: string, endpoint?: string): void
    setModel(modelId: string): void
    getAvailableModels(): ModelConfig[]
    getAvailableProviders(): AIProvider[]
    getModelCapabilities(modelId: string): ModelCapabilities | undefined
    getConfig(): AIConfig
    registerTool(tool: Tool): void
    unregisterTool(toolName: string): void
    getTools(): Tool[]
    clearConversation(conversationId?: string): void
    getConversationHistory(conversationId?: string): AIMessage[]
}

/**
 * Rules Service Interface
 */
export interface Rule {
    id: string
    name: string
    description: string
    category: RuleCategory
    severity: RuleSeverity
    patterns: string[]
    exceptions: string[]
    fix?: string
    enabled: boolean
}

export type RuleCategory = 'style' | 'naming' | 'architecture' | 'security' | 'performance' | 'testing' | 'custom'

export type RuleSeverity = 'error' | 'warning' | 'suggestion' | 'info'

export interface RuleSet {
    id: string
    name: string
    description: string
    rules: Rule[]
    version: string
}

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
}

export interface RuleApplicationResult {
    violations: RuleViolation[]
    appliedRules: number
    skippedRules: number
    errors: string[]
}

export interface IRuleService {
    initialize(projectPath: string): Promise<void>
    applyRulesToCode(code: string, filePath: string): Promise<RuleApplicationResult>
    applyRulesToAIContext(context: string, filePath: string): string
    getActiveRules(): Rule[]
    getRulesByCategory(category: RuleCategory): Rule[]
    getRulesBySeverity(severity: RuleSeverity): Rule[]
    getRuleSet(name: string): RuleSet | undefined
    getAllRuleSets(): RuleSet[]
    createRuleSet(ruleSet: RuleSet, projectPath: string): Promise<void>
    updateRuleSet(name: string, updates: Partial<RuleSet>, projectPath: string): Promise<void>
    deleteRuleSet(name: string, projectPath: string): Promise<void>
    enableRule(ruleId: string, projectPath: string): Promise<void>
    disableRule(ruleId: string, projectPath: string): Promise<void>
    getStatistics(): {
        totalRuleSets: number
        totalRules: number
        activeRules: number
        rulesByCategory: Record<RuleCategory, number>
        rulesBySeverity: Record<RuleSeverity, number>
    }
    validateRule(rule: Rule): { valid: boolean; error?: string }
    exportRules(): string
    importRules(json: string, projectPath: string): Promise<void>
}

/**
 * Automations Service Interface
 */
export interface AutomationTrigger {
    id: string
    type: AutomationTriggerType
    config: Record<string, any>
    enabled: boolean
}

export type AutomationTriggerType = 'file_save' | 'file_change' | 'git_commit' | 'time' | 'manual' | 'event'

export interface AutomationAction {
    id: string
    type: AutomationActionType
    config: Record<string, any>
    enabled: boolean
}

export type AutomationActionType = 'command' | 'script' | 'ai_task' | 'notification' | 'file_operation' | 'git_operation'

export interface AutomationWorkflow {
    id: string
    name: string
    description: string
    triggers: AutomationTrigger[]
    actions: AutomationAction[]
    enabled: boolean
    createdAt: Date
    updatedAt: Date
    lastRun?: Date
    runCount: number
}

export interface AutomationExecution {
    id: string
    workflowId: string
    trigger: AutomationTrigger
    status: ExecutionStatus
    startTime: Date
    endTime?: Date
    results: Array<{
        actionId: string
        success: boolean
        output?: string
        error?: string
        duration?: number
    }>
    error?: string
    context?: Record<string, any>
}

export type ExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface IAutomationService {
    activate(): void
    deactivate(): void
    isActive(): boolean
    createWorkflow(
        name: string,
        description: string,
        triggers: AutomationTrigger[],
        actions: AutomationAction[]
    ): AutomationWorkflow
    updateWorkflow(
        workflowId: string,
        updates: Partial<Omit<AutomationWorkflow, 'id' | 'createdAt' | 'runCount'>>
    ): AutomationWorkflow | null
    deleteWorkflow(workflowId: string): boolean
    enableWorkflow(workflowId: string): boolean
    disableWorkflow(workflowId: string): boolean
    getWorkflow(workflowId: string): AutomationWorkflow | undefined
    getWorkflows(): AutomationWorkflow[]
    getEnabledWorkflows(): AutomationWorkflow[]
    getWorkflowsByTrigger(triggerType: AutomationTriggerType): AutomationWorkflow[]
    executeWorkflow(
        workflowId: string,
        trigger: AutomationTrigger,
        context?: Record<string, any>
    ): Promise<AutomationExecution>
    getExecution(executionId: string): AutomationExecution | undefined
    getExecutions(): AutomationExecution[]
    cancelExecution(executionId: string): Promise<void>
}

/**
 * Agent Execution Service Interface
 */
export interface AgentTask {
    id: string
    command: string
    args: string[]
    cwd?: string
    env?: Record<string, string>
    status: TaskStatus
    output: string
    error?: string
    startTime?: Date
    endTime?: Date
    toolName?: string
    toolParams?: Record<string, any>
}

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface IAgentExecService {
    executeAgent(command: string, args?: string[], cwd?: string, env?: Record<string, string>): Promise<string>
    executeAgentScript(scriptPath: string, args?: string[], cwd?: string): Promise<string>
    executeAgentCommand(commandString: string, cwd?: string): Promise<string>
    getTask(taskId: string): AgentTask | undefined
    getTasks(): AgentTask[]
    getRunningTasks(): AgentTask[]
    getCompletedTasks(): AgentTask[]
    getFailedTasks(): AgentTask[]
    stopTask(taskId: string): Promise<void>
    stopAllTasks(): Promise<void>
    clearTask(taskId: string): void
    clearCompletedTasks(): void
    clearFailedTasks(): void
    clearAllTasks(): void
    getTaskOutput(taskId: string): string | null
    getTaskError(taskId: string): string | null
    executeTool(toolName: string, params: Record<string, any>): Promise<string>
    getAvailableTools(): Tool[]
    getTool(toolName: string): Tool | undefined
}

/**
 * Composer Service Interface
 */
export interface FileChange {
    filePath: string
    originalContent: string
    proposedContent: string
    changeType: 'insert' | 'delete' | 'replace' | 'move'
    lineRange: { start: number; end: number }
    description: string
    dependencies: string[]
    dependents: string[]
}

export interface ComposerRequest {
    prompt: string
    context: {
        projectPath: string
        files: Map<string, string>
        language?: string
    }
    constraints?: {
        maxFiles?: number
        allowedPaths?: string[]
        forbiddenPaths?: string[]
    }
}

export interface ComposerResult {
    changes: FileChange[]
    summary: string
    estimatedTime: number
    dependencies: Map<string, string[]>
    executionOrder: string[]
}

export interface ComposerExecution {
    requestId: string
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled'
    changes: FileChange[]
    executedChanges: string[]
    failedChanges: string[]
    currentStep: number
    totalSteps: number
    startTime: Date
    endTime?: Date
    error?: string
    appliedChanges: Map<string, string>
    rollbackData?: Map<string, string>
    canRollback: boolean
}

export interface IComposerService {
    planChanges(request: ComposerRequest): Promise<ComposerResult>
    executeChanges(result: ComposerResult): Promise<ComposerExecution>
    getExecution(requestId: string): ComposerExecution | undefined
    rollbackExecution(requestId: string): Promise<boolean>
    validateChanges(changes: FileChange[]): { valid: boolean; errors: string[] }
}