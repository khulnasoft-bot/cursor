/**
 * Diff Generator
 * Generates coordinated diffs for multi-file changes
 */

import { Logger, ConsoleLogger } from './logger'

export interface DiffHunk {
    oldStart: number
    oldEnd: number
    newStart: number
    newEnd: number
    oldLines: string[]
    newLines: string[]
    type: 'add' | 'remove' | 'replace' | 'equal'
}

export interface FileDiff {
    filePath: string
    hunks: DiffHunk[]
    summary: {
        additions: number
        deletions: number
        modifications: number
    }
}

export interface MultiFileDiff {
    diffs: Map<string, FileDiff>
    totalChanges: {
        files: number
        additions: number
        deletions: number
        modifications: number
    }
    executionOrder: string[]
}

export class DiffGenerator {
    private logger: Logger

    constructor(logger?: Logger) {
        this.logger = logger || new ConsoleLogger()
    }

    generateDiff(oldContent: string, newContent: string): DiffHunk[] {
        const hunks: DiffHunk[] = []
        
        const oldLines = oldContent.split('\n')
        const newLines = newContent.split('\n')
        
        // Simple line-by-line diff
        let oldIndex = 0
        let newIndex = 0
        
        while (oldIndex < oldLines.length || newIndex < newLines.length) {
            const oldLine = oldLines[oldIndex]
            const newLine = newLines[newIndex]
            
            if (oldLine === newLine) {
                // Lines are equal
                oldIndex++
                newIndex++
            } else if (oldIndex < oldLines.length && newIndex < newLines.length) {
                // Lines differ - create a hunk
                const hunk = this.createDiffHunk(oldLines, newLines, oldIndex, newIndex)
                if (hunk) {
                    hunks.push(hunk)
                    oldIndex += hunk.oldLines.length
                    newIndex += hunk.newLines.length
                } else {
                    oldIndex++
                    newIndex++
                }
            } else if (oldIndex < oldLines.length) {
                // Remaining old lines (deletions)
                hunks.push({
                    oldStart: oldIndex + 1,
                    oldEnd: oldLines.length,
                    newStart: newIndex,
                    newEnd: newIndex,
                    oldLines: oldLines.slice(oldIndex),
                    newLines: [],
                    type: 'remove'
                })
                oldIndex = oldLines.length
            } else {
                // Remaining new lines (additions)
                hunks.push({
                    oldStart: oldIndex,
                    oldEnd: oldIndex,
                    newStart: newIndex + 1,
                    newEnd: newLines.length,
                    oldLines: [],
                    newLines: newLines.slice(newIndex),
                    type: 'add'
                })
                newIndex = newLines.length
            }
        }
        
        return hunks
    }

    private createDiffHunk(
        oldLines: string[],
        newLines: string[],
        oldStart: number,
        newStart: number
    ): DiffHunk | null {
        // Find the extent of the difference
        let oldEnd = oldStart
        let newEnd = newStart
        
        const maxHunkSize = 10 // Limit hunk size for simplicity
        
        while (oldEnd < oldLines.length && newEnd < newLines.length && (oldEnd - oldStart < maxHunkSize || newEnd - newStart < maxHunkSize)) {
            if (oldLines[oldEnd] === newLines[newEnd]) {
                break
            }
            oldEnd++
            newEnd++
        }
        
        if (oldEnd === oldStart && newEnd === newStart) {
            return null
        }
        
        return {
            oldStart: oldStart + 1,
            oldEnd: oldEnd,
            newStart: newStart + 1,
            newEnd: newEnd,
            oldLines: oldLines.slice(oldStart, oldEnd),
            newLines: newLines.slice(newStart, newEnd),
            type: this.determineHunkType(oldLines.slice(oldStart, oldEnd), newLines.slice(newStart, newEnd))
        }
    }

    private determineHunkType(oldLines: string[], newLines: string[]): DiffHunk['type'] {
        if (oldLines.length === 0) return 'add'
        if (newLines.length === 0) return 'remove'
        if (oldLines.length === newLines.length) return 'replace'
        return 'replace'
    }

    generateFileDiff(filePath: string, oldContent: string, newContent: string): FileDiff {
        const hunks = this.generateDiff(oldContent, newContent)
        
        let additions = 0
        let deletions = 0
        let modifications = 0
        
        for (const hunk of hunks) {
            if (hunk.type === 'add') {
                additions += hunk.newLines.length
            } else if (hunk.type === 'remove') {
                deletions += hunk.oldLines.length
            } else if (hunk.type === 'replace') {
                modifications += Math.max(hunk.oldLines.length, hunk.newLines.length)
            }
        }
        
        return {
            filePath,
            hunks,
            summary: {
                additions,
                deletions,
                modifications
            }
        }
    }

