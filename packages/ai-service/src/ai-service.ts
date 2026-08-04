/**
 * Cursor AI Service
 * Enhanced AI service with multi-model support, streaming, context management, and tool calling
 * Extracted and adapted from Cursor's AI service
 */

import {
    AIMessage,
    AIContext,
    AIStreamChunk,
    AIConfig,
    AIProvider,
    Tool,
    ModelConfig,
    ModelCapabilities
} from './types'
import { HttpClient, FetchHttpClient, HttpError } from './http-client'
import { ProviderRegistry } from './provider-registry'

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
    private providerConfigs: Map<AIProvider, any> = new Map()
    private providerRegistry: ProviderRegistry
    private currentModel: string = 'gpt-4o'
    private httpClient: HttpClient

    constructor(httpClient?: HttpClient) {
        this.httpClient = httpClient || new FetchHttpClient()
        this.providerRegistry = new ProviderRegistry()
    }

    updateConfig(config: Partial<AIConfig>): void {
        this.config = { ...this.config, ...config }
        if (config.model) {
            this.currentModel = config.model
        }
    }

    setProvider(provider: AIProvider, apiKey?: string, endpoint?: string): void {
        const providerConfig: any = {
            provider,
            apiKey,
            endpoint,
            models: this.providerRegistry.getModelsByProvider(provider)
        }
        this.providerConfigs.set(provider, providerConfig)
        this.config.provider = provider
    }

    setModel(modelId: string): void {
        const model = this.providerRegistry.getModel(modelId)
        if (model) {
            this.currentModel = modelId
            this.config.provider = model.provider
        } else {
            throw new Error(`Model not found: ${modelId}`)
        }
    }

    getAvailableModels(): ModelConfig[] {
        return this.providerRegistry.getModels()
    }

    getAvailableProviders(): AIProvider[] {
        return this.providerRegistry.getAvailableProviders()
    }

    getModelCapabilities(modelId: string): ModelCapabilities | undefined {
        return this.providerRegistry.getModelCapabilities(modelId)
    }

    getConfig(): AIConfig {
        return { ...this.config }
    }

    registerTool(tool: Tool): void {
        this.availableTools.push(tool)
    }

    unregisterTool(toolName: string): void {
        this.availableTools = this.availableTools.filter(t => t.name !== toolName)
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
            if (error instanceof Error) {
                throw error
            }
            throw new Error(`AI message failed: ${String(error)}`)
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
            if (error instanceof Error) {
                throw error
            }
            throw new Error(`AI streaming message failed: ${String(error)}`)
        }
    }

    private buildSystemContext(context: AIContext): AIMessage {
        let systemPrompt = 'You are an AI coding assistant. '

        if (context.files && context.files.length > 0) {
            systemPrompt += `The user is working with the following files: ${context.files.join(', ')}. `
        }

        if (context.projectPath) {
            systemPrompt += `Project path: ${context.projectPath}. `
        }

        if (context.language) {
            systemPrompt += `Primary language: ${context.language}. `
        }

        return {
            role: 'system',
            content: systemPrompt
        }
    }

    private async callAI(messages: AIMessage[]): Promise<string> {
        const provider = this.config.provider || 'openai'
        const model = this.currentModel

        try {
            const response = await this.callProvider(provider, model, messages, false)
            return response
        } catch (error) {
            if (this.config.fallbackEnabled && this.config.fallbackProvider) {
                try {
                    return await this.callProvider(this.config.fallbackProvider, model, messages, false)
                } catch (fallbackError) {
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

        try {
            await this.callProvider(provider, model, messages, true, onChunk)
        } catch (error) {
            if (this.config.fallbackEnabled && this.config.fallbackProvider) {
                try {
                    await this.callProvider(this.config.fallbackProvider, model, messages, true, onChunk)
                } catch (fallbackError) {
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
        const url = `${endpoint}/chat/completions`

        const response = await this.httpClient.post(url, {
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            stream
        }, {
            'Authorization': `Bearer ${apiKey}`
        })

        if (stream && onChunk) {
            return this.handleOpenAIStream(response.data, onChunk)
        } else {
            return response.data.choices[0].message.content
        }
    }

    private async handleOpenAIStream(
        data: any,
        onChunk: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        // This is a simplified implementation
        // In production, you'd handle the actual streaming response
        let fullContent = data.choices[0].message.content || ''
        onChunk({ content: fullContent, done: true })
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

        const systemMessages = messages.filter(m => m.role === 'system')
        const chatMessages = messages.filter(m => m.role !== 'system')

        const response = await this.httpClient.post(url, {
            model,
            system: systemMessages.map(m => m.content).join('\n'),
            messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
            max_tokens: this.config.maxTokens || 4096,
            temperature: this.config.temperature,
            stream
        }, {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
        })

        if (stream && onChunk) {
            return this.handleAnthropicStream(response.data, onChunk)
        } else {
            return response.data.content[0].text
        }
    }

    private async handleAnthropicStream(
        data: any,
        onChunk: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        // This is a simplified implementation
        let fullContent = data.content[0].text || ''
        onChunk({ content: fullContent, done: true })
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

        const contents = messages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }))

        const response = await this.httpClient.post(url, {
            contents,
            generationConfig: {
                temperature: this.config.temperature,
                maxOutputTokens: this.config.maxTokens
            }
        })

        return response.data.candidates[0].content.parts[0].text
    }

    private async callCustom(
        endpoint: string,
        apiKey: string,
        model: string,
        messages: AIMessage[],
        stream: boolean,
        onChunk?: (chunk: AIStreamChunk) => void
    ): Promise<string> {
        const url = `${endpoint}/chat/completions`

        const response = await this.httpClient.post(url, {
            model,
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            temperature: this.config.temperature,
            max_tokens: this.config.maxTokens,
            stream
        }, {
            'Authorization': `Bearer ${apiKey}`
        })

        if (stream && onChunk) {
            return this.handleOpenAIStream(response.data, onChunk)
        } else {
            return response.data.choices[0].message.content
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
    }

    getConversationHistory(conversationId?: string): AIMessage[] {
        return this.getConversationMessages(conversationId)
    }

    async callTool(toolName: string, parameters: any): Promise<any> {
        const tool = this.availableTools.find(t => t.name === toolName)
        if (!tool) {
            throw new Error(`Tool not found: ${toolName}`)
        }

        // Tool calling logic would be implemented here
        // For now, return placeholder
        return { result: 'Tool call placeholder' }
    }

    isModelAvailable(modelId: string): boolean {
        return this.providerRegistry.isModelAvailable(modelId)
    }

    isProviderAvailable(provider: AIProvider): boolean {
        return this.providerRegistry.isProviderAvailable(provider)
    }
}

// Singleton instance
let aiService: AIService | null = null

export function getAIService(httpClient?: HttpClient): AIService {
    if (!aiService) {
        aiService = new AIService(httpClient)
    }
    return aiService
}

export function destroyAIService(): void {
    if (aiService) {
        aiService.clearConversation()
        aiService = null
    }
}

export function createAIService(httpClient?: HttpClient): AIService {
    return new AIService(httpClient)
}

// Export types
export type {
    AIMessage,
    AIContext,
    AIStreamChunk,
    AIConfig,
    AIProvider,
    Tool,
    ModelConfig,
    ModelCapabilities
}