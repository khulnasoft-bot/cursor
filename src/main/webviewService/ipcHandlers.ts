/**
 * WebView Service IPC Handlers
 * IPC communication layer for webview service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getWebviewService } from './webviewService'
import type { WebViewConfig } from './webviewService'

export function setupWebviewServiceIpcs() {
    const webviewService = getWebviewService()

    // Create webview
    ipcMain.handle(
        'webview-service-create',
        async (_event: IpcMainInvokeEvent, config: Partial<WebViewConfig>) => {
            try {
                const webViewId = await webviewService.createWebView(config)
                return { success: true, webViewId }
            } catch (error) {
                log.error('Failed to create webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Load URL
    ipcMain.handle(
        'webview-service-load-url',
        async (_event: IpcMainInvokeEvent, webViewId: string, url: string) => {
            try {
                await webviewService.loadUrl(webViewId, url)
                return { success: true }
            } catch (error) {
                log.error('Failed to load URL in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Reload
    ipcMain.handle(
        'webview-service-reload',
        async (_event: IpcMainInvokeEvent, webViewId: string) => {
            try {
                await webviewService.reload(webViewId)
                return { success: true }
            } catch (error) {
                log.error('Failed to reload webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Go back
    ipcMain.handle(
        'webview-service-go-back',
        async (_event: IpcMainInvokeEvent, webViewId: string) => {
            try {
                await webviewService.goBack(webViewId)
                return { success: true }
            } catch (error) {
                log.error('Failed to go back in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Go forward
    ipcMain.handle(
        'webview-service-go-forward',
        async (_event: IpcMainInvokeEvent, webViewId: string) => {
            try {
                await webviewService.goForward(webViewId)
                return { success: true }
            } catch (error) {
                log.error('Failed to go forward in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop loading
    ipcMain.handle(
        'webview-service-stop-loading',
        async (_event: IpcMainInvokeEvent, webViewId: string) => {
            try {
                await webviewService.stopLoading(webViewId)
                return { success: true }
            } catch (error) {
                log.error('Failed to stop loading in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Execute JavaScript
    ipcMain.handle(
        'webview-service-execute-js',
        async (_event: IpcMainInvokeEvent, webViewId: string, code: string) => {
            try {
                const result = await webviewService.executeJavaScript(webViewId, code)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to execute JavaScript in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Send message
    ipcMain.handle(
        'webview-service-send-message',
        async (_event: IpcMainInvokeEvent, webViewId: string, channel: string, data: any) => {
            try {
                await webviewService.sendMessage(webViewId, channel, data)
                return { success: true }
            } catch (error) {
                log.error('Failed to send message to webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Insert CSS
    ipcMain.handle(
        'webview-service-insert-css',
        async (_event: IpcMainInvokeEvent, webViewId: string, css: string) => {
            try {
                await webviewService.insertCSS(webViewId, css)
                return { success: true }
            } catch (error) {
                log.error('Failed to insert CSS in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Set zoom level
    ipcMain.handle(
        'webview-service-set-zoom',
        async (_event: IpcMainInvokeEvent, webViewId: string, level: number) => {
            try {
                await webviewService.setZoomLevel(webViewId, level)
                return { success: true }
            } catch (error) {
                log.error('Failed to set zoom level in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Find in page
    ipcMain.handle(
        'webview-service-find',
        async (_event: IpcMainInvokeEvent, webViewId: string, text: string, options?: any) => {
            try {
                const result = await webviewService.findInPage(webViewId, text, options)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to find in page in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop find in page
    ipcMain.handle(
        'webview-service-stop-find',
        async (_event: IpcMainInvokeEvent, webViewId: string, action?: string) => {
            try {
                await webviewService.stopFindInPage(webViewId, action)
                return { success: true }
            } catch (error) {
                log.error('Failed to stop find in page in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Capture page
    ipcMain.handle(
        'webview-service-capture',
        async (_event: IpcMainInvokeEvent, webViewId: string) => {
            try {
                const result = await webviewService.capturePage(webViewId)
                return { success: true, result }
            } catch (error) {
                log.error('Failed to capture page in webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Print
    ipcMain.handle(
        'webview-service-print',
        async (_event: IpcMainInvokeEvent, webViewId: string) => {
            try {
                await webviewService.print(webViewId)
                return { success: true }
            } catch (error) {
                log.error('Failed to print webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Close webview
    ipcMain.handle(
        'webview-service-close',
        async (_event: IpcMainInvokeEvent, webViewId: string) => {
            try {
                await webviewService.closeWebView(webViewId)
                return { success: true }
            } catch (error) {
                log.error('Failed to close webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get webview
    ipcMain.handle(
        'webview-service-get',
        async (_event: IpcMainInvokeEvent, webViewId: string) => {
            try {
                const webView = webviewService.getWebView(webViewId)
                return { success: true, webView }
            } catch (error) {
                log.error('Failed to get webview:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get all webviews
    ipcMain.handle(
        'webview-service-get-all',
        async () => {
            try {
                const webViews = webviewService.getWebViews()
                return { success: true, webViews }
            } catch (error) {
                log.error('Failed to get webviews:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Update config
    ipcMain.handle(
        'webview-service-update-config',
        async (_event: IpcMainInvokeEvent, webViewId: string, config: Partial<WebViewConfig>) => {
            try {
                webviewService.updateConfig(webViewId, config)
                return { success: true }
            } catch (error) {
                log.error('Failed to update webview config:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('WebView service IPC handlers registered')
}
