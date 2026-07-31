import { useAppDispatch, useAppSelector } from '../app/hooks'

import { Switch } from '@headlessui/react'
import log from 'electron-log'
import { HOMEPAGE_ROOT } from '../utils'

import * as ssel from '../features/settings/settingsSelectors'
import {
    changeSettings,
    toggleSettings,
} from '../features/settings/settingsSlice'
import {
    copilotChangeEnable,
    copilotChangeSignin,
    getConnections,
    installLanguageServer,
    runLanguageServer,
    stopLanguageServer,
} from '../features/lsp/languageServerSlice'
// REMOVED CODEBASE-WIDE FEATURES!
// import { initializeIndex } from '../features/globalSlice'

import Dropdown from 'react-dropdown'
import 'react-dropdown/style.css'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
    copilotStatus,
    getLanguages,
    languageServerStatus,
} from '../features/lsp/languageServerSelector'

import {
    signInCursor,
    signOutCursor,
    upgradeCursor,
} from '../features/tools/toolSlice'
import { loginStatus } from '../features/tools/toolSelectors'

import Modal from 'react-modal'

export function SettingsPopup() {
    const dispatch = useAppDispatch()
    const settings = useAppSelector(ssel.getSettings)
    const isSettingsOpen = useAppSelector(ssel.getSettingsIsOpen)
    const languageServerNames = useAppSelector(getLanguages)
    const synced: boolean = useAppSelector(
        (state) => state.global.repoProgress.state == 'done'
    )
    const embeddingOptions = useMemo(() => {
        if (synced) {
            return ['embeddings', 'copilot', 'none']
        } else {
            return ['copilot', 'none']
        }
    }, [synced])
    const [uploadPreference, setUploadPreference] = useState(false)
    useEffect(() => {
        // @ts-ignore
        connector.getUploadPreference().then((preference) => {
            setUploadPreference(preference)
        })
    }, [isSettingsOpen])

    const customStyles = {
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            zIndex: 10000,
        },
        content: {
            padding: 'none',
            bottom: 'none',
            background: 'none',
            border: 'none',
            marginLeft: 'auto',
            marginRight: 'auto',
            top: '130px',
            right: '40px',
            left: 'none',
            width: '500px',
        },
    }

    return (
        <>
            <Modal
                isOpen={isSettingsOpen}
                onRequestClose={() => {
                    dispatch(toggleSettings())
                }}
                style={customStyles}
            >
                <div className="settingsContainer">
                    <div className="settings">
                        <div
                            className="settings__dismiss"
                            onClick={() => {
                                dispatch(toggleSettings())
                            }}
                        >
                            <i className="fas fa-times"></i>
                        </div>
                        <div className="settings__title">SETTINGS</div>
                        <div className="settings__content">
                            <div className="settings__item">
                                <div className="settings__item_title">
                                    Key Bindings
                                </div>
                                <div className="settings__item_description">
                                    Controls whether to use vim, emacs, or none
                                </div>
                                <Dropdown
                                    options={['none', 'vim', 'emacs']}
                                    onChange={(e) => {
                                        dispatch(
                                            changeSettings({
                                                keyBindings: e.value,
                                            })
                                        )
                                    }}
                                    value={settings.keyBindings}
                                />
                            </div>

                            <div className="settings__item">
                                <div className="settings__item_title">
                                    Text Wrapping
                                </div>
                                <div className="settings__item_description">
                                    Controls whether text wrapping is enabled
                                </div>
                                <Dropdown
                                    options={['enabled', 'disabled']}
                                    onChange={(e) => {
                                        dispatch(
                                            changeSettings({
                                                textWrapping: e.value,
                                            })
                                        )
                                    }}
                                    value={settings.textWrapping}
                                />
                            </div>

                            <div className="settings__item">
                                <div className="settings__item_title">
                                    Tab Size
                                </div>
                                <div className="settings__item_description">
                                    Controls the tab size
                                </div>
                                <Dropdown
                                    options={['2', '4', '8']}
                                    onChange={(e) => {
                                        dispatch(
                                            changeSettings({
                                                tabSize: e.value,
                                            })
                                        )
                                    }}
                                    value={settings.tabSize}
                                />
                            </div>

                            <CursorLogin />
                            <AIModelSettingsPanel />
                            <OpenAIPanel />
                            <CopilotPanel />
                            {/* REMOVED CODEBASE-WIDE FEATURES!
                            <RemoteCodebaseSettingsPanel />*/}
                            {languageServerNames.map((name) => (
                                <LanguageServerPanel
                                    key={name}
                                    languageName={name}
                                />
                            ))}
                        </div>
                    </div>
                    <div className="cover-bar"></div>
                </div>
            </Modal>
        </>
    )
}

