/**
 * Visual Editor Service
 * Service for visual editing capabilities overlaying CodeMirror
 */

import log from 'electron-log'

export interface VisualElement {
    id: string
    type: 'component' | 'element' | 'text' | 'style' | 'layout'
    name: string
    selector?: string
    properties: Record<string, any>
    styles: Record<string, string>
    children?: VisualElement[]
    parent?: string
    codeLocation?: {
        line: number
        column: number
        filePath: string
    }
}

export interface VisualChange {
    id: string
    elementId: string
    type: 'property' | 'style' | 'structure' | 'content'
    property?: string
    oldValue?: any
    newValue?: any
    timestamp: Date
    description: string
    author?: string
    tags?: string[]
}

export interface VisualEditorState {
    active: boolean
    selectedElement: VisualElement | null
    hoveredElement: VisualElement | null
    changes: VisualChange[]
    undoStack: VisualChange[]
    redoStack: VisualChange[]
    previewMode: boolean
}

export class VisualEditorService {
    private state: VisualEditorState = {
        active: false,
        selectedElement: null,
        hoveredElement: null,
        changes: [],
        undoStack: [],
        redoStack: [],
        previewMode: false
    }
    private elementCounter = 0
    private changeCounter = 0

    activate(): void {
        this.state.active = true
        log.info('Visual editor activated')
    }

    deactivate(): void {
        this.state.active = false
        this.state.selectedElement = null
        this.state.hoveredElement = null
        log.info('Visual editor deactivated')
    }

    isActive(): boolean {
        return this.state.active
    }

    selectElement(element: VisualElement): void {
        this.state.selectedElement = element
        log.info(`Selected element: ${element.name}`)
    }

    deselectElement(): void {
        this.state.selectedElement = null
    }

    getSelectedElement(): VisualElement | null {
        return this.state.selectedElement
    }

    hoverElement(element: VisualElement): void {
        this.state.hoveredElement = element
    }

    clearHover(): void {
        this.state.hoveredElement = null
    }

    getHoveredElement(): VisualElement | null {
        return this.state.hoveredElement
    }

    updateElementProperty(elementId: string, property: string, value: any, author?: string, tags?: string[]): VisualChange {
        const change: VisualChange = {
            id: `change-${++this.changeCounter}`,
            elementId,
            type: 'property',
            property,
            oldValue: this.getElementValue(elementId, property),
            newValue: value,
            timestamp: new Date(),
            description: `Updated ${property} to ${value}`,
            author,
            tags
        }

        this.state.changes.push(change)
        this.state.undoStack.push(change)
        this.state.redoStack = []

        log.info(`Updated element property: ${property} = ${value}`)
        return change
    }

    updateElementStyle(elementId: string, styleProperty: string, value: string, author?: string, tags?: string[]): VisualChange {
        const change: VisualChange = {
            id: `change-${++this.changeCounter}`,
            elementId,
            type: 'style',
            property: styleProperty,
            oldValue: this.getElementStyle(elementId, styleProperty),
            newValue: value,
            timestamp: new Date(),
            description: `Updated style ${styleProperty} to ${value}`,
            author,
            tags
        }

        this.state.changes.push(change)
        this.state.undoStack.push(change)
        this.state.redoStack = []

        log.info(`Updated element style: ${styleProperty} = ${value}`)
        return change
    }

    private getElementValue(elementId: string, property: string): any {
        const element = this.findElement(elementId)
        return element?.properties[property]
    }

    private getElementStyle(elementId: string, styleProperty: string): string {
        const element = this.findElement(elementId)
        return element?.styles[styleProperty] || ''
    }

    findElement(_elementId: string): VisualElement | undefined {
        // This would search through the parsed code structure
        // For now, return undefined as placeholder
        return undefined
    }

    undo(): VisualChange | null {
        if (this.state.undoStack.length === 0) {
            return null
        }

        const change = this.state.undoStack.pop()!
        this.state.redoStack.push(change)

        // Apply the undo
        this.applyChangeUndo(change)

        log.info(`Undone change: ${change.description}`)
        return change
    }

