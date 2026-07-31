/**
 * Undo/Redo Toolbar
 * Component for undo/redo functionality in visual editor
 */

import React from 'react'

interface UndoRedoToolbarProps {
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    onClearHistory: () => void
    history: {
        total: number
        undoable: number
        redoable: number
    }
}

export function UndoRedoToolbar({
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    onClearHistory,
    history
}: UndoRedoToolbarProps) {
    return (
        <div className="undo-redo-toolbar">
            <div className="undo-redo-toolbar__buttons">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="undo-redo-toolbar__button undo-redo-toolbar__button--undo"
                    title="Undo (Ctrl+Z)"
                >
                    ↶ Undo
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="undo-redo-toolbar__button undo-redo-toolbar__button--redo"
                    title="Redo (Ctrl+Y)"
                >
                    ↷ Redo
                </button>
            </div>

            <div className="undo-redo-toolbar__info">
                <span className="undo-redo-toolbar__count">
                    {history.undoable} undoable, {history.redoable} redoable
                </span>
                <span className="undo-redo-toolbar__total">
                    ({history.total} total)
                </span>
            </div>

            <div className="undo-redo-toolbar__actions">
                <button
                    onClick={onClearHistory}
                    disabled={history.total === 0}
                    className="undo-redo-toolbar__button undo-redo-toolbar__button--clear"
                    title="Clear history"
                >
                    Clear History
                </button>
            </div>
        </div>
    )
}
