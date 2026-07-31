/**
 * Automation Editor
 * UI component for creating and editing automation workflows
 */

import React, { useState, useEffect } from 'react'
import type { AutomationWorkflow, AutomationTrigger, AutomationAction } from '../../features/automations'

interface AutomationEditorProps {
    workflow: AutomationWorkflow | null
    onSave: (workflow: AutomationWorkflow) => void
    onCancel: () => void
    availableTriggers: AutomationTrigger[]
    availableActions: AutomationAction[]
}

export function AutomationEditor({
    workflow,
    onSave,
    onCancel,
    availableTriggers,
    availableActions
}: AutomationEditorProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [triggers, setTriggers] = useState<AutomationTrigger[]>([])
    const [actions, setActions] = useState<AutomationAction[]>([])
    const [enabled, setEnabled] = useState(true)
    const [selectedTrigger, setSelectedTrigger] = useState<AutomationTrigger | null>(null)
    const [selectedAction, setSelectedAction] = useState<AutomationAction | null>(null)

    useEffect(() => {
        if (workflow) {
            setName(workflow.name)
            setDescription(workflow.description)
            setTriggers([...workflow.triggers])
            setActions([...workflow.actions])
            setEnabled(workflow.enabled)
        }
    }, [workflow])

    const handleAddTrigger = () => {
        const newTrigger: AutomationTrigger = {
            id: `trigger-${Date.now()}`,
            type: 'manual',
            config: {},
            enabled: true
        }
        setTriggers([...triggers, newTrigger])
        setSelectedTrigger(newTrigger)
    }

    const handleRemoveTrigger = (triggerId: string) => {
        setTriggers(triggers.filter(t => t.id !== triggerId))
        if (selectedTrigger?.id === triggerId) {
            setSelectedTrigger(null)
        }
    }

    const handleUpdateTrigger = (triggerId: string, updates: Partial<AutomationTrigger>) => {
        setTriggers(triggers.map(t => t.id === triggerId ? { ...t, ...updates } : t))
    }

    const handleAddAction = () => {
        const newAction: AutomationAction = {
            id: `action-${Date.now()}`,
            type: 'command',
            config: { command: '' },
            enabled: true
        }
        setActions([...actions, newAction])
        setSelectedAction(newAction)
    }

    const handleRemoveAction = (actionId: string) => {
        setActions(actions.filter(a => a.id !== actionId))
        if (selectedAction?.id === actionId) {
            setSelectedAction(null)
        }
    }

    const handleUpdateAction = (actionId: string, updates: Partial<AutomationAction>) => {
        setActions(actions.map(a => a.id === actionId ? { ...a, ...updates } : a))
    }

    const handleSave = () => {
        const newWorkflow: AutomationWorkflow = {
            id: workflow?.id || `workflow-${Date.now()}`,
            name,
            description,
            triggers,
            actions,
            enabled,
            createdAt: workflow?.createdAt || new Date(),
            updatedAt: new Date(),
            runCount: workflow?.runCount || 0,
            lastRun: workflow?.lastRun
        }
        onSave(newWorkflow)
    }

    return (
        <div className="automation-editor">
            <div className="automation-editor__header">
                <h3>{workflow ? 'Edit Automation' : 'New Automation'}</h3>
                <div className="automation-editor__actions">
                    <button onClick={onCancel} className="automation-editor__button">
                        Cancel
                    </button>
                    <button onClick={handleSave} className="automation-editor__button automation-editor__button--primary">
                        Save
                    </button>
                </div>
            </div>

            <div className="automation-editor__content">
                <div className="automation-editor__section">
                    <h4>Basic Information</h4>
                    <div className="automation-editor__field">
                        <label>Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Automation name"
                        />
                    </div>
                    <div className="automation-editor__field">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What does this automation do?"
                            rows={3}
                        />
                    </div>
                    <div className="automation-editor__field">
                        <label>
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(e) => setEnabled(e.target.checked)}
                            />
                            Enabled
                        </label>
                    </div>
                </div>

                <div className="automation-editor__section">
                    <div className="automation-editor__section-header">
                        <h4>Triggers ({triggers.length})</h4>
                        <button onClick={handleAddTrigger} className="automation-editor__add">
                            + Add Trigger
                        </button>
                    </div>
                    <div className="automation-editor__triggers">
                        {triggers.map(trigger => (
                            <div
                                key={trigger.id}
                                className={`automation-editor__trigger ${selectedTrigger?.id === trigger.id ? 'selected' : ''}`}
                                onClick={() => setSelectedTrigger(trigger)}
                            >
                                <div className="automation-editor__trigger-header">
                                    <span className="automation-editor__trigger-type">{trigger.type}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveTrigger(trigger.id)
                                        }}
                                        className="automation-editor__remove"
                                    >
                                        ×
                                    </button>
                                </div>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={trigger.enabled}
                                        onChange={(e) => handleUpdateTrigger(trigger.id, { enabled: e.target.checked })}
                                    />
                                    Enabled
                                </label>
                            </div>
                        ))}
                        {triggers.length === 0 && (
                            <div className="automation-editor__empty">No triggers configured</div>
                        )}
                    </div>
                </div>

                {selectedTrigger && (
                    <div className="automation-editor__section">
                        <h4>Trigger Configuration</h4>
                        <div className="automation-editor__config">
                            <div className="automation-editor__field">
                                <label>Type</label>
                                <select
                                    value={selectedTrigger.type}
                                    onChange={(e) => handleUpdateTrigger(selectedTrigger.id, { type: e.target.value as any })}
                                >
                                    <option value="manual">Manual</option>
                                    <option value="file_save">File Save</option>
                                    <option value="file_change">File Change</option>
                                    <option value="git_commit">Git Commit</option>
                                    <option value="time">Time-based</option>
                                    <option value="event">Custom Event</option>
                                </select>
                            </div>
                            {selectedTrigger.type === 'time' && (
                                <div className="automation-editor__field">
                                    <label>Schedule</label>
                                    <input
                                        type="text"
                                        value={selectedTrigger.config.schedule || ''}
                                        onChange={(e) => handleUpdateTrigger(selectedTrigger.id, {
                                            config: { ...selectedTrigger.config, schedule: e.target.value }
                                        })}
                                        placeholder="e.g., every 1 hour"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="automation-editor__section">
                    <div className="automation-editor__section-header">
                        <h4>Actions ({actions.length})</h4>
                        <button onClick={handleAddAction} className="automation-editor__add">
                            + Add Action
                        </button>
                    </div>
                    <div className="automation-editor__actions">
                        {actions.map((action, index) => (
                            <div
                                key={action.id}
                                className={`automation-editor__action ${selectedAction?.id === action.id ? 'selected' : ''}`}
                                onClick={() => setSelectedAction(action)}
                            >
                                <div className="automation-editor__action-header">
                                    <span className="automation-editor__action-index">{index + 1}.</span>
                                    <span className="automation-editor__action-type">{action.type}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveAction(action.id)
                                        }}
                                        className="automation-editor__remove"
                                    >
                                        ×
                                    </button>
                                </div>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={action.enabled}
                                        onChange={(e) => handleUpdateAction(action.id, { enabled: e.target.checked })}
                                    />
                                    Enabled
                                </label>
                            </div>
                        ))}
                        {actions.length === 0 && (
                            <div className="automation-editor__empty">No actions configured</div>
                        )}
                    </div>
                </div>

                {selectedAction && (
                    <div className="automation-editor__section">
                        <h4>Action Configuration</h4>
                        <div className="automation-editor__config">
                            <div className="automation-editor__field">
                                <label>Action Type</label>
                                <select
                                    value={selectedAction.type}
                                    onChange={(e) => handleUpdateAction(selectedAction.id, { type: e.target.value as any })}
                                >
                                    {availableActions.map(action => (
                                        <option key={action.type} value={action.type}>
                                            {action.type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {selectedAction.type === 'command' && (
                                <div className="automation-editor__field">
                                    <label>Command</label>
                                    <input
                                        type="text"
                                        value={selectedAction.config.command || ''}
                                        onChange={(e) => handleUpdateAction(selectedAction.id, {
                                            config: { ...selectedAction.config, command: e.target.value }
                                        })}
                                        placeholder="Shell command to execute"
                                    />
                                </div>
                            )}
                            {selectedAction.type === 'notification' && (
                                <>
                                    <div className="automation-editor__field">
                                        <label>Message</label>
                                        <input
                                            type="text"
                                            value={selectedAction.config.message || ''}
                                            onChange={(e) => handleUpdateAction(selectedAction.id, {
                                                config: { ...selectedAction.config, message: e.target.value }
                                        })}
                                            placeholder="Notification message"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
