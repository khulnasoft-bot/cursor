/**
 * Provider Registry
 * Manages AI provider configurations and model registry
 */

import {
    AIProvider,
    ModelConfig,
    ModelCapabilities,
    ProviderConfig
} from './types'

/**
 * AI Provider interface
 */
export interface AIProviderImplementation {
    name: string
    call(messages: any[], config: any): Promise<string>
    stream(messages: any[], config: any, onChunk: (chunk: string) => void): Promise<void>
}

/**
 * Provider Registry
 */
export class ProviderRegistry {
    private providers: Map<string, ProviderConfig> = new Map()
    private modelRegistry: Map<string, ModelConfig> = new Map()
    private implementations: Map<AIProvider, AIProviderImplementation> = new Map()

    constructor() {
        this.initializeDefaultModels()
    }

    private initializeDefaultModels(): void {
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
    }

    registerModel(model: ModelConfig): void {
        this.modelRegistry.set(model.id, model)
    }

    getModel(modelId: string): ModelConfig | undefined {
        return this.modelRegistry.get(modelId)
    }

    getModels(): ModelConfig[] {
        return Array.from(this.modelRegistry.values())
    }

    getModelsByProvider(provider: AIProvider): ModelConfig[] {
        return this.getModels().filter(m => m.provider === provider)
    }

    registerProvider(config: ProviderConfig): void {
        this.providers.set(config.provider, config)
    }

    getProvider(provider: AIProvider): ProviderConfig | undefined {
        return this.providers.get(provider)
    }

    getProviders(): ProviderConfig[] {
        return Array.from(this.providers.values())
    }

    registerImplementation(provider: AIProvider, implementation: AIProviderImplementation): void {
        this.implementations.set(provider, implementation)
    }

    getImplementation(provider: AIProvider): AIProviderImplementation | undefined {
        return this.implementations.get(provider)
    }

    getModelCapabilities(modelId: string): ModelCapabilities | undefined {
        const model = this.getModel(modelId)
        return model?.capabilities
    }

    getAvailableProviders(): AIProvider[] {
        return Array.from(new Set(this.getModels().map(m => m.provider)))
    }

    isModelAvailable(modelId: string): boolean {
        return this.modelRegistry.has(modelId)
    }

    isProviderAvailable(provider: AIProvider): boolean {
        return this.providers.has(provider) || this.getModelsByProvider(provider).length > 0
    }
}