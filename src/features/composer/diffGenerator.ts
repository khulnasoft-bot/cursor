/**
 * Diff Generator
 * Generates coordinated diffs for multi-file changes
 */

import log from 'electron-log'
import { diffLines, diffWords } from 'diff'

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
    generateDiff(oldContent: string, newContent: string): DiffHunk[] {
        const diff = diffLines(oldContent, newContent)
        const hunks: DiffHunk[] = []
        
        let oldLineNum = 1
        let newLineNum = 1
        let currentHunk: Partial<DiffHunk> | null = null
        
        for (const part of diff) {
            if (part.added) {
                if (!currentHunk) {
                    currentHunk = {
                        oldStart: oldLineNum - 1,
                        oldEnd: oldLineNum - 1,
                        newStart: newLineNum,
                        newEnd: newLineNum,
                        oldLines: [],
                        newLines: [],
                        type: 'add'
                    }
                }
                currentHunk.newLines.push(...part.value.split('\n').filter(l => l !== ''))
                currentHunk.newEnd = newLineNum + part.value.split('\n').length - 1
                newLineNum += part.value.split('\n').length
            } else if (part.removed) {
                if (!currentHunk) {
                    currentHunk = {
                        oldStart: oldLineNum,
                        oldEnd: oldLineNum,
                        newStart: newLineNum - 1,
                        newEnd: newLineNum - 1,
                        oldLines: [],
                        newLines: [],
                        type: 'remove'
                    }
                }
                currentHunk.oldLines.push(...part.value.split('\n').filter(l => l !== ''))
                currentHunk.oldEnd = oldLineNum + part.value.split('\n').length - 1
                oldLineNum += part.value.split('\n').length
            } else {
                // Equal content
                if (currentHunk) {
                    hunks.push(currentHunk as DiffHunk)
                    currentHunk = null
                }
                const lineCount = part.value.split('\n').length
                oldLineNum += lineCount
                newLineNum += lineCount
            }
        }
        
        if (currentHunk) {
            hunks.push(currentHunk as DiffHunk)
        }
        
        return hunks
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
            log.error('Diff validation failed:', error)
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

export function getDiffGenerator(): DiffGenerator {
    if (!diffGenerator) {
        diffGenerator = new DiffGenerator()
    }
    return diffGenerator
}
