# @cursor/ai-service

Multi-provider AI service with streaming, tool calling, and context management.

## Installation

```bash
npm install @cursor/ai-service
```

## Usage

```typescript
import { createAIService, FetchHttpClient } from '@cursor/ai-service'

// Create AI service instance
const aiService = createAIService(new FetchHttpClient())

// Configure API key
aiService.setProvider('openai', 'your-api-key-here')

// Send a message
const response = await aiService.sendMessage('Explain this code', {
    files: ['src/main.ts'],
    projectPath: './my-project'
})

// Send with streaming
await aiService.sendMessageStream(
    'Generate a function',
    { files: ['src/utils.ts'] },
    'conversation-1',
    (chunk) => {
        console.log('Received chunk:', chunk.content)
    }
)
```

## Features

### Multi-Provider Support
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 3.5 Sonnet, Claude 3 Opus)
- Google (Gemini 1.5 Pro)
- Custom OpenAI-compatible endpoints

### Streaming Responses
- Real-time streaming with chunk handling
- Configurable streaming enable/disable
- Automatic fallback on errors

### Context Management
- Conversation history per conversation ID
- System message building
- File context integration
- Language awareness

### Tool Calling
- Tool registration and management
- Tool execution framework
- Tool parameter validation

### Model Registry
- Pre-configured popular models
- Model capabilities metadata
- Provider management
- Custom model registration

## API

### AIService

#### Configuration Methods

- `updateConfig(config: Partial<AIConfig>): void` - Update service configuration
- `setProvider(provider: AIProvider, apiKey?: string, endpoint?: string): void` - Set active provider
- `setModel(modelId: string): void` - Set active model
- `getConfig(): AIConfig` - Get current configuration

#### Information Methods

- `getAvailableModels(): ModelConfig[]` - Get all available models
- `getAvailableProviders(): AIProvider[]` - Get all available providers
- `getModelCapabilities(modelId: string): ModelCapabilities | undefined` - Get model capabilities
- `isModelAvailable(modelId: string): boolean` - Check if model is available
- `isProviderAvailable(provider: AIProvider): boolean` - Check if provider is available

#### Tool Methods

- `registerTool(tool: Tool): void` - Register a tool
- `unregisterTool(toolName: string): void` - Unregister a tool
- `getTools(): Tool[]` - Get all registered tools
- `callTool(toolName: string, parameters: any): Promise<any>` - Execute a tool

#### Message Methods

- `sendMessage(message: string, context?: AIContext, conversationId?: string): Promise<string>` - Send a message
- `sendMessageStream(message: string, context?: AIContext, conversationId?: string, onChunk?: (chunk: AIStreamChunk) => void): Promise<string>` - Send with streaming
- `clearConversation(conversationId?: string): void` - Clear conversation history
- `getConversationHistory(conversationId?: string): AIMessage[]` - Get conversation history

### Configuration

#### AIConfig
```typescript
interface AIConfig {
    apiKey?: string              // API key for the provider
    model?: string               // Model ID to use
    provider?: AIProvider        // AI provider to use
    endpoint?: string            // Custom endpoint URL
    temperature?: number        // Temperature for generation (0-2)
    maxTokens?: number           // Maximum tokens to generate
    streamingEnabled?: boolean   // Enable streaming responses
    fallbackEnabled?: boolean    // Enable fallback provider
    fallbackProvider?: AIProvider // Fallback provider on error
}
```

#### AIContext
```typescript
interface AIContext {
    files: string[]              // Files in context
    projectPath?: string         // Project directory path
    language?: string            // Primary programming language
    symbols?: any[]              // Code symbols in context
}
```

#### ModelConfig
```typescript
interface ModelConfig {
    id: string                   // Model identifier
    name: string                 // Human-readable name
    provider: AIProvider         // Provider name
    capabilities: ModelCapabilities
    defaultParams: {
        temperature?: number
        maxTokens?: number
        topP?: number
    }
}
```

## Examples

### Basic Usage
```typescript
import { createAIService } from '@cursor/ai-service'

const aiService = createAIService()
aiService.setProvider('openai', process.env.OPENAI_API_KEY)

const response = await aiService.sendMessage('Hello, how are you?')
console.log(response)
```

