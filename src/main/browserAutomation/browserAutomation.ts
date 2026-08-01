/**
 * Cursor Browser Automation
 * Provides browser automation capabilities for AI agents
 */

import { BrowserWindow, session } from 'electron'
import log from 'electron-log'

export interface BrowserAutomationOptions {
    headless?: boolean
    width?: number
    height?: number
    userAgent?: string
}

export interface NavigationOptions {
    waitUntil?: 'load' | 'domcontentloaded' | 'networkidle'
    timeout?: number
}

export interface PageInteraction {
    type: 'click' | 'type' | 'scroll' | 'waitFor' | 'extract'
    selector?: string
    text?: string
    timeout?: number
}

export interface BrowserSession {
    id: string
    window: BrowserWindow
    url: string
    createdAt: Date
}

class BrowserAutomation {
    private sessions: Map<string, BrowserSession> = new Map()
    private sessionIdCounter = 0

    async createSession(options: BrowserAutomationOptions = {}): Promise<string> {
        const sessionId = `session-${++this.sessionIdCounter}`
        
        const defaultOptions: BrowserAutomationOptions = {
            headless: true,
            width: 1280,
            height: 720,
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            ...options
        }

        const browserWindow = new BrowserWindow({
            width: defaultOptions.width,
            height: defaultOptions.height,
            show: !defaultOptions.headless,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                sandbox: true,
                webSecurity: true,
                allowRunningInsecureContent: false,
            }
        })

        // Set user agent if provided
        if (defaultOptions.userAgent) {
            await browserWindow.webContents.session.setUserAgent(defaultOptions.userAgent)
        }

        const session: BrowserSession = {
            id: sessionId,
            window: browserWindow,
            url: 'about:blank',
            createdAt: new Date()
        }

        this.sessions.set(sessionId, session)
        log.info(`Created browser automation session: ${sessionId}`)

        return sessionId
    }

    async navigate(sessionId: string, url: string, options: NavigationOptions = {}): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        const defaultOptions: NavigationOptions = {
            waitUntil: 'load',
            timeout: 30000,
            ...options
        }

        try {
            await session.window.loadURL(url)
            session.url = url
            log.info(`Navigated session ${sessionId} to ${url}`)
        } catch (error) {
            log.error(`Navigation failed for session ${sessionId}:`, error)
            throw error
        }
    }

    async click(sessionId: string, selector: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        await session.window.webContents.executeJavaScript(`
            const element = document.querySelector('${selector}');
            if (element) {
                element.click();
                return { success: true };
            }
            return { success: false, error: 'Element not found' };
        `)
    }

    async type(sessionId: string, selector: string, text: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        await session.window.webContents.executeJavaScript(`
            const element = document.querySelector('${selector}');
            if (element) {
                element.value = '${text}';
                element.dispatchEvent(new Event('input', { bubbles: true }));
                return { success: true };
            }
            return { success: false, error: 'Element not found' };
        `)
    }

    async extractText(sessionId: string, selector?: string): Promise<string> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        const script = selector
            ? `document.querySelector('${selector}')?.innerText || ''`
            : `document.body.innerText`

        return await session.window.webContents.executeJavaScript(`return ${script}`)
    }

    async extractHTML(sessionId: string, selector?: string): Promise<string> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        const script = selector
            ? `document.querySelector('${selector}')?.outerHTML || ''`
            : `document.body.outerHTML`

        return await session.window.webContents.executeJavaScript(`return ${script}`)
    }

    async screenshot(sessionId: string): Promise<Buffer> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        const image = await session.window.webContents.capturePage()
        return image.toPNG()
    }

    async executeScript(sessionId: string, script: string): Promise<any> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        return await session.window.webContents.executeJavaScript(script)
    }

    async waitForSelector(sessionId: string, selector: string, timeout = 5000): Promise<boolean> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        const script = `
            new Promise((resolve) => {
                const startTime = Date.now();
                const check = () => {
                    if (document.querySelector('${selector}')) {
                        resolve(true);
                    } else if (Date.now() - startTime > ${timeout}) {
                        resolve(false);
                    } else {
                        setTimeout(check, 100);
                    }
                };
                check();
            });
        `

        return await session.window.webContents.executeJavaScript(script)
    }

    async getCurrentUrl(sessionId: string): Promise<string> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        return session.window.webContents.getURL()
    }

    async getTitle(sessionId: string): Promise<string> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        return session.window.getTitle()
    }

    async closeSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId)
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`)
        }

        session.window.close()
        this.sessions.delete(sessionId)
        log.info(`Closed browser automation session: ${sessionId}`)
    }

    async closeAllSessions(): Promise<void> {
        for (const [sessionId, session] of this.sessions) {
            session.window.close()
        }
        this.sessions.clear()
        log.info('Closed all browser automation sessions')
    }

    getSessions(): BrowserSession[] {
        return Array.from(this.sessions.values())
    }

    getSession(sessionId: string): BrowserSession | undefined {
        return this.sessions.get(sessionId)
    }
}

// Singleton instance
let browserAutomation: BrowserAutomation | null = null

export function getBrowserAutomation(): BrowserAutomation {
    if (!browserAutomation) {
        browserAutomation = new BrowserAutomation()
    }
    return browserAutomation
}

export function cleanupBrowserAutomation() {
    if (browserAutomation) {
        browserAutomation.closeAllSessions()
        browserAutomation = null
    }
}
