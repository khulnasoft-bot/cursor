/**
 * Visual to Code Mapper
 * Service for mapping visual changes to code changes
 */

import log from 'electron-log'
import * as path from 'path'
import type { VisualElement, VisualChange } from './visualEditorService'

export interface CodeChange {
    filePath: string
    line: number
    column: number
    oldText: string
    newText: string
    description: string
}

export interface MappingResult {
    codeChanges: CodeChange[]
    errors: string[]
}

export class VisualCodeMapper {
    private elementToCodeMap: Map<string, { filePath: string; line: number; column: number }> = new Map()

    registerElementMapping(elementId: string, filePath: string, line: number, column: number): void {
        this.elementToCodeMap.set(elementId, { filePath, line, column })
        log.info(`Registered mapping for element ${elementId} to ${filePath}:${line}:${column}`)
    }

    unregisterElementMapping(elementId: string): void {
        this.elementToCodeMap.delete(elementId)
        log.info(`Unregistered mapping for element ${elementId}`)
    }

    clearMappings(): void {
        this.elementToCodeMap.clear()
        log.info('Cleared all element-to-code mappings')
    }

    mapChangeToCode(change: VisualChange): MappingResult {
        const codeChanges: CodeChange[] = []
        const errors: string[] = []

        const location = this.elementToCodeMap.get(change.elementId)
        if (!location) {
            errors.push(`No code location found for element ${change.elementId}`)
            return { codeChanges, errors }
        }

        try {
            switch (change.type) {
                case 'property':
                    const propChange = this.mapPropertyChange(change, location)
                    if (propChange) codeChanges.push(propChange)
                    break
                case 'style':
                    const styleChange = this.mapStyleChange(change, location)
                    if (styleChange) codeChanges.push(styleChange)
                    break
                case 'structure':
                    const structChange = this.mapStructureChange(change, location)
                    if (structChange) codeChanges.push(structChange)
                    break
                case 'content':
                    const contentChange = this.mapContentChange(change, location)
                    if (contentChange) codeChanges.push(contentChange)
                    break
                default:
                    errors.push(`Unknown change type: ${change.type}`)
            }
        } catch (error) {
            errors.push(`Failed to map change ${change.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }

        return { codeChanges, errors }
    }

    private mapPropertyChange(change: VisualChange, location: { filePath: string; line: number; column: number }): CodeChange | null {
        if (!change.property) return null

        // Map property changes to code
        // This is a simplified implementation - would need actual code parsing
        const oldText = `${change.property}="${change.oldValue || ''}"`
        const newText = `${change.property}="${change.newValue || ''}"`

        return {
            filePath: location.filePath,
            line: location.line,
            column: location.column,
            oldText,
            newText,
            description: change.description
        }
    }

    private mapStyleChange(change: VisualChange, location: { filePath: string; line: number; column: number }): CodeChange | null {
        if (!change.property) return null

        // Map style changes to code
        // This is a simplified implementation - would need actual code parsing
        const oldStyle = `${change.property}: ${change.oldValue || ''}`
        const newStyle = `${change.property}: ${change.newValue || ''}`

        return {
            filePath: location.filePath,
            line: location.line,
            column: location.column,
            oldText: oldStyle,
            newText: newStyle,
            description: change.description
        }
    }

    private mapStructureChange(change: VisualChange, location: { filePath: string; line: number; column: number }): CodeChange | null {
        // Map structural changes (adding/removing elements)
        // This is a placeholder - would need more sophisticated parsing
        return {
            filePath: location.filePath,
            line: location.line,
            column: location.column,
            oldText: change.oldValue || '',
            newText: change.newValue || '',
            description: change.description
        }
    }

    private mapContentChange(change: VisualChange, location: { filePath: string; line: number; column: number }): CodeChange | null {
        // Map content changes (text content)
        return {
            filePath: location.filePath,
            line: location.line,
            column: location.column,
            oldText: change.oldValue || '',
            newText: change.newValue || '',
            description: change.description
        }
    }

    mapChangesToCode(changes: VisualChange[]): MappingResult {
        const codeChanges: CodeChange[] = []
        const errors: string[] = []

        for (const change of changes) {
            const result = this.mapChangeToCode(change)
            codeChanges.push(...result.codeChanges)
            errors.push(...result.errors)
        }

        return { codeChanges, errors }
    }

    parseCodeForElements(code: string, filePath: string): VisualElement[] {
        // Parse code to extract visual elements
        // This is a simplified implementation - would need proper AST parsing
        const elements: VisualElement[] = []
        const lines = code.split('\n')

        let elementCounter = 0

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            
            // Simple pattern matching for common patterns
            const componentMatch = line.match(/<(\w+)/)
            if (componentMatch) {
                const element: VisualElement = {
                    id: `element-${++elementCounter}`,
                    type: 'component',
                    name: componentMatch[1],
                    selector: componentMatch[1],
                    properties: {},
                    styles: {},
                    codeLocation: {
                        line: i + 1,
                        column: line.indexOf(componentMatch[0]),
                        filePath
                    }
                }
                elements.push(element)
                this.registerElementMapping(element.id, filePath, i + 1, line.indexOf(componentMatch[0]))
            }

            // Match style definitions
            const styleMatch = line.match(/(\w+):\s*([^;]+)/)
            if (styleMatch) {
                const element: VisualElement = {
                    id: `style-${++elementCounter}`,
                    type: 'style',
                    name: styleMatch[1],
                    properties: {},
                    styles: { [styleMatch[1]]: styleMatch[2].trim() },
                    codeLocation: {
                        line: i + 1,
                        column: line.indexOf(styleMatch[0]),
                        filePath
                    }
                }
                elements.push(element)
                this.registerElementMapping(element.id, filePath, i + 1, line.indexOf(styleMatch[0]))
            }
        }

        log.info(`Parsed ${elements.length} elements from ${filePath}`)
        return elements
    }

    generateCodeFromElements(elements: VisualElement[]): string {
        // Generate code from visual elements
        // This is a simplified implementation - would need proper code generation
        let code = ''

        for (const element of elements) {
            if (element.type === 'component') {
                code += `<${element.name}`
                
                // Add properties as attributes
                for (const [key, value] of Object.entries(element.properties)) {
                    code += ` ${key}="${value}"`
                }
                
                // Add styles as inline style
                if (Object.keys(element.styles).length > 0) {
                    const styleString = Object.entries(element.styles)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join('; ')
                    code += ` style="${styleString}"`
                }
                
                code += '>\n'
            }
        }

        return code
    }

    validateMapping(elementId: string): boolean {
        return this.elementToCodeMap.has(elementId)
    }

    getMapping(elementId: string): { filePath: string; line: number; column: number } | undefined {
        return this.elementToCodeMap.get(elementId)
    }

    getAllMappings(): Map<string, { filePath: string; line: number; column: number }> {
        return new Map(this.elementToCodeMap)
    }

    getStatistics(): {
        totalMappings: number
        mappingsByFile: Record<string, number>
    } {
        const mappingsByFile: Record<string, number> = {}

        for (const location of this.elementToCodeMap.values()) {
            mappingsByFile[location.filePath] = (mappingsByFile[location.filePath] || 0) + 1
        }

        return {
            totalMappings: this.elementToCodeMap.size,
            mappingsByFile
        }
    }
}

// Singleton instance
let visualCodeMapper: VisualCodeMapper | null = null

export function getVisualCodeMapper(): VisualCodeMapper {
    if (!visualCodeMapper) {
        visualCodeMapper = new VisualCodeMapper()
    }
    return visualCodeMapper
}

export function destroyVisualCodeMapper() {
    if (visualCodeMapper) {
        visualCodeMapper.clearMappings()
        visualCodeMapper = null
    }
}
