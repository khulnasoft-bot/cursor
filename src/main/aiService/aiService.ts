/**
 * Cursor AI Service
 * Enhanced AI service with multi-model support, streaming, context management, and tool calling
 */

import log from 'electron-log'
import { getRuleService } from '../rules'
import nodeFetch from 'node-fetch'

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

export interface ProviderConfig {
    provider: AIProvider
    apiKey?: string
    endpoint?: string
    models: ModelConfig[]
}

class AIService {
    private config: AIConfig = {
        streamingEnabled: true,
        temperature: 0.7,
        maxTokens: 4096,
        provider: 'openai',
        fallbackEnabled: true
    }
    private conversationHistory: Map<string, AIMessage[]> = new Map()
    private availableTools: Tool[] = []
    private providerConfigs: Map<AIProvider, ProviderConfig> = new Map()
    private modelRegistry: Map<string, ModelConfig> = new Map()
    private currentModel: string = 'gpt-4o'

    constructor() {
        this.initializeModelRegistry()
        this.loadConfig()
    }

    private initializeModelRegistry(): void {
        // OpenAI Models
        this.registerModel({
            id: 'gpt-4o',
            name: 'GPT-4o',
            provider: 'openai',
            capabilities: {
                streaming: true,
                toolCalling: true,
                maxContextTokens: 128000,
                supportsImages: true,
                supportsSystemMessages: true,
                costPer1kTokens: 0.005
            },
            defaultParams: {
                temperature: 0.7,
                maxTokens: 4096
            }
        })

        this.registerModel({
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo',
            provider: 'openai',
            capabilities: {
                streaming: true,
                toolCalling: true,
                maxContextTokens: 128000,
                supportsImages: true,
                supportsSystemMessages: true,
                costPer1kTokens: 0.01
            },
            defaultParams: {
                temperature: 0.7,
                maxTokens: 4096
            }
        })

        this.registerModel({
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            provider: 'openai',
            capabilities: {
                streaming: true,
                toolCalling: true,
                maxContextTokens: 16385,
                supportsImages: false,
                supportsSystemMessages: true,
                costPer1kTokens: 0.0015
            },
            defaultParams: {
                temperature: 0.7,
                maxTokens: 4096
            }
        })

        // Anthropic Models
        this.registerModel({
            id: 'claude-3-5-sonnet',
            name: 'Claude 3.5 Sonnet',
            provider: 'anthropic',
            capabilities: {
                streaming: true,
                toolCalling: true,
                maxContextTokens: 200000,
                supportsImages: true,
                supportsSystemMessages: true,
                costPer1kTokens: 0.003
            },
            defaultParams: {
                temperature: 0.7,
                maxTokens: 4096
            }
        })

        this.registerModel({
            id: 'claude-3-opus',
            name: 'Claude 3 Opus',
            provider: 'anthropic',
            capabilities: {
                streaming: true,
                toolCalling: true,
                maxContextTokens: 200000,
                supportsImages: true,
                supportsSystemMessages: true,
                costPer1kTokens: 0.015
            },
            defaultParams: {
                temperature: 0.7,
                maxTokens: 4096
            }
        })

        // Google Models
        this.registerModel({
            id: 'gemini-1.5-pro',
            name: 'Gemini 1.5 Pro',
            provider: 'google',
            capabilities: {
                streaming: true,
                toolCalling: true,
                maxContextTokens: 1000000,
                supportsImages: true,
                supportsSystemMessages: true,
                costPer1kTokens: 0.0035
            },
            defaultParams: {
                temperature: 0.7,
                maxTokens: 8192
            }
        })

        log.info(`Initialized model registry with ${this.modelRegistry.size} models`)
    }

    private registerModel(model: ModelConfig): void {
        this.modelRegistry.set(model.id, model)
    }

    private loadConfig(): void {
        // Load configuration from product config or settings
        // This will be integrated with the productConfig module
        try {
            // For now, use default config
            log.info('AI Service loaded with default configuration')
        } catch (error) {
            log.error('Failed to load AI config:', error)
        }
    }

    updateConfig(config: Partial<AIConfig>): void {
        this.config = { ...this.config, ...config }
        if (config.model) {
            this.currentModel = config.model
        }
        log.info('AI Service configuration updated')
    }

