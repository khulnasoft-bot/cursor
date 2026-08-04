/**
 * Tool Registry
 * Registry for available tools that agents can use
 */

import { Tool, ToolResult } from './types'
import { Logger, ConsoleLogger } from './logger'

export class ToolRegistry {
    private tools: Map<string, Tool> = new Map()
    private logger: Logger

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
        this.registerDefaultTools()
    }

    private registerDefaultTools(): void {
        // File operations
        this.registerTool({
            name: 'read_file',
            description: 'Read the contents of a file',
            parameters: {
                filePath: { type: 'string', required: true, description: 'Path to the file to read' }
            },
            execute: async (params) => {
                // Placeholder for actual file reading
                this.logger.info(`Reading file: ${params.filePath}`)
                return { success: true, data: { content: `File content from ${params.filePath}` } }
            }
        })

        this.registerTool({
            name: 'write_file',
            description: 'Write content to a file',
            parameters: {
                filePath: { type: 'string', required: true, description: 'Path to the file to write' },
                content: { type: 'string', required: true, description: 'Content to write' }
            },
            execute: async (params) => {
                this.logger.info(`Writing file: ${params.filePath}`)
                return { success: true, data: { bytesWritten: params.content.length } }
            }
        })

        this.registerTool({
            name: 'delete_file',
            description: 'Delete a file',
            parameters: {
                filePath: { type: 'string', required: true, description: 'Path to the file to delete' }
            },
            execute: async (params) => {
                this.logger.info(`Deleting file: ${params.filePath}`)
                return { success: true, data: { deleted: true } }
            }
        })

        // Directory operations
        this.registerTool({
            name: 'list_directory',
            description: 'List contents of a directory',
            parameters: {
                dirPath: { type: 'string', required: true, description: 'Path to the directory' }
            },
            execute: async (params) => {
                this.logger.info(`Listing directory: ${params.dirPath}`)
                return { success: true, data: { files: ['file1.ts', 'file2.ts'] } }
            }
        })

        this.registerTool({
            name: 'create_directory',
            description: 'Create a new directory',
            parameters: {
                dirPath: { type: 'string', required: true, description: 'Path for the new directory' }
            },
            execute: async (params) => {
                this.logger.info(`Creating directory: ${params.dirPath}`)
                return { success: true, data: { created: true } }
            }
        })

        // Search operations
        this.registerTool({
            name: 'search_files',
            description: 'Search for files matching a pattern',
            parameters: {
                directory: { type: 'string', required: true, description: 'Directory to search in' },
                pattern: { type: 'string', required: true, description: 'Search pattern' }
            },
            execute: async (params) => {
                this.logger.info(`Searching files in ${params.directory} for ${params.pattern}`)
                return { success: true, data: { matches: ['file1.ts', 'file2.ts'] } }
            }
        })

        // Analysis operations
        this.registerTool({
            name: 'analyze',
            description: 'Analyze a goal or task',
            parameters: {
                goal: { type: 'string', required: true, description: 'Goal to analyze' }
            },
            execute: async (params) => {
                this.logger.info(`Analyzing goal: ${params.goal}`)
                return { success: true, data: { analysis: 'Goal analysis result' } }
            }
        })

        // AI operations
        this.registerTool({
            name: 'ai_task',
            description: 'Execute an AI task',
            parameters: {
                prompt: { type: 'string', required: true, description: 'Prompt for the AI' },
                context: { type: 'object', required: false, description: 'Additional context' }
            },
            execute: async (params) => {
                this.logger.info(`Executing AI task: ${params.prompt}`)
                return { success: true, data: { result: 'AI task result' } }
            }
        })
    }

    registerTool(tool: Tool): void {
        this.tools.set(tool.name, tool)
        this.logger.info(`Registered tool: ${tool.name}`)
    }

    unregisterTool(toolName: string): boolean {
        const deleted = this.tools.delete(toolName)
        if (deleted) {
            this.logger.info(`Unregistered tool: ${toolName}`)
        }
        return deleted
    }

    getTool(toolName: string): Tool | undefined {
        return this.tools.get(toolName)
    }

    getTools(): Tool[] {
        return Array.from(this.tools.values())
    }

    async executeTool(toolName: string, params: Record<string, any>): Promise<ToolResult> {
        const tool = this.tools.get(toolName)
        if (!tool) {
            throw new Error(`Tool not found: ${toolName}`)
        }

        // Validate parameters
        const validation = this.validateParams(tool, params)
        if (!validation.valid) {
            return {
                success: false,
                error: `Invalid parameters: ${validation.errors.join(', ')}`
            }
        }

        this.logger.info(`Executing tool: ${toolName}`)
        return await tool.execute(params)
    }

    private validateParams(tool: Tool, params: Record<string, any>): { valid: boolean; errors: string[] } {
        const errors: string[] = []

        for (const [key, schema] of Object.entries(tool.parameters)) {
            if (schema.required && params[key] === undefined) {
                errors.push(`Missing required parameter: ${key}`)
            }

            if (params[key] !== undefined) {
                const value = params[key]
                const expectedType = schema.type

                if (expectedType === 'string' && typeof value !== 'string') {
                    errors.push(`Parameter ${key} must be a string`)
                } else if (expectedType === 'number' && typeof value !== 'number') {
                    errors.push(`Parameter ${key} must be a number`)
                } else if (expectedType === 'boolean' && typeof value !== 'boolean') {
                    errors.push(`Parameter ${key} must be a boolean`)
                } else if (expectedType === 'object' && typeof value !== 'object') {
                    errors.push(`Parameter ${key} must be an object`)
                }
            }
        }

        return { valid: errors.length === 0, errors }
    }

    searchTools(query: string): Tool[] {
        const queryLower = query.toLowerCase()
        return this.getTools().filter(tool =>
            tool.name.toLowerCase().includes(queryLower) ||
            tool.description.toLowerCase().includes(queryLower)
        )
    }

    reset(): void {
        this.tools.clear()
        this.registerDefaultTools()
        this.logger.info('Reset tool registry')
    }
}

// Singleton instance
let toolRegistry: ToolRegistry | null = null

export function getToolRegistry(logger?: Logger): ToolRegistry {
    if (!toolRegistry) {
        toolRegistry = new ToolRegistry(logger)
    }
    return toolRegistry
}

export function destroyToolRegistry(): void {
    if (toolRegistry) {
        toolRegistry.reset()
        toolRegistry = null
    }
}

export function createToolRegistry(logger?: Logger): ToolRegistry {
    return new ToolRegistry(logger)
}