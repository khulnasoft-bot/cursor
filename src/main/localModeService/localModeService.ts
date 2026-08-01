/**
 * Cursor Local Mode Service
 * Local-only mode for offline development
 */

import log from 'electron-log'

class LocalModeService {
    private localModeEnabled = false
    private offlineMode = false
    private cachedData: Map<string, any> = new Map()

    enableLocalMode(): void {
        this.localModeEnabled = true
        log.info('Local mode enabled')
    }

    disableLocalMode(): void {
        this.localModeEnabled = false
        log.info('Local mode disabled')
    }

    isLocalModeEnabled(): boolean {
        return this.localModeEnabled
    }

    enableOfflineMode(): void {
        this.offlineMode = true
        log.info('Offline mode enabled')
    }

    disableOfflineMode(): void {
        this.offlineMode = false
        log.info('Offline mode disabled')
    }

    isOfflineMode(): boolean {
        return this.offlineMode
    }

    cacheData(key: string, data: any): void {
        this.cachedData.set(key, data)
        log.info(`Cached data for key: ${key}`)
    }

    getCachedData(key: string): any {
        return this.cachedData.get(key)
    }

    removeCachedData(key: string): void {
        this.cachedData.delete(key)
        log.info(`Removed cached data for key: ${key}`)
    }

    clearCache(): void {
        this.cachedData.clear()
        log.info('Cleared all cached data')
    }

    getCacheKeys(): string[] {
        return Array.from(this.cachedData.keys())
    }

    isDataCached(key: string): boolean {
        return this.cachedData.has(key)
    }

    shouldUseLocalResource(url: string): boolean {
        // Determine if a resource should be loaded locally
        return this.localModeEnabled || this.offlineMode
    }

    getLocalResourcePath(url: string): string | null {
        // Convert remote URL to local path if in local mode
        if (!this.shouldUseLocalResource(url)) {
            return null
        }
        
        // Placeholder for actual path conversion logic
        return null
    }
}

// Singleton instance
let localModeService: LocalModeService | null = null

export function getLocalModeService(): LocalModeService {
    if (!localModeService) {
        localModeService = new LocalModeService()
    }
    return localModeService
}

export function destroyLocalModeService() {
    localModeService = null
}