    setProvider(provider: AIProvider, apiKey?: string, endpoint?: string): void {
        const providerConfig: ProviderConfig = {
            provider,
            apiKey,
            endpoint,
            models: Array.from(this.modelRegistry.values()).filter(m => m.provider === provider)
        }
        this.providerConfigs.set(provider, providerConfig)
        this.config.provider = provider
        log.info(`Set AI provider to: ${provider}`)
    }

    setModel(modelId: string): void {
        const model = this.modelRegistry.get(modelId)
        if (model) {
            this.currentModel = modelId
            this.config.provider = model.provider
            log.info(`Set AI model to: ${model.name} (${modelId})`)
        } else {
            log.error(`Model not found: ${modelId}`)
        }
    }

    getAvailableModels(): ModelConfig[] {
        return Array.from(this.modelRegistry.values())
    }

    getAvailableProviders(): AIProvider[] {
        return Array.from(new Set(Array.from(this.modelRegistry.values()).map(m => m.provider)))
    }

    getModelCapabilities(modelId: string): ModelCapabilities | undefined {
        return this.modelRegistry.get(modelId)?.capabilities
    }

    getConfig(): AIConfig {
        return { ...this.config }
    }

    registerTool(tool: Tool): void {
        this.availableTools.push(tool)
        log.info(`Registered AI tool: ${tool.name}`)
    }

    unregisterTool(toolName: string): void {
        this.availableTools = this.availableTools.filter(t => t.name !== toolName)
        log.info(`Unregistered AI tool: ${toolName}`)
    }

    getTools(): Tool[] {
        return [...this.availableTools]
    }

    async sendMessage(
        message: string,
        context?: AIContext,
        conversationId?: string
    ): Promise<string> {
        const messages = this.getConversationMessages(conversationId)

        // Add system context if available
        if (context) {
            const systemMessage = this.buildSystemContext(context)
            if (messages.length === 0 || messages[0].role !== 'system') {
                messages.unshift(systemMessage)
            }
        }

        // Add user message
        messages.push({
            role: 'user',
            content: message
        })

        try {
            const response = await this.callAI(messages)

            // Add assistant response to history
            messages.push({
                role: 'assistant',
                content: response
            })

            this.saveConversationMessages(conversationId, messages)
            return response
        } catch (error) {
            log.error('AI message failed:', error)
            throw error
        }
    }

    async sendMessageStream(
        message: string,
        context?: AIContext,
        conversationId?: string,
        onChunk?: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        if (!this.config.streamingEnabled) {
            return this.sendMessage(message, context, conversationId)
        }

        const messages = this.getConversationMessages(conversationId)

        if (context) {
            const systemMessage = this.buildSystemContext(context)
            if (messages.length === 0 || messages[0].role !== 'system') {
                messages.unshift(systemMessage)
            }
        }

        messages.push({
            role: 'user',
            content: message
        })

        try {
            let fullResponse = ''

            await this.callAIStream(messages, (chunk) => {
                if (onChunk) {
                    onChunk(chunk)
                }
                fullResponse += chunk.content
            })

            messages.push({
                role: 'assistant',
                content: fullResponse
            })

            this.saveConversationMessages(conversationId, messages)
            return fullResponse
        } catch (error) {
            log.error('AI streaming message failed:', error)
            throw error
        }
    }

    private buildSystemContext(context: AIContext): AIMessage {
        let systemPrompt = 'You are Cursor, an AI coding assistant. '

        if (context.files && context.files.length > 0) {
            systemPrompt += `The user is working with the following files: ${context.files.join(', ')}. `
        }

        if (context.projectPath) {
            systemPrompt += `Project path: ${context.projectPath}. `
        }

        if (context.language) {
            systemPrompt += `Primary language: ${context.language}. `
        }

        // Apply team rules to context if available
        if (context.projectPath && context.files && context.files.length > 0) {
            try {
                const ruleService = getRuleService()
                const firstFile = context.files[0]
                const enhancedContext = ruleService.applyRulesToAIContext(systemPrompt, firstFile)
                systemPrompt = enhancedContext
            } catch (error) {
                log.warn('Failed to apply rules to AI context:', error)
            }
        }

        return {
            role: 'system',
            content: systemPrompt
        }
    }

