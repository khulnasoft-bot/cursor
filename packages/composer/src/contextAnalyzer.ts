/**
 * Context Analyzer
 * Analyzes file context and relationships for better multi-file editing
 */

import { Logger, ConsoleLogger } from './logger'

export interface FileContext {
    filePath: string
    content: string
    language: string
    imports: string[]
    exports: string[]
    dependencies: string[]
    dependents: string[]
    symbols: SymbolInfo[]
}

export interface SymbolInfo {
    name: string
    type: 'function' | 'class' | 'variable' | 'interface' | 'type'
    line: number
    column: number
    exported: boolean
}

export interface RelationshipGraph {
    nodes: Map<string, FileContext>
    edges: Map<string, Set<string>> // filePath -> dependencies
    reverseEdges: Map<string, Set<string>> // filePath -> dependents
}

export class ContextAnalyzer {
    private logger: Logger

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
    }

    analyzeFile(filePath: string, content: string, language?: string): FileContext {
        this.logger.info(`Analyzing file: ${filePath}`)

        const fileContext: FileContext = {
            filePath,
            content,
            language: language || this.detectLanguage(filePath),
            imports: this.extractImports(content, language),
            exports: this.extractExports(content, language),
            dependencies: [],
            dependents: [],
            symbols: this.extractSymbols(content, language)
        }

        return fileContext
    }

    analyzeProject(files: Map<string, string>): RelationshipGraph {
        this.logger.info(`Analyzing project with ${files.size} files`)

        const nodes = new Map<string, FileContext>()
        const edges = new Map<string, Set<string>>()
        const reverseEdges = new Map<string, Set<string>>()

        // Analyze each file
        for (const [filePath, content] of files) {
            const context = this.analyzeFile(filePath, content)
            nodes.set(filePath, context)
        }

        // Build dependency graph
        for (const [filePath, context] of nodes) {
            const dependencies = new Set<string>()
            
            for (const imp of context.imports) {
                // Find files that export this symbol
                for (const [otherPath, otherContext] of nodes) {
                    if (otherPath === filePath) continue
                    if (otherContext.exports.includes(imp)) {
                        dependencies.add(otherPath)
                    }
                }
            }

            edges.set(filePath, dependencies)

            // Build reverse edges
            for (const dep of dependencies) {
                if (!reverseEdges.has(dep)) {
                    reverseEdges.set(dep, new Set())
                }
                reverseEdges.get(dep)!.add(filePath)
            }
        }

        // Update dependents in file contexts
        for (const [filePath, dependents] of reverseEdges) {
            const context = nodes.get(filePath)
            if (context) {
                context.dependents = Array.from(dependents)
            }
        }

        // Update dependencies in file contexts
        for (const [filePath, dependencies] of edges) {
            const context = nodes.get(filePath)
            if (context) {
                context.dependencies = Array.from(dependencies)
            }
        }

        return { nodes, edges, reverseEdges }
    }

    getAffectedFiles(
        filePath: string,
        graph: RelationshipGraph,
        depth: number = 1
    ): string[] {
        const affected = new Set<string>()
        const visited = new Set<string>()

        const traverse = (currentPath: string, currentDepth: number) => {
            if (currentDepth > depth) return
            if (visited.has(currentPath)) return

            visited.add(currentPath)

            const dependents = graph.reverseEdges.get(currentPath) || new Set()
            for (const dependent of dependents) {
                affected.add(dependent as string)
                traverse(dependent as string, currentDepth + 1)
            }
        }

        traverse(filePath, 0)
        return Array.from(affected)
    }

    getImpactAnalysis(
        filePath: string,
        graph: RelationshipGraph
    ): {
        directDependents: string[]
        indirectDependents: string[]
        totalImpact: number
    } {
        const reverseEdges = graph.reverseEdges.get(filePath) || new Set<string>()
        const directDependents = Array.from(reverseEdges)
        const indirectDependents = this.getAffectedFiles(filePath, graph, 2).filter(
            (f) => !directDependents.includes(f)
        )

        return {
            directDependents,
            indirectDependents,
            totalImpact: directDependents.length + indirectDependents.length
        }
    }

    private detectLanguage(filePath: string): string {
        const ext = filePath.split('.').pop()?.toLowerCase()
        const languageMap: Record<string, string> = {
            'ts': 'typescript',
            'tsx': 'typescript',
            'js': 'javascript',
            'jsx': 'javascript',
            'py': 'python',
            'java': 'java',
            'go': 'go',
            'rs': 'rust',
            'cpp': 'cpp',
            'c': 'c',
            'cs': 'csharp',
            'php': 'php',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin'
        }

        return languageMap[ext || ''] || 'text'
    }

    private extractImports(content: string, language?: string): string[] {
        const imports: string[] = []

        // Simple regex-based extraction (in production, use proper parsers)
        const patterns = [
            /import\s+.*\s+from\s+['"]([^'"]+)['"]/g,
            /import\s+['"]([^'"]+)['"]/g,
            /require\(['"]([^'"]+)['"]\)/g,
            /#include\s*[<"]([^>"]+)[>"]/g
        ]

        for (const pattern of patterns) {
            let match
            while ((match = pattern.exec(content)) !== null) {
                imports.push(match[1])
            }
        }

        return [...new Set(imports)]
    }

    private extractExports(content: string, language?: string): string[] {
        const exports: string[] = []

        // Simple regex-based extraction
        const patterns = [
            /export\s+(?:default\s+)?(?:class|function|const|let|var)\s+(\w+)/g,
            /export\s*\{\s*([^}]+)\s*\}/g,
            /module\.exports\s*=\s*(\w+)/g
        ]

        for (const pattern of patterns) {
            let match
            while ((match = pattern.exec(content)) !== null) {
                if (match[1]) {
                    const names = match[1].split(',').map(s => s.trim())
                    exports.push(...names)
                }
            }
        }

        return [...new Set(exports)]
    }

    private extractSymbols(content: string, language?: string): SymbolInfo[] {
        const symbols: SymbolInfo[] = []
        const lines = content.split('\n')

        // Simple regex-based symbol extraction
        const patterns = [
            { regex: /(?:class|interface|type)\s+(\w+)/g, type: 'class' as const },
            { regex: /function\s+(\w+)/g, type: 'function' as const },
            { regex: /const\s+(\w+)\s*=/g, type: 'variable' as const },
            { regex: /let\s+(\w+)\s*=/g, type: 'variable' as const },
            { regex: /var\s+(\w+)\s*=/g, type: 'variable' as const }
        ]

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            for (const { regex, type } of patterns) {
                regex.lastIndex = 0
                let match
                while ((match = regex.exec(line)) !== null) {
                    symbols.push({
                        name: match[1],
                        type,
                        line: i + 1,
                        column: line.indexOf(match[1]),
                        exported: line.includes('export')
                    })
                }
            }
        }

        return symbols
    }

    findRelatedFiles(
        filePath: string,
        graph: RelationshipGraph,
        context: string
    ): string[] {
        const related = new Set<string>()
        const fileContext = graph.nodes.get(filePath)

        if (!fileContext) return []

        // Add dependencies
        for (const dep of fileContext.dependencies) {
            related.add(dep)
        }

        // Add dependents
        for (const dep of fileContext.dependents) {
            related.add(dep)
        }

        // Add files with similar symbols
        for (const [otherPath, otherContext] of graph.nodes) {
            if (otherPath === filePath) continue

            const commonSymbols = fileContext.symbols.filter(s1 =>
                otherContext.symbols.some(s2 => s1.name === s2.name)
            )

            if (commonSymbols.length > 0) {
                related.add(otherPath)
            }
        }

        return Array.from(related)
    }
}

// Singleton instance
let contextAnalyzer: ContextAnalyzer | null = null

export function getContextAnalyzer(logger?: Logger): ContextAnalyzer {
    if (!contextAnalyzer) {
        contextAnalyzer = new ContextAnalyzer(logger)
    }
    return contextAnalyzer
}

export function destroyContextAnalyzer(): void {
    if (contextAnalyzer) {
        contextAnalyzer = null
    }
}

export function createContextAnalyzer(logger?: Logger): ContextAnalyzer {
    return new ContextAnalyzer(logger)
}