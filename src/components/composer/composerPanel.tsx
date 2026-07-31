/**
 * Composer Panel
 * Multi-file diff preview UI for coordinated changes
 */

import React, { useState, useEffect } from 'react'
import { getComposerService, getDiffGenerator } from '../../features/composer'
import type { FileChange, ComposerResult, ComposerExecution, FileDiff } from '../../features/composer'

interface ComposerPanelProps {
    isOpen: boolean
    onClose: () => void
    projectPath: string
}

export function ComposerPanel({ isOpen, onClose, projectPath }: ComposerPanelProps) {
    const [prompt, setPrompt] = useState('')
    const [planning, setPlanning] = useState(false)
    const [executing, setExecuting] = useState(false)
    const [result, setResult] = useState<ComposerResult | null>(null)
    const [execution, setExecution] = useState<ComposerExecution | null>(null)
    const [selectedFile, setSelectedFile] = useState<string | null>(null)
    const [diffs, setDiffs] = useState<Map<string, FileDiff>>(new Map())

    const composerService = getComposerService()
    const diffGenerator = getDiffGenerator()

    const handlePlanChanges = async () => {
        if (!prompt.trim()) return

        setPlanning(true)
        setResult(null)
        setExecution(null)

        try {
            // This would integrate with the file system to get file contents
            // For now, use placeholder
            const files = new Map<string, string>()
            
            const request = {
                prompt,
                context: {
                    projectPath,
                    files
                }
            }

            const planResult = await composerService.planChanges(request)
            setResult(planResult)

            // Generate diffs for all changes
            const diffMap = new Map<string, FileDiff>()
            for (const change of planResult.changes) {
                const fileDiff = diffGenerator.generateFileDiff(
                    change.filePath,
                    change.originalContent,
                    change.proposedContent
                )
                diffMap.set(change.filePath, fileDiff)
            }
            setDiffs(diffMap)

            if (planResult.changes.length > 0) {
                setSelectedFile(planResult.changes[0].filePath)
            }
        } catch (error) {
            console.error('Failed to plan changes:', error)
        } finally {
            setPlanning(false)
        }
    }

    const handleExecuteChanges = async () => {
        if (!result) return

        setExecuting(true)
        setExecution(null)

        try {
            const execResult = await composerService.executeChanges(result)
            setExecution(execResult)
        } catch (error) {
            console.error('Failed to execute changes:', error)
        } finally {
            setExecuting(false)
        }
    }

    const handleAcceptChange = (filePath: string) => {
        // Apply the change to the file
        // This would integrate with the file system
        console.log('Accepting change for:', filePath)
    }

    const handleRejectChange = (filePath: string) => {
        // Reject the change
        console.log('Rejecting change for:', filePath)
    }

    const handleAcceptAll = () => {
        // Accept all changes
        if (result) {
            for (const change of result.changes) {
                handleAcceptChange(change.filePath)
            }
        }
    }

    const handleRejectAll = () => {
        // Reject all changes
        if (result) {
            for (const change of result.changes) {
                handleRejectChange(change.filePath)
            }
        }
        setResult(null)
        setDiffs(new Map())
        setSelectedFile(null)
    }

    if (!isOpen) return null

    return (
        <div className="composer-panel">
            <div className="composer-panel__header">
                <h2>Composer - Multi-file Editing</h2>
                <button onClick={onClose} className="composer-panel__close">×</button>
            </div>

            <div className="composer-panel__content">
                <div className="composer-panel__prompt">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe the changes you want to make across multiple files..."
                        className="composer-panel__textarea"
                        rows={4}
                    />
                    <button
                        onClick={handlePlanChanges}
                        disabled={planning || !prompt.trim()}
                        className="composer-panel__button"
                    >
                        {planning ? 'Planning...' : 'Plan Changes'}
                    </button>
                </div>

                {result && (
                    <div className="composer-panel__results">
                        <div className="composer-panel__summary">
                            <h3>Planned Changes</h3>
                            <p>{result.summary}</p>
                            <p>Estimated time: {Math.round(result.estimatedTime / 1000)}s</p>
                        </div>

                        <div className="composer-panel__files">
                            <h3>Files to Change ({result.changes.length})</h3>
                            <div className="composer-panel__file-list">
                                {result.executionOrder.map((filePath, index) => {
                                    const change = result.changes.find(c => c.filePath === filePath)
                                    const diff = diffs.get(filePath)
                                    return (
                                        <div
                                            key={filePath}
                                            className={`composer-panel__file-item ${selectedFile === filePath ? 'selected' : ''}`}
                                            onClick={() => setSelectedFile(filePath)}
                                        >
                                            <span className="composer-panel__file-index">{index + 1}.</span>
                                            <span className="composer-panel__file-path">{filePath}</span>
                                            {diff && (
                                                <span className="composer-panel__file-stats">
                                                    +{diff.summary.additions} -{diff.summary.deletions}
                                                </span>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {selectedFile && diffs.get(selectedFile) && (
                            <div className="composer-panel__diff">
                                <h3>Diff: {selectedFile}</h3>
                                <div className="composer-panel__diff-content">
                                    {renderDiff(diffs.get(selectedFile)!)}
                                </div>
                            </div>
                        )}

                        <div className="composer-panel__actions">
                            <button
                                onClick={handleExecuteChanges}
                                disabled={executing}
                                className="composer-panel__button composer-panel__button--primary"
                            >
                                {executing ? 'Executing...' : 'Execute All Changes'}
                            </button>
                            <button
                                onClick={handleAcceptAll}
                                className="composer-panel__button"
                            >
                                Accept All
                            </button>
                            <button
                                onClick={handleRejectAll}
                                className="composer-panel__button composer-panel__button--danger"
                            >
                                Reject All
                            </button>
                        </div>
                    </div>
                )}

                {execution && (
                    <div className="composer-panel__execution">
                        <h3>Execution Status</h3>
                        <div className="composer-panel__progress">
                            <div className="composer-panel__progress-bar">
                                <div
                                    className="composer-panel__progress-fill"
                                    style={{ width: `${(execution.currentStep / execution.totalSteps) * 100}%` }}
                                />
                            </div>
                            <p>
                                Step {execution.currentStep} of {execution.totalSteps}
                            </p>
                        </div>
                        {execution.status === 'completed' && (
                            <div className="composer-panel__success">
                                <p>✓ All changes executed successfully</p>
                            </div>
                        )}
                        {execution.status === 'failed' && (
                            <div className="composer-panel__error">
                                <p>✗ Execution failed: {execution.error}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function renderDiff(fileDiff: FileDiff): JSX.Element {
    return (
        <div className="diff-view">
            {fileDiff.hunks.map((hunk, index) => (
                <div key={index} className="diff-hunk">
                    <div className="diff-hunk-header">
                        @@ -{hunk.oldStart},{hunk.oldEnd} +{hunk.newStart},{hunk.newEnd} @@
                    </div>
                    {hunk.oldLines.map((line, i) => (
                        <div key={`old-${i}`} className="diff-line diff-line--removed">
                            <span className="diff-line-marker">-</span>
                            <span className="diff-line-content">{line}</span>
                        </div>
                    ))}
                    {hunk.newLines.map((line, i) => (
                        <div key={`new-${i}`} className="diff-line diff-line--added">
                            <span className="diff-line-marker">+</span>
                            <span className="diff-line-content">{line}</span>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}