### With Context
```typescript
const response = await aiService.sendMessage('Explain this function', {
    files: ['src/utils.ts', 'src/main.ts'],
    projectPath: './my-project',
    language: 'typescript'
})
```

### Streaming
```typescript
await aiService.sendMessageStream(
    'Write a React component',
    { files: ['src/App.tsx'] },
    'conv-1',
    (chunk) => {
        process.stdout.write(chunk.content)
    }
)
```

### With Conversation History
```typescript
// First message
await aiService.sendMessage('My name is Alice', {}, 'conv-1')

// Second message (remembers context)
const response = await aiService.sendMessage('What is my name?', {}, 'conv-1')
console.log(response) // "Your name is Alice"
```

### Tool Calling
```typescript
aiService.registerTool({
    name: 'calculator',
    description: 'Perform mathematical calculations',
    parameters: {
        type: 'object',
        properties: {
            expression: { type: 'string' }
        }
    }
})

const result = await aiService.callTool('calculator', { expression: '2 + 2' })
```

### Model Selection
```typescript
// Set specific model
aiService.setModel('gpt-4o')

// Get available models
const models = aiService.getAvailableModels()
console.log(models.map(m => m.name))

// Get model capabilities
const capabilities = aiService.getModelCapabilities('gpt-4o')
console.log(capabilities)
```

### Provider Selection
```typescript
// Use Anthropic
aiService.setProvider('anthropic', process.env.ANTHROPIC_API_KEY)

// Use Google
aiService.setProvider('google', process.env.GOOGLE_API_KEY)

// Use custom endpoint
aiService.setProvider('custom', 'custom-key', 'https://api.example.com/v1')
```

### Fallback Configuration
```typescript
aiService.updateConfig({
    provider: 'openai',
    fallbackEnabled: true,
    fallbackProvider: 'anthropic'
})
```

## HTTP Client

The service uses an HTTP client abstraction for maximum flexibility:

### FetchHttpClient
Default implementation using fetch API (or node-fetch in Node.js).

```typescript
import { FetchHttpClient } from '@cursor/ai-service'

const client = new FetchHttpClient()
const aiService = createAIService(client)
```

### MockHttpClient
For testing purposes.

```typescript
import { MockHttpClient } from '@cursor/ai-service'

const mockClient = new MockHttpClient()
mockClient.setMockResponse('https://api.openai.com/v1/chat/completions', {
    choices: [{ message: { content: 'Mock response' } }]
})

const aiService = createAIService(mockClient)
```

## Available Models

### OpenAI
- `gpt-4o` - GPT-4 Omni (128k context, streaming, images)
- `gpt-4-turbo` - GPT-4 Turbo (128k context, streaming, images)
- `gpt-3.5-turbo` - GPT-3.5 Turbo (16k context, streaming)

### Anthropic
- `claude-3-5-sonnet` - Claude 3.5 Sonnet (200k context, streaming, images)
- `claude-3-opus` - Claude 3 Opus (200k context, streaming, images)

### Google
- `gemini-1.5-pro` - Gemini 1.5 Pro (1M context, streaming, images)

## Error Handling

The service throws standard errors for common issues:

```typescript
try {
    const response = await aiService.sendMessage('Hello')
} catch (error) {
    if (error.message.includes('No API key')) {
        console.error('API key not configured')
    } else if (error.message.includes('Model not found')) {
        console.error('Invalid model ID')
    } else {
        console.error('Unknown error:', error)
    }
}
```

## Best Practices

### API Key Security
- Never commit API keys to version control
- Use environment variables for API keys
- Rotate API keys regularly
- Use different keys for different environments

### Conversation Management
- Use conversation IDs for related messages
- Clear conversations when no longer needed
- Consider conversation memory limits

### Cost Optimization
- Use appropriate models for tasks
- Set reasonable maxTokens limits
- Monitor token usage
- Use streaming for better UX

### Error Handling
- Always handle errors gracefully
- Implement retry logic for transient failures
- Log errors for debugging
- Provide fallback options

## Performance Considerations

- **Streaming**: Use streaming for long responses to improve UX
- **Caching**: Consider caching responses for repeated queries
- **Batching**: Batch multiple requests when possible
- **Model Selection**: Use smaller models for simple tasks

## License

MIT