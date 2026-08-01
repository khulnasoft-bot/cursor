/**
 * Element Inspector
 * Component for inspecting and selecting visual elements
 */

import React, { useState } from 'react'
import type { VisualElement } from '../../features/visualEditor'

interface ElementInspectorProps {
    elements: VisualElement[]
    selectedElement: VisualElement | null
    onSelectElement: (element: VisualElement) => void
    onHoverElement: (element: VisualElement | null) => void
}

export function ElementInspector({ elements, selectedElement, onSelectElement, onHoverElement }: ElementInspectorProps) {
    const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set())
    const [filter, setFilter] = useState('')

    const toggleExpand = (elementId: string) => {
        const newExpanded = new Set(expandedElements)
        if (newExpanded.has(elementId)) {
            newExpanded.delete(elementId)
        } else {
            newExpanded.add(elementId)
        }
        setExpandedElements(newExpanded)
    }

    const filteredElements = elements.filter(el =>
        el.name.toLowerCase().includes(filter.toLowerCase()) ||
        el.type.toLowerCase().includes(filter.toLowerCase())
    )

    const renderElement = (element: VisualElement, level: number = 0): JSX.Element => {
        const isSelected = selectedElement?.id === element.id
        const hasChildren = element.children && element.children.length > 0
        const isExpanded = expandedElements.has(element.id)

        return (
            <div key={element.id} style={{ marginLeft: `${level * 16}px` }}>
                <div
                    className={`element-item ${isSelected ? 'selected' : ''}`}
                    onMouseEnter={() => onHoverElement(element)}
                    onMouseLeave={() => onHoverElement(null)}
                    onClick={() => onSelectElement(element)}
                >
                    {hasChildren && (
                        <button
                            className="element-expand"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleExpand(element.id)
                            }}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    <span className={`element-type element-type--${element.type}`}>
                        {element.type.charAt(0).toUpperCase()}
                    </span>
                    <span className="element-name">{element.name}</span>
                    {element.selector && (
                        <span className="element-selector">{element.selector}</span>
                    )}
                </div>
                {hasChildren && isExpanded && (
                    <div className="element-children">
                        {element.children!.map(child => renderElement(child, level + 1))}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="element-inspector">
            <div className="element-inspector__header">
                <h3>Elements</h3>
                <input
                    type="text"
                    className="element-inspector__filter"
                    placeholder="Filter elements..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>

            <div className="element-inspector__list">
                {filteredElements.length === 0 ? (
                    <div className="element-inspector__empty">
                        {filter ? 'No elements match filter' : 'No elements available'}
                    </div>
                ) : (
                    filteredElements.map(element => renderElement(element))
                )}
            </div>

            {selectedElement && (
                <div className="element-inspector__details">
                    <h4>Selected Element</h4>
                    <div className="element-details">
                        <div className="element-detail">
                            <label>Name:</label>
                            <span>{selectedElement.name}</span>
                        </div>
                        <div className="element-detail">
                            <label>Type:</label>
                            <span>{selectedElement.type}</span>
                        </div>
                        {selectedElement.selector && (
                            <div className="element-detail">
                                <label>Selector:</label>
                                <code>{selectedElement.selector}</code>
                            </div>
                        )}
                        {selectedElement.codeLocation && (
                            <div className="element-detail">
                                <label>Location:</label>
                                <span>
                                    {selectedElement.codeLocation.filePath}:{selectedElement.codeLocation.line}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="element-properties">
                        <h5>Properties</h5>
                        {Object.keys(selectedElement.properties).length === 0 ? (
                            <div className="element-empty">No properties</div>
                        ) : (
                            <div className="element-properties-list">
                                {Object.entries(selectedElement.properties).map(([key, value]) => (
                                    <div key={key} className="element-property">
                                        <label>{key}:</label>
                                        <span>{String(value)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="element-styles">
                        <h5>Styles</h5>
                        {Object.keys(selectedElement.styles).length === 0 ? (
                            <div className="element-empty">No styles</div>
                        ) : (
                            <div className="element-styles-list">
                                {Object.entries(selectedElement.styles).map(([key, value]) => (
                                    <div key={key} className="element-style">
                                        <label>{key}:</label>
                                        <span>{value}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
