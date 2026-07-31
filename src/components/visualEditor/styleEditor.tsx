/**
 * Style Editor
 * Component for CSS/style manipulation with visual controls
 */

import React, { useState, useEffect } from 'react'
import type { VisualElement } from '../../features/visualEditor'

interface StyleEditorProps {
    selectedElement: VisualElement | null
    onUpdateStyle: (elementId: string, styleProperty: string, value: string) => void
}

interface StylePreset {
    name: string
    styles: Record<string, string>
}

export function StyleEditor({ selectedElement, onUpdateStyle }: StyleEditorProps) {
    const [styles, setStyles] = useState<Record<string, string>>({})
    const [selectedPreset, setSelectedPreset] = useState<string | null>(null)
    const [customStyle, setCustomStyle] = useState({ property: '', value: '' })

    useEffect(() => {
        if (selectedElement) {
            setStyles({ ...selectedElement.styles })
        }
    }, [selectedElement])

    const stylePresets: StylePreset[] = [
        {
            name: 'Flex Container',
            styles: {
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem'
            }
        },
        {
            name: 'Flex Column',
            styles: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: '1rem'
            }
        },
        {
            name: 'Grid Container',
            styles: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1rem'
            }
        },
        {
            name: 'Card',
            styles: {
                backgroundColor: '#ffffff',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                padding: '1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }
        },
        {
            name: 'Button',
            styles: {
                backgroundColor: '#007bff',
                color: '#ffffff',
                padding: '0.5rem 1rem',
                borderRadius: '4px',
                border: 'none',
                cursor: 'pointer'
            }
        },
        {
            name: 'Centered',
            styles: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }
        }
    ]

    const colorPresets = [
        { name: 'Primary', value: '#007bff' },
        { name: 'Secondary', value: '#6c757d' },
        { name: 'Success', value: '#28a745' },
        { name: 'Danger', value: '#dc3545' },
        { name: 'Warning', value: '#ffc107' },
        { name: 'Info', value: '#17a2b8' },
        { name: 'Light', value: '#f8f9fa' },
        { name: 'Dark', value: '#343a40' }
    ]

    const spacingPresets = ['0', '0.25rem', '0.5rem', '1rem', '1.5rem', '2rem', '3rem', '4rem']

    const handleStyleChange = (styleProperty: string, value: string) => {
        setStyles(prev => ({ ...prev, [styleProperty]: value }))
        if (selectedElement) {
            onUpdateStyle(selectedElement.id, styleProperty, value)
        }
    }

    const applyPreset = (preset: StylePreset) => {
        Object.entries(preset.styles).forEach(([property, value]) => {
            handleStyleChange(property, value)
        })
        setSelectedPreset(preset.name)
    }

    const addCustomStyle = () => {
        if (customStyle.property && customStyle.value && selectedElement) {
            handleStyleChange(customStyle.property, customStyle.value)
            setCustomStyle({ property: '', value: '' })
        }
    }

    const removeStyle = (property: string) => {
        const newStyles = { ...styles }
        delete newStyles[property]
        setStyles(newStyles)
        if (selectedElement) {
            onUpdateStyle(selectedElement.id, property, '')
        }
    }

    if (!selectedElement) {
        return (
            <div className="style-editor">
                <div className="style-editor__empty">
                    Select an element to edit its styles
                </div>
            </div>
        )
    }

    return (
        <div className="style-editor">
            <div className="style-editor__header">
                <h3>Style Editor</h3>
            </div>

            <div className="style-editor__presets">
                <h4>Style Presets</h4>
                <div className="style-editor__preset-list">
                    {stylePresets.map(preset => (
                        <button
                            key={preset.name}
                            className={`style-editor__preset ${selectedPreset === preset.name ? 'active' : ''}`}
                            onClick={() => applyPreset(preset)}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>
            </div>

            <div className="style-editor__sections">
                <div className="style-editor__section">
                    <h4>Layout</h4>
                    <div className="style-editor__controls">
                        <div className="style-editor__control">
                            <label>Display</label>
                            <select
                                value={styles.display || ''}
                                onChange={(e) => handleStyleChange('display', e.target.value)}
                            >
                                <option value="">Default</option>
                                <option value="block">Block</option>
                                <option value="inline">Inline</option>
                                <option value="flex">Flex</option>
                                <option value="grid">Grid</option>
                                <option value="none">None</option>
                            </select>
                        </div>

                        {(styles.display === 'flex' || styles.display === 'inline-flex') && (
                            <>
                                <div className="style-editor__control">
                                    <label>Flex Direction</label>
                                    <select
                                        value={styles.flexDirection || ''}
                                        onChange={(e) => handleStyleChange('flexDirection', e.target.value)}
                                    >
                                        <option value="row">Row</option>
                                        <option value="column">Column</option>
                                        <option value="row-reverse">Row Reverse</option>
                                        <option value="column-reverse">Column Reverse</option>
                                    </select>
                                </div>
                                <div className="style-editor__control">
                                    <label>Align Items</label>
                                    <select
                                        value={styles.alignItems || ''}
                                        onChange={(e) => handleStyleChange('alignItems', e.target.value)}
                                    >
                                        <option value="flex-start">Flex Start</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">Flex End</option>
                                        <option value="stretch">Stretch</option>
                                    </select>
                                </div>
                                <div className="style-editor__control">
                                    <label>Justify Content</label>
                                    <select
                                        value={styles.justifyContent || ''}
                                        onChange={(e) => handleStyleChange('justifyContent', e.target.value)}
                                    >
                                        <option value="flex-start">Flex Start</option>
                                        <option value="center">Center</option>
                                        <option value="flex-end">Flex End</option>
                                        <option value="space-between">Space Between</option>
                                        <option value="space-around">Space Around</option>
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="style-editor__section">
                    <h4>Spacing</h4>
                    <div className="style-editor__controls">
                        <div className="style-editor__control">
                            <label>Padding</label>
                            <select
                                value={styles.padding || ''}
                                onChange={(e) => handleStyleChange('padding', e.target.value)}
                            >
                                <option value="">Default</option>
                                {spacingPresets.map(value => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </div>
                        <div className="style-editor__control">
                            <label>Margin</label>
                            <select
                                value={styles.margin || ''}
                                onChange={(e) => handleStyleChange('margin', e.target.value)}
                            >
                                <option value="">Default</option>
                                {spacingPresets.map(value => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </div>
                        <div className="style-editor__control">
                            <label>Gap</label>
                            <select
                                value={styles.gap || ''}
                                onChange={(e) => handleStyleChange('gap', e.target.value)}
                            >
                                <option value="">Default</option>
                                {spacingPresets.map(value => (
                                    <option key={value} value={value}>{value}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="style-editor__section">
                    <h4>Colors</h4>
                    <div className="style-editor__controls">
                        <div className="style-editor__control">
                            <label>Color</label>
                            <div className="style-editor__color-picker">
                                <input
                                    type="color"
                                    value={styles.color || '#000000'}
                                    onChange={(e) => handleStyleChange('color', e.target.value)}
                                />
                                <input
                                    type="text"
                                    value={styles.color || ''}
                                    onChange={(e) => handleStyleChange('color', e.target.value)}
                                    placeholder="#000000"
                                />
                            </div>
                            <div className="style-editor__color-presets">
                                {colorPresets.map(preset => (
                                    <button
                                        key={preset.name}
                                        className="style-editor__color-preset"
                                        style={{ backgroundColor: preset.value }}
                                        onClick={() => handleStyleChange('color', preset.value)}
                                        title={preset.name}
                                    />
                                ))}
                            </div>
                        </div>
                        <div className="style-editor__control">
                            <label>Background Color</label>
                            <div className="style-editor__color-picker">
                                <input
                                    type="color"
                                    value={styles.backgroundColor || '#ffffff'}
                                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                />
                                <input
                                    type="text"
                                    value={styles.backgroundColor || ''}
                                    onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                                    placeholder="#ffffff"
                                />
                            </div>
                            <div className="style-editor__color-presets">
                                {colorPresets.map(preset => (
                                    <button
                                        key={preset.name}
                                        className="style-editor__color-preset"
                                        style={{ backgroundColor: preset.value }}
                                        onClick={() => handleStyleChange('backgroundColor', preset.value)}
                                        title={preset.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="style-editor__section">
                    <h4>Typography</h4>
                    <div className="style-editor__controls">
                        <div className="style-editor__control">
                            <label>Font Size</label>
                            <input
                                type="text"
                                value={styles.fontSize || ''}
                                onChange={(e) => handleStyleChange('fontSize', e.target.value)}
                                placeholder="16px"
                            />
                        </div>
                        <div className="style-editor__control">
                            <label>Font Weight</label>
                            <select
                                value={styles.fontWeight || ''}
                                onChange={(e) => handleStyleChange('fontWeight', e.target.value)}
                            >
                                <option value="">Default</option>
                                <option value="100">Thin (100)</option>
                                <option value="300">Light (300)</option>
                                <option value="400">Normal (400)</option>
                                <option value="500">Medium (500)</option>
                                <option value="600">Semi Bold (600)</option>
                                <option value="700">Bold (700)</option>
                                <option value="900">Black (900)</option>
                            </select>
                        </div>
                        <div className="style-editor__control">
                            <label>Text Align</label>
                            <select
                                value={styles.textAlign || ''}
                                onChange={(e) => handleStyleChange('textAlign', e.target.value)}
                            >
                                <option value="">Default</option>
                                <option value="left">Left</option>
                                <option value="center">Center</option>
                                <option value="right">Right</option>
                                <option value="justify">Justify</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="style-editor__section">
                    <h4>Border</h4>
                    <div className="style-editor__controls">
                        <div className="style-editor__control">
                            <label>Border</label>
                            <input
                                type="text"
                                value={styles.border || ''}
                                onChange={(e) => handleStyleChange('border', e.target.value)}
                                placeholder="1px solid #ccc"
                            />
                        </div>
                        <div className="style-editor__control">
                            <label>Border Radius</label>
                            <input
                                type="text"
                                value={styles.borderRadius || ''}
                                onChange={(e) => handleStyleChange('borderRadius', e.target.value)}
                                placeholder="4px"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="style-editor__custom">
                <h4>Custom Style</h4>
                <div className="style-editor__custom-inputs">
                    <input
                        type="text"
                        placeholder="Property (e.g., opacity)"
                        value={customStyle.property}
                        onChange={(e) => setCustomStyle({ ...customStyle, property: e.target.value })}
                    />
                    <input
                        type="text"
                        placeholder="Value (e.g., 0.5)"
                        value={customStyle.value}
                        onChange={(e) => setCustomStyle({ ...customStyle, value: e.target.value })}
                    />
                    <button onClick={addCustomStyle} className="style-editor__add">
                        Add
                    </button>
                </div>
            </div>

            <div className="style-editor__current">
                <h4>Current Styles</h4>
                {Object.keys(styles).length === 0 ? (
                    <div className="style-editor__empty">No styles applied</div>
                ) : (
                    <div className="style-editor__current-list">
                        {Object.entries(styles).map(([property, value]) => (
                            <div key={property} className="style-editor__current-item">
                                <label>{property}:</label>
                                <span>{value}</span>
                                <button
                                    onClick={() => removeStyle(property)}
                                    className="style-editor__remove"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
