import { app } from 'electron'
import log from 'electron-log'
import path from 'path'

export interface DeeplinkAction {
    type: 'open-file' | 'open-folder' | 'run-command' | 'settings' | 'chat' | 'auth'
    params: Record<string, string>
}

export default function setupProtocol() {
    if (process.defaultApp) {
        if (process.argv.length >= 2) {
            app.setAsDefaultProtocolClient('cursor', process.execPath, [
                path.resolve(process.argv[1]),
            ])
        }
    } else {
        app.setAsDefaultProtocolClient('cursor')
    }

    // Handle deeplink URLs when the app is already running
    app.on('open-url', (event, url) => {
        event.preventDefault()
        handleDeeplink(url)
    })

    // Handle deeplink URLs on macOS when app is not running
    app.on('open-file', (event, path) => {
        event.preventDefault()
        handleDeeplink(`cursor://open-file?path=${encodeURIComponent(path)}`)
    })
}

function handleDeeplink(url: string) {
    try {
        log.info('Handling deeplink:', url)

        if (!url.startsWith('cursor://')) {
            log.warn('Invalid deeplink protocol:', url)
            return
        }

        const action = parseDeeplink(url)
        log.info('Parsed deeplink action:', action)

        // Emit event for renderer to handle
        if (action) {
            // Store action for renderer to pick up
            global.deeplinkAction = action
        }
    } catch (error) {
        log.error('Error handling deeplink:', error)
    }
}

function parseDeeplink(url: string): DeeplinkAction | null {
    try {
        const urlObj = new URL(url)
        const pathParts = urlObj.pathname.split('/').filter(Boolean)

        if (pathParts.length === 0) {
            return null
        }

        const actionType = pathParts[0] as DeeplinkAction['type']
        const params: Record<string, string> = {}

        // Parse query parameters
        urlObj.searchParams.forEach((value, key) => {
            params[key] = value
        })

        // Parse path parameters
        for (let i = 1; i < pathParts.length; i += 2) {
            if (pathParts[i + 1]) {
                params[pathParts[i]] = pathParts[i + 1]
            }
        }

        return {
            type: actionType,
            params
        }
    } catch (error) {
        log.error('Error parsing deeplink:', error)
        return null
    }
}

export function getPendingDeeplinkAction(): DeeplinkAction | null {
    const action = global.deeplinkAction as DeeplinkAction | undefined
    if (action) {
        delete global.deeplinkAction
        return action
    }
    return null
}

// Extend global type
declare global {
    var deeplinkAction: DeeplinkAction | undefined
}
