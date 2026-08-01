/**
 * Browser Automation Renderer API
 * Client-side API for browser automation functionality
 */

import { ipcRenderer } from 'electron'
import type { BrowserAutomationOptions, NavigationOptions } from '../main/browserAutomation'

export interface BrowserAutomationResult<T = any> {
    success: boolean
    data?: T
    error?: string
}

export class BrowserAutomationClient {
    async createSession(options: BrowserAutomationOptions = {}): Promise<BrowserAutomationResult<{ sessionId: string }>> {
        return await ipcRenderer.invoke('browser-automation-create-session', options)
    }

    async navigate(sessionId: string, url: string, options?: NavigationOptions): Promise<BrowserAutomationResult> {
        return await ipcRenderer.invoke('browser-automation-navigate', sessionId, url, options)
    }

    async click(sessionId: string, selector: string): Promise<BrowserAutomationResult> {
        return await ipcRenderer.invoke('browser-automation-click', sessionId, selector)
    }

    async type(sessionId: string, selector: string, text: string): Promise<BrowserAutomationResult> {
        return await ipcRenderer.invoke('browser-automation-type', sessionId, selector, text)
    }

    async extractText(sessionId: string, selector?: string): Promise<BrowserAutomationResult<{ text: string }>> {
        return await ipcRenderer.invoke('browser-automation-extract-text', sessionId, selector)
    }

    async extractHTML(sessionId: string, selector?: string): Promise<BrowserAutomationResult<{ html: string }>> {
        return await ipcRenderer.invoke('browser-automation-extract-html', sessionId, selector)
    }

    async screenshot(sessionId: string): Promise<BrowserAutomationResult<{ screenshot: string }>> {
        return await ipcRenderer.invoke('browser-automation-screenshot', sessionId)
    }

    async executeScript(sessionId: string, script: string): Promise<BrowserAutomationResult<{ result: any }>> {
        return await ipcRenderer.invoke('browser-automation-execute-script', sessionId, script)
    }

    async waitForSelector(sessionId: string, selector: string, timeout?: number): Promise<BrowserAutomationResult<{ found: boolean }>> {
        return await ipcRenderer.invoke('browser-automation-wait-for-selector', sessionId, selector, timeout)
    }

    async getUrl(sessionId: string): Promise<BrowserAutomationResult<{ url: string }>> {
        return await ipcRenderer.invoke('browser-automation-get-url', sessionId)
    }

    async getTitle(sessionId: string): Promise<BrowserAutomationResult<{ title: string }>> {
        return await ipcRenderer.invoke('browser-automation-get-title', sessionId)
    }

    async closeSession(sessionId: string): Promise<BrowserAutomationResult> {
        return await ipcRenderer.invoke('browser-automation-close-session', sessionId)
    }

    async closeAllSessions(): Promise<BrowserAutomationResult> {
        return await ipcRenderer.invoke('browser-automation-close-all-sessions')
    }

    async getSessions(): Promise<BrowserAutomationResult<{ sessions: any[] }>> {
        return await ipcRenderer.invoke('browser-automation-get-sessions')
    }
}

// Singleton instance
let browserAutomationClient: BrowserAutomationClient | null = null

export function getBrowserAutomationClient(): BrowserAutomationClient {
    if (!browserAutomationClient) {
        browserAutomationClient = new BrowserAutomationClient()
    }
    return browserAutomationClient
}
