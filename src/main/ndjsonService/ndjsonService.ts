/**
 * Cursor NDJSON Service
 * NDJSON data ingestion service for streaming data processing
 */

import * as fs from 'fs'
import * as readline from 'readline'
import log from 'electron-log'

export interface NDJSONRecord {
    data: any
    timestamp: Date
    source: string
}

export interface NDJSONIngestConfig {
    source: string
    batchSize: number
    autoProcess: boolean
}

class NDJSONService {
    private records: NDJSONRecord[] = []
    private config: NDJSONIngestConfig | null = null
    private processing = false

    async ingestFromFile(filePath: string, config?: Partial<NDJSONIngestConfig>): Promise<number> {
        const ingestConfig: NDJSONIngestConfig = {
            source: filePath,
            batchSize: config?.batchSize || 100,
            autoProcess: config?.autoProcess !== false,
            ...config
        }

        this.config = ingestConfig

        try {
            const fileStream = fs.createReadStream(filePath)
            const rl = readline.createInterface({
                input: fileStream,
                crlfDelay: Infinity
            })

            let count = 0
            for await (const line of rl) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line)
                        const record: NDJSONRecord = {
                            data,
                            timestamp: new Date(),
                            source: filePath
                        }
                        this.records.push(record)
                        count++

                        // Process in batches
                        if (ingestConfig.autoProcess && count % ingestConfig.batchSize === 0) {
                            await this.processBatch()
                        }
                    } catch (error) {
                        log.error(`Failed to parse NDJSON line: ${line}`, error)
                    }
                }
            }

            // Process remaining records
            if (ingestConfig.autoProcess && this.records.length > 0) {
                await this.processBatch()
            }

            log.info(`Ingested ${count} NDJSON records from ${filePath}`)
            return count
        } catch (error) {
            log.error('Failed to ingest NDJSON file:', error)
            throw error
        }
    }

    async ingestFromString(ndjsonString: string, source: string = 'string'): Promise<number> {
        try {
            const lines = ndjsonString.split('\n')
            let count = 0

            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line)
                        const record: NDJSONRecord = {
                            data,
                            timestamp: new Date(),
                            source
                        }
                        this.records.push(record)
                        count++
                    } catch (error) {
                        log.error(`Failed to parse NDJSON line: ${line}`, error)
                    }
                }
            }

            log.info(`Ingested ${count} NDJSON records from ${source}`)
            return count
        } catch (error) {
            log.error('Failed to ingest NDJSON string:', error)
            throw error
        }
    }

    private async processBatch(): Promise<void> {
        if (this.processing) return

        this.processing = true
        try {
            // Placeholder for batch processing logic
            log.info(`Processing batch of ${this.records.length} records`)
        } finally {
            this.processing = false
        }
    }

    getRecords(): NDJSONRecord[] {
        return [...this.records]
    }

    getRecordsBySource(source: string): NDJSONRecord[] {
        return this.records.filter(r => r.source === source)
    }

    getRecordsByDateRange(start: Date, end: Date): NDJSONRecord[] {
        return this.records.filter(r => r.timestamp >= start && r.timestamp <= end)
    }

    queryRecords(predicate: (record: NDJSONRecord) => boolean): NDJSONRecord[] {
        return this.records.filter(predicate)
    }

    clearRecords(): void {
        this.records = []
        log.info('Cleared all NDJSON records')
    }

    clearRecordsBySource(source: string): void {
        this.records = this.records.filter(r => r.source !== source)
        log.info(`Cleared NDJSON records from source: ${source}`)
    }

    exportToNDJSON(outputPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const writeStream = fs.createWriteStream(outputPath)
                
                for (const record of this.records) {
                    writeStream.write(JSON.stringify(record.data) + '\n')
                }

                writeStream.end()
                writeStream.on('finish', () => {
                    log.info(`Exported ${this.records.length} records to ${outputPath}`)
                    resolve()
                })
                writeStream.on('error', reject)
            } catch (error) {
                log.error('Failed to export NDJSON:', error)
                reject(error)
            }
        })
    }

    getConfig(): NDJSONIngestConfig | null {
        return this.config
    }

    isProcessing(): boolean {
        return this.processing
    }
}

// Singleton instance
let ndjsonService: NDJSONService | null = null

export function getNDJSONService(): NDJSONService {
    if (!ndjsonService) {
        ndjsonService = new NDJSONService()
    }
    return ndjsonService
}

export function destroyNDJSONService() {
    ndjsonService = null
}
