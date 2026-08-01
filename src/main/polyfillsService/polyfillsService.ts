/**
 * Cursor Polyfills Service
 * Remote polyfills for browser compatibility
 */

import log from 'electron-log'

export interface Polyfill {
    name: string
    version: string
    code: string
    enabled: boolean
}

class PolyfillsService {
    private polyfills: Map<string, Polyfill> = new Map()
    private remoteEnabled = false

    enableRemotePolyfills(): void {
        this.remoteEnabled = true
        log.info('Remote polyfills enabled')
    }

    disableRemotePolyfills(): void {
        this.remoteEnabled = false
        log.info('Remote polyfills disabled')
    }

    isRemoteEnabled(): boolean {
        return this.remoteEnabled
    }

    registerPolyfill(polyfill: Polyfill): void {
        this.polyfills.set(polyfill.name, polyfill)
        log.info(`Registered polyfill: ${polyfill.name}`)
    }

    unregisterPolyfill(name: string): void {
        this.polyfills.delete(name)
        log.info(`Unregistered polyfill: ${name}`)
    }

    getPolyfill(name: string): Polyfill | undefined {
        return this.polyfills.get(name)
    }

    getPolyfills(): Polyfill[] {
        return Array.from(this.polyfills.values())
    }

    getEnabledPolyfills(): Polyfill[] {
        return this.getPolyfills().filter(p => p.enabled)
    }

    enablePolyfill(name: string): void {
        const polyfill = this.polyfills.get(name)
        if (polyfill) {
            polyfill.enabled = true
            log.info(`Enabled polyfill: ${name}`)
        }
    }

    disablePolyfill(name: string): void {
        const polyfill = this.polyfills.get(name)
        if (polyfill) {
            polyfill.enabled = false
            log.info(`Disabled polyfill: ${name}`)
        }
    }

    getPolyfillCode(name: string): string | null {
        const polyfill = this.polyfills.get(name)
        if (polyfill && polyfill.enabled) {
            return polyfill.code
        }
        return null
    }

    getAllPolyfillCode(): string {
        const enabledPolyfills = this.getEnabledPolyfills()
        return enabledPolyfills.map(p => p.code).join('\n')
    }
}

// Singleton instance
let polyfillsService: PolyfillsService | null = null

export function getPolyfillsService(): PolyfillsService {
    if (!polyfillsService) {
        polyfillsService = new PolyfillsService()
    }
    return polyfillsService
}

export function destroyPolyfillsService() {
    polyfillsService = null
}
