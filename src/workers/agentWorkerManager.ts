/**
 * Agent Worker Manager
 * Manages the lifecycle of agent workers and handles communication
 */

import { AgentTask, AgentResponse } from './agentWorker'

export class AgentWorkerManager {
    private worker: Worker | null = null
    private pendingTasks: Map<string, {
        resolve: (value: any) => void
        reject: (error: Error) => void
        onProgress?: (progress: number) => void
    }> = new Map()

    constructor() {
        this.initializeWorker()
    }

    private initializeWorker() {
        try {
            // Create worker from the TypeScript file
            // In production, this would be built to a separate worker file
            const workerCode = `
                ${require('./agentWorker.ts')}
            `
            
            // For now, we'll use a Blob approach for development
            const blob = new Blob([workerCode], { type: 'application/javascript' })
            const workerUrl = URL.createObjectURL(blob)
            
            this.worker = new Worker(workerUrl)
            
            this.worker.onmessage = (event: MessageEvent<AgentResponse>) => {
                this.handleWorkerMessage(event.data)
            }
            
            this.worker.onerror = (error) => {
                console.error('Agent worker error:', error)
            }
        } catch (error) {
            console.error('Failed to initialize agent worker:', error)
        }
    }

    private handleWorkerMessage(response: AgentResponse) {
        const task = this.pendingTasks.get(response.id)
        if (!task) return

        switch (response.type) {
            case 'result':
                task.resolve(response.data)
                this.pendingTasks.delete(response.id)
                break
            case 'error':
                task.reject(new Error(response.error || 'Unknown worker error'))
                this.pendingTasks.delete(response.id)
                break
            case 'progress':
                if (task.onProgress) {
                    task.onProgress(response.progress || 0)
                }
                break
        }
    }

    async executeTask(
        task: AgentTask,
        onProgress?: (progress: number) => void
    ): Promise<any> {
        if (!this.worker) {
            throw new Error('Agent worker not initialized')
        }

        return new Promise((resolve, reject) => {
            this.pendingTasks.set(task.id, { resolve, reject, onProgress })
            this.worker!.postMessage(task)
        })
    }

    async completion(
        file: string,
        content: string,
        pos: number,
        onProgress?: (progress: number) => void
    ): Promise<{ completion: string }> {
        const taskId = this.generateTaskId()
        return this.executeTask(
            {
                type: 'completion',
                id: taskId,
                data: { file, content, pos }
            },
            onProgress
        )
    }

    async chat(
        messages: any[],
        context: any,
        onProgress?: (progress: number) => void
    ): Promise<{ response: string }> {
        const taskId = this.generateTaskId()
        return this.executeTask(
            {
                type: 'chat',
                id: taskId,
                data: { messages, context }
            },
            onProgress
        )
    }

    async analysis(
        code: string,
        language: string,
        onProgress?: (progress: number) => void
    ): Promise<{ analysis: any }> {
        const taskId = this.generateTaskId()
        return this.executeTask(
            {
                type: 'analysis',
                id: taskId,
                data: { code, language }
            },
            onProgress
        )
    }

    async fix(
        code: string,
        errors: any[],
        language: string,
        onProgress?: (progress: number) => void
    ): Promise<{ fixed: string }> {
        const taskId = this.generateTaskId()
        return this.executeTask(
            {
                type: 'fix',
                id: taskId,
                data: { code, errors, language }
            },
            onProgress
        )
    }

    private generateTaskId(): string {
        return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    terminate() {
        if (this.worker) {
            this.worker.terminate()
            this.worker = null
        }
        this.pendingTasks.clear()
    }
}

// Singleton instance
let agentWorkerManager: AgentWorkerManager | null = null

export function getAgentWorkerManager(): AgentWorkerManager {
    if (!agentWorkerManager) {
        agentWorkerManager = new AgentWorkerManager()
    }
    return agentWorkerManager
}

export function terminateAgentWorker() {
    if (agentWorkerManager) {
        agentWorkerManager.terminate()
        agentWorkerManager = null
    }
}