    private async callAI(messages: AIMessage[]): Promise<string> {
        const provider = this.config.provider || 'openai'
        const model = this.currentModel

        log.info(`Calling AI with provider: ${provider}, model: ${model}, messages: ${messages.length}`)

        try {
            const response = await this.callProvider(provider, model, messages, false)
            return response
        } catch (error) {
            if (this.config.fallbackEnabled && this.config.fallbackProvider) {
                log.warn(`Primary provider ${provider} failed, trying fallback: ${this.config.fallbackProvider}`)
                try {
                    return await this.callProvider(this.config.fallbackProvider, model, messages, false)
                } catch (fallbackError) {
                    log.error('Fallback provider also failed:', fallbackError)
                    throw error
                }
            }
            throw error
        }
    }

    private async callAIStream(
        messages: AIMessage[],
        onChunk: (chunk: AIStreamChunk) => void
    ): Promise<void> {
        const provider = this.config.provider || 'openai'
        const model = this.currentModel

        log.info(`Calling AI stream with provider: ${provider}, model: ${model}, messages: ${messages.length}`)

        try {
            await this.callProvider(provider, model, messages, true, onChunk)
        } catch (error) {
            if (this.config.fallbackEnabled && this.config.fallbackProvider) {
                log.warn(`Primary provider ${provider} failed, trying fallback: ${this.config.fallbackProvider}`)
                try {
                    await this.callProvider(this.config.fallbackProvider, model, messages, true, onChunk)
                } catch (fallbackError) {
                    log.error('Fallback provider also failed:', fallbackError)
                    throw error
                }
            }
            throw error
        }
    }

    private async callProvider(
        provider: AIProvider,
        model: string,
        messages: AIMessage[],
        stream: boolean,
        onChunk?: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        const providerConfig = this.providerConfigs.get(provider)
        const apiKey = providerConfig?.apiKey || this.config.apiKey
        const endpoint = providerConfig?.endpoint || this.getDefaultEndpoint(provider)

        if (!apiKey) {
            throw new Error(`No API key configured for provider: ${provider}`)
        }

        switch (provider) {
            case 'openai':
                return this.callOpenAI(apiKey, model, messages, stream, onChunk)
            case 'anthropic':
                return this.callAnthropic(apiKey, model, messages, stream, onChunk)
            case 'google':
                return this.callGoogle(apiKey, model, messages, stream, onChunk)
            case 'custom':
                return this.callCustom(endpoint, apiKey, model, messages, stream, onChunk)
            default:
                throw new Error(`Unsupported provider: ${provider}`)
        }
    }

    private getDefaultEndpoint(provider: AIProvider): string {
        switch (provider) {
            case 'openai':
                return 'https://api.openai.com/v1'
            case 'anthropic':
                return 'https://api.anthropic.com/v1'
            case 'google':
                return 'https://generativelanguage.googleapis.com/v1beta'
            default:
                return ''
        }
    }

