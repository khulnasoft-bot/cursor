/**
 * Debugger Slice
 * Redux state management for debugger functionality
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { DebugSession, DebugBreakpoint, DebugStackFrame, DebugVariable, DebugThread } from '../../main/debuggerService'

interface DebuggerState {
    sessions: DebugSession[]
    activeSessionId: string | null
    breakpoints: Map<string, DebugBreakpoint[]>
    stackFrames: DebugStackFrame[]
    variables: DebugVariable[]
    threads: DebugThread[]
    isDebugging: boolean
    isPaused: boolean
}

const initialState: DebuggerState = {
    sessions: [],
    activeSessionId: null,
    breakpoints: new Map(),
    stackFrames: [],
    variables: [],
    threads: [],
    isDebugging: false,
    isPaused: false
}

const debuggerSlice = createSlice({
    name: 'debugger',
    initialState,
    reducers: {
        setSessions: (state, action: PayloadAction<DebugSession[]>) => {
            state.sessions = action.payload
        },
        addSession: (state, action: PayloadAction<DebugSession>) => {
            state.sessions.push(action.payload)
        },
        removeSession: (state, action: PayloadAction<string>) => {
            state.sessions = state.sessions.filter(s => s.id !== action.payload)
            if (state.activeSessionId === action.payload) {
                state.activeSessionId = null
            }
        },
        setActiveSession: (state, action: PayloadAction<string | null>) => {
            state.activeSessionId = action.payload
        },
        setBreakpoints: (state, action: PayloadAction<Map<string, DebugBreakpoint[]>>) => {
            state.breakpoints = action.payload
        },
        addBreakpoint: (state, action: PayloadAction<{ path: string; breakpoint: DebugBreakpoint }>) => {
            const { path, breakpoint } = action.payload
            if (!state.breakpoints.has(path)) {
                state.breakpoints.set(path, [])
            }
            state.breakpoints.get(path)!.push(breakpoint)
        },
        removeBreakpoint: (state, action: PayloadAction<{ path: string; breakpointId: string }>) => {
            const { path, breakpointId } = action.payload
            const breakpoints = state.breakpoints.get(path)
            if (breakpoints) {
                const index = breakpoints.findIndex(bp => bp.id === breakpointId)
                if (index !== -1) {
                    breakpoints.splice(index, 1)
                }
            }
        },
        setStackFrames: (state, action: PayloadAction<DebugStackFrame[]>) => {
            state.stackFrames = action.payload
        },
        setVariables: (state, action: PayloadAction<DebugVariable[]>) => {
            state.variables = action.payload
        },
        setThreads: (state, action: PayloadAction<DebugThread[]>) => {
            state.threads = action.payload
        },
        setDebugging: (state, action: PayloadAction<boolean>) => {
            state.isDebugging = action.payload
        },
        setPaused: (state, action: PayloadAction<boolean>) => {
            state.isPaused = action.payload
        },
        clearDebugger: (state) => {
            state.sessions = []
            state.activeSessionId = null
            state.breakpoints = new Map()
            state.stackFrames = []
            state.variables = []
            state.threads = []
            state.isDebugging = false
            state.isPaused = false
        }
    }
})

export const {
    setSessions,
    addSession,
    removeSession,
    setActiveSession,
    setBreakpoints,
    addBreakpoint,
    removeBreakpoint,
    setStackFrames,
    setVariables,
    setThreads,
    setDebugging,
    setPaused,
    clearDebugger
} = debuggerSlice.actions

export default debuggerSlice.reducer
