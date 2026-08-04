/**
 * Relationship Mapper
 * Maps file relationships and dependencies in the codebase
 */

import {
    CodeChunk,
    FileRelationship,
    RelationshipGraph
} from './types'
import { Logger, ConsoleLogger } from './logger'

export class RelationshipMapper {
    private graph: RelationshipGraph
    private logger: Logger

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
        this.graph = {
            nodes: new Map(),
            edges: new Map()
        }
    }

    analyzeFile(filePath: string, content: string, language?: string): void {
        // Extract relationships from the file
        const relationships = this.extractRelationships(filePath, content, language)

        // Add nodes and edges to the graph
        for (const relationship of relationships) {
            this.addRelationship(relationship)
        }

        this.logger.info(`Analyzed file: ${filePath}, relationships: ${relationships.length}`)
    }

    private extractRelationships(filePath: string, content: string, language?: string): FileRelationship[] {
        const relationships: FileRelationship[] = []

        // Extract imports
        const imports = this.extractImports(content, language)
        for (const imp of imports) {
            relationships.push({
                sourceFile: filePath,
                targetFile: imp,
                relationshipType: 'import',
                strength: 0.8
            })
        }

        // Extract exports
        const exports = this.extractExports(content, language)
        for (const exp of exports) {
            relationships.push({
                sourceFile: filePath,
                targetFile: exp,
                relationshipType: 'export',
                strength: 0.7
            })
        }

        return relationships
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

    addRelationship(relationship: FileRelationship): void {
        const { sourceFile, targetFile } = relationship

        // Add edge from source to target
        if (!this.graph.edges.has(sourceFile)) {
            this.graph.edges.set(sourceFile, new Set())
        }
        this.graph.edges.get(sourceFile)!.add(relationship)

        // Add reverse edge for dependents
        if (!this.graph.edges.has(targetFile)) {
            this.graph.edges.set(targetFile, new Set())
        }
        this.graph.edges.get(targetFile)!.add({
            sourceFile: targetFile,
            targetFile: sourceFile,
            relationshipType: 'reference',
            strength: relationship.strength * 0.5
        })
    }

    getDependents(filePath: string): FileRelationship[] {
        const edges = this.graph.edges.get(filePath) || new Set()
        return Array.from(edges).filter(r => r.relationshipType === 'reference')
    }

    getDependencies(filePath: string): FileRelationship[] {
        const edges = this.graph.edges.get(filePath) || new Set()
        return Array.from(edges).filter(r => r.relationshipType === 'import')
    }

    getRelatedFiles(filePath: string, maxDepth: number = 2): string[] {
        const related = new Set<string>()
        const visited = new Set<string>()

        const traverse = (currentPath: string, depth: number) => {
            if (depth > maxDepth || visited.has(currentPath)) return

            visited.add(currentPath)

            const edges = this.graph.edges.get(currentPath) || new Set()
            for (const edge of edges) {
                related.add(edge.targetFile)
                traverse(edge.targetFile, depth + 1)
            }
        }

        traverse(filePath, 0)
        return Array.from(related)
    }

    findSimilarFiles(filePath: string, threshold: number = 0.7): string[] {
        const similar: string[] = []
        const sourceChunk = this.graph.nodes.get(filePath)

        if (!sourceChunk || !sourceChunk.embedding) {
            return similar
        }

        for (const [otherPath, otherChunk] of this.graph.nodes) {
            if (otherPath === filePath) continue
            if (!otherChunk.embedding) continue

            // Calculate similarity (placeholder - would use actual cosine similarity)
            const similarity = this.calculateSimilarity(sourceChunk.embedding, otherChunk.embedding)

            if (similarity >= threshold) {
                similar.push(otherPath)
            }
        }

        return similar
    }

    private calculateSimilarity(embedding1: number[], embedding2: number[]): number {
        // Placeholder for actual similarity calculation
        // In production, this would use cosine similarity
        if (embedding1.length !== embedding2.length) return 0

        let dotProduct = 0
        let normA = 0
        let normB = 0

        for (let i = 0; i < embedding1.length; i++) {
            dotProduct += embedding1[i] * embedding2[i]
            normA += embedding1[i] * embedding1[i]
            normB += embedding2[i] * embedding2[i]
        }

        if (normA === 0 || normB === 0) return 0

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
    }

    addNode(chunk: CodeChunk): void {
        this.graph.nodes.set(chunk.filePath, chunk)
    }

    getNode(filePath: string): CodeChunk | undefined {
        return this.graph.nodes.get(filePath)
    }

    getGraph(): RelationshipGraph {
        return {
            nodes: new Map(this.graph.nodes),
            edges: new Map(this.graph.edges)
        }
    }

    getGraphStats(): {
        totalNodes: number
        totalEdges: number
        totalFiles: number
    } {
        let totalEdges = 0
        for (const edges of this.graph.edges.values()) {
            totalEdges += edges.size
        }

        return {
            totalNodes: this.graph.nodes.size,
            totalEdges: totalEdges,
            totalFiles: this.graph.edges.size
        }
    }

    clearGraph(): void {
        this.graph = {
            nodes: new Map(),
            edges: new Map()
        }
        this.logger.info('Relationship graph cleared')
    }

    reset(): void {
        this.clearGraph()
        this.logger.info('Reset relationship mapper')
    }
}

// Singleton instance
let relationshipMapper: RelationshipMapper | null = null

export function getRelationshipMapper(logger?: Logger): RelationshipMapper {
    if (!relationshipMapper) {
        relationshipMapper = new RelationshipMapper(logger)
    }
    return relationshipMapper
}

export function destroyRelationshipMapper(): void {
    if (relationshipMapper) {
        relationshipMapper.reset()
        relationshipMapper = null
    }
}

export function createRelationshipMapper(logger?: Logger): RelationshipMapper {
    return new RelationshipMapper(logger)
}