export function OpenAILoginPanel({ onSubmit }: { onSubmit: () => void }) {
    const settings = useAppSelector(ssel.getSettings)
    const [localAPIKey, setLocalAPIKey] = useState('')
    const [models, setAvailableModels] = useState<string[]>([])
    const [keyError, showKeyError] = useState(false)
    const dispatch = useAppDispatch()

    // When the global openai key changes, we change this one
    useEffect(() => {
        if (settings.openAIKey && settings.openAIKey != localAPIKey) {
            setLocalAPIKey(settings.openAIKey)
            ssel.getModels(settings.openAIKey).then(
                ({ models, isValidKey }) => {
                    if (models) {
                        setAvailableModels(models)
                    }
                }
            )
        }
    }, [settings.openAIKey])

    useEffect(() => {
        showKeyError(false)
    }, [localAPIKey])

    const handleNewAPIKey = useCallback(async () => {
        const { models, isValidKey } = await ssel.getModels(localAPIKey)
        if (!isValidKey) {
            // Error, and we let them know
            showKeyError(true)
            setAvailableModels([])
        } else {
            setAvailableModels(models)
            dispatch(
                changeSettings({
                    openAIKey: localAPIKey,
                    useOpenAIKey: true,
                    openAIModel: models.at(0) ?? null,
                })
            )
            onSubmit()
        }
    }, [dispatch, localAPIKey])

    return (
        <div className="settings__item">
            <div className="flex">
                <input
                    className={`settings__item_textarea
                    ${keyError ? 'input-error' : ''}`}
                    placeholder="Enter your OpenAI API Key"
                    onChange={(e) => {
                        setLocalAPIKey(e.target.value)
                    }}
                    value={localAPIKey || ''}
                    spellCheck="false"
                />
                <button
                    className="settings__button"
                    onClick={() => {
                        handleNewAPIKey()
                    }}
                >
                    Submit
                </button>
            </div>
            {keyError && (
                <div className="error-message">
                    Invalid API Key. Please try again.
                </div>
            )}
            {settings.openAIKey && (
                <>
                    <div className="flex items-center">
                        <Switch
                            checked={settings.useOpenAIKey}
                            onChange={(value) =>
                                dispatch(
                                    changeSettings({ useOpenAIKey: value })
                                )
                            }
                            className={`${
                                settings.useOpenAIKey
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                            }
                                            mt-2 relative inline-flex h-[25px] w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
                        >
                            <span className="sr-only">Use setting</span>
                            <span
                                aria-hidden="true"
                                className={`${
                                    settings.useOpenAIKey
                                        ? 'translate-x-7'
                                        : 'translate-x-0'
                                }
                pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                            />
                        </Switch>
                        {settings.useOpenAIKey ? (
                            <span className="ml-2">Enabled</span>
                        ) : (
                            <span className="ml-2">Disabled</span>
                        )}
                    </div>
                    {settings.useOpenAIKey && (
                        <Dropdown
                            options={models}
                            onChange={(e) => {
                                dispatch(
                                    changeSettings({
                                        openAIModel: e.value,
                                    })
                                )
                            }}
                            value={settings.openAIModel}
                        />
                    )}
                </>
            )}
        </div>
    )
}

export function OpenAIPanel() {
    const settings = useAppSelector(ssel.getSettings)
    const [localAPIKey, setLocalAPIKey] = useState('')
    const [models, setAvailableModels] = useState<string[]>([])
    const [keyError, showKeyError] = useState(false)
    const dispatch = useAppDispatch()

    // When the global openai key changes, we change this one
    useEffect(() => {
        if (settings.openAIKey && settings.openAIKey != localAPIKey) {
            setLocalAPIKey(settings.openAIKey)
            ssel.getModels(settings.openAIKey).then(
                ({ models, isValidKey }) => {
                    if (models) {
                        setAvailableModels(models)
                    }
                }
            )
        }
    }, [settings.openAIKey])

    useEffect(() => {
        showKeyError(false)
    }, [localAPIKey])

    const handleNewAPIKey = useCallback(async () => {
        log.info('Validating new API key')
        const { models, isValidKey } = await ssel.getModels(localAPIKey)
        if (!isValidKey) {
            showKeyError(true)
            setAvailableModels([])
        } else {
            setAvailableModels(models)
            dispatch(
                changeSettings({
                    openAIKey: localAPIKey,
                    useOpenAIKey: true,
                    openAIModel: models.at(0) ?? null,
                })
            )
        }
    }, [dispatch, localAPIKey])

    return (
        <div className="settings__item">
            <div className="settings__item_title">OpenAI API Key</div>
            <div className="settings__item_description">
                You can enter an OpenAI API key to use Cursor at-cost
            </div>
            <div className="flex">
                <input
                    className={`settings__item_textarea
                    ${keyError ? 'input-error' : ''}`}
                    placeholder="Enter your OpenAI API Key"
                    onChange={(e) => {
                        setLocalAPIKey(e.target.value)
                    }}
                    value={localAPIKey || ''}
                    spellCheck="false"
                />
                <button
                    className="settings__button"
                    onClick={() => {
                        handleNewAPIKey()
                    }}
                >
                    Submit
                </button>
            </div>
            {keyError && (
                <div className="error-message">
                    Invalid API Key. Please try again.
                </div>
            )}
            {settings.openAIKey && (
                <>
                    <div className="flex items-center">
                        <Switch
                            checked={settings.useOpenAIKey}
                            onChange={(value) =>
                                dispatch(
                                    changeSettings({ useOpenAIKey: value })
                                )
                            }
                            className={`${
                                settings.useOpenAIKey
                                    ? 'bg-green-500'
                                    : 'bg-red-500'
                            }
                                            mt-2 relative inline-flex h-[24px] w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
                        >
                            <span className="sr-only">Use setting</span>
                            <span
                                aria-hidden="true"
                                className={`${
                                    settings.useOpenAIKey
                                        ? 'translate-x-7'
                                        : 'translate-x-0'
                                }
                pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                            />
                        </Switch>
                        {settings.useOpenAIKey ? (
                            <span className="ml-2">Enabled</span>
                        ) : (
                            <span className="ml-2">Disabled</span>
                        )}
                    </div>
                    {settings.useOpenAIKey && (
                        <Dropdown
                            options={models}
                            onChange={(e) => {
                                dispatch(
                                    changeSettings({
                                        openAIModel: e.value,
                                    })
                                )
                            }}
                            value={settings.openAIModel}
                        />
                    )}
                </>
            )}
        </div>
    )
}

export function CursorLogin({
    showSettings = true,
}: {
    showSettings?: boolean
}) {
    const dispatch = useAppDispatch()

    const { signedIn, proVersion } = useAppSelector(loginStatus)

    const signIn = useCallback(() => {
        dispatch(signInCursor(null))
    }, [])
    const signOut = useCallback(() => {
        dispatch(signOutCursor(null))
    }, [])

    const upgrade = useCallback(() => {
        dispatch(upgradeCursor(null))
    }, [])
    const openAccountSettings = useCallback(() => {
        window.open(`${HOMEPAGE_ROOT}/settings`, '_blank')
    }, [])

    let currentPanel
    if (!signedIn) {
        currentPanel = (
            <div className="settings__item">
                <div className="settings__item_title">Cursor Account</div>
                <div className="settings__item_description">
                    Login to use the AI without an API key
                </div>
                <div className="copilot__signin">
                    <button onClick={signIn}>Sign in</button>
                    <br />
                    <button onClick={signIn}>Sign up</button>
                </div>
            </div>
        )
    } else {
        if (proVersion) {
            currentPanel = (
                <div className="settings__item">
                    <div className="settings__item_title">Cursor Account</div>
                    <div className="settings__item_description">
                        Login to use the AI without an API key
                    </div>
                    <div className="copilot__signin">
                        <button onClick={signOut}>Log out</button>
                        {showSettings && (
                            <>
                                <br />
                                <button onClick={openAccountSettings}>
                                    Manage settings
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )
        } else {
            currentPanel = (
                <>
                    <div className="settings__item">
                        <div className="settings__item_title">
                            Cursor Account
                        </div>
                        <div className="settings__item_description">
                            Login to use the AI without an API key
                        </div>
                        <div className="copilot__signin">
                            <button onClick={signOut}>Log out</button>
                            {showSettings && (
                                <>
                                    <br />
                                    <button onClick={openAccountSettings}>
                                        Manage settings
                                    </button>
                                </>
                            )}
                            <br />
                        </div>
                    </div>
                    <div className="settings__item">
                        <div className="settings__item_title">Cursor Pro</div>
                        <div className="settings__item_description">
                            Upgrade for unlimited generations
                        </div>
                        <div className="copilot__signin">
                            <button onClick={upgrade}>Upgrade to Pro</button>
                        </div>
                    </div>
                </>
            )
        }
    }

    return currentPanel
}

function CopilotPanel() {
    const dispatch = useAppDispatch()
    const { signedIn, enabled } = useAppSelector(copilotStatus)
    const [localState, setLocalState] = useState<
        'signedIn' | 'signingIn' | 'signInFailed' | 'signedOut'
    >(signedIn ? 'signedIn' : 'signedOut')
    const [localData, setLocalData] = useState<{ url: string; code: string }>()
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        setLocalState(signedIn ? 'signedIn' : 'signedOut')
    }, [signedIn])

    const trySignIn = useCallback(async () => {
        const copilotClient = getConnections().copilot.client
        setLoading(true)
        const { verificationUri, status, userCode } =
            await copilotClient.signInInitiate({})

        if (status == 'OK' || status == 'AlreadySignedIn') {
            dispatch(copilotChangeSignin(true))
        } else {
            setLocalState('signingIn')
            setLocalData({ url: verificationUri, code: userCode })
        }
        setLoading(false)
    }, [setLocalState, setLocalData, dispatch])

    const tryFinishSignIn = useCallback(async () => {
        const copilotClient = getConnections().copilot.client
        const { status } = await copilotClient.signInConfirm({
            userCode: localData!.code,
        })

        if (status == 'OK' || status == 'AlreadySignedIn') {
            dispatch(copilotChangeSignin(true))
        } else {
            setLocalState
        }
    }, [localData, setLocalState, dispatch])

    const signOut = useCallback(async () => {
        const copilotClient = getConnections().copilot.client
        await copilotClient.signOut()
        dispatch(copilotChangeSignin(false))
    }, [])

    const enableCopilot = useCallback(() => {
        dispatch(copilotChangeEnable(true))
    }, [dispatch])

    const disableCopilot = useCallback(() => {
        dispatch(copilotChangeEnable(false))
    }, [dispatch])

    let currentPanel
    if (localState == 'signedOut') {
        currentPanel = (
            <div className="copilot__signin">
                <button onClick={trySignIn}>Sign in</button>
            </div>
        )
    } else if (localState == 'signingIn') {
        currentPanel = (
            <div className="copilot__signin">
                Please click this link:&nbsp;&nbsp;
                <a href={localData?.url} target="_blank">
                    {localData?.url}
                </a>
                <br />
                Enter this code: {localData?.code}
                <br />
                Click here when done:
                <button onClick={tryFinishSignIn}>Done</button>
            </div>
        )
    } else if (localState == 'signInFailed') {
        currentPanel = (
            <div className="copilot__signin">
                Sign in failed. Please try again.
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <button onClick={trySignIn}>Sign in</button>
                )}
            </div>
        )
    } else {
        currentPanel = (
            <div className="copilot__signin">
                Currently signed in <br />
                {enabled ? (
                    <button onClick={disableCopilot}>Disable</button>
                ) : (
                    <button onClick={enableCopilot}>Enable</button>
                )}
                <br />
                <button onClick={signOut}>Sign out</button>
            </div>
        )
    }

    return (
        <div className="settings__item">
            <div className="settings__item_title">Copilot</div>
            {currentPanel}
        </div>
    )
}
// REMOVED CODEBASE-WIDE FEATURES!
// function RemoteCodebaseSettingsPanel() {
//     const dispatch = useAppDispatch()
//     const repoId = useAppSelector((state) => state.global.repoId)
//     const rootDir = useAppSelector(getRootPath)
//     const progress = useAppSelector(getProgress)
//     const finished = useMemo(() => progress.state == 'done', [progress])

