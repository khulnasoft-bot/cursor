import { PayloadAction, createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { addTransaction } from '../globalSlice'
import { FullState, State, initialState } from '../window/state'
import { getFilePath } from '../selectors'
import { API_ROOT, streamSource } from '../../utils'
import { getAgentWorkerManager } from '../../workers'
import { getEnhancedCompletionService } from './enhancedCompletion'

const API_ENDPOINT = '/long_complete'

export const startCompletion = createAsyncThunk(
    'generation/start_completion',
    async (tabId: number, { getState, dispatch }) => {
        const getTab = () => (<FullState>getState()).global.tabs[tabId]

        // If already generating, we do nothing
        if (getTab().generating) {
            return
        }

        const state = <FullState>getState()
        const initialEditorState =
            state.global.tabCache[tabId].initialEditorState
        const fileId = state.global.tabs[tabId].fileId

        const file = getFilePath(fileId)(state)
        const content = initialEditorState!.doc.toString()
        const pos = initialEditorState!.selection.ranges[0].anchor

        // Calculate cursor line and column
        const lines = content.split('\n')
        let cursorLine = 1
        let cursorColumn = pos
        for (let i = 0; i < lines.length; i++) {
            if (cursorColumn <= lines[i].length + 1) {
                cursorLine = i + 1
                break
            }
            cursorColumn -= lines[i].length + 1
        }

        dispatch(generationSlice.actions.pending(tabId))

        try {
            // Try enhanced completion first
            const enhancedService = getEnhancedCompletionService()
            let currentPos = pos
            let notStarted = true

            try {
                // Build completion context
                const completionContext = {
                    file,
                    content,
                    position: pos,
                    precedingCode: content.substring(0, pos),
                    followingCode: content.substring(pos),
                    language: undefined, // Will be detected from file extension
                    projectPath: state.global.rootPath,
                    cursorLine,
                    cursorColumn
                }

                const result = await enhancedService.getCompletion({
                    context: completionContext,
                    maxLines: 10,
                    includeImports: true,
                    predictNextEdit: true
                })

                if (result.completion) {
                    // If interrupted, we stop
                    if (getTab().interrupted) return

                    // Insert suggested imports if any
                    if (result.suggestedImports && result.suggestedImports.length > 0) {
                        const importText = result.suggestedImports.join('\n') + '\n'
                        dispatch(
                            addTransaction({
                                tabId: tabId,
                                transactionFunction: {
                                    type: 'insert',
                                    from: 0,
                                    to: 0,
                                    text: importText,
                                },
                            })
                        )
                        currentPos += importText.length
                    }

                    // Insert completion
                    dispatch(
                        addTransaction({
                            tabId: tabId,
                            transactionFunction: {
                                type: 'insert',
                                from: currentPos,
                                to: currentPos,
                                text: result.completion,
                            },
                        })
                    )

                    // Store next edit location prediction for future use
                    if (result.nextEditLocation) {
                        // Could store this in state for highlighting
                        console.log('Next edit location predicted:', result.nextEditLocation)
                    }
                }
            } catch (enhancedError) {
                console.warn('Enhanced completion failed, falling back to worker:', enhancedError)

                // Fallback to worker manager
                const workerManager = getAgentWorkerManager()

                try {
                    const result = await workerManager.completion(
                        file,
                        content,
                        pos,
                        (progress) => {
                            if (notStarted && progress > 0) {
                                notStarted = false
                                dispatch(generationSlice.actions.starting(tabId))
                            }
                        }
                    )

                    if (result.completion) {
                        // If interrupted, we stop
                        if (getTab().interrupted) return

                        dispatch(
                            addTransaction({
                                tabId: tabId,
                                transactionFunction: {
                                    type: 'insert',
                                    from: currentPos,
                                    to: currentPos,
                                    text: result.completion,
                                },
                            })
                        )
                    }
                } catch (workerError) {
                    // Final fallback to API
                    console.warn('Agent worker failed, falling back to API:', workerError)

                    const path = API_ROOT + API_ENDPOINT
                    const data = {
                        file,
                        content,
                        pos: pos,
                    }

                    const response = await fetch(path, {
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json;charset=UTF-8',
                        },
                        body: JSON.stringify(data),
                    })

                    for await (const token of streamSource(response)) {
                        if (notStarted) {
                            notStarted = false
                            dispatch(generationSlice.actions.starting(tabId))
                        }

                        // If interrupted, we stop
                        if (getTab().interrupted) break

                        dispatch(
                            addTransaction({
                                tabId: tabId,
                                transactionFunction: {
                                    type: 'insert',
                                    from: currentPos,
                                    to: currentPos,
                                    text: token,
                                },
                            })
                        )
                        currentPos += token.length
                    }
                }
            }
        } finally {
            dispatch(generationSlice.actions.completed(tabId))
        }
    }
)

export const generationSlice = createSlice({
    name: 'generation',
    initialState,
    reducers: {
        init(_stobj: unknown, _action: PayloadAction<number>) {
            const state = <State>_stobj
            const tabId = _action.payload
            //state.keyboardBindings['Cmd-e'] = ''
        },
        pending(stobj: unknown, action: PayloadAction<number>) {
            const state = <State>stobj
            const tabId = action.payload
            const tab = state.tabs[tabId]

            // set Tab to Read only
            tab.isReadOnly = true
            tab.generating = true
            tab.interrupted = false

            state.keyboardBindings['Ctrl-c'] =
                generationSlice.actions.interrupt(tabId)
        },
        starting(_stobj: unknown, _action: PayloadAction<number>) {},
        completed(stobj: unknown, action: PayloadAction<number>) {
            const state = <State>stobj
            const tabId = action.payload

            const tab = state.tabs[tabId]

            // set Tab to not Read only
            tab.isReadOnly = false
            tab.generating = false
            tab.interrupted = false
            delete state.keyboardBindings['Ctrl-c']
        },
        interrupt(stobj: Object, action: PayloadAction<number>) {
            const state = <State>stobj
            const tabId = action.payload
            const tab = state.tabs[tabId]

            if (tab.generating) {
                tab.interrupted = true
                delete state.keyboardBindings['Ctrl-c']
            }
        },
    },
})
