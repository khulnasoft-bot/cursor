/**
 * Property Editor
 * Component for editing properties of selected visual elements
 */

import React, { useState, useEffect } from 'react'
import type { VisualElement } from '../../features/visualEditor'

interface PropertyEditorProps {
    selectedElement: VisualElement | null
    onUpdateProperty: (elementId: string, property: string, value: any) => void
    onUpdateStyle: (elementId: string, styleProperty: string, value: string) => void
}

export function PropertyEditor({ selectedElement, onUpdateProperty, onUpdateStyle }: PropertyEditorProps) {
    const [properties, setProperties] = useState<Record<string, any>>({})
    const [styles, setStyles] = useState<Record<string, string>>({})
    const [tab, setTab] = useState<'properties' | 'styles'>('properties')

    useEffect(() => {
        if (selectedElement) {
            setProperties({ ...selectedElement.properties })
            setStyles({ ...selectedElement.styles })
        }
    }, [selectedElement])

    const handlePropertyChange = (property: string, value: any) => {
        setProperties(prev => ({ ...prev, [property]: value }))
        if (selectedElement) {
            onUpdateProperty(selectedElement.id, property, value)
        }
    }

    const handleStyleChange = (styleProperty: string, value: string) => {
        setStyles(prev => ({ ...prev, [styleProperty]: value }))
        if (selectedElement) {
            onUpdateStyle(selectedElement.id, styleProperty, value)
        }
    }

    const addProperty = () => {
        const key = prompt('Enter property name:')
        if (key && selectedElement) {
            handlePropertyChange(key, '')
        }
    }

    const addStyle = () => {
        const key = prompt('Enter style property name:')
        if (key && selectedElement) {
            handleStyleChange(key, '')
        }
    }

    const removeProperty = (property: string) => {
        const newProperties = { ...properties }
        delete newProperties[property]
        setProperties(newProperties)
        if (selectedElement) {
            onUpdateProperty(selectedElement.id, property, undefined)
        }
    }

    const removeStyle = (styleProperty: string) => {
        const newStyles = { ...styles }
        delete newStyles[styleProperty]
        setStyles(newStyles)
        if (selectedElement) {
            onUpdateStyle(selectedElement.id, styleProperty, '')
        }
    }

    if (!selectedElement) {
        return (
            <div className="property-editor">
                <div className="property-editor__empty">
                    Select an element to edit its properties
                </div>
            </div>
        )
    }

    return (
        <div className="property-editor">
            <div className="property-editor__header">
                <h3>Properties: {selectedElement.name}</h3>
            </div>

            <div className="property-editor__tabs">
                <button
                    className={`property-editor__tab ${tab === 'properties' ? 'active' : ''}`}
                    onClick={() => setTab('properties')}
                >
                    Properties
                </button>
                <button
                    className={`property-editor__tab ${tab === 'styles' ? 'active' : ''}`}
                    onClick={() => setTab('styles')}
                >
                    Styles
                </button>
            </div>

            <div className="property-editor__content">
                {tab === 'properties' && (
                    <div className="property-editor__properties">
                        <div className="property-editor__actions">
                            <button onClick={addProperty} className="property-editor__button">
                                + Add Property
                            </button>
                        </div>

                        {Object.keys(properties).length === 0 ? (
                            <div className="property-editor__empty">No properties</div>
                        ) : (
                            <div className="property-editor__list">
                                {Object.entries(properties).map(([key, value]) => (
                                    <div key={key} className="property-editor__item">
                                        <label className="property-editor__label">{key}</label>
                                        <input
                                            type="text"
                                            className="property-editor__input"
                                            value={String(value)}
                                            onChange={(e) => handlePropertyChange(key, e.target.value)}
                                        />
                                        <button
                                            onClick={() => removeProperty(key)}
                                            className="property-editor__remove"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'styles' && (
                    <div className="property-editor__styles">
                        <div className="property-editor__actions">
                            <button onClick={addStyle} className="property-editor__button">
                                + Add Style
                            </button>
                        </div>

                        {Object.keys(styles).length === 0 ? (
                            <div className="property-editor__empty">No styles</div>
                        ) : (
                            <div className="property-editor__list">
                                {Object.entries(styles).map(([key, value]) => (
                                    <div key={key} className="property-editor__item">
                                        <label className="property-editor__label">{key}</label>
                                        <input
                                            type="text"
                                            className="property-editor__input"
                                            value={value}
                                            onChange={(e) => handleStyleChange(key, e.target.value)}
                                        />
                                        <button
                                            onClick={() => removeStyle(key)}
                                            className="property-editor__remove"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="property-editor__common-styles">
                            <h4>Common Styles</h4>
                            <div className="property-editor__common-list">
                                {[
                                    'color', 'backgroundColor', 'fontSize', 'fontWeight',
                                    'padding', 'margin', 'border', 'borderRadius',
                                    'display', 'flexDirection', 'alignItems', 'justifyContent',
                                    'width', 'height', 'opacity', 'transform'
                                ].map(style => (
                                    <div key={style} className="property-editor__common-item">
                                        <label>{style}</label>
                                        <input
                                            type="text"
                                            className="property-editor__input"
                                            value={styles[style] || ''}
                                            placeholder="value"
                                            onChange={(e) => handleStyleChange(style, e.target.value)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
