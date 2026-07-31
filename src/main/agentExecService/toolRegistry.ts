/**
 * Agent Tool Registry
 * Registry for agent tools with safety checks and permissions
 */

import log from 'electron-log'
import * as fs from 'fs/promises'
import * as path from 'path'
import { spawn } from 'child_process'

export interface ToolParameter {
    name: string
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    required: boolean
    description: string
    default?: any
}

export interface ToolResult {
    success: boolean
    data?: any
    error?: string
    executionTime: number
}

export interface AgentTool {
    name: string
    description: string
    category: 'filesystem' | 'terminal' | 'search' | 'git' | 'code' | 'system'
    parameters: ToolParameter[]
    dangerous: boolean
    requiresConfirmation: boolean
    execute: (params: Record<string, any>) => Promise<ToolResult>
}

export class ToolRegistry {
    private tools: Map<string, AgentTool> = new Map()
    private allowedPaths: Set<string> = new Set()
    private blockedCommands: Set<string> = new Set()

    constructor() {
        this.initializeDefaultTools()
        this.initializeSafetyRules()
    }

    private initializeSafetyRules() {
        // Block dangerous commands by default
        this.blockedCommands.add('rm')
        this.blockedCommands.add('dd')
        this.blockedCommands.add('mkfs')
        this.blockedCommands.add('format')
        this.blockedCommands.add('fdisk')
        this.blockedCommands.add('shutdown')
        this.blockedCommands.add('reboot')
        this.blockedCommands.add('halt')
    }