    private async callOpenAI(
        apiKey: string,
        model: string,
        messages: AIMessage[],
        stream: boolean,
        onChunk?: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        const endpoint = this.config.endpoint || this.getDefaultEndpoint('openai')
        const url = stream ? `${endpoint}/chat/completions` : `${endpoint}/chat/completions`

        const response = await nodeFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`OpenAI API error: ${response.status} - ${error}`)
        }

        if (stream && onChunk) {
            return this.handleOpenAIStream(response, onChunk)
        } else {
            const data = await response.json() as any
            return data.choices[0].message.content
        }
    }

    private async handleOpenAIStream(
        response: any,
        onChunk: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        let fullContent = ''
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    if (data === '[DONE]') continue

                    try {
                        const parsed = JSON.parse(data)
                        const content = parsed.choices[0]?.delta?.content || ''
                        if (content) {
                            fullContent += content
                            onChunk({ content, done: false })
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onChunk({ content: '', done: true })
        return fullContent
    }

    private async callAnthropic(
        apiKey: string,
        model: string,
        messages: AIMessage[],
        stream: boolean,
        onChunk?: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        const endpoint = this.config.endpoint || this.getDefaultEndpoint('anthropic')
        const url = `${endpoint}/messages`

        // Convert messages to Anthropic format
        const systemMessages = messages.filter(m => m.role === 'system')
        const chatMessages = messages.filter(m => m.role !== 'system')

        const response = await nodeFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                system: systemMessages.map(m => m.content).join('\n'),
                messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
                max_tokens: this.config.maxTokens || 4096,
                temperature: this.config.temperature,
                stream
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Anthropic API error: ${response.status} - ${error}`)
        }

        if (stream && onChunk) {
            return this.handleAnthropicStream(response, onChunk)
        } else {
            const data = await response.json() as any
            return data.content[0].text
        }
    }

    private async handleAnthropicStream(
        response: any,
        onChunk: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        let fullContent = ''
        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value)
            const lines = chunk.split('\n').filter(line => line.trim() !== '')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6)
                    try {
                        const parsed = JSON.parse(data)
                        if (parsed.type === 'content_block_delta') {
                            const content = parsed.delta?.text || ''
                            if (content) {
                                fullContent += content
                                onChunk({ content, done: false })
                            }
                        }
                    } catch (e) {
                        // Skip invalid JSON
                    }
                }
            }
        }

        onChunk({ content: '', done: true })
        return fullContent
    }

    private async callGoogle(
        apiKey: string,
        model: string,
        messages: AIMessage[],
        stream: boolean,
        onChunk?: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        const endpoint = this.config.endpoint || this.getDefaultEndpoint('google')
        const url = `${endpoint}/models/${model}:generateContent?key=${apiKey}`

        // Convert messages to Gemini format
        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))

        const response = await nodeFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    temperature: this.config.temperature,
                    maxOutputTokens: this.config.maxTokens
                }
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Google API error: ${response.status} - ${error}`)
        }

        const data = await response.json() as any
        return data.candidates[0].content.parts[0].text
    }

    private async callCustom(
        endpoint: string,
        apiKey: string,
        model: string,
        messages: AIMessage[],
        stream: boolean,
        onChunk?: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        // Custom endpoint - assumes OpenAI-compatible API
        const url = `${endpoint}/chat/completions`

        const response = await nodeFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: messages.map(m => ({ role: m.role, content: m.content })),
                temperature: this.config.temperature,
                max_tokens: this.config.maxTokens,
                stream
            })
        })

        if (!response.ok) {
            const error = await response.text()
            throw new Error(`Custom API error: ${response.status} - ${error}`)
        }

        if (stream && onChunk) {
            return this.handleOpenAIStream(response, onChunk)
        } else {
            const data = await response.json() as any
            return data.choices[0].message.content
        }
    }

    private getConversationMessages(conversationId?: string): AIMessage[] {
        const id = conversationId || 'default'
        return this.conversationHistory.get(id) || []
    }

    private saveConversationMessages(conversationId: string | undefined, messages: AIMessage[]): void {
        const id = conversationId || 'default'
        this.conversationHistory.set(id, messages)
    }

    clearConversation(conversationId?: string): void {
        if (conversationId) {
            this.conversationHistory.delete(conversationId)
        } else {
            this.conversationHistory.clear()
        }
        log.info(`Cleared conversation: ${conversationId || 'all'}`)
    }

    getConversationHistory(conversationId?: string): AIMessage[] {
        return this.getConversationMessages(conversationId)
    }

    async callTool(toolName: string, parameters: any): Promise<any> {
        log.info(`Calling AI tool: ${toolName}`, parameters)

        const tool = this.availableTools.find(t => t.name === toolName)
        if (!tool) {
            throw new Error(`Tool not found: ${toolName}`)
        }

        // Tool calling logic will be implemented
        // For now, return placeholder
        return { result: 'Tool call placeholder' }
    }

    isModelAvailable(modelId: string): boolean {
        return this.modelRegistry.has(modelId)
    }

    isProviderAvailable(provider: AIProvider): boolean {
        return this.providerConfigs.has(provider) || !!this.config.apiKey
    }
}

// Singleton instance
let aiService: AIService | null = null

export function getAIService(): AIService {
    if (!aiService) {
        aiService = new AIService()
    }
    return aiService
}

export function destroyAIService() {
    if (aiService) {
        aiService.clearConversation()
        aiService = null
    }
}
