/**
 * Cloud Agent Management Panel
 * UI component for managing cloud agents and instances
 */

import React, { useState, useEffect } from 'react'
import type { CloudAgentConfig, CloudAgentInstance, CloudAgentTask } from '../../features/cloudAgent'

interface CloudAgentPanelProps {
    isOpen: boolean
    onClose: () => void
}

export function CloudAgentPanel({ isOpen, onClose }: CloudAgentPanelProps) {
    const [tab, setTab] = useState<'configs' | 'instances' | 'tasks'>('configs')
    const [configs, setConfigs] = useState<CloudAgentConfig[]>([])
    const [instances, setInstances] = useState<CloudAgentInstance[]>([])
    const [tasks, setTasks] = useState<CloudAgentTask[]>([])
    const [selectedConfig, setSelectedConfig] = useState<CloudAgentConfig | null>(null)
    const [selectedInstance, setSelectedInstance] = useState<CloudAgentInstance | null>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (isOpen) {
            loadData()
        }
    }, [isOpen])

    const loadData = async () => {
        setLoading(true)
        try {
            // This would call IPC handlers
            // const configsResponse = await window.api.cloudAgentGetConfigs()
            // if (configsResponse.success) {
            //     setConfigs(configsResponse.configs)
            // }
            // Similar for instances and tasks
        } catch (error) {
            console.error('Failed to load cloud agent data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleProvisionInstance = async (configId: string) => {
        setLoading(true)
        try {
            // const response = await window.api.cloudAgentProvisionInstance(configId)
            // if (response.success) {
            //     loadData()
            // }
        } catch (error) {
            console.error('Failed to provision instance:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDeprovisionInstance = async (instanceId: string) => {
        setLoading(true)
        try {
            // const response = await window.api.cloudAgentDeprovisionInstance(instanceId)
            // if (response.success) {
            //     loadData()
            // }
        } catch (error) {
            console.error('Failed to deprovision instance:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="cloud-agent-panel">
            <div className="cloud-agent-panel__header">
                <h2>Cloud Agent Platform</h2>
                <button onClick={onClose} className="cloud-agent-panel__close">×</button>
            </div>

            <div className="cloud-agent-panel__tabs">
                <button
                    className={`cloud-agent-panel__tab ${tab === 'configs' ? 'active' : ''}`}
                    onClick={() => setTab('configs')}
                >
                    Configs ({configs.length})
                </button>
                <button
                    className={`cloud-agent-panel__tab ${tab === 'instances' ? 'active' : ''}`}
                    onClick={() => setTab('instances')}
                >
                    Instances ({instances.length})
                </button>
                <button
                    className={`cloud-agent-panel__tab ${tab === 'tasks' ? 'active' : ''}`}
                    onClick={() => setTab('tasks')}
                >
                    Tasks ({tasks.length})
                </button>
            </div>

            <div className="cloud-agent-panel__content">
                {tab === 'configs' && (
                    <div className="cloud-agent-panel__configs">
                        <div className="cloud-agent-panel__actions">
                            <button className="cloud-agent-panel__button cloud-agent-panel__button--primary">
                                + New Config
                            </button>
                        </div>

                        {loading ? (
                            <div className="cloud-agent-panel__loading">Loading...</div>
                        ) : configs.length === 0 ? (
                            <div className="cloud-agent-panel__empty">No configurations</div>
                        ) : (
                            <div className="cloud-agent-panel__list">
                                {configs.map(config => (
                                    <div
                                        key={config.id}
                                        className={`cloud-agent-panel__item ${selectedConfig?.id === config.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedConfig(config)}
                                    >
                                        <div className="cloud-agent-panel__item-header">
                                            <span className="cloud-agent-panel__item-name">{config.name}</span>
                                            <span className={`cloud-agent-panel__provider provider-${config.provider}`}>
                                                {config.provider}
                                            </span>
                                        </div>
                                        <div className="cloud-agent-panel__item-details">
                                            <span>Region: {config.region}</span>
                                            <span>Type: {config.instanceType}</span>
                                            <span>Max Agents: {config.maxConcurrentAgents}</span>
                                        </div>
                                        <div className="cloud-agent-panel__item-actions">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleProvisionInstance(config.id)
                                                }}
                                                className="cloud-agent-panel__action"
                                            >
                                                Provision
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'instances' && (
                    <div className="cloud-agent-panel__instances">
                        <div className="cloud-agent-panel__actions">
                            <button className="cloud-agent-panel__button cloud-agent-panel__button--primary">
                                Refresh
                            </button>
                        </div>

                        {loading ? (
                            <div className="cloud-agent-panel__loading">Loading...</div>
                        ) : instances.length === 0 ? (
                            <div className="cloud-agent-panel__empty">No instances running</div>
                        ) : (
                            <div className="cloud-agent-panel__list">
                                {instances.map(instance => (
                                    <div
                                        key={instance.id}
                                        className={`cloud-agent-panel__item ${selectedInstance?.id === instance.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedInstance(instance)}
                                    >
                                        <div className="cloud-agent-panel__item-header">
                                            <span className="cloud-agent-panel__item-name">{instance.id}</span>
                                            <span className={`cloud-agent-panel__status status-${instance.status}`}>
                                                {instance.status}
                                            </span>
                                        </div>
                                        <div className="cloud-agent-panel__item-details">
                                            <span>IP: {instance.ipAddress || 'N/A'}</span>
                                            <span>Tasks: {instance.tasks.length}</span>
                                            <span>CPU: {instance.resources.cpu} cores</span>
                                            <span>Memory: {instance.resources.memory} MB</span>
                                        </div>
                                        <div className="cloud-agent-panel__item-actions">
                                            {instance.status === 'running' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        handleDeprovisionInstance(instance.id)
                                                    }}
                                                    className="cloud-agent-panel__action cloud-agent-panel__action--danger"
                                                >
                                                    Stop
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'tasks' && (
                    <div className="cloud-agent-panel__tasks">
                        <div className="cloud-agent-panel__actions">
                            <button className="cloud-agent-panel__button cloud-agent-panel__button--primary">
                                + New Task
                            </button>
                        </div>

                        {loading ? (
                            <div className="cloud-agent-panel__loading">Loading...</div>
                        ) : tasks.length === 0 ? (
                            <div className="cloud-agent-panel__empty">No tasks</div>
                        ) : (
                            <div className="cloud-agent-panel__list">
                                {tasks.map(task => (
                                    <div key={task.id} className="cloud-agent-panel__item">
                                        <div className="cloud-agent-panel__item-header">
                                            <span className="cloud-agent-panel__item-name">{task.id}</span>
                                            <span className={`cloud-agent-panel__status status-${task.status}`}>
                                                {task.status}
                                            </span>
                                        </div>
                                        <div className="cloud-agent-panel__item-details">
                                            <span>Instance: {task.instanceId}</span>
                                            <span>Priority: {task.priority}</span>
                                            {task.executionTime && (
                                                <span>Duration: {task.executionTime}ms</span>
                                            )}
                                        </div>
                                        {task.error && (
                                            <div className="cloud-agent-panel__error">
                                                Error: {task.error}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedConfig && (
                <div className="cloud-agent-panel__details">
                    <div className="cloud-agent-panel__details-header">
                        <h4>Config Details: {selectedConfig.name}</h4>
                        <button onClick={() => setSelectedConfig(null)}>×</button>
                    </div>
                    <div className="cloud-agent-panel__details-content">
                        <div className="cloud-agent-panel__detail">
                            <label>Provider:</label>
                            <span>{selectedConfig.provider}</span>
                        </div>
                        <div className="cloud-agent-panel__detail">
                            <label>Region:</label>
                            <span>{selectedConfig.region}</span>
                        </div>
                        <div className="cloud-agent-panel__detail">
                            <label>Instance Type:</label>
                            <span>{selectedConfig.instanceType}</span>
                        </div>
                        <div className="cloud-agent-panel__detail">
                            <label>Max Concurrent Agents:</label>
                            <span>{selectedConfig.maxConcurrentAgents}</span>
                        </div>
                        <div className="cloud-agent-panel__detail">
                            <label>Auto Scaling:</label>
                            <span>{selectedConfig.autoScaling ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div className="cloud-agent-panel__detail">
                            <label>Security:</label>
                            <span>{selectedConfig.securityEnabled ? 'Enabled' : 'Disabled'}</span>
                        </div>
                    </div>
                </div>
            )}

            {selectedInstance && (
                <div className="cloud-agent-panel__details">
                    <div className="cloud-agent-panel__details-header">
                        <h4>Instance Details: {selectedInstance.id}</h4>
                        <button onClick={() => setSelectedInstance(null)}>×</button>
                    </div>
                    <div className="cloud-agent-panel__details-content">
                        <div className="cloud-agent-panel__detail">
                            <label>Status:</label>
                            <span>{selectedInstance.status}</span>
                        </div>
                        <div className="cloud-agent-panel__detail">
                            <label>Created:</label>
                            <span>{selectedInstance.createdAt.toLocaleString()}</span>
                        </div>
                        {selectedInstance.startedAt && (
                            <div className="cloud-agent-panel__detail">
                                <label>Started:</label>
                                <span>{selectedInstance.startedAt.toLocaleString()}</span>
                            </div>
                        )}
                        {selectedInstance.ipAddress && (
                            <div className="cloud-agent-panel__detail">
                                <label>IP Address:</label>
                                <span>{selectedInstance.ipAddress}</span>
                            </div>
                        )}
                        {selectedInstance.endpoint && (
                            <div className="cloud-agent-panel__detail">
                                <label>Endpoint:</label>
                                <span>{selectedInstance.endpoint}</span>
                            </div>
                        )}
                        <div className="cloud-agent-panel__detail">
                            <label>Resources:</label>
                            <span>
                                CPU: {selectedInstance.resources.cpu} cores, 
                                Memory: {selectedInstance.resources.memory} MB, 
                                Storage: {selectedInstance.resources.storage} GB
                            </span>
                        </div>
                        <div className="cloud-agent-panel__detail">
                            <label>Active Tasks:</label>
                            <span>{selectedInstance.tasks.length}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
