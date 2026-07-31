/**
 * AI Service IPC Handlers
 * IPC communication layer for AI service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getAIService } from './aiService'
import { getModelConfigManager } from './modelConfig'
import type { AIMessage, AIContext, Tool, AIConfig, AIStreamChunk, AIProvider, ModelConfig } from './aiService'

export function setupAIServiceIpcs() {
    const aiService = getAIService()
    const modelConfigManager = getModelConfigManager()

    // Send message to AI
    ipcMain.handle(
        'ai-service-send-message',
        async (_event: IpcMainInvokeEvent, message: string, context?: AIContext, conversationId?: string) => {
            try {
                const response = await aiService.sendMessage(message, context, conversationId)
                return { success: true, response }
            } catch (error) {
                log.error('Failed to send AI message:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Send message to AI with streaming
    ipcMain.handle(
        'ai-service-send-message-stream',
        async (_event: IpcMainInvokeEvent, message: string, context?: AIContext, conversationId?: string) => {
            try {
                let fullResponse = ''
                const chunks: AIStreamChunk[] = []

                await aiService.sendMessageStream(message, context, conversationId, (chunk) => {
                    chunks.push(chunk)
                    // Send chunk to renderer via event
                    _event.sender.send('ai-service-stream-chunk', { chunk, conversationId })
                })

                return { success: true, response: fullResponse, chunks }
            } catch (error) {
                log.error('Failed to send AI streaming message:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Update AI configuration
    ipcMain.handle(
        'ai-service-update-config',
        async (_event: IpcMainInvokeEvent, config: Partial<AIConfig>) => {
            try {
                aiService.updateConfig(config)
                return { success: true }
            } catch (error) {
                log.error('Failed to update AI config:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get AI configuration
    ipcMain.handle(
        'ai-service-get-config',
        async () => {
            try {
                const config = aiService.getConfig()
                return { success: true, config }
            } catch (error) {
                log.error('Failed to get AI config:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Register AI tool
    ipcMain.handle(
        'ai-service-register-tool',
        async (_event: IpcMainInvokeEvent, tool: Tool) => {
            try {
                aiService.registerTool(tool)
                return { success: true }
            } catch (error) {
                log.error('Failed to register AI tool:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Unregister AI tool
    ipcMain.handle(
        'ai-service-unregister-tool',
        async (_event: IpcMainInvokeEvent, toolName: string) => {
            try {
                aiService.unregisterTool(toolName)
                return { success: true }
            } catch (error) {
                log.error('Failed to unregister AI tool:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get available AI tools
    ipcMain.handle(
        'ai-service-get-tools',
        async () => {
            try {
                const tools = aiService.getTools()
                return { success: true, tools }
            } catch (error) {
                log.error('Failed to get AI tools:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Call AI tool
    ipcMain.handle(
        'ai-service-call-tool',
        async (_event: IpcMainInvokeEvent, toolName: string, parameters: any) => {
            try {
                const result = await aiService.callTool(toolName, parameters)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to call AI tool:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear conversation
    ipcMain.handle(
        'ai-service-clear-conversation',
        async (_event: IpcMainInvokeEvent, conversationId?: string) => {
            try {
                aiService.clearConversation(conversationId)
                return { success: true }
            } catch (error) {
                log.error('Failed to clear AI conversation:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get conversation history
    ipcMain.handle(
        'ai-service-get-history',
        async (_event: IpcMainInvokeEvent, conversationId?: string) => {
            try {
                const history = aiService.getConversationHistory(conversationId)
                return { success: true, history }
            } catch (error) {
                log.error('Failed to get AI conversation history:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Multi-model support IPC handlers

    // Set AI provider
    ipcMain.handle(
        'ai-service-set-provider',
        async (_event: IpcMainInvokeEvent, provider: AIProvider, apiKey?: string, endpoint?: string) => {
            try {
                aiService.setProvider(provider, apiKey, endpoint)
                if (apiKey) {
                    modelConfigManager.setApiKey(provider, apiKey)
                }
                if (endpoint) {
                    modelConfigManager.setCustomEndpoint(provider, endpoint)
                }
                return { success: true }
            } catch (error) {
                log.error('Failed to set AI provider:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Set AI model
    ipcMain.handle(
        'ai-service-set-model',
        async (_event: IpcMainInvokeEvent, modelId: string) => {
            try {
                aiService.setModel(modelId)
                modelConfigManager.setPreferredModel(modelId)
                return { success: true }
            } catch (error) {
                log.error('Failed to set AI model:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get available models
    ipcMain.handle(
        'ai-service-get-models',
        async () => {
            try {
                const models = aiService.getAvailableModels()
                return { success: true, models }
            } catch (error) {
                log.error('Failed to get available models:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get available providers
    ipcMain.handle(
        'ai-service-get-providers',
        async () => {
            try {
                const providers = aiService.getAvailableProviders()
                return { success: true, providers }
            } catch (error) {
                log.error('Failed to get available providers:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get model capabilities
    ipcMain.handle(
        'ai-service-get-model-capabilities',
        async (_event: IpcMainInvokeEvent, modelId: string) => {
            try {
                const capabilities = aiService.getModelCapabilities(modelId)
                return { success: true, capabilities }
            } catch (error) {
                log.error('Failed to get model capabilities:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check model availability
    ipcMain.handle(
        'ai-service-is-model-available',
        async (_event: IpcMainInvokeEvent, modelId: string) => {
            try {
                const available = aiService.isModelAvailable(modelId)
                return { success: true, available }
            } catch (error) {
                log.error('Failed to check model availability:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check provider availability
    ipcMain.handle(
        'ai-service-is-provider-available',
        async (_event: IpcMainInvokeEvent, provider: AIProvider) => {
            try {
                const available = aiService.isProviderAvailable(provider)
                return { success: true, available }
            } catch (error) {
                log.error('Failed to check provider availability:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Model configuration IPC handlers

    // Set API key for provider
    ipcMain.handle(
        'model-config-set-api-key',
        async (_event: IpcMainInvokeEvent, provider: AIProvider, apiKey: string) => {
            try {
                modelConfigManager.setApiKey(provider, apiKey)
                // Also update AI service config
                aiService.updateConfig({ apiKey })
                return { success: true }
            } catch (error) {
                log.error('Failed to set API key:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get API key for provider
    ipcMain.handle(
        'model-config-get-api-key',
        async (_event: IpcMainInvokeEvent, provider: AIProvider) => {
            try {
                const apiKey = modelConfigManager.getApiKey(provider)
                return { success: true, apiKey: apiKey || null }
            } catch (error) {
                log.error('Failed to get API key:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Set custom endpoint
    ipcMain.handle(
        'model-config-set-custom-endpoint',
        async (_event: IpcMainInvokeEvent, provider: AIProvider, endpoint: string) => {
            try {
                modelConfigManager.setCustomEndpoint(provider, endpoint)
                aiService.updateConfig({ endpoint })
                return { success: true }
            } catch (error) {
                log.error('Failed to set custom endpoint:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Set fallback enabled
    ipcMain.handle(
        'model-config-set-fallback-enabled',
        async (_event: IpcMainInvokeEvent, enabled: boolean) => {
            try {
                modelConfigManager.setFallbackEnabled(enabled)
                aiService.updateConfig({ fallbackEnabled: enabled })
                return { success: true }
            } catch (error) {
                log.error('Failed to set fallback enabled:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Set fallback provider
    ipcMain.handle(
        'model-config-set-fallback-provider',
        async (_event: IpcMainInvokeEvent, provider: AIProvider) => {
            try {
                modelConfigManager.setFallbackProvider(provider)
                aiService.updateConfig({ fallbackProvider: provider })
                return { success: true }
            } catch (error) {
                log.error('Failed to set fallback provider:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Set model preference
    ipcMain.handle(
        'model-config-set-model-preference',
        async (_event: IpcMainInvokeEvent, modelId: string, preferences: { temperature?: number; maxTokens?: number; topP?: number }) => {
            try {
                modelConfigManager.setModelPreference(modelId, preferences)
                // Update AI service config if this is the current model
                const currentConfig = aiService.getConfig()
                if (currentConfig.model === modelId) {
                    aiService.updateConfig(preferences)
                }
                return { success: true }
            } catch (error) {
                log.error('Failed to set model preference:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all model settings
    ipcMain.handle(
        'model-config-get-all-settings',
        async () => {
            try {
                const settings = modelConfigManager.getAllSettings()
                return { success: true, settings }
            } catch (error) {
                log.error('Failed to get all model settings:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Validate provider config
    ipcMain.handle(
        'model-config-validate-provider',
        async (_event: IpcMainInvokeEvent, provider: AIProvider) => {
            try {
                const validation = modelConfigManager.validateProviderConfig(provider)
                return { success: true, validation }
            } catch (error) {
                log.error('Failed to validate provider config:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('AI service IPC handlers registered')
}
