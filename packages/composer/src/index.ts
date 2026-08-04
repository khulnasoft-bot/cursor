/**
 * @cursor/composer
 * Multi-file editing orchestration engine for coordinated changes across files
 */

// Main composer service
export {
    ComposerService,
    getComposerService,
    destroyComposerService,
    createComposerService
} from './composerService'

// Types
export type {
    ChangeType,
    ExecutionStatus,
    FileChange,
    ComposerRequest,
    ComposerResult,
    ComposerExecution,
    ComposerConfig
} from './types'

// Diff generator
export {
    DiffGenerator,
    getDiffGenerator,
    destroyDiffGenerator,
    createDiffGenerator
} from './diffGenerator'

export type {
    DiffHunk,
    FileDiff,
    MultiFileDiff
} from './diffGenerator'

// Change orchestrator
export {
    ChangeOrchestrator,
    getChangeOrchestrator,
    destroyChangeOrchestrator,
    createChangeOrchestrator
} from './changeOrchestrator'

export type {
    OrchestrationPlan,
    OrchestrationStep
} from './changeOrchestrator'

// Context analyzer
export {
    ContextAnalyzer,
    getContextAnalyzer,
    destroyContextAnalyzer,
    createContextAnalyzer
} from './contextAnalyzer'

export type {
    FileContext,
    SymbolInfo,
    RelationshipGraph
} from './contextAnalyzer'

// Logger
export {
    Logger,
    LogLevel,
    ConsoleLogger,
    NoOpLogger
} from './logger'