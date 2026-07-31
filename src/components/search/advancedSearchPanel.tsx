/**
 * Advanced Search Panel
 * UI component for advanced codebase search with filters and preview
 */

import React, { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import type { SearchResult } from '../../main/search/advancedSearch'

interface SearchFilters {
    caseSensitive: boolean
    regex: boolean
    wholeWord: boolean
    fileExtensions: string[]
    excludePatterns: string[]
}

export function AdvancedSearchPanel() {
    const dispatch = useAppDispatch()
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
    const [filters, setFilters] = useState<SearchFilters>({
        caseSensitive: false,
        regex: true,
        wholeWord: false,
        fileExtensions: [],
        excludePatterns: []
    })
    const [extensionInput, setExtensionInput] = useState('')
    const [excludeInput, setExcludeInput] = useState('')

    const handleSearch = async () => {
        if (!query.trim()) return

        setIsSearching(true)
        try {
            // This would call the IPC handler
            // const response = await window.api.searchPerform({
            //     pattern: query,
            //     directory: projectPath,
            //     ...filters
            // })
            // if (response.success) {
            //     setResults(response.results)
            // }

            // Placeholder for now
            setResults([])
        } catch (error) {
            console.error('Search failed:', error)
        } finally {
            setIsSearching(false)
        }
    }

    const addExtension = () => {
        if (extensionInput.trim() && !filters.fileExtensions.includes(extensionInput.trim())) {
            setFilters({
                ...filters,
                fileExtensions: [...filters.fileExtensions, extensionInput.trim()]
            })
            setExtensionInput('')
        }
    }

    const removeExtension = (ext: string) => {
        setFilters({
            ...filters,
            fileExtensions: filters.fileExtensions.filter(e => e !== ext)
        })
    }

    const addExcludePattern = () => {
        if (excludeInput.trim() && !filters.excludePatterns.includes(excludeInput.trim())) {
            setFilters({
                ...filters,
                excludePatterns: [...filters.excludePatterns, excludeInput.trim()]
            })
            setExcludeInput('')
        }
    }

    const removeExcludePattern = (pattern: string) => {
        setFilters({
            ...filters,
            excludePatterns: filters.excludePatterns.filter(p => p !== pattern)
        })
    }

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch()
        }
    }

    return (
        <div className="advanced-search-panel">
            <div className="search-header">
                <h3>Advanced Search</h3>
            </div>

            <div className="search-input-section">
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search query..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                />
                <button
                    className="search-button"
                    onClick={handleSearch}
                    disabled={isSearching}
                >
                    {isSearching ? 'Searching...' : 'Search'}
                </button>
            </div>

            <div className="search-filters">
                <div className="filter-group">
                    <label className="filter-label">
                        <input
                            type="checkbox"
                            checked={filters.caseSensitive}
                            onChange={(e) => setFilters({ ...filters, caseSensitive: e.target.checked })}
                        />
                        Case Sensitive
                    </label>
                    <label className="filter-label">
                        <input
                            type="checkbox"
                            checked={filters.regex}
                            onChange={(e) => setFilters({ ...filters, regex: e.target.checked })}
                        />
                        Regex
                    </label>
                    <label className="filter-label">
                        <input
                            type="checkbox"
                            checked={filters.wholeWord}
                            onChange={(e) => setFilters({ ...filters, wholeWord: e.target.checked })}
                        />
                        Whole Word
                    </label>
                </div>

                <div className="filter-group">
                    <label className="filter-label">File Extensions:</label>
                    <div className="filter-input-group">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder=".ts,.tsx,.js"
                            value={extensionInput}
                            onChange={(e) => setExtensionInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addExtension()}
                        />
                        <button className="add-button" onClick={addExtension}>+</button>
                    </div>
                    <div className="filter-tags">
                        {filters.fileExtensions.map(ext => (
                            <span key={ext} className="filter-tag">
                                {ext}
                                <button onClick={() => removeExtension(ext)}>×</button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="filter-group">
                    <label className="filter-label">Exclude Patterns:</label>
                    <div className="filter-input-group">
                        <input
                            type="text"
                            className="filter-input"
                            placeholder="node_modules,dist"
                            value={excludeInput}
                            onChange={(e) => setExcludeInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addExcludePattern()}
                        />
                        <button className="add-button" onClick={addExcludePattern}>+</button>
                    </div>
                    <div className="filter-tags">
                        {filters.excludePatterns.map(pattern => (
                            <span key={pattern} className="filter-tag">
                                {pattern}
                                <button onClick={() => removeExcludePattern(pattern)}>×</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="search-results">
                <div className="results-header">
                    <h4>Results ({results.length})</h4>
                </div>
                <div className="results-list">
                    {results.map((result, index) => (
                        <div
                            key={index}
                            className={`result-item ${selectedResult === result ? 'selected' : ''}`}
                            onClick={() => setSelectedResult(result)}
                        >
                            <div className="result-file">{result.filePath}</div>
                            <div className="result-location">Line {result.lineNumber}</div>
                            <div className="result-match">{result.matchText}</div>
                        </div>
                    ))}
                    {results.length === 0 && !isSearching && (
                        <div className="no-results">No results found</div>
                    )}
                </div>
            </div>

            {selectedResult && (
                <div className="result-preview">
                    <div className="preview-header">
                        <h4>Preview: {selectedResult.filePath}</h4>
                        <button onClick={() => setSelectedResult(null)}>×</button>
                    </div>
                    <div className="preview-content">
                        {selectedResult.contextBefore && selectedResult.contextBefore.length > 0 && (
                            <div className="preview-context-before">
                                {selectedResult.contextBefore.map((line, i) => (
                                    <div key={i} className="preview-line">{line}</div>
                                ))}
                            </div>
                        )}
                        <div className="preview-match">
                            <span className="line-number">{selectedResult.lineNumber}:</span>
                            <span className="line-content">{selectedResult.lineContent}</span>
                        </div>
                        {selectedResult.contextAfter && selectedResult.contextAfter.length > 0 && (
                            <div className="preview-context-after">
                                {selectedResult.contextAfter.map((line, i) => (
                                    <div key={i} className="preview-line">{line}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