//     const startUpload = useCallback(async () => {
//         dispatch(initializeIndex(rootDir!))
//     }, [dispatch])

//     let container
//     if (repoId == null) {
//         container = (
//             <div className="remote_codebase__container">
//                 <button onClick={startUpload}>Start Index</button>
//             </div>
//         )
//     } else if (!finished) {
//         container = (
//             <div className="remote_codebase__container">
//                 <div className="remote_codebase__text">
//                     {(() => {
//                         switch (progress.state) {
//                             case 'notStarted':
//                                 return 'Not started'
//                             case 'uploading':
//                                 return 'Uploading...'
//                             case 'indexing':
//                                 return 'Indexing...'
//                             case 'done':
//                                 return 'Done!'
//                             case 'error':
//                                 return 'Failed!'
//                             case null:
//                                 return <br />
//                         }
//                     })()}
//                 </div>
//                 {progress.state != 'notStarted' && progress.state != null && (
//                     <>
//                         <div className="remote_codebase__progress">
//                             <div
//                                 className="remote_codebase__progress_bar"
//                                 style={{
//                                     width: `${progress.progress * 100}%`,
//                                     color: 'green',
//                                 }}
//                             />
//                         </div>
//                         <div className="remote_codebase__progress_text">
//                             {Math.floor(progress.progress * 100.0)}%
//                         </div>
//                     </>
//                 )}
//             </div>
//         )
//     } else {
//         container = (
//             <div className="remote_codebase__container">
//                 <div className="remote_codebase__progress_text">Done!</div>
//             </div>
//         )
//     }

