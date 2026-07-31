/**
 * Enhanced Tab Completion
 * Multi-line prediction with cross-file context, symbol imports, and next-edit prediction
 */

import { getAgentWorkerManager } from '../../workers'
import { getAIService } from '../../main/aiService'
import type { AIContext } from '../../main/aiService'

export interface CompletionContext {
    file: string
    content: string
    position: number
    precedingCode: string
    followingCode: string
    language?: string
    projectPath?: string
    relatedFiles?: string[]
    importedSymbols?: string[]
    cursorLine: number
    cursorColumn: number
}

export interface CompletionRequest {
    context: CompletionContext
    maxLines?: number
    includeImports?: boolean
    predictNextEdit?: boolean
}

export interface CompletionResult {
    completion: string
    suggestedImports?: string[]
    nextEditLocation?: {
        line: number
        column: number
        reason: string
    }
    confidence: number
}

export class EnhancedCompletionService {
    private aiService = getAIService()
    private workerManager = getAgentWorkerManager()

    async getCompletion(request: CompletionRequest): Promise<CompletionResult> {
        const { context, maxLines = 10, includeImports = true, predictNextEdit = true } = request

        // Build enhanced context for AI
        const aiContext: AIContext = {
            files: context.relatedFiles || [context.file],
            projectPath: context.projectPath,
            language: context.language,
            symbols: [] // Will be populated with relevant symbols
        }

        // Build prompt for multi-line completion
        const prompt = this.buildCompletionPrompt(context, maxLines, includeImports)

        try {
            // Try AI service first for enhanced completion
            const response = await this.aiService.sendMessage(prompt, aiContext)
            
            // Parse response for completion, imports, and next edit
            return this.parseCompletionResponse(response, context)
        } catch (error) {
            console.warn('AI service completion failed, falling back to worker:', error)
            
            // Fallback to worker manager
            const workerResult = await this.workerManager.completion(
                context.file,
                context.content,
                context.position
            )

            return {
                completion: workerResult.completion,
                confidence: 0.7
            }
        }
    }

    private buildCompletionPrompt(
        context: CompletionContext,
        maxLines: number,
        includeImports: boolean
    ): string {
        const lines = context.content.split('\n')
        const cursorLineIndex = context.cursorLine - 1
        const currentLine = lines[cursorLineIndex] || ''
        
        // Get preceding context (last 20 lines before cursor)
        const precedingLines = lines.slice(Math.max(0, cursorLineIndex - 20), cursorLineIndex)
        const precedingCode = precedingLines.join('\n')
        
        // Get following context (next 5 lines after cursor)
        const followingLines = lines.slice(cursorLineIndex + 1, cursorLineIndex + 6)
        const followingCode = followingLines.join('\n')

        let prompt = `Complete the code at the cursor position. Generate up to ${maxLines} lines of code.\n\n`
        prompt += `File: ${context.file}\n`
        prompt += `Language: ${context.language || 'unknown'}\n\n`
        prompt += `Preceding code:\n${precedingCode}\n\n`
        prompt += `Current line: ${currentLine}\n\n`
        
        if (followingCode) {
            prompt += `Following code:\n${followingCode}\n\n`
        }

        if (includeImports && context.importedSymbols && context.importedSymbols.length > 0) {
            prompt += `Available symbols to import: ${context.importedSymbols.join(', ')}\n\n`
        }

        prompt += `Cursor position: line ${context.cursorLine}, column ${context.cursorColumn}\n\n`
        prompt += `Provide the completion only, no explanations. If imports are needed, include them at the top.`

        return prompt
    }

    private parseCompletionResponse(response: string, context: CompletionContext): CompletionResult {
        // Parse the response to extract completion, imports, and next edit suggestions
        let completion = response
        const suggestedImports: string[] = []
        let nextEditLocation: { line: number; column: number; reason: string } | undefined

        // Check for import statements at the beginning
        const importRegex = /^(import|from|require)\s+.*$/gm
        const importMatches = response.match(importRegex)
        if (importMatches) {
            suggestedImports.push(...importMatches)
            // Remove imports from completion
            completion = response.replace(importRegex, '').trim()
        }

        // Simple heuristic for next edit location prediction
        // If completion ends with a function or class definition, suggest editing the body
        if (completion.includes('function ') || completion.includes('class ') || completion.includes('=>')) {
            const lines = completion.split('\n')
            const lastLineIndex = lines.length - 1
            nextEditLocation = {
                line: context.cursorLine + lastLineIndex,
                column: lines[lastLineIndex].length,
                reason: 'Function/class body likely needs implementation'
            }
        }

        return {
            completion,
            suggestedImports: suggestedImports.length > 0 ? suggestedImports : undefined,
            nextEditLocation,
            confidence: 0.85
        }
    }

    async getCrossFileContext(file: string, projectPath?: string): Promise<string[]> {
        // This would integrate with the file system to find related files
        // For now, return empty array
        // TODO: Implement file relationship detection
        return []
    }

    async detectImportedSymbols(content: string, language?: string): Promise<string[]> {
        // Parse the file to detect imported symbols
        const symbols: string[] = []
        
        if (language === 'typescript' || language === 'javascript') {
            // Parse import statements
            const importRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g
            let match
            while ((match = importRegex.exec(content)) !== null) {
                const imported = match[1].split(',').map(s => s.trim())
                symbols.push(...imported)
            }

            // Parse require statements
            const requireRegex = /const\s+{([^}]+)}\s+=\s+require\(['"]([^'"]+)['"]\)/g
            while ((match = requireRegex.exec(content)) !== null) {
                const imported = match[1].split(',').map(s => s.trim())
                symbols.push(...imported)
            }
        }

        // TODO: Add parsers for other languages
        return symbols
    }

    async predictNextEditLocation(
        content: string,
        cursorLine: number,
        cursorColumn: number
    ): Promise<{ line: number; column: number; reason: string } | undefined> {
        const lines = content.split('\n')
        
        // Look for TODO comments
        for (let i = cursorLine; i < Math.min(lines.length, cursorLine + 50); i++) {
            if (lines[i].includes('TODO') || lines[i].includes('FIXME')) {
                return {
                    line: i + 1,
                    column: lines[i].indexOf('T') || 0,
                    reason: 'Found TODO/FIXME comment'
                }
            }
        }

        // Look for empty function bodies
        const currentLine = lines[cursorLine] || ''
        if (currentLine.includes('{') && !currentLine.includes('}')) {
            // Find the matching closing brace
            let braceCount = 1
            for (let i = cursorLine; i < lines.length; i++) {
                for (const char of lines[i]) {
                    if (char === '{') braceCount++
                    if (char === '}') braceCount--
                    if (braceCount === 0) {
                        return {
                            line: i + 1,
                            column: lines[i].length,
                            reason: 'Empty function body'
                        }
                    }
                }
            }
        }

        return undefined
    }
}

// Singleton instance
let enhancedCompletionService: EnhancedCompletionService | null = null

export function getEnhancedCompletionService(): EnhancedCompletionService {
    if (!enhancedCompletionService) {
        enhancedCompletionService = new EnhancedCompletionService()
    }
    return enhancedCompletionService
}
