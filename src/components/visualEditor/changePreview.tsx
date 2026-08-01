/**
 * Change Preview
 * Component for previewing visual changes before applying them
 */

import React, { useState } from 'react'
import type { VisualChange } from '../../features/visualEditor'

interface ChangePreviewProps {
    changes: VisualChange[]
    onApplyChange: (change: VisualChange) => void
    onRejectChange: (change: VisualChange) => void
    onApplyAll: () => void
    onRejectAll: () => void
    previewMode: boolean
    onTogglePreview: () => void
}

export function ChangePreview({
    changes,
    onApplyChange,
    onRejectChange,
    onApplyAll,
    onRejectAll,
    previewMode,
    onTogglePreview
}: ChangePreviewProps) {
    const [selectedChange, setSelectedChange] = useState<VisualChange | null>(null)
    const [filter, setFilter] = useState('')
    const [filterType, setFilterType] = useState<'all' | 'property' | 'style' | 'structure' | 'content'>('all')

    const filteredChanges = changes.filter(change => {
        const matchesFilter = filter === '' ||
            change.description.toLowerCase().includes(filter.toLowerCase()) ||
            change.elementId.toLowerCase().includes(filter.toLowerCase())

        const matchesType = filterType === 'all' || change.type === filterType

        return matchesFilter && matchesType
    })

    const groupedChanges = {
        property: filteredChanges.filter(c => c.type === 'property'),
        style: filteredChanges.filter(c => c.type === 'style'),
        structure: filteredChanges.filter(c => c.type === 'structure'),
        content: filteredChanges.filter(c => c.type === 'content')
    }

    return (
        <div className="change-preview">
            <div className="change-preview__header">
                <h3>Change Preview ({changes.length})</h3>
                <div className="change-preview__controls">
                    <button
                        className={`change-preview__toggle ${previewMode ? 'active' : ''}`}
                        onClick={onTogglePreview}
                    >
                        {previewMode ? '👁️ Live Preview' : '👁️ Preview'}
                    </button>
                </div>
            </div>

            <div className="change-preview__filters">
                <input
                    type="text"
                    className="change-preview__filter"
                    placeholder="Filter changes..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
                <select
                    className="change-preview__filter-type"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                >
                    <option value="all">All Types</option>
                    <option value="property">Properties</option>
                    <option value="style">Styles</option>
                    <option value="structure">Structure</option>
                    <option value="content">Content</option>
                </select>
            </div>

            <div className="change-preview__list">
                {filteredChanges.length === 0 ? (
                    <div className="change-preview__empty">
                        {filter || filterType !== 'all' ? 'No changes match filter' : 'No changes to preview'}
                    </div>
                ) : (
                    <>
                        {Object.entries(groupedChanges).map(([type, typeChanges]) => (
                            typeChanges.length > 0 && (
                                <div key={type} className="change-preview__group">
                                    <h4 className="change-preview__group-title">
                                        {type.charAt(0).toUpperCase() + type.slice(1)} ({typeChanges.length})
                                    </h4>
                                    {typeChanges.map(change => (
                                        <div
                                            key={change.id}
                                            className={`change-preview__item ${selectedChange?.id === change.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedChange(change)}
                                        >
                                            <div className="change-preview__item-header">
                                                <span className={`change-preview__type change-preview__type--${change.type}`}>
                                                    {change.type}
                                                </span>
                                                <span className="change-preview__timestamp">
                                                    {change.timestamp.toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="change-preview__description">
                                                {change.description}
                                            </div>
                                            <div className="change-preview__diff">
                                                {change.oldValue !== undefined && (
                                                    <div className="change-preview__old">
                                                        <span className="change-preview__label">Old:</span>
                                                        <code>{String(change.oldValue)}</code>
                                                    </div>
                                                )}
                                                {change.newValue !== undefined && (
                                                    <div className="change-preview__new">
                                                        <span className="change-preview__label">New:</span>
                                                        <code>{String(change.newValue)}</code>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="change-preview__actions">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onApplyChange(change)
                                                    }}
                                                    className="change-preview__apply"
                                                    title="Apply change"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onRejectChange(change)
                                                    }}
                                                    className="change-preview__reject"
                                                    title="Reject change"
                                                >
                                                    ✗
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        ))}
                    </>
                )}
            </div>

            {changes.length > 0 && (
                <div className="change-preview__bulk-actions">
                    <button
                        onClick={onApplyAll}
                        className="change-preview__bulk-apply"
                    >
                        Apply All ({changes.length})
                    </button>
                    <button
                        onClick={onRejectAll}
                        className="change-preview__bulk-reject"
                    >
                        Reject All ({changes.length})
                    </button>
                </div>
            )}

            {selectedChange && (
                <div className="change-preview__details">
                    <div className="change-preview__details-header">
                        <h4>Change Details</h4>
                        <button onClick={() => setSelectedChange(null)}>×</button>
                    </div>
                    <div className="change-preview__details-content">
                        <div className="change-preview__detail">
                            <label>ID:</label>
                            <span>{selectedChange.id}</span>
                        </div>
                        <div className="change-preview__detail">
                            <label>Element:</label>
                            <span>{selectedChange.elementId}</span>
                        </div>
                        <div className="change-preview__detail">
                            <label>Type:</label>
                            <span>{selectedChange.type}</span>
                        </div>
                        {selectedChange.property && (
                            <div className="change-preview__detail">
                                <label>Property:</label>
                                <span>{selectedChange.property}</span>
                            </div>
                        )}
                        <div className="change-preview__detail">
                            <label>Description:</label>
                            <span>{selectedChange.description}</span>
                        </div>
                        <div className="change-preview__detail">
                            <label>Timestamp:</label>
                            <span>{selectedChange.timestamp.toLocaleString()}</span>
                        </div>
                        {selectedChange.oldValue !== undefined && (
                            <div className="change-preview__detail">
                                <label>Old Value:</label>
                                <code>{String(selectedChange.oldValue)}</code>
                            </div>
                        )}
                        {selectedChange.newValue !== undefined && (
                            <div className="change-preview__detail">
                                <label>New Value:</label>
                                <code>{String(selectedChange.newValue)}</code>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
