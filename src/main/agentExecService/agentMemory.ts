/**
 * Agent Memory System
 * Memory and context management for autonomous agents
 */

import log from 'electron-log'

export interface MemoryEntry {
    id: string
    type: 'observation' | 'action' | 'result' | 'context' | 'goal'
    content: string
    timestamp: Date
    metadata?: Record<string, any>
    importance: number // 0-1 score for relevance
    embeddings?: number[] // For semantic search
}

export interface MemoryQuery {
    query: string
    type?: MemoryEntry['type']
    limit?: number
    minImportance?: number
    timeRange?: { start: Date; end: Date }
}

export class AgentMemory {
    private memories: Map<string, MemoryEntry> = new Map()
    private memoryCounter = 0
    private maxMemories = 1000
    private importanceThreshold = 0.3

    addMemory(
        type: MemoryEntry['type'],
        content: string,
        metadata?: Record<string, any>,
        importance: number = 0.5
    ): MemoryEntry {
        const memoryId = `memory-${++this.memoryCounter}`
        
        const memory: MemoryEntry = {
            id: memoryId,
            type,
            content,
            timestamp: new Date(),
            metadata,
            importance
        }

        this.memories.set(memoryId, memory)

        // Prune old memories if we exceed limit
        if (this.memories.size > this.maxMemories) {
            this.pruneMemories()
        }

        log.info(`Added memory ${memoryId}: ${type} (importance: ${importance})`)
        return memory
    }

    addObservation(content: string, metadata?: Record<string, any>, importance?: number): MemoryEntry {
        return this.addMemory('observation', content, metadata, importance)
    }

    addAction(content: string, metadata?: Record<string, any>, importance?: number): MemoryEntry {
        return this.addMemory('action', content, metadata, importance || 0.7)
    }

    addResult(content: string, metadata?: Record<string, any>, importance?: number): MemoryEntry {
        return this.addMemory('result', content, metadata, importance || 0.8)
    }

    addContext(content: string, metadata?: Record<string, any>, importance?: number): MemoryEntry {
        return this.addMemory('context', content, metadata, importance || 0.6)
    }

    addGoal(content: string, metadata?: Record<string, any>, importance?: number): MemoryEntry {
        return this.addMemory('goal', content, metadata, importance || 0.9)
    }

    getMemory(memoryId: string): MemoryEntry | undefined {
        return this.memories.get(memoryId)
    }

    getMemories(): MemoryEntry[] {
        return Array.from(this.memories.values())
    }

    getMemoriesByType(type: MemoryEntry['type']): MemoryEntry[] {
        return this.getMemories().filter(m => m.type === type)
    }

