/**
 * Visual Editor Service
 * Service for visual editing capabilities overlaying CodeMirror
 * Provides functionality for managing visual elements, tracking changes,
 * and supporting undo/redo operations in a visual editing context.
 */

import log from 'electron-log'

/**
 * Represents a visual element in the editor (component, element, text, style, or layout)
 * Contains properties, styles, and code location information for mapping visual changes to code
 */
export interface VisualElement {
    /** Unique identifier for the visual element */
    id: string
    /** Type of the visual element */
    type: 'component' | 'element' | 'text' | 'style' | 'layout'
    /** Human-readable name of the element */
    name: string
    /** CSS selector for the element (if applicable) */
    selector?: string
    /** Key-value pairs of element properties */
    properties: Record<string, any>
    /** Key-value pairs of CSS styles */
    styles: Record<string, string>
    /** Child elements (for hierarchical structures) */
    children?: VisualElement[]
    /** Parent element ID (for hierarchical structures) */
    parent?: string
    /** Location in source code where this element is defined */
    codeLocation?: {
        line: number
        column: number
        filePath: string
    }
}

/**
 * Represents a single change made to a visual element
 * Tracks the modification details for undo/redo functionality and change history
 */
export interface VisualChange {
    /** Unique identifier for the change */
    id: string
    /** ID of the element that was modified */
    elementId: string
    /** Type of change that was made */
    type: 'property' | 'style' | 'structure' | 'content'
    /** Property that was modified (if applicable) */
    property?: string
    /** Previous value before the change */
    oldValue?: any
    /** New value after the change */
    newValue?: any
    /** When the change was made */
    timestamp: Date
    /** Human-readable description of the change */
    description: string
    /** Author who made the change (optional) */
    author?: string
    /** Tags for categorizing the change (optional) */
    tags?: string[]
}

/**
 * Current state of the visual editor
 * Tracks active elements, change history, and editor mode
 */
export interface VisualEditorState {
    /** Whether the visual editor is currently active */
    active: boolean
    /** Currently selected visual element */
    selectedElement: VisualElement | null
    /** Currently hovered visual element */
    hoveredElement: VisualElement | null
    /** All changes made in the current session */
    changes: VisualChange[]
    /** Stack of changes that can be undone */
    undoStack: VisualChange[]
    /** Stack of changes that can be redone */
    redoStack: VisualChange[]
    /** Whether preview mode is active */
    previewMode: boolean
}