    generateMultiFileDiff(
        fileChanges: Map<string, { oldContent: string; newContent: string }>,
        executionOrder: string[]
    ): MultiFileDiff {
        const diffs = new Map<string, FileDiff>()
        let totalAdditions = 0
        let totalDeletions = 0
        let totalModifications = 0
        
        for (const filePath of executionOrder) {
            const change = fileChanges.get(filePath)
            if (!change) continue
            
            const fileDiff = this.generateFileDiff(filePath, change.oldContent, change.newContent)
            diffs.set(filePath, fileDiff)
            
            totalAdditions += fileDiff.summary.additions
            totalDeletions += fileDiff.summary.deletions
            totalModifications += fileDiff.summary.modifications
        }
        
        return {
            diffs,
            totalChanges: {
                files: diffs.size,
                additions: totalAdditions,
                deletions: totalDeletions,
                modifications: totalModifications
            },
            executionOrder
        }
    }

    formatDiffHunk(hunk: DiffHunk): string {
        let output = `@@ -${hunk.oldStart},${hunk.oldEnd} +${hunk.newStart},${hunk.newEnd} @@\n`
        
        for (const line of hunk.oldLines) {
            output += `-${line}\n`
        }
        
        for (const line of hunk.newLines) {
            output += `+${line}\n`
        }
        
        return output
    }

    formatFileDiff(fileDiff: FileDiff): string {
        let output = `diff --git a/${fileDiff.filePath} b/${fileDiff.filePath}\n`
        output += `--- a/${fileDiff.filePath}\n`
        output += `+++ b/${fileDiff.filePath}\n`
        
        for (const hunk of fileDiff.hunks) {
            output += this.formatDiffHunk(hunk)
        }
        
        return output
    }

    formatMultiFileDiff(multiFileDiff: MultiFileDiff): string {
        let output = `Multi-file Diff Summary:\n`
        output += `Files changed: ${multiFileDiff.totalChanges.files}\n`
        output += `Additions: ${multiFileDiff.totalChanges.additions}\n`
        output += `Deletions: ${multiFileDiff.totalChanges.deletions}\n`
        output += `Modifications: ${multiFileDiff.totalChanges.modifications}\n\n`
        
        for (const filePath of multiFileDiff.executionOrder) {
            const fileDiff = multiFileDiff.diffs.get(filePath)
            if (fileDiff) {
                output += this.formatFileDiff(fileDiff)
                output += '\n'
            }
        }
        
        return output
    }

    applyDiff(content: string, hunks: DiffHunk[]): string {
        const lines = content.split('\n')
        const result: string[] = []
        let lineIndex = 0
        
        for (const hunk of hunks) {
            // Add lines before the hunk
            while (lineIndex < hunk.oldStart - 1) {
                result.push(lines[lineIndex])
                lineIndex++
            }
            
            // Skip removed lines
            lineIndex += hunk.oldLines.length
            
            // Add new lines
            result.push(...hunk.newLines)
        }
        
        // Add remaining lines
        while (lineIndex < lines.length) {
            result.push(lines[lineIndex])
            lineIndex++
        }
        
        return result.join('\n')
    }

    validateDiff(oldContent: string, newContent: string, hunks: DiffHunk[]): boolean {
        try {
            const applied = this.applyDiff(oldContent, hunks)
            return applied === newContent
        } catch (error) {
            this.logger.error('Diff validation failed:', error)
            return false
        }
    }

    generateUnifiedDiff(
        filePath: string,
        oldContent: string,
        newContent: string,
        oldLabel?: string,
        newLabel?: string
    ): string {
        const fileDiff = this.generateFileDiff(filePath, oldContent, newContent)
        
        let output = `--- ${oldLabel || 'a/' + filePath}\n`
        output += `+++ ${newLabel || 'b/' + filePath}\n`
        
        for (const hunk of fileDiff.hunks) {
            output += this.formatDiffHunk(hunk)
        }
        
        return output
    }
}

// Singleton instance
let diffGenerator: DiffGenerator | null = null

export function getDiffGenerator(logger?: Logger): DiffGenerator {
    if (!diffGenerator) {
        diffGenerator = new DiffGenerator(logger)
    }
    return diffGenerator
}

export function destroyDiffGenerator(): void {
    if (diffGenerator) {
        diffGenerator = null
    }
}

export function createDiffGenerator(logger?: Logger): DiffGenerator {
    return new DiffGenerator(logger)
}