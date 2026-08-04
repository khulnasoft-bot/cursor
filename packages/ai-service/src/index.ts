/**
 * @cursor/ai-service
 * Multi-provider AI service with streaming, tool calling, and context management
 */

// Main AI service
export {
    getAIService,
    destroyAIService,
    createAIService
} from './ai-service'

// Types
export type {
    AIMessage,
    AIContext,
    AIStreamChunk,
    AIConfig,
    AIProvider,
    Tool,
    ModelConfig,
    ModelCapabilities
} from './ai-service'

// HTTP client
export {
    HttpClient,
    FetchHttpClient,
    MockHttpClient,
    HttpError,
    createHttpError
} from './http-client'

// Provider registry
export {
    ProviderRegistry,
    AIProviderImplementation
} from './provider-registry'