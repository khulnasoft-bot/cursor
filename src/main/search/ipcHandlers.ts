/**
 * Advanced Search IPC Handlers
 * IPC communication layer for advanced search functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getAdvancedSearchService } from './advancedSearch'
import type { SearchOptions, SearchResult, SearchIndex } from './advancedSearch'

export function setupSearch() {
    const searchService = getAdvancedSearchService()

    // Perform search
    ipcMain.handle(
        'search-perform',
        async (_event: IpcMainInvokeEvent, options: SearchOptions) => {
            try {
                const results = await searchService.search(options)
                // Rank results
                const rankedResults = searchService.rankResults(results, options.pattern)
                return { success: true, results: rankedResults }
            } catch (error) {
                log.error('Search failed:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Search in specific file
    ipcMain.handle(
        'search-in-file',
        async (_event: IpcMainInvokeEvent, filePath: string, pattern: string, options?: Partial<SearchOptions>) => {
            try {
                const results = await searchService.searchInFile(filePath, pattern, options)
                const rankedResults = searchService.rankResults(results, pattern)
                return { success: true, results: rankedResults }
            } catch (error) {
                log.error('File search failed:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Build search index
    ipcMain.handle(
        'search-build-index',
        async (_event: IpcMainInvokeEvent, directory: string, fileExtensions?: string[]) => {
            try {
                await searchService.buildIndex(directory, fileExtensions)
                return { success: true }
            } catch (error) {
                log.error('Failed to build search index:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Start watching directory
    ipcMain.handle(
        'search-start-watching',
        async (_event: IpcMainInvokeEvent, directory: string) => {
            try {
                searchService.startWatching(directory, (filePath, event) => {
                    // Notify renderer of file changes
                    _event.sender.send('search-file-changed', { filePath, event })
                })
                return { success: true }
            } catch (error) {
                log.error('Failed to start watching directory:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop watching directory
    ipcMain.handle(
        'search-stop-watching',
        async (_event: IpcMainInvokeEvent, directory: string) => {
            try {
                searchService.stopWatching(directory)
                return { success: true }
            } catch (error) {
                log.error('Failed to stop watching directory:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Stop all watching
    ipcMain.handle(
        'search-stop-all-watching',
        async () => {
            try {
                searchService.stopAllWatching()
                return { success: true }
            } catch (error) {
                log.error('Failed to stop all watching:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get index stats
    ipcMain.handle(
        'search-get-index-stats',
        async () => {
            try {
                const stats = searchService.getIndexStats()
                return { success: true, stats }
            } catch (error) {
                log.error('Failed to get index stats:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear index
    ipcMain.handle(
        'search-clear-index',
        async () => {
            try {
                searchService.clearIndex()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear index:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if ripgrep is available
    ipcMain.handle(
        'search-is-ripgrep-available',
        async () => {
            try {
                const available = searchService.isRipgrepAvailable()
                return { success: true, available }
            } catch (error) {
                log.error('Failed to check ripgrep availability:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Search IPC handlers registered')
}
