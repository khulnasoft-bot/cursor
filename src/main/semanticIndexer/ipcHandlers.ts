/**
 * Semantic Indexer IPC Handlers
 * IPC communication layer for semantic indexing functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getSemanticIndexer } from './semanticIndexer'
import type { SearchQuery, SearchResult, CodeChunk } from './semanticIndexer'

export function setupSemanticIndexerIpcs() {
    const semanticIndexer = getSemanticIndexer()

    // Index a file
    ipcMain.handle(
        'semantic-index-file',
        async (_event: IpcMainInvokeEvent, filePath: string, content: string, language?: string) => {
            try {
                await semanticIndexer.indexFile(filePath, content, language)
                return { success: true }
            } catch (error) {
                log.error('Failed to index file:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Index a directory
    ipcMain.handle(
        'semantic-index-directory',
        async (_event: IpcMainInvokeEvent, directoryPath: string, fileExtensions?: string[], ignorePatterns?: string[]) => {
            try {
                await semanticIndexer.indexDirectory(directoryPath, fileExtensions, ignorePatterns)
                return { success: true }
            } catch (error) {
                log.error('Failed to index directory:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Search semantically
    ipcMain.handle(
        'semantic-search',
        async (_event: IpcMainInvokeEvent, query: SearchQuery) => {
            try {
                const results = await semanticIndexer.search(query)
                return { success: true, results }
            } catch (error) {
                log.error('Semantic search failed:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Search in specific file
    ipcMain.handle(
        'semantic-search-file',
        async (_event: IpcMainInvokeEvent, filePath: string, query: string, limit?: number) => {
            try {
                const results = await semanticIndexer.searchByFile(filePath, query, limit)
                return { success: true, results }
            } catch (error) {
                log.error('File semantic search failed:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get index stats
    ipcMain.handle(
        'semantic-get-index-stats',
        async () => {
            try {
                const stats = semanticIndexer.getIndexStats()
                return { success: true, stats }
            } catch (error) {
                log.error('Failed to get index stats:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear index
    ipcMain.handle(
        'semantic-clear-index',
        async () => {
            try {
                semanticIndexer.clearIndex()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear index:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Remove file from index
    ipcMain.handle(
        'semantic-remove-file',
        async (_event: IpcMainInvokeEvent, filePath: string) => {
            try {
                semanticIndexer.removeFile(filePath)
                return { success: true }
            } catch (error) {
                log.error('Failed to remove file from index:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Reindex file
    ipcMain.handle(
        'semantic-reindex-file',
        async (_event: IpcMainInvokeEvent, filePath: string, content: string, language?: string) => {
            try {
                await semanticIndexer.reindexFile(filePath, content, language)
                return { success: true }
            } catch (error) {
                log.error('Failed to reindex file:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('Semantic indexer IPC handlers registered')
}
