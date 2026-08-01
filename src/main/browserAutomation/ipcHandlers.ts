/**
 * Browser Automation IPC Handlers
 * IPC communication layer for browser automation functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getBrowserAutomation } from './browserAutomation'
import type { BrowserAutomationOptions, NavigationOptions } from './browserAutomation'

export function setupBrowserAutomationIpcs() {
    const browserAutomation = getBrowserAutomation()

    // Create a new browser session
    ipcMain.handle(
        'browser-automation-create-session',
        async (_event: IpcMainInvokeEvent, options: BrowserAutomationOptions = {}) => {
            try {
                const sessionId = await browserAutomation.createSession(options)
                return { success: true, sessionId }
            } catch (error) {
                log.error('Failed to create browser session:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Navigate to a URL
    ipcMain.handle(
        'browser-automation-navigate',
        async (_event: IpcMainInvokeEvent, sessionId: string, url: string, options: NavigationOptions = {}) => {
            try {
                await browserAutomation.navigate(sessionId, url, options)
                return { success: true }
            } catch (error) {
                log.error('Failed to navigate:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Click an element
    ipcMain.handle(
        'browser-automation-click',
        async (_event: IpcMainInvokeEvent, sessionId: string, selector: string) => {
            try {
                await browserAutomation.click(sessionId, selector)
                return { success: true }
            } catch (error) {
                log.error('Failed to click element:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Type text into an element
    ipcMain.handle(
        'browser-automation-type',
        async (_event: IpcMainInvokeEvent, sessionId: string, selector: string, text: string) => {
            try {
                await browserAutomation.type(sessionId, selector, text)
                return { success: true }
            } catch (error) {
                log.error('Failed to type text:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Extract text from page or element
    ipcMain.handle(
        'browser-automation-extract-text',
        async (_event: IpcMainInvokeEvent, sessionId: string, selector?: string) => {
            try {
                const text = await browserAutomation.extractText(sessionId, selector)
                return { success: true, text }
            } catch (error) {
                log.error('Failed to extract text:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Extract HTML from page or element
    ipcMain.handle(
        'browser-automation-extract-html',
        async (_event: IpcMainInvokeEvent, sessionId: string, selector?: string) => {
            try {
                const html = await browserAutomation.extractHTML(sessionId, selector)
                return { success: true, html }
            } catch (error) {
                log.error('Failed to extract HTML:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Take a screenshot
    ipcMain.handle(
        'browser-automation-screenshot',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const screenshot = await browserAutomation.screenshot(sessionId)
                return { success: true, screenshot: screenshot.toString('base64') }
            } catch (error) {
                log.error('Failed to take screenshot:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Execute custom JavaScript
    ipcMain.handle(
        'browser-automation-execute-script',
        async (_event: IpcMainInvokeEvent, sessionId: string, script: string) => {
            try {
                const result = await browserAutomation.executeScript(sessionId, script)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to execute script:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Wait for selector to appear
    ipcMain.handle(
        'browser-automation-wait-for-selector',
        async (_event: IpcMainInvokeEvent, sessionId: string, selector: string, timeout = 5000) => {
            try {
                const found = await browserAutomation.waitForSelector(sessionId, selector, timeout)
                return { success: true, found }
            } catch (error) {
                log.error('Failed to wait for selector:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get current URL
    ipcMain.handle(
        'browser-automation-get-url',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const url = await browserAutomation.getCurrentUrl(sessionId)
                return { success: true, url }
            } catch (error) {
                log.error('Failed to get URL:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get page title
    ipcMain.handle(
        'browser-automation-get-title',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                const title = await browserAutomation.getTitle(sessionId)
                return { success: true, title }
            } catch (error) {
                log.error('Failed to get title:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Close a specific session
    ipcMain.handle(
        'browser-automation-close-session',
        async (_event: IpcMainInvokeEvent, sessionId: string) => {
            try {
                await browserAutomation.closeSession(sessionId)
                return { success: true }
            } catch (error) {
                log.error('Failed to close session:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Close all sessions
    ipcMain.handle(
        'browser-automation-close-all-sessions',
        async () => {
            try {
                await browserAutomation.closeAllSessions()
                return { success: true }
            } catch (error) {
                log.error('Failed to close all sessions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all active sessions
    ipcMain.handle(
        'browser-automation-get-sessions',
        async () => {
            try {
                const sessions = browserAutomation.getSessions()
                return { success: true, sessions }
            } catch (error) {
                log.error('Failed to get sessions:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Browser automation IPC handlers registered')
}
