/**
 * Rules Management Panel
 * UI component for managing team rules
 */

import React, { useState, useEffect } from 'react'
import type { Rule, RuleSet, RuleViolation } from '../../main/rules'

interface RulesPanelProps {
    isOpen: boolean
    onClose: () => void
    projectPath: string
}

export function RulesPanel({ isOpen, onClose, projectPath }: RulesPanelProps) {
    const [ruleSets, setRuleSets] = useState<RuleSet[]>([])
    const [activeRules, setActiveRules] = useState<Rule[]>([])
    const [selectedRuleSet, setSelectedRuleSet] = useState<RuleSet | null>(null)
    const [selectedRule, setSelectedRule] = useState<Rule | null>(null)
    const [violations, setViolations] = useState<RuleViolation[]>([])
    const [loading, setLoading] = useState(false)
    const [tab, setTab] = useState<'rules' | 'violations' | 'templates'>('rules')

    useEffect(() => {
        if (isOpen) {
            loadRules()
        }
    }, [isOpen, projectPath])

    const loadRules = async () => {
        setLoading(true)
        try {
            // This would call IPC handlers
            // const response = await window.api.rulesGetRuleSets()
            // if (response.success) {
            //     setRuleSets(response.ruleSets)
            // }
            // const activeResponse = await window.api.rulesGetActive()
            // if (activeResponse.success) {
            //     setActiveRules(activeResponse.rules)
            // }
        } catch (error) {
            console.error('Failed to load rules:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleToggleRule = async (ruleId: string, enabled: boolean) => {
        try {
            // const response = await window.api.rulesEnableRule(ruleId, projectPath)
            // if (response.success) {
            //     loadRules()
            // }
        } catch (error) {
            console.error('Failed to toggle rule:', error)
        }
    }

    const handleCreateRuleSet = async () => {
        const newRuleSet: RuleSet = {
            name: `custom-${Date.now()}`,
            version: '1.0.0',
            description: 'Custom rule set',
            rules: []
        }
        try {
            // const response = await window.api.rulesCreateRuleSet(newRuleSet, projectPath)
            // if (response.success) {
            //     loadRules()
            // }
        } catch (error) {
            console.error('Failed to create rule set:', error)
        }
    }

    const handleDeleteRuleSet = async (name: string) => {
        try {
            // const response = await window.api.rulesDeleteRuleSet(name, projectPath)
            // if (response.success) {
            //     loadRules()
            // }
        } catch (error) {
            console.error('Failed to delete rule set:', error)
        }
    }

    const handleRunRules = async () => {
        setLoading(true)
        try {
            // This would run rules on current code
            // const response = await window.api.rulesApplyToCode(code, filePath)
            // if (response.success) {
            //     setViolations(response.result.violations)
            // }
        } catch (error) {
            console.error('Failed to run rules:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="rules-panel">
            <div className="rules-panel__header">
                <h2>Team Rules</h2>
                <button onClick={onClose} className="rules-panel__close">×</button>
            </div>

            <div className="rules-panel__tabs">
                <button
                    className={`rules-panel__tab ${tab === 'rules' ? 'active' : ''}`}
                    onClick={() => setTab('rules')}
                >
                    Rules
                </button>
                <button
                    className={`rules-panel__tab ${tab === 'violations' ? 'active' : ''}`}
                    onClick={() => setTab('violations')}
                >
                    Violations
                </button>
                <button
                    className={`rules-panel__tab ${tab === 'templates' ? 'active' : ''}`}
                    onClick={() => setTab('templates')}
                >
                    Templates
                </button>
            </div>

            <div className="rules-panel__content">
                {tab === 'rules' && (
                    <div className="rules-panel__rules">
                        <div className="rules-panel__actions">
                            <button onClick={handleCreateRuleSet} className="rules-panel__button">
                                + New Rule Set
                            </button>
                            <button onClick={handleRunRules} className="rules-panel__button rules-panel__button--primary">
                                Run Rules
                            </button>
                        </div>

                        <div className="rules-panel__rule-sets">
                            <h3>Rule Sets ({ruleSets.length})</h3>
                            {loading ? (
                                <div className="rules-panel__loading">Loading...</div>
                            ) : (
                                <div className="rules-panel__rule-set-list">
                                    {ruleSets.map(ruleSet => (
                                        <div
                                            key={ruleSet.name}
                                            className={`rules-panel__rule-set ${selectedRuleSet?.name === ruleSet.name ? 'selected' : ''}`}
                                            onClick={() => setSelectedRuleSet(ruleSet)}
                                        >
                                            <div className="rules-panel__rule-set-header">
                                                <span className="rules-panel__rule-set-name">{ruleSet.name}</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeleteRuleSet(ruleSet.name)
                                                    }}
                                                    className="rules-panel__delete-button"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                            <div className="rules-panel__rule-set-description">
                                                {ruleSet.description}
                                            </div>
                                            <div className="rules-panel__rule-set-stats">
                                                {ruleSet.rules.length} rules
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {selectedRuleSet && (
                            <div className="rules-panel__rules-list">
                                <h3>Rules in {selectedRuleSet.name}</h3>
                                <div className="rules-panel__rule-items">
                                    {selectedRuleSet.rules.map(rule => (
                                        <div
                                            key={rule.id}
                                            className={`rules-panel__rule-item ${selectedRule?.id === rule.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedRule(rule)}
                                        >
                                            <div className="rules-panel__rule-header">
                                                <span className={`rules-panel__rule-status ${rule.enabled ? 'enabled' : 'disabled'}`}>
                                                    {rule.enabled ? '●' : '○'}
                                                </span>
                                                <span className="rules-panel__rule-name">{rule.name}</span>
                                                <span className={`rules-panel__rule-severity severity-${rule.severity}`}>
                                                    {rule.severity}
                                                </span>
                                            </div>
                                            <div className="rules-panel__rule-description">
                                                {rule.description}
                                            </div>
                                            <div className="rules-panel__rule-actions">
                                                <button
                                                    onClick={() => handleToggleRule(rule.id, !rule.enabled)}
                                                    className="rules-panel__toggle-button"
                                                >
                                                    {rule.enabled ? 'Disable' : 'Enable'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedRule && (
                            <div className="rules-panel__rule-details">
                                <h3>Rule Details: {selectedRule.name}</h3>
                                <div className="rules-panel__rule-detail">
                                    <label>Category:</label>
                                    <span>{selectedRule.category}</span>
                                </div>
                                <div className="rules-panel__rule-detail">
                                    <label>Severity:</label>
                                    <span>{selectedRule.severity}</span>
                                </div>
                                <div className="rules-panel__rule-detail">
                                    <label>Priority:</label>
                                    <span>{selectedRule.priority}</span>
                                </div>
                                <div className="rules-panel__rule-detail">
                                    <label>Patterns:</label>
                                    <div className="rules-panel__rule-patterns">
                                        {selectedRule.patterns.map((pattern, i) => (
                                            <code key={i}>{pattern}</code>
                                        ))}
                                    </div>
                                </div>
                                <div className="rules-panel__rule-detail">
                                    <label>Applies to:</label>
                                    <div className="rules-panel__rule-applies">
                                        {selectedRule.appliesTo.map((pattern, i) => (
                                            <span key={i}>{pattern}</span>
                                        ))}
                                    </div>
                                </div>
                                <div className="rules-panel__rule-detail">
                                    <label>Message:</label>
                                    <span>{selectedRule.message}</span>
                                </div>
                                {selectedRule.fix && (
                                    <div className="rules-panel__rule-detail">
                                        <label>Suggested Fix:</label>
                                        <span>{selectedRule.fix}</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'violations' && (
                    <div className="rules-panel__violations">
                        <div className="rules-panel__actions">
                            <button onClick={handleRunRules} className="rules-panel__button rules-panel__button--primary">
                                Run Rules
                            </button>
                        </div>

                        <h3>Rule Violations ({violations.length})</h3>
                        {loading ? (
                            <div className="rules-panel__loading">Running rules...</div>
                        ) : violations.length === 0 ? (
                            <div className="rules-panel__no-violations">No violations found</div>
                        ) : (
                            <div className="rules-panel__violation-list">
                                {violations.map((violation, index) => (
                                    <div key={index} className={`rules-panel__violation severity-${violation.severity}`}>
                                        <div className="rules-panel__violation-header">
                                            <span className="rules-panel__violation-rule">{violation.ruleName}</span>
                                            <span className={`rules-panel__violation-severity severity-${violation.severity}`}>
                                                {violation.severity}
                                            </span>
                                        </div>
                                        <div className="rules-panel__violation-message">
                                            {violation.message}
                                        </div>
                                        <div className="rules-panel__violation-location">
                                            {violation.filePath}:{violation.lineNumber}
                                        </div>
                                        {violation.fix && (
                                            <div className="rules-panel__violation-fix">
                                                <strong>Fix:</strong> {violation.fix}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'templates' && (
                    <div className="rules-panel__templates">
                        <h3>Rule Templates</h3>
                        <div className="rules-panel__template-list">
                            <div className="rules-panel__template">
                                <h4>JavaScript Best Practices</h4>
                                <p>Standard JavaScript/TypeScript coding standards</p>
                                <button className="rules-panel__button">Use Template</button>
                            </div>
                            <div className="rules-panel__template">
                                <h4>Python Style Guide</h4>
                                <p>PEP 8 compliant Python coding standards</p>
                                <button className="rules-panel__button">Use Template</button>
                            </div>
                            <div className="rules-panel__template">
                                <h4>Security Standards</h4>
                                <p>Security-focused coding rules</p>
                                <button className="rules-panel__button">Use Template</button>
                            </div>
                            <div className="rules-panel__template">
                                <h4>Performance Guidelines</h4>
                                <p>Performance optimization rules</p>
                                <button className="rules-panel__button">Use Template</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
