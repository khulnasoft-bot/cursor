/**
 * Cursor Explorer Service
 * Workspace extension for Cursor Explorer
 */

import * as fs from 'fs'
import * as path from 'path'
import log from 'electron-log'

export interface ExplorerNode {
    id: string
    name: string
    path: string
    type: 'file' | 'directory'
    children?: ExplorerNode[]
    size?: number
    lastModified?: number
    language?: string
}

export interface ExplorerOptions {
    showHiddenFiles?: boolean
    excludePatterns?: string[]
    maxDepth?: number
}

class ExplorerService {
    private workspaceRoot: string | null = null
    private cache: Map<string, ExplorerNode> = new Map()

    setWorkspaceRoot(rootPath: string): void {
        this.workspaceRoot = rootPath
        this.cache.clear()
        log.info(`Workspace root set to: ${rootPath}`)
    }

    async getDirectoryTree(dirPath: string, options: ExplorerOptions = {}): Promise<ExplorerNode> {
        const defaultOptions: ExplorerOptions = {
            showHiddenFiles: false,
            excludePatterns: ['node_modules', '.git', '.webpack', 'dist', 'build', 'out'],
            maxDepth: 10,
            ...options
        }

        return this.buildTree(dirPath, dirPath, 0, defaultOptions)
    }

    private async buildTree(
        currentPath: string,
        relativePath: string,
        depth: number,
        options: ExplorerOptions
    ): Promise<ExplorerNode> {
        const stats = await fs.promises.stat(currentPath)
        const name = path.basename(currentPath)

        if (stats.isFile()) {
            return {
                id: this.generateId(currentPath),
                name,
                path: currentPath,
                type: 'file',
                size: stats.size,
                lastModified: stats.mtimeMs,
                language: this.detectLanguage(currentPath)
            }
        }

        if (stats.isDirectory()) {
            if (depth >= (options.maxDepth || 10)) {
                return {
                    id: this.generateId(currentPath),
                    name,
                    path: currentPath,
                    type: 'directory',
                    children: []
                }
            }

            const entries = await fs.promises.readdir(currentPath, { withFileTypes: true })
            const children: ExplorerNode[] = []

            for (const entry of entries) {
                // Skip hidden files if not requested
                if (!options.showHiddenFiles && entry.name.startsWith('.')) {
                    continue
                }

                // Skip excluded patterns
                if (options.excludePatterns?.some(pattern => 
                    entry.name.includes(pattern) || currentPath.includes(pattern))) {
                    continue
                }

                const fullPath = path.join(currentPath, entry.name)
                try {
                    const childNode = await this.buildTree(fullPath, path.join(relativePath, entry.name), depth + 1, options)
                    children.push(childNode)
                } catch (error) {
                    log.warn(`Failed to build tree for ${fullPath}:`, error)
                }
            }

            // Sort: directories first, then files, both alphabetically
            children.sort((a, b) => {
                if (a.type === b.type) {
                    return a.name.localeCompare(b.name)
                }
                return a.type === 'directory' ? -1 : 1
            })

            return {
                id: this.generateId(currentPath),
                name,
                path: currentPath,
                type: 'directory',
                children
            }
        }

        throw new Error(`Unsupported file type: ${currentPath}`)
    }

    private generateId(filePath: string): string {
        return Buffer.from(filePath).toString('base64')
    }

    private detectLanguage(filePath: string): string {
        const ext = path.extname(filePath).toLowerCase()
        const languageMap: Record<string, string> = {
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.php': 'php',
            '.rb': 'ruby',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.html': 'html',
            '.css': 'css',
            '.scss': 'scss',
            '.json': 'json',
            '.xml': 'xml',
            '.yaml': 'yaml',
            '.yml': 'yaml',
            '.md': 'markdown',
            '.sql': 'sql',
            '.sh': 'shell'
        }
        return languageMap[ext] || 'plaintext'
    }

    async searchNodes(query: string, rootNode: ExplorerNode): Promise<ExplorerNode[]> {
        const results: ExplorerNode[] = []
        const lowerQuery = query.toLowerCase()

        const search = (node: ExplorerNode) => {
            if (node.name.toLowerCase().includes(lowerQuery)) {
                results.push(node)
            }

            if (node.children) {
                for (const child of node.children) {
                    search(child)
                }
            }
        }

        search(rootNode)
        return results
    }

    async getNodeByPath(targetPath: string, rootNode: ExplorerNode): Promise<ExplorerNode | null> {
        if (rootNode.path === targetPath) {
            return rootNode
        }

        if (rootNode.children) {
            for (const child of rootNode.children) {
                const found = await this.getNodeByPath(targetPath, child)
                if (found) return found
            }
        }

        return null
    }

    getWorkspaceRoot(): string | null {
        return this.workspaceRoot
    }

    clearCache(): void {
        this.cache.clear()
    }
}

// Singleton instance
let explorerService: ExplorerService | null = null

export function getExplorerService(): ExplorerService {
    if (!explorerService) {
        explorerService = new ExplorerService()
    }
    return explorerService
}

export function destroyExplorerService() {
    if (explorerService) {
        explorerService.clearCache()
        explorerService = null
    }
}
