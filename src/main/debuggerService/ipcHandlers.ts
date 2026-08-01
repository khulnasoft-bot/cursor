/**
 * Debugger Service IPC Handlers
 * IPC communication layer for debugger service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getDebuggerService } from './debuggerService'
import type { DebugBreakpoint, DebugStackFrame, DebugVariable, DebugThread } from './debuggerService'

export function setupDebuggerServiceIpcs() {
    const debuggerService = getDebuggerService()

    // Start debug session
    ipcMain.handle(
        'debugger-service-start-session',
        async (_event: IpcMainInvokeEvent, name: string, type: string, request: string, program: string, args: string[] = []) => {
            try {
                const sessionId = await debuggerService.startSession(name, type, request, program, args)
                return { success: true, sessionId }
            } catch (error) {
                log.error('Failed to start debug session:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop debug session
    ipcMain.handle(
        'debugger-service-stop-session',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                await debuggerService.stopSession(sessionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to stop debug session:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop all debug sessions
    ipcMain.handle(
        'debugger-service-stop-all',
        async () => {
            try {
                debuggerService.stopAllSessions()
                return { success: true }
            } catch (error) {
                log.error('Failed to stop all debug sessions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Set breakpoint
    ipcMain.handle(
        'debugger-service-set-breakpoint',
        async (_event: IpcMainInvokeEvent, sessionId: string, path: string, line: number, column: number = 0) => {
            try {
                const breakpointId = await debuggerService.setBreakpoint(sessionId, path, line, column)
                return { success: true, breakpointId }
            } catch (error) {
                log.error('Failed to set breakpoint:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Remove breakpoint
    ipcMain.handle(
        'debugger-service-remove-breakpoint',
        async (_event: IpcMainInvokeEvent, sessionId: string, breakpointId: string) => {
            try {
                await debuggerService.removeBreakpoint(sessionId, breakpointId)
                return { success: true }
            } catch (error) {
                log.error('Failed to remove breakpoint:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get breakpoints
    ipcMain.handle(
        'debugger-service-get-breakpoints',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const breakpoints = await debuggerService.getBreakpoints(sessionId)
                return { success: true, breakpoints }
            } catch (error) {
                log.error('Failed to get breakpoints:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Continue execution
    ipcMain.handle(
        'debugger-service-continue',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                await debuggerService.continue(sessionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to continue debug session:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Pause execution
    ipcMain.handle(
        'debugger-service-pause',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                await debuggerService.pause(sessionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to pause debug session:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Step over
    ipcMain.handle(
        'debugger-service-step-over',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                await debuggerService.stepOver(sessionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to step over:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Step into
    ipcMain.handle(
        'debugger-service-step-into',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                await debuggerService.stepInto(sessionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to step into:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Step out
    ipcMain.handle(
        'debugger-service-step-out',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                await debuggerService.stepOut(sessionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to step out:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get stack frames
    ipcMain.handle(
        'debugger-service-get-stack-frames',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const stackFrames = await debuggerService.getStackFrames(sessionId)
                return { success: true, stackFrames }
            } catch (error) {
                log.error('Failed to get stack frames:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get variables
    ipcMain.handle(
        'debugger-service-get-variables',
        async (_event: IpcMainInvokeEvent, sessionId: string, variablesReference: number) => {
            try {
                const variables = await debuggerService.getVariables(sessionId, variablesReference)
                return { success: true, variables }
            } catch (error) {
                log.error('Failed to get variables:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get threads
    ipcMain.handle(
        'debugger-service-get-threads',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const threads = await debuggerService.getThreads(sessionId)
                return { success: true, threads }
            } catch (error) {
                log.error('Failed to get threads:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all debug sessions
    ipcMain.handle(
        'debugger-service-get-sessions',
        async () => {
            try {
                const sessions = debuggerService.getSessions()
                return { success: true, sessions }
            } catch (error) {
                log.error('Failed to get debug sessions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if session is connected
    ipcMain.handle(
        'debugger-service-is-connected',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const connected = debuggerService.isSessionConnected(sessionId)
                return { success: true, connected }
            } catch (error) {
                log.error('Failed to check debug connection:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Debugger service IPC handlers registered')
}
