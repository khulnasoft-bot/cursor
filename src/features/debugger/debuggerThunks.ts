/**
 * Debugger Thunks
 * Async actions for debugger functionality
 */

import { createAsyncThunk } from '@reduxjs/toolkit'
import { ipcRenderer } from 'electron'
import type { DebugSession, DebugBreakpoint, DebugStackFrame, DebugVariable, DebugThread } from '../../main/debuggerService'
import {
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
} from './debuggerSlice'

export const startDebugSession = createAsyncThunk(
    'debugger/startSession',
    async (params: { name: string; type: string; request: string; program: string; args?: string[] }) => {
        const response = await ipcRenderer.invoke('debugger-service-start-session', params.name, params.type, params.request, params.program, params.args || [])
        if (!response.success) {
            throw new Error(response.error)
        }
        return response.sessionId
    }
)

export const stopDebugSession = createAsyncThunk(
    'debugger/stopSession',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-stop-session', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return sessionId
    }
)

export const setBreakpointAction = createAsyncThunk(
    'debugger/setBreakpoint',
    async (params: { sessionId: string; path: string; line: number; column?: number }) => {
        const response = await ipcRenderer.invoke('debugger-service-set-breakpoint', params.sessionId, params.path, params.line, params.column || 0)
        if (!response.success) {
            throw new Error(response.error)
        }
        return { path: params.path, breakpointId: response.breakpointId, line: params.line, column: params.column || 0 }
    }
)

export const removeBreakpointAction = createAsyncThunk(
    'debugger/removeBreakpoint',
    async (params: { sessionId: string; breakpointId: string }) => {
        const response = await ipcRenderer.invoke('debugger-service-remove-breakpoint', params.sessionId, params.breakpointId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return params.breakpointId
    }
)

export const getBreakpointsAction = createAsyncThunk(
    'debugger/getBreakpoints',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-get-breakpoints', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return response.breakpoints
    }
)

export const continueExecution = createAsyncThunk(
    'debugger/continue',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-continue', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return sessionId
    }
)

export const pauseExecution = createAsyncThunk(
    'debugger/pause',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-pause', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return sessionId
    }
)

export const stepOver = createAsyncThunk(
    'debugger/stepOver',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-step-over', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return sessionId
    }
)

export const stepInto = createAsyncThunk(
    'debugger/stepInto',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-step-into', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return sessionId
    }
)

export const stepOut = createAsyncThunk(
    'debugger/stepOut',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-step-out', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return sessionId
    }
)

export const getStackFrames = createAsyncThunk(
    'debugger/getStackFrames',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-get-stack-frames', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return response.stackFrames
    }
)

export const getVariables = createAsyncThunk(
    'debugger/getVariables',
    async (params: { sessionId: string; variablesReference: number }) => {
        const response = await ipcRenderer.invoke('debugger-service-get-variables', params.sessionId, params.variablesReference)
        if (!response.success) {
            throw new Error(response.error)
        }
        return response.variables
    }
)

export const getThreads = createAsyncThunk(
    'debugger/getThreads',
    async (sessionId: string) => {
        const response = await ipcRenderer.invoke('debugger-service-get-threads', sessionId)
        if (!response.success) {
            throw new Error(response.error)
        }
        return response.threads
    }
)

export const getSessions = createAsyncThunk(
    'debugger/getSessions',
    async () => {
        const response = await ipcRenderer.invoke('debugger-service-get-sessions')
        if (!response.success) {
            throw new Error(response.error)
        }
        return response.sessions
    }
)

export const stopAllSessions = createAsyncThunk(
    'debugger/stopAll',
    async () => {
        const response = await ipcRenderer.invoke('debugger-service-stop-all')
        if (!response.success) {
            throw new Error(response.error)
        }
        return true
    }
)
