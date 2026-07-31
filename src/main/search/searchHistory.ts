/**
 * Search History Service
 * Search history and saved queries management
 */

import log from 'electron-log'
import { store } from '../storeHandler'

export interface SearchQuery {
    id: string
    pattern: string
    directory: string
    caseSensitive: boolean
    regex: boolean
    wholeWord: boolean
    fileExtensions: string[]
    excludePatterns: string[]
    symbolType?: 'function' | 'class' | 'variable' | 'constant' | 'all'
    timestamp: Date
    resultCount: number
}

export interface SavedQuery extends SearchQuery {
    name: string
    description?: string
    isFavorite: boolean
}

export class SearchHistoryService {
    private history: SearchQuery[] = []
    private savedQueries: SavedQuery[] = []
    private maxHistorySize = 100
    private historyCounter = 0
    private savedCounter = 0

    constructor() {
        this.loadFromStorage()
    }

    addToHistory(query: Omit<SearchQuery, 'id' | 'timestamp'>, resultCount: number): SearchQuery {
        const historyEntry: SearchQuery = {
            id: `history-${++this.historyCounter}`,
            ...query,
            timestamp: new Date(),
            resultCount
        }

        this.history.unshift(historyEntry)

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(0, this.maxHistorySize)
        }

        this.saveToStorage()
        log.info(`Added search to history: ${query.pattern}`)
        return historyEntry
    }

    getHistory(): SearchQuery[] {
        return [...this.history]
    }

    getRecentHistory(count: number = 10): SearchQuery[] {
        return this.history.slice(0, count)
    }

    getHistoryByPattern(pattern: string): SearchQuery[] {
        return this.history.filter(h => h.pattern.includes(pattern))
    }

    removeFromHistory(id: string): boolean {
        const index = this.history.findIndex(h => h.id === id)
        if (index !== -1) {
            this.history.splice(index, 1)
            this.saveToStorage()
            log.info(`Removed search from history: ${id}`)
            return true
        }
        return false
    }

    clearHistory(): void {
        this.history = []
        this.saveToStorage()
        log.info('Cleared search history')
    }

    saveQuery(query: Omit<SearchQuery, 'id' | 'timestamp'>, name: string, description?: string): SavedQuery {
        const savedQuery: SavedQuery = {
            id: `saved-${++this.savedCounter}`,
            ...query,
            name,
            description,
            isFavorite: false,
            timestamp: new Date(),
            resultCount: 0
        }

        this.savedQueries.push(savedQuery)
        this.saveToStorage()
        log.info(`Saved query: ${name}`)
        return savedQuery
    }

    getSavedQueries(): SavedQuery[] {
        return [...this.savedQueries]
    }

    getSavedQuery(id: string): SavedQuery | undefined {
        return this.savedQueries.find(q => q.id === id)
    }

    getFavoriteQueries(): SavedQuery[] {
        return this.savedQueries.filter(q => q.isFavorite)
    }

    updateSavedQuery(id: string, updates: Partial<Omit<SavedQuery, 'id'>>): boolean {
        const query = this.savedQueries.find(q => q.id === id)
        if (query) {
            Object.assign(query, updates)
            this.saveToStorage()
            log.info(`Updated saved query: ${id}`)
            return true
        }
        return false
    }

    deleteSavedQuery(id: string): boolean {
        const index = this.savedQueries.findIndex(q => q.id === id)
        if (index !== -1) {
            this.savedQueries.splice(index, 1)
            this.saveToStorage()
            log.info(`Deleted saved query: ${id}`)
            return true
        }
        return false
    }

    toggleFavorite(id: string): boolean {
        const query = this.savedQueries.find(q => q.id === id)
        if (query) {
            query.isFavorite = !query.isFavorite
            this.saveToStorage()
            log.info(`Toggled favorite for query: ${id}`)
            return true
        }
        return false
    }

    searchHistory(query: string): SearchQuery[] {
        const queryLower = query.toLowerCase()
        return this.history.filter(h => 
            h.pattern.toLowerCase().includes(queryLower) ||
            h.directory.toLowerCase().includes(queryLower)
        )
    }

    searchSavedQueries(query: string): SavedQuery[] {
        const queryLower = query.toLowerCase()
        return this.savedQueries.filter(q => 
            q.name.toLowerCase().includes(queryLower) ||
            q.pattern.toLowerCase().includes(queryLower) ||
            (q.description && q.description.toLowerCase().includes(queryLower))
        )
    }

    getStatistics(): {
        totalHistory: number
        totalSaved: number
        totalFavorites: number
        mostCommonPatterns: Array<{ pattern: string; count: number }>
        mostCommonDirectories: Array<{ directory: string; count: number }>
    } {
        const patternCounts = new Map<string, number>()
        const directoryCounts = new Map<string, number>()

        for (const entry of this.history) {
            patternCounts.set(entry.pattern, (patternCounts.get(entry.pattern) || 0) + 1)
            directoryCounts.set(entry.directory, (directoryCounts.get(entry.directory) || 0) + 1)
        }

        const mostCommonPatterns = Array.from(patternCounts.entries())
            .map(([pattern, count]) => ({ pattern, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        const mostCommonDirectories = Array.from(directoryCounts.entries())
            .map(([directory, count]) => ({ directory, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5)

        return {
            totalHistory: this.history.length,
            totalSaved: this.savedQueries.length,
            totalFavorites: this.savedQueries.filter(q => q.isFavorite).length,
            mostCommonPatterns,
            mostCommonDirectories
        }
    }

    exportHistory(): string {
        return JSON.stringify(this.history, null, 2)
    }

    exportSavedQueries(): string {
        return JSON.stringify(this.savedQueries, null, 2)
    }

    importHistory(json: string): number {
        try {
            const history = JSON.parse(json) as SearchQuery[]
            let count = 0
            for (const entry of history) {
                this.history.push(entry)
                count++
            }
            this.saveToStorage()
            log.info(`Imported ${count} history entries`)
            return count
        } catch (error) {
            log.error('Failed to import history:', error)
            return 0
        }
    }

    importSavedQueries(json: string): number {
        try {
            const queries = JSON.parse(json) as SavedQuery[]
            let count = 0
            for (const query of queries) {
                this.savedQueries.push(query)
                count++
            }
            this.saveToStorage()
            log.info(`Imported ${count} saved queries`)
            return count
        } catch (error) {
            log.error('Failed to import saved queries:', error)
            return 0
        }
    }

    private saveToStorage(): void {
        try {
            store.set('searchHistory', this.history)
            store.set('savedQueries', this.savedQueries)
        } catch (error) {
            log.error('Failed to save search history to storage:', error)
        }
    }

    private loadFromStorage(): void {
        try {
            const history = store.get('searchHistory') as SearchQuery[] | undefined
            const savedQueries = store.get('savedQueries') as SavedQuery[] | undefined

            if (history) {
                this.history = history
            }
            if (savedQueries) {
                this.savedQueries = savedQueries
            }

            log.info(`Loaded ${this.history.length} history entries and ${this.savedQueries.length} saved queries`)
        } catch (error) {
            log.error('Failed to load search history from storage:', error)
        }
    }

    setMaxHistorySize(size: number): void {
        this.maxHistorySize = size
        if (this.history.length > size) {
            this.history = this.history.slice(0, size)
            this.saveToStorage()
        }
    }
}

// Singleton instance
let searchHistoryService: SearchHistoryService | null = null

export function getSearchHistoryService(): SearchHistoryService {
    if (!searchHistoryService) {
        searchHistoryService = new SearchHistoryService()
    }
    return searchHistoryService
}

export function destroySearchHistoryService() {
    if (searchHistoryService) {
        searchHistoryService = null
    }
}
