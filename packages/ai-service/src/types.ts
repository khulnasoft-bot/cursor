/**
 * AI Service Type Definitions
 * Core types for the multi-provider AI service
 */

/**
 * AI message role
 */
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool'

/**
 * AI message interface
 */
export interface AIMessage {
    role: MessageRole
    content: string
    toolCalls?: ToolCall[]
    toolCallId?: string
}

/**
 * Tool call interface
 */
export interface ToolCall {
    id: string
    type: string
    function: {
        name: string
        arguments: string
    }
}

/**
 * Tool definition
 */
export interface Tool {
    name: string
    description: string
    parameters: any
}

/**
 * AI context for prompts
 */
export interface AIContext {
    files: string[]
    projectPath?: string
    language?: string
    symbols?: any[]
}

/**
 * AI stream chunk
 */
export interface AIStreamChunk {
    content: string
    done: boolean
    toolCalls?: ToolCall[]
}

/**
 * AI provider types
 */
export type AIProvider = 'openai' | 'anthropic' | 'google' | 'custom' | 'cursor'

/**
 * AI configuration
 */
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

/**
 * Model capabilities
 */
export interface ModelCapabilities {
    streaming: boolean
    toolCalling: boolean
    maxContextTokens: number
    supportsImages: boolean
    supportsSystemMessages: boolean
    costPer1kTokens: number
}

/**
 * Model configuration
 */
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

/**
 * Provider configuration
 */
export interface ProviderConfig {
    provider: AIProvider
    apiKey?: string
    endpoint?: string
    models: ModelConfig[]
}