/**
 * Deeplink Renderer API
 * Client-side API for handling deeplink actions
 */

import { ipcRenderer } from 'electron'
import type { DeeplinkAction } from '../main/setup/protocol'

export class DeeplinkClient {
    private actionHandlers: Map<DeeplinkAction['type'], (params: Record<string, string>) => void> = new Map()
    private pollingInterval: NodeJS.Timeout | null = null

    constructor() {
        this.startPolling()
    }

    private startPolling() {
        // Poll for pending deeplink actions every 500ms
        this.pollingInterval = setInterval(async () => {
            try {
                const action = await ipcRenderer.invoke('get-pending-deeplink-action')
                if (action) {
                    this.handleAction(action)
                }
            } catch (error) {
                console.error('Error polling for deeplink actions:', error)
            }
        }, 500)
    }

    private handleAction(action: DeeplinkAction) {
        const handler = this.actionHandlers.get(action.type)
        if (handler) {
            try {
                handler(action.params)
            } catch (error) {
                console.error('Error handling deeplink action:', error)
            }
        } else {
            console.warn('No handler registered for deeplink action:', action.type)
        }
    }

    on(actionType: DeeplinkAction['type'], handler: (params: Record<string, string>) => void) {
        this.actionHandlers.set(actionType, handler)
    }

    off(actionType: DeeplinkAction['type']) {
        this.actionHandlers.delete(actionType)
    }

    destroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval)
            this.pollingInterval = null
        }
        this.actionHandlers.clear()
    }
}

// Singleton instance
let deeplinkClient: DeeplinkClient | null = null

export function getDeeplinkClient(): DeeplinkClient {
    if (!deeplinkClient) {
        deeplinkClient = new DeeplinkClient()
    }
    return deeplinkClient
}

export function destroyDeeplinkClient() {
    if (deeplinkClient) {
        deeplinkClient.destroy()
        deeplinkClient = null
    }
}