    redo(): VisualChange | null {
        if (this.state.redoStack.length === 0) {
            return null
        }

        const change = this.state.redoStack.pop()!
        this.state.undoStack.push(change)

        // Apply the redo
        this.applyChangeRedo(change)

        log.info(`Redone change: ${change.description}`)
        return change
    }

    private applyChangeUndo(_change: VisualChange): void {
        // This would revert the change in the actual code
        // For now, this is a placeholder
    }

    private applyChangeRedo(_change: VisualChange): void {
        // This would reapply the change in the actual code
        // For now, this is a placeholder
    }

    canUndo(): boolean {
        return this.state.undoStack.length > 0
    }

    canRedo(): boolean {
        return this.state.redoStack.length > 0
    }

    setPreviewMode(enabled: boolean): void {
        this.state.previewMode = enabled
        log.info(`Preview mode: ${enabled}`)
    }

    isPreviewMode(): boolean {
        return this.state.previewMode
    }

    getChanges(): VisualChange[] {
        return [...this.state.changes]
    }

    getChangesByAuthor(author: string): VisualChange[] {
        return this.state.changes.filter(c => c.author === author)
    }

    getChangesByTag(tag: string): VisualChange[] {
        return this.state.changes.filter(c => c.tags?.includes(tag))
    }

    getChangesByTimeRange(start: Date, end: Date): VisualChange[] {
        return this.state.changes.filter(c =>
            c.timestamp >= start && c.timestamp <= end
        )
    }

    clearChanges(): void {
        this.state.changes = []
        this.state.undoStack = []
        this.state.redoStack = []
        log.info('Cleared all changes')
    }

    getChangeHistory(): {
        total: number
        undoable: number
        redoable: number
        byAuthor: Record<string, number>
        byType: Record<string, number>
    } {
        const byAuthor: Record<string, number> = {}
        const byType: Record<string, number> = {}

        for (const change of this.state.changes) {
            if (change.author) {
                byAuthor[change.author] = (byAuthor[change.author] || 0) + 1
            }
            byType[change.type] = (byType[change.type] || 0) + 1
        }

        return {
            total: this.state.changes.length,
            undoable: this.state.undoStack.length,
            redoable: this.state.redoStack.length,
            byAuthor,
            byType
        }
    }

    exportChanges(): string {
        return JSON.stringify(this.state.changes, null, 2)
    }

    importChanges(json: string): number {
        try {
            const changes = JSON.parse(json) as VisualChange[]
            let count = 0
            for (const change of changes) {
                this.state.changes.push(change)
                count++
            }
            log.info(`Imported ${count} changes`)
            return count
        } catch (error) {
            log.error('Failed to import changes:', error)
            return 0
        }
    }

    parseCodeToElements(_code: string, _filePath: string): VisualElement[] {
        // This would parse the code and extract visual elements
        // For now, return empty array as placeholder
        return []
    }

    generateCodeFromElements(_elements: VisualElement[]): string {
        // This would generate code from visual elements
        // For now, return empty string as placeholder
        return ''
    }

    mapVisualToCode(_change: VisualChange): {
        codeChange: {
            filePath: string
            line: number
            column: number
            oldText: string
            newText: string
        }
    } {
        // This would map visual changes to code changes
        // For now, return placeholder
        return {
            codeChange: {
                filePath: '',
                line: 0,
                column: 0,
                oldText: '',
                newText: ''
            }
        }
    }

    getState(): VisualEditorState {
        return { ...this.state }
    }

    reset(): void {
        this.state = {
            active: false,
            selectedElement: null,
            hoveredElement: null,
            changes: [],
            undoStack: [],
            redoStack: [],
            previewMode: false
        }
        log.info('Visual editor state reset')
    }
}

// Singleton instance
let visualEditorService: VisualEditorService | null = null

export function getVisualEditorService(): VisualEditorService {
    if (!visualEditorService) {
        visualEditorService = new VisualEditorService()
    }
    return visualEditorService
}

export function destroyVisualEditorService() {
    if (visualEditorService) {
        visualEditorService.reset()
        visualEditorService = null
    }
}