    getRecentMemories(count: number = 10): MemoryEntry[] {
        return this.getMemories()
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, count)
    }

    getImportantMemories(threshold: number = this.importanceThreshold): MemoryEntry[] {
        return this.getMemories().filter(m => m.importance >= threshold)
    }

    searchMemories(query: MemoryQuery): MemoryEntry[] {
        let results = this.getMemories()

        // Filter by type
        if (query.type) {
            results = results.filter(m => m.type === query.type)
        }

        // Filter by importance
        if (query.minImportance) {
            results = results.filter(m => m.importance >= query.minImportance)
        }

        // Filter by time range
        if (query.timeRange) {
            results = results.filter(m => 
                m.timestamp >= query.timeRange!.start && 
                m.timestamp <= query.timeRange!.end
            )
        }

        // Simple text search (could be enhanced with embeddings)
        if (query.query) {
            const queryLower = query.query.toLowerCase()
            results = results.filter(m => 
                m.content.toLowerCase().includes(queryLower) ||
                JSON.stringify(m.metadata || {}).toLowerCase().includes(queryLower)
            )
        }

        // Sort by importance and recency
        results.sort((a, b) => {
            const importanceDiff = b.importance - a.importance
            if (Math.abs(importanceDiff) > 0.1) {
                return importanceDiff
            }
            return b.timestamp.getTime() - a.timestamp.getTime()
        })

        // Apply limit
        if (query.limit) {
            results = results.slice(0, query.limit)
        }

        return results
    }

    getContextForTask(taskDescription: string, limit: number = 20): MemoryEntry[] {
        // Get relevant memories for a specific task
        const query: MemoryQuery = {
            query: taskDescription,
            limit,
            minImportance: 0.4
        }
        return this.searchMemories(query)
    }

    updateMemory(memoryId: string, updates: Partial<MemoryEntry>): boolean {
        const memory = this.memories.get(memoryId)
        if (!memory) return false

        const updated = { ...memory, ...updates }
        this.memories.set(memoryId, updated)
        log.info(`Updated memory ${memoryId}`)
        return true
    }

    updateImportance(memoryId: string, importance: number): boolean {
        return this.updateMemory(memoryId, { importance })
    }

    deleteMemory(memoryId: string): boolean {
        const deleted = this.memories.delete(memoryId)
        if (deleted) {
            log.info(`Deleted memory ${memoryId}`)
        }
        return deleted
    }

    deleteMemoriesByType(type: MemoryEntry['type']): number {
        const memories = this.getMemoriesByType(type)
        let count = 0
        for (const memory of memories) {
            if (this.deleteMemory(memory.id)) {
                count++
            }
        }
        log.info(`Deleted ${count} memories of type ${type}`)
        return count
    }

    clearOldMemories(olderThan: Date): number {
        const oldMemories = this.getMemories().filter(m => m.timestamp < olderThan)
        let count = 0
        for (const memory of oldMemories) {
            if (this.deleteMemory(memory.id)) {
                count++
            }
        }
        log.info(`Cleared ${count} old memories`)
        return count
    }

    clearAllMemories(): void {
        const count = this.memories.size
        this.memories.clear()
        log.info(`Cleared all ${count} memories`)
    }

    private pruneMemories(): void {
        // Remove least important memories when exceeding limit
        const memories = this.getMemories()
        
        // Sort by importance (ascending) and recency (descending)
        memories.sort((a, b) => {
            const importanceDiff = a.importance - b.importance
            if (Math.abs(importanceDiff) > 0.1) {
                return importanceDiff
            }
            return a.timestamp.getTime() - b.timestamp.getTime()
        })

        // Remove the least important memories
        const toRemove = memories.slice(0, memories.length - this.maxMemories)
        for (const memory of toRemove) {
            this.deleteMemory(memory.id)
        }

        log.info(`Pruned ${toRemove.length} memories`)
    }

    getMemoryStats(): {
        total: number
        byType: Record<MemoryEntry['type'], number>
        averageImportance: number
        oldestMemory: Date | null
        newestMemory: Date | null
    } {
        const memories = this.getMemories()
        const byType: Record<MemoryEntry['type'], number> = {
            observation: 0,
            action: 0,
            result: 0,
            context: 0,
            goal: 0
        }

        let totalImportance = 0
        let oldest: Date | null = null
        let newest: Date | null = null

        for (const memory of memories) {
            byType[memory.type]++
            totalImportance += memory.importance

            if (!oldest || memory.timestamp < oldest) {
                oldest = memory.timestamp
            }
            if (!newest || memory.timestamp > newest) {
                newest = memory.timestamp
            }
        }

        return {
            total: memories.length,
            byType,
            averageImportance: memories.length > 0 ? totalImportance / memories.length : 0,
            oldestMemory: oldest,
            newestMemory: newest
        }
    }

    exportMemories(): string {
        const memories = this.getMemories()
        return JSON.stringify(memories, null, 2)
    }

    importMemories(json: string): number {
        try {
            const memories = JSON.parse(json) as MemoryEntry[]
            let count = 0
            for (const memory of memories) {
                this.memories.set(memory.id, memory)
                count++
            }
            log.info(`Imported ${count} memories`)
            return count
        } catch (error) {
            log.error('Failed to import memories:', error)
            return 0
        }
    }
}

// Singleton instance
let agentMemory: AgentMemory | null = null

export function getAgentMemory(): AgentMemory {
    if (!agentMemory) {
        agentMemory = new AgentMemory()
    }
    return agentMemory
}

export function destroyAgentMemory() {
    if (agentMemory) {
        agentMemory.clearAllMemories()
        agentMemory = null
    }
}
