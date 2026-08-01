/**
 * NDJSON Service IPC Handlers
 * IPC communication layer for NDJSON service functionality
 */

import { ipcMain, IpcMainInvokeEvent } from 'electron'
import log from 'electron-log'
import { getNDJSONService } from './ndjsonService'
import type { NDJSONIngestConfig } from './ndjsonService'

export function setupNDJSONServiceIpcs() {
    const ndjsonService = getNDJSONService()

    // Ingest from file
    ipcMain.handle(
        'ndjson-service-ingest-file',
        async (_event: IpcMainInvokeEvent, filePath: string, config?: Partial<NDJSONIngestConfig>) => {
            try {
                const count = await ndjsonService.ingestFromFile(filePath, config)
                return { success: true, count }
            } catch (error) {
                log.error('Failed to ingest NDJSON file:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Ingest from string
    ipcMain.handle(
        'ndjson-service-ingest-string',
        async (_event: IpcMainInvokeEvent, ndjsonString: string, source?: string) => {
            try {
                const count = await ndjsonService.ingestFromString(ndjsonString, source)
                return { success: true, count }
            } catch (error) {
                log.error('Failed to ingest NDJSON string:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get records
    ipcMain.handle(
        'ndjson-service-get-records',
        async () => {
            try {
                const records = ndjsonService.getRecords()
                return { success: true, records }
            } catch (error) {
                log.error('Failed to get NDJSON records:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get records by source
    ipcMain.handle(
        'ndjson-service-get-by-source',
        async (_event: IpcMainInvokeEvent, source: string) => {
            try {
                const records = ndjsonService.getRecordsBySource(source)
                return { success: true, records }
            } catch (error) {
                log.error('Failed to get NDJSON records by source:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get records by date range
    ipcMain.handle(
        'ndjson-service-get-by-date-range',
        async (_event: IpcMainInvokeEvent, start: Date, end: Date) => {
            try {
                const records = ndjsonService.getRecordsByDateRange(start, end)
                return { success: true, records }
            } catch (error) {
                log.error('Failed to get NDJSON records by date range:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear records
    ipcMain.handle(
        'ndjson-service-clear',
        async () => {
            try {
                ndjsonService.clearRecords()
                return { success: true }
            } catch (error) {
                log.error('Failed to clear NDJSON records:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Clear records by source
    ipcMain.handle(
        'ndjson-service-clear-by-source',
        async (_event: IpcMainInvokeEvent, source: string) => {
            try {
                ndjsonService.clearRecordsBySource(source)
                return { success: true }
            } catch (error) {
                log.error('Failed to clear NDJSON records by source:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Export to NDJSON
    ipcMain.handle(
        'ndjson-service-export',
        async (_event: IpcMainInvokeEvent, outputPath: string) => {
            try {
                await ndjsonService.exportToNDJSON(outputPath)
                return { success: true }
            } catch (error) {
                log.error('Failed to export NDJSON:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Get config
    ipcMain.handle(
        'ndjson-service-get-config',
        async () => {
            try {
                const config = ndjsonService.getConfig()
                return { success: true, config }
            } catch (error) {
                log.error('Failed to get NDJSON config:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    // Check if processing
    ipcMain.handle(
        'ndjson-service-is-processing',
        async () => {
            try {
                const processing = ndjsonService.isProcessing()
                return { success: true, processing }
            } catch (error) {
                log.error('Failed to check processing status:', error)
                return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
            }
        }
    )

    log.info('NDJSON service IPC handlers registered')
}