/**
 * Main service class for visual editing functionality
 * Manages visual elements, tracks changes, and provides undo/redo capabilities
 */
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
    private changeStats = {
        byAuthor: new Map<string, number>(),
        byType: new Map<string, number>()
    }

    /**
     * Activates the visual editor
     */
    activate(): void {
        this.state.active = true
        log.info('Visual editor activated')
    }

    /**
     * Deactivates the visual editor and clears selections
     */
    deactivate(): void {
        this.state.active = false
        this.state.selectedElement = null
        this.state.hoveredElement = null
        log.info('Visual editor deactivated')
    }

    /**
     * Checks if the visual editor is currently active
     * @returns true if active, false otherwise
     */
    isActive(): boolean {
        return this.state.active
    }

    /**
     * Selects a visual element for editing
     * @param element The visual element to select
     */
    selectElement(element: VisualElement): void {
        this.state.selectedElement = element
        log.info(`Selected element: ${element.name}`)
    }

    /**
     * Deselects the currently selected element
     */
    deselectElement(): void {
        this.state.selectedElement = null
    }

    /**
     * Gets the currently selected visual element
     * @returns The selected element or null if none is selected
     */
    getSelectedElement(): VisualElement | null {
        return this.state.selectedElement
    }

    /**
     * Sets the hovered visual element
     * @param element The visual element being hovered
     */
    hoverElement(element: VisualElement): void {
        this.state.hoveredElement = element
    }

    /**
     * Clears the hovered element
     */
    clearHover(): void {
        this.state.hoveredElement = null
    }

    /**
     * Gets the currently hovered visual element
     * @returns The hovered element or null if none is hovered
     */
    getHoveredElement(): VisualElement | null {
        return this.state.hoveredElement
    }

    /**
     * Updates a property of a visual element
     * @param elementId ID of the element to update
     * @param property Property name to update
     * @param value New value for the property
     * @param author Optional author of the change
     * @param tags Optional tags for categorizing the change
     * @returns The VisualChange record
     */
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
        this.invalidateChangeStats(change)

        log.info(`Updated element property: ${property} = ${value}`)
        return change
    }

    /**
     * Updates a CSS style of a visual element
     * @param elementId ID of the element to update
     * @param styleProperty CSS property name to update
     * @param value New value for the CSS property
     * @param author Optional author of the change
     * @param tags Optional tags for categorizing the change
     * @returns The VisualChange record
     */
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
        this.invalidateChangeStats(change)

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

    private invalidateChangeStats(change: VisualChange): void {
        if (change.author) {
            this.changeStats.byAuthor.set(
                change.author,
                (this.changeStats.byAuthor.get(change.author) || 0) + 1
            )
        }
        this.changeStats.byType.set(
            change.type,
            (this.changeStats.byType.get(change.type) || 0) + 1
        )
    }

    findElement(_elementId: string): VisualElement | undefined {
        // This would search through the parsed code structure
        // For now, return undefined as placeholder
        return undefined
    }

    /**
     * Undoes the last change
     * @returns The undone change or null if nothing to undo
     */
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

    /**
     * Redoes the last undone change
     * @returns The redone change or null if nothing to redo
     */
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

    /**
     * Checks if undo is available
     * @returns true if there are changes to undo
     */
    canUndo(): boolean {
        return this.state.undoStack.length > 0
    }

    /**
     * Checks if redo is available
     * @returns true if there are changes to redo
     */
    canRedo(): boolean {
        return this.state.redoStack.length > 0
    }

    /**
     * Sets preview mode
     * @param enabled Whether preview mode should be enabled
     */
    setPreviewMode(enabled: boolean): void {
        this.state.previewMode = enabled
        log.info(`Preview mode: ${enabled}`)
    }

    /**
     * Checks if preview mode is active
     * @returns true if preview mode is active
     */
    isPreviewMode(): boolean {
        return this.state.previewMode
    }

    /**
     * Gets all changes
     * @returns A copy of all changes
     */
    getChanges(): VisualChange[] {
        return [...this.state.changes]
    }

    /**
     * Gets changes filtered by author
     * @param author The author to filter by
     * @returns Changes made by the specified author
     */
    getChangesByAuthor(author: string): VisualChange[] {
        return this.state.changes.filter(c => c.author === author)
    }

    /**
     * Gets changes filtered by tag
     * @param tag The tag to filter by
     * @returns Changes with the specified tag
     */
    getChangesByTag(tag: string): VisualChange[] {
        return this.state.changes.filter(c => c.tags?.includes(tag))
    }

    /**
     * Gets changes within a time range
     * @param start Start of the time range
     * @param end End of the time range
     * @returns Changes within the specified time range
     */
    getChangesByTimeRange(start: Date, end: Date): VisualChange[] {
        return this.state.changes.filter(c =>
            c.timestamp >= start && c.timestamp <= end
        )
    }

    /**
     * Clears all changes and resets undo/redo stacks
     */
    clearChanges(): void {
        this.state.changes = []
        this.state.undoStack = []
        this.state.redoStack = []
        this.changeStats.byAuthor.clear()
        this.changeStats.byType.clear()
        log.info('Cleared all changes')
    }

    /**
     * Gets change history statistics
     * @returns Statistics about changes including counts by author and type
     */
    getChangeHistory(): {
        total: number
        undoable: number
        redoable: number
        byAuthor: Record<string, number>
        byType: Record<string, number>
    } {
        const byAuthor: Record<string, number> = {}
        const byType: Record<string, number> = {}

        for (const [author, count] of this.changeStats.byAuthor) {
            byAuthor[author] = count
        }
        for (const [type, count] of this.changeStats.byType) {
            byType[type] = count
        }

        return {
            total: this.state.changes.length,
            undoable: this.state.undoStack.length,
            redoable: this.state.redoStack.length,
            byAuthor,
            byType
        }
    }

    /**
     * Exports all changes to JSON
     * @returns JSON string representation of all changes
     */
    exportChanges(): string {
        return JSON.stringify(this.state.changes, null, 2)
    }

    /**
     * Imports changes from JSON
     * @param json JSON string containing changes to import
     * @returns Number of changes imported
     */
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

    /**
     * Parses code to extract visual elements
     * @param code Source code to parse
     * @param filePath File path of the code
     * @returns Array of visual elements extracted from the code
     */
    parseCodeToElements(_code: string, _filePath: string): VisualElement[] {
        // This would parse the code and extract visual elements
        // For now, return empty array as placeholder
        return []
    }

    /**
     * Generates code from visual elements
     * @param elements Visual elements to generate code from
     * @returns Generated code string
     */
    generateCodeFromElements(_elements: VisualElement[]): string {
        // This would generate code from visual elements
        // For now, return empty string as placeholder
        return ''
    }

    /**
     * Maps a visual change to a code change
     * @param change The visual change to map
     * @returns Code change details including file location and text changes
     */
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

    /**
     * Gets the current state of the visual editor
     * @returns A copy of the current state
     */
    getState(): VisualEditorState {
        return { ...this.state }
    }

    /**
     * Resets the visual editor to its initial state
     */
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
