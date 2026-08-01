/**
 * Model Configuration Manager
 * Manages AI model configurations, provider settings, and user preferences
 */

import Store from 'electron-store'
import log from 'electron-log'
import type { AIProvider, ProviderConfig } from './aiService'

export interface ModelSettings {
    preferredModel: string
    preferredProvider: AIProvider
    fallbackEnabled: boolean
    fallbackProvider?: AIProvider
    customEndpoints: Map<AIProvider, string>
    apiKeys: Map<AIProvider, string>
    modelPreferences: Map<string, {
        temperature?: number
        maxTokens?: number
        topP?: number
    }>
}

class ModelConfigManager {
    private store: Store
    private settings: ModelSettings

    constructor() {
        this.store = new Store({
            name: 'model-config',
            defaults: {
                preferredModel: 'gpt-4o',
                preferredProvider: 'openai',
                fallbackEnabled: true,
                fallbackProvider: 'anthropic',
                customEndpoints: {},
                apiKeys: {},
                modelPreferences: {}
            }
        })

        this.settings = this.loadSettings()
    }

    private loadSettings(): ModelSettings {
        try {
            const data = this.store.store as any
            return {
                preferredModel: (data.preferredModel as string) || 'gpt-4o',
                preferredProvider: (data.preferredProvider as AIProvider) || 'openai',
                fallbackEnabled: (data.fallbackEnabled as boolean) ?? true,
                fallbackProvider: data.fallbackProvider as AIProvider | undefined,
                customEndpoints: new Map<AIProvider, string>(
                    Object.entries(data.customEndpoints || {}).map(([k, v]) => [k as AIProvider, v as string])
                ),
                apiKeys: new Map<AIProvider, string>(
                    Object.entries(data.apiKeys || {}).map(([k, v]) => [k as AIProvider, v as string])
                ),
                modelPreferences: new Map<string, { temperature?: number; maxTokens?: number; topP?: number }>(
                    Object.entries(data.modelPreferences || {})
                )
            }
        } catch (error) {
            log.error('Failed to load model settings:', error)
            return this.getDefaultSettings()
        }
    }

    private getDefaultSettings(): ModelSettings {
        return {
            preferredModel: 'gpt-4o',
            preferredProvider: 'openai',
            fallbackEnabled: true,
            fallbackProvider: 'anthropic',
            customEndpoints: new Map(),
            apiKeys: new Map(),
            modelPreferences: new Map()
        }
    }

    private saveSettings(): void {
        try {
            this.store.set({
                preferredModel: this.settings.preferredModel,
                preferredProvider: this.settings.preferredProvider,
                fallbackEnabled: this.settings.fallbackEnabled,
                fallbackProvider: this.settings.fallbackProvider,
                customEndpoints: Object.fromEntries(this.settings.customEndpoints),
                apiKeys: Object.fromEntries(this.settings.apiKeys),
                modelPreferences: Object.fromEntries(this.settings.modelPreferences)
            })
            log.info('Model settings saved successfully')
        } catch (error) {
            log.error('Failed to save model settings:', error)
        }
    }

    setPreferredModel(modelId: string): void {
        this.settings.preferredModel = modelId
        this.saveSettings()
        log.info(`Preferred model set to: ${modelId}`)
    }

    getPreferredModel(): string {
        return this.settings.preferredModel
    }

    setPreferredProvider(provider: AIProvider): void {
        this.settings.preferredProvider = provider
        this.saveSettings()
        log.info(`Preferred provider set to: ${provider}`)
    }

    getPreferredProvider(): AIProvider {
        return this.settings.preferredProvider
    }

    setApiKey(provider: AIProvider, apiKey: string): void {
        this.settings.apiKeys.set(provider, apiKey)
        this.saveSettings()
        log.info(`API key set for provider: ${provider}`)
    }

    getApiKey(provider: AIProvider): string | undefined {
        return this.settings.apiKeys.get(provider)
    }

    removeApiKey(provider: AIProvider): void {
        this.settings.apiKeys.delete(provider)
        this.saveSettings()
        log.info(`API key removed for provider: ${provider}`)
    }

    setCustomEndpoint(provider: AIProvider, endpoint: string): void {
        this.settings.customEndpoints.set(provider, endpoint)
        this.saveSettings()
        log.info(`Custom endpoint set for provider: ${provider}`)
    }

    getCustomEndpoint(provider: AIProvider): string | undefined {
        return this.settings.customEndpoints.get(provider)
    }

    removeCustomEndpoint(provider: AIProvider): void {
        this.settings.customEndpoints.delete(provider)
        this.saveSettings()
        log.info(`Custom endpoint removed for provider: ${provider}`)
    }