//     return <div className="settings__item"></div>
// }

function AIModelSettingsPanel() {
    const dispatch = useAppDispatch()
    const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google' | 'custom'>('openai')
    const [model, setModel] = useState('gpt-4o')
    const [apiKey, setApiKey] = useState('')
    const [customEndpoint, setCustomEndpoint] = useState('')
    const [fallbackEnabled, setFallbackEnabled] = useState(true)
    const [fallbackProvider, setFallbackProvider] = useState<'openai' | 'anthropic' | 'google' | 'custom'>('anthropic')
    const [temperature, setTemperature] = useState(0.7)
    const [maxTokens, setMaxTokens] = useState(4096)
    const [showApiKey, setShowApiKey] = useState(false)
    const [availableModels, setAvailableModels] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle')

    const providerOptions = [
        { value: 'openai', label: 'OpenAI' },
        { value: 'anthropic', label: 'Anthropic' },
        { value: 'google', label: 'Google' },
        { value: 'custom', label: 'Custom' }
    ]

    // Load available models on mount
    useEffect(() => {
        loadAvailableModels()
        loadCurrentSettings()
    }, [])

    const loadAvailableModels = async () => {
        try {
            // @ts-ignore
            const result = await window.electron.ipcRenderer.invoke('ai-service-get-models')
            if (result.success) {
                setAvailableModels(result.models)
            }
        } catch (error) {
            console.error('Failed to load available models:', error)
        }
    }

    const loadCurrentSettings = async () => {
        try {
            // @ts-ignore
            const result = await window.electron.ipcRenderer.invoke('model-config-get-all-settings')
            if (result.success) {
                const settings = result.settings
                if (settings.preferredProvider) setProvider(settings.preferredProvider)
                if (settings.preferredModel) setModel(settings.preferredModel)
                if (settings.fallbackEnabled !== undefined) setFallbackEnabled(settings.fallbackEnabled)
                if (settings.fallbackProvider) setFallbackProvider(settings.fallbackProvider)

                // Load API key for current provider
                if (settings.preferredProvider) {
                    // @ts-ignore
                    const keyResult = await window.electron.ipcRenderer.invoke('model-config-get-api-key', settings.preferredProvider)
                    if (keyResult.success && keyResult.apiKey) {
                        setApiKey(keyResult.apiKey)
                    }
                }
            }
        } catch (error) {
            console.error('Failed to load current settings:', error)
        }
    }

    const modelOptions = useMemo(() => {
        const providerModels = availableModels
            .filter(m => m.provider === provider)
            .map(m => ({ value: m.id, label: m.name }))

        if (providerModels.length > 0) {
            return providerModels
        }

        // Fallback to hardcoded options
        switch (provider) {
            case 'openai':
                return [
                    { value: 'gpt-4o', label: 'GPT-4o' },
                    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
                    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' }
                ]
            case 'anthropic':
                return [
                    { value: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet' },
                    { value: 'claude-3-opus', label: 'Claude 3 Opus' }
                ]
            case 'google':
                return [
                    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' }
                ]
            default:
                return []
        }
    }, [provider, availableModels])

    const handleProviderChange = async (value: string) => {
        setProvider(value as any)
        // Reset model when provider changes
        const models = modelOptions
        if (models.length > 0) {
            setModel(models[0].value)
        }

        // Load API key for new provider
        try {
            // @ts-ignore
            const keyResult = await window.electron.ipcRenderer.invoke('model-config-get-api-key', value)
            if (keyResult.success && keyResult.apiKey) {
                setApiKey(keyResult.apiKey)
            } else {
                setApiKey('')
            }
        } catch (error) {
            console.error('Failed to load API key for provider:', error)
        }
    }

    const handleSaveConfig = async () => {
        setLoading(true)
        setSaveStatus('saving')

        try {
            // Save API key
            if (apiKey) {
                // @ts-ignore
                await window.electron.ipcRenderer.invoke('model-config-set-api-key', provider, apiKey)
            }

            // Save custom endpoint if provided
            if (customEndpoint && provider === 'custom') {
                // @ts-ignore
                await window.electron.ipcRenderer.invoke('model-config-set-custom-endpoint', provider, customEndpoint)
            }

            // Save model selection
            // @ts-ignore
            await window.electron.ipcRenderer.invoke('ai-service-set-model', model)

            // Save fallback settings
            // @ts-ignore
            await window.electron.ipcRenderer.invoke('model-config-set-fallback-enabled', fallbackEnabled)
            if (fallbackEnabled) {
                // @ts-ignore
                await window.electron.ipcRenderer.invoke('model-config-set-fallback-provider', fallbackProvider)
            }

            // Save model preferences
            // @ts-ignore
            await window.electron.ipcRenderer.invoke('model-config-set-model-preference', model, {
                temperature,
                maxTokens
            })

            setSaveStatus('success')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } catch (error) {
            console.error('Failed to save AI config:', error)
            setSaveStatus('error')
            setTimeout(() => setSaveStatus('idle'), 2000)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="settings__item">
            <div className="settings__item_title">
                AI Model Configuration
            </div>
            <div className="settings__item_description">
                Configure AI provider and model settings
            </div>

            <div className="settings__subitem">
                <div className="settings__subitem_title">Provider</div>
                <Dropdown
                    options={providerOptions}
                    onChange={(e) => handleProviderChange(e.value)}
                    value={provider}
                />
            </div>

            {provider !== 'custom' && (
                <div className="settings__subitem">
                    <div className="settings__subitem_title">Model</div>
                    <Dropdown
                        options={modelOptions}
                        onChange={(e) => setModel(e.value)}
                        value={model}
                    />
                </div>
            )}

            <div className="settings__subitem">
                <div className="settings__subitem_title">API Key</div>
                <div className="flex">
                    <input
                        className="settings__item_textarea"
                        type={showApiKey ? 'text' : 'password'}
                        placeholder={`Enter ${provider} API Key`}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        spellCheck="false"
                    />
                    <button
                        className="settings__button"
                        onClick={() => setShowApiKey(!showApiKey)}
                    >
                        {showApiKey ? 'Hide' : 'Show'}
                    </button>
                </div>
            </div>

            {provider === 'custom' && (
                <div className="settings__subitem">
                    <div className="settings__subitem_title">Custom Endpoint</div>
                    <input
                        className="settings__item_textarea"
                        placeholder="https://api.example.com/v1"
                        value={customEndpoint}
                        onChange={(e) => setCustomEndpoint(e.target.value)}
                        spellCheck="false"
                    />
                </div>
            )}

            <div className="settings__subitem">
                <div className="settings__subitem_title">Temperature: {temperature}</div>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="settings__slider"
                />
            </div>

            <div className="settings__subitem">
                <div className="settings__subitem_title">Max Tokens: {maxTokens}</div>
                <input
                    type="number"
                    min="1"
                    max="128000"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                    className="settings__item_textarea"
                />
            </div>

            <div className="settings__subitem">
                <div className="flex items-center">
                    <Switch
                        checked={fallbackEnabled}
                        onChange={setFallbackEnabled}
                        className={`${
                            fallbackEnabled ? 'bg-green-500' : 'bg-red-500'
                        } mt-2 relative inline-flex h-[25px] w-[52px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
                    >
                        <span className="sr-only">Enable fallback</span>
                        <span
                            aria-hidden="true"
                            className={`${
                                fallbackEnabled ? 'translate-x-7' : 'translate-x-0'
                            } pointer-events-none inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
                        />
                    </Switch>
                    <span className="ml-2">Enable Fallback</span>
                </div>
            </div>

            {fallbackEnabled && (
                <div className="settings__subitem">
                    <div className="settings__subitem_title">Fallback Provider</div>
                    <Dropdown
                        options={providerOptions.filter(p => p.value !== provider)}
                        onChange={(e) => setFallbackProvider(e.value as any)}
                        value={fallbackProvider}
                    />
                </div>
            )}

            <div className="settings__button_container">
                <button
                    className="settings__button"
                    onClick={handleSaveConfig}
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Configuration'}
                </button>
                {saveStatus === 'success' && (
                    <span className="text-green-500 ml-2">✓ Saved</span>
                )}
                {saveStatus === 'error' && (
                    <span className="text-red-500 ml-2">✗ Error</span>
                )}
            </div>
        </div>
    )
}

function LanguageServerPanel({ languageName }: { languageName: string }) {
    const dispatch = useAppDispatch()
    const languageState = useAppSelector(languageServerStatus(languageName))

    const languageInstalled = useMemo(
        () => languageState && languageState.installed,
        [languageState]
    )
    const languageRunning = useMemo(
        () => languageState && languageState.running,
        [languageState]
    )

    const installServer = useCallback(async () => {
        await dispatch(installLanguageServer(languageName))
    }, [languageName])

    const runServer = useCallback(async () => {
        await dispatch(runLanguageServer(languageName))
    }, [languageName])
    const stopServer = useCallback(async () => {
        await dispatch(stopLanguageServer(languageName))
    }, [languageName])

    let container
    if (languageInstalled) {
        container = (
            <div className="language_server__container">
                <div className="language_server__status">
                    {languageRunning ? 'Running' : 'Stopped'}
                </div>
                <div className="copilot__signin">
                    {languageRunning ? (
                        <button onClick={stopServer}>Stop</button>
                    ) : (
                        <button onClick={runServer}>Run</button>
                    )}
                </div>
            </div>
        )
    } else {
        container = (
            <div className="copilot__signin">
                <button onClick={installServer}>Install</button>
            </div>
        )
    }

    return (
        <div className="settings__item">
            <div className="settings__item_title">
                {languageName} Language Server
            </div>
            {container}
        </div>
    )
}