    private initializeDefaultTools() {
        // File system tools
        this.registerTool({
            name: 'read_file',
            description: 'Read the contents of a file',
            category: 'filesystem',
            parameters: [
                {
                    name: 'filePath',
                    type: 'string',
                    required: true,
                    description: 'Path to the file to read'
                }
            ],
            dangerous: false,
            requiresConfirmation: false,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    const content = await fs.readFile(params.filePath, 'utf-8')
                    return {
                        success: true,
                        data: content,
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to read file',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })

        this.registerTool({
            name: 'write_file',
            description: 'Write content to a file',
            category: 'filesystem',
            parameters: [
                {
                    name: 'filePath',
                    type: 'string',
                    required: true,
                    description: 'Path to the file to write'
                },
                {
                    name: 'content',
                    type: 'string',
                    required: true,
                    description: 'Content to write to the file'
                }
            ],
            dangerous: true,
            requiresConfirmation: true,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    await fs.writeFile(params.filePath, params.content, 'utf-8')
                    return {
                        success: true,
                        data: 'File written successfully',
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to write file',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })

        this.registerTool({
            name: 'list_directory',
            description: 'List contents of a directory',
            category: 'filesystem',
            parameters: [
                {
                    name: 'dirPath',
                    type: 'string',
                    required: true,
                    description: 'Path to the directory to list'
                }
            ],
            dangerous: false,
            requiresConfirmation: false,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    const entries = await fs.readdir(params.dirPath, { withFileTypes: true })
                    const result = entries.map(entry => ({
                        name: entry.name,
                        isDirectory: entry.isDirectory(),
                        isFile: entry.isFile()
                    }))
                    return {
                        success: true,
                        data: result,
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to list directory',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })

        this.registerTool({
            name: 'create_directory',
            description: 'Create a new directory',
            category: 'filesystem',
            parameters: [
                {
                    name: 'dirPath',
                    type: 'string',
                    required: true,
                    description: 'Path to the directory to create'
                }
            ],
            dangerous: true,
            requiresConfirmation: true,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    await fs.mkdir(params.dirPath, { recursive: true })
                    return {
                        success: true,
                        data: 'Directory created successfully',
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to create directory',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })

        this.registerTool({
            name: 'delete_file',
            description: 'Delete a file',
            category: 'filesystem',
            parameters: [
                {
                    name: 'filePath',
                    type: 'string',
                    required: true,
                    description: 'Path to the file to delete'
                }
            ],
            dangerous: true,
            requiresConfirmation: true,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    await fs.unlink(params.filePath)
                    return {
                        success: true,
                        data: 'File deleted successfully',
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Failed to delete file',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })

        // Search tools
        this.registerTool({
            name: 'search_files',
            description: 'Search for files matching a pattern',
            category: 'search',
            parameters: [
                {
                    name: 'directory',
                    type: 'string',
                    required: true,
                    description: 'Directory to search in'
                },
                {
                    name: 'pattern',
                    type: 'string',
                    required: true,
                    description: 'File name pattern to match'
                }
            ],
            dangerous: false,
            requiresConfirmation: false,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    const results: string[] = []
                    const searchDir = async (dir: string) => {
                        const entries = await fs.readdir(dir, { withFileTypes: true })
                        for (const entry of entries) {
                            const fullPath = path.join(dir, entry.name)
                            if (entry.isDirectory()) {
                                await searchDir(fullPath)
                            } else if (entry.name.includes(params.pattern)) {
                                results.push(fullPath)
                            }
                        }
                    }
                    await searchDir(params.directory)
                    return {
                        success: true,
                        data: results,
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Search failed',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })

        // Git tools
        this.registerTool({
            name: 'git_status',
            description: 'Get git repository status',
            category: 'git',
            parameters: [
                {
                    name: 'directory',
                    type: 'string',
                    required: true,
                    description: 'Path to the git repository'
                }
            ],
            dangerous: false,
            requiresConfirmation: false,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    // This would integrate with the git service
                    // For now, return placeholder
                    return {
                        success: true,
                        data: { status: 'placeholder', branch: 'main' },
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Git status failed',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })

        // Terminal tools with safety checks
        this.registerTool({
            name: 'execute_command',
            description: 'Execute a terminal command with safety checks',
            category: 'terminal',
            parameters: [
                {
                    name: 'command',
                    type: 'string',
                    required: true,
                    description: 'Command to execute'
                },
                {
                    name: 'args',
                    type: 'array',
                    required: false,
                    description: 'Command arguments',
                    default: []
                },
                {
                    name: 'cwd',
                    type: 'string',
                    required: false,
                    description: 'Working directory'
                }
            ],
            dangerous: true,
            requiresConfirmation: true,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    // Check if command is blocked
                    const commandParts = params.command.split(' ')
                    const baseCommand = commandParts[0]

                    if (this.blockedCommands.has(baseCommand)) {
                        return {
                            success: false,
                            error: `Command is blocked for safety: ${baseCommand}`,
                            executionTime: Date.now() - startTime
                        }
                    }

                    // Execute command with timeout
                    const result = await this.executeCommandWithTimeout(
                        params.command,
                        params.args || [],
                        params.cwd,
                        30000 // 30 second timeout
                    )

                    return {
                        success: true,
                        data: result,
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Command execution failed',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })

        this.registerTool({
            name: 'list_files',
            description: 'List files in directory (terminal-based)',
            category: 'terminal',
            parameters: [
                {
                    name: 'directory',
                    type: 'string',
                    required: true,
                    description: 'Directory to list'
                }
            ],
            dangerous: false,
            requiresConfirmation: false,
            execute: async (params) => {
                const startTime = Date.now()
                try {
                    const result = await this.executeCommandWithTimeout('ls', ['-la', params.directory], undefined, 5000)
                    return {
                        success: true,
                        data: result,
                        executionTime: Date.now() - startTime
                    }
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'ls command failed',
                        executionTime: Date.now() - startTime
                    }
                }
            }
        })
    }

    private async executeCommandWithTimeout(
        command: string,
        args: string[],
        cwd?: string,
        timeout: number = 30000
    ): Promise<{ stdout: string; stderr: string; exitCode: number }> {
        return new Promise((resolve, reject) => {
            const child = spawn(command, args, {
                cwd: cwd || process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe']
            })

            let stdout = ''
            let stderr = ''

            child.stdout?.on('data', (data) => {
                stdout += data.toString()
            })

            child.stderr?.on('data', (data) => {
                stderr += data.toString()
            })

            const timeoutHandle = setTimeout(() => {
                child.kill()
                reject(new Error(`Command timed out after ${timeout}ms`))
            }, timeout)

            child.on('close', (code) => {
                clearTimeout(timeoutHandle)
                resolve({ stdout, stderr, exitCode: code || 0 })
            })

            child.on('error', (error) => {
                clearTimeout(timeoutHandle)
                reject(error)
            })
        })
    }

    registerTool(tool: AgentTool): void {
        this.tools.set(tool.name, tool)
        log.info(`Registered tool: ${tool.name} (${tool.category})`)
    }

    unregisterTool(toolName: string): void {
        this.tools.delete(toolName)
        log.info(`Unregistered tool: ${toolName}`)
    }

    getTool(toolName: string): AgentTool | undefined {
        return this.tools.get(toolName)
    }

    getTools(): AgentTool[] {
        return Array.from(this.tools.values())
    }

    getToolsByCategory(category: AgentTool['category']): AgentTool[] {
        return this.getTools().filter(tool => tool.category === category)
    }

    async executeTool(toolName: string, params: Record<string, any>): Promise<ToolResult> {
        const tool = this.tools.get(toolName)

        if (!tool) {
            return {
                success: false,
                error: `Tool not found: ${toolName}`,
                executionTime: 0
            }
        }

        // Validate parameters
        const validation = this.validateParameters(tool, params)
        if (!validation.valid) {
            return {
                success: false,
                error: validation.error,
                executionTime: 0
            }
        }

        // Check if command is blocked
        if (tool.category === 'terminal' && this.blockedCommands.has(toolName)) {
            return {
                success: false,
                error: `Command is blocked for safety: ${toolName}`,
                executionTime: 0
            }
        }

        try {
            return await tool.execute(params)
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Tool execution failed',
                executionTime: 0
            }
        }
    }

    private validateParameters(tool: AgentTool, params: Record<string, any>): { valid: boolean; error?: string } {
        for (const param of tool.parameters) {
            if (param.required && !(param.name in params)) {
                return { valid: false, error: `Missing required parameter: ${param.name}` }
            }

            if (param.name in params) {
                const value = params[param.name]
                const typeMatch = this.checkType(value, param.type)
                if (!typeMatch) {
                    return { valid: false, error: `Parameter ${param.name} has wrong type. Expected ${param.type}` }
                }
            }
        }

        return { valid: true }
    }

    private checkType(value: any, expectedType: ToolParameter['type']): boolean {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string'
            case 'number':
                return typeof value === 'number'
            case 'boolean':
                return typeof value === 'boolean'
            case 'array':
                return Array.isArray(value)
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value)
            default:
                return true
        }
    }

    addAllowedPath(path: string): void {
        this.allowedPaths.add(path)
    }

    removeAllowedPath(path: string): void {
        this.allowedPaths.delete(path)
    }

    isPathAllowed(filePath: string): boolean {
        if (this.allowedPaths.size === 0) return true
        const normalizedPath = path.normalize(filePath)
        for (const allowedPath of this.allowedPaths) {
            if (normalizedPath.startsWith(path.normalize(allowedPath))) {
                return true
            }
        }
        return false
    }

    blockCommand(command: string): void {
        this.blockedCommands.add(command)
    }

    unblockCommand(command: string): void {
        this.blockedCommands.delete(command)
    }

    isCommandBlocked(command: string): boolean {
        return this.blockedCommands.has(command)
    }
}

// Singleton instance
let toolRegistry: ToolRegistry | null = null

export function getToolRegistry(): ToolRegistry {
    if (!toolRegistry) {
        toolRegistry = new ToolRegistry()
    }
    return toolRegistry
}

export function destroyToolRegistry() {
    if (toolRegistry) {
        toolRegistry = null
    }
}