    setFallbackEnabled(enabled: boolean): void {
        this.settings.fallbackEnabled = enabled
        this.saveSettings()
        log.info(`Fallback enabled: ${enabled}`)
    }

    isFallbackEnabled(): boolean {
        return this.settings.fallbackEnabled
    }

    setFallbackProvider(provider: AIProvider): void {
        this.settings.fallbackProvider = provider
        this.saveSettings()
        log.info(`Fallback provider set to: ${provider}`)
    }

    getFallbackProvider(): AIProvider | undefined {
        return this.settings.fallbackProvider
    }

    setModelPreference(
        modelId: string,
        preferences: {
            temperature?: number
            maxTokens?: number
            topP?: number
        }
    ): void {
        this.settings.modelPreferences.set(modelId, preferences)
        this.saveSettings()
        log.info(`Preferences set for model: ${modelId}`)
    }

    getModelPreference(modelId: string): {
        temperature?: number
        maxTokens?: number
        topP?: number
    } | undefined {
        return this.settings.modelPreferences.get(modelId)
    }

    removeModelPreference(modelId: string): void {
        this.settings.modelPreferences.delete(modelId)
        this.saveSettings()
        log.info(`Preferences removed for model: ${modelId}`)
    }

    getAllSettings(): ModelSettings {
        return { ...this.settings }
    }

    resetToDefaults(): void {
        this.settings = this.getDefaultSettings()
        this.saveSettings()
        log.info('Model settings reset to defaults')
    }

    exportSettings(): string {
        return JSON.stringify({
            preferredModel: this.settings.preferredModel,
            preferredProvider: this.settings.preferredProvider,
            fallbackEnabled: this.settings.fallbackEnabled,
            fallbackProvider: this.settings.fallbackProvider,
            customEndpoints: Object.fromEntries(this.settings.customEndpoints),
            modelPreferences: Object.fromEntries(this.settings.modelPreferences)
            // Note: API keys are excluded from export for security
        }, null, 2)
    }

    importSettings(configJson: string, includeApiKeys: boolean = false): void {
        try {
            const config = JSON.parse(configJson)

            if (config.preferredModel) {
                this.settings.preferredModel = config.preferredModel
            }
            if (config.preferredProvider) {
                this.settings.preferredProvider = config.preferredProvider
            }
            if (typeof config.fallbackEnabled === 'boolean') {
                this.settings.fallbackEnabled = config.fallbackEnabled
            }
            if (config.fallbackProvider) {
                this.settings.fallbackProvider = config.fallbackProvider
            }
            if (config.customEndpoints) {
                this.settings.customEndpoints = new Map(Object.entries(config.customEndpoints))
            }
            if (config.modelPreferences) {
                this.settings.modelPreferences = new Map(Object.entries(config.modelPreferences))
            }

            // Only import API keys if explicitly requested
            if (includeApiKeys && config.apiKeys) {
                this.settings.apiKeys = new Map(Object.entries(config.apiKeys))
            }

            this.saveSettings()
            log.info('Model settings imported successfully')
        } catch (error) {
            log.error('Failed to import model settings:', error)
            throw new Error('Invalid settings format')
        }
    }

    validateProviderConfig(provider: AIProvider): {
        valid: boolean
        hasApiKey: boolean
        hasEndpoint: boolean
        errors: string[]
    } {
        const errors: string[] = []
        const hasApiKey = this.settings.apiKeys.has(provider)
        const hasEndpoint = this.settings.customEndpoints.has(provider)

        if (!hasApiKey && provider !== 'custom') {
            errors.push(`No API key configured for ${provider}`)
        }

        if (provider === 'custom' && !hasEndpoint) {
            errors.push('Custom provider requires an endpoint')
        }

        return {
            valid: errors.length === 0,
            hasApiKey,
            hasEndpoint,
            errors
        }
    }

    getProviderConfig(provider: AIProvider): ProviderConfig | null {
        const validation = this.validateProviderConfig(provider)
        if (!validation.valid) {
            return null
        }

        return {
            provider,
            apiKey: this.getApiKey(provider),
            endpoint: this.getCustomEndpoint(provider),
            models: [] // Will be populated by the model registry
        }
    }
}

// Singleton instance
let modelConfigManager: ModelConfigManager | null = null

export function getModelConfigManager(): ModelConfigManager {
    if (!modelConfigManager) {
        modelConfigManager = new ModelConfigManager()
    }
    return modelConfigManager
}

export function destroyModelConfigManager() {
    if (modelConfigManager) {
        modelConfigManager = null
    }
}
