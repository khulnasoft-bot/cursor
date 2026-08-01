/**
 * Cursor Notebook Service
 * Handles Jupyter notebook integration for Cursor
 */

import * as fs from 'fs'
import * as path from 'path'
import { spawn, ChildProcess } from 'child_process'
import log from 'electron-log'

export interface NotebookCell {
    id: string
    cellType: 'code' | 'markdown'
    content: string
    outputs: CellOutput[]
    executionCount: number | null
}

export interface CellOutput {
    outputType: 'stream' | 'display_data' | 'execute_result' | 'error'
    data?: any
    text?: string
    name?: string
    ename?: string
    evalue?: string
    traceback?: string[]
    executionCount?: number
}

export interface Notebook {
    id: string
    path: string
    name: string
    kernel: string
    cells: NotebookCell[]
    metadata: any
}

export interface NotebookKernel {
    name: string
    language: string
    process: ChildProcess | null
    connected: boolean
}

class NotebookService {
    private notebooks: Map<string, Notebook> = new Map()
    private kernels: Map<string, NotebookKernel> = new Map()
    private notebookIdCounter = 0
    private kernelIdCounter = 0

    async createNotebook(notebookPath: string): Promise<string> {
        const notebookId = `notebook-${++this.notebookIdCounter}`

        try {
            // Load existing notebook or create new one
            let cells: NotebookCell[] = []
            let metadata: any = {}

            if (fs.existsSync(notebookPath)) {
                const data = fs.readFileSync(notebookPath, 'utf8')
                const notebookData = JSON.parse(data)
                cells = this.convertJupyterCells(notebookData.cells)
                metadata = notebookData.metadata || {}
            }

            const notebook: Notebook = {
                id: notebookId,
                path: notebookPath,
                name: path.basename(notebookPath),
                kernel: 'python3',
                cells,
                metadata
            }

            this.notebooks.set(notebookId, notebook)
            log.info(`Created notebook: ${notebook.name} (${notebookId})`)
            return notebookId
        } catch (error) {
            log.error(`Failed to create notebook ${notebookPath}:`, error)
            throw error
        }
    }

    private convertJupyterCells(jupyterCells: any[]): NotebookCell[] {
        return jupyterCells.map((cell, index) => ({
            id: `cell-${index}`,
            cellType: cell.cell_type,
            content: cell.source.join(''),
            outputs: this.convertJupyterOutputs(cell.outputs || []),
            executionCount: cell.execution_count || null
        }))
    }

    private convertJupyterOutputs(outputs: any[]): CellOutput[] {
        return outputs.map(output => {
            if (output.output_type === 'stream') {
                return {
                    outputType: 'stream',
                    text: output.text.join(''),
                    name: output.name
                }
            } else if (output.output_type === 'display_data') {
                return {
                    outputType: 'display_data',
                    data: output.data
                }
            } else if (output.output_type === 'execute_result') {
                return {
                    outputType: 'execute_result',
                    data: output.data,
                    executionCount: output.execution_count
                }
            } else if (output.output_type === 'error') {
                return {
                    outputType: 'error',
                    ename: output.ename,
                    evalue: output.evalue,
                    traceback: output.traceback
                }
            }
            return { outputType: 'stream', text: '' }
        })
    }

    async startKernel(kernelName: string = 'python3'): Promise<string> {
        const kernelId = `kernel-${++this.kernelIdCounter}`

        try {
            // Start Jupyter kernel
            const process = spawn('jupyter', ['kernel', '--kernel', kernelName], {
                stdio: ['pipe', 'pipe', 'pipe']
            })

            const kernel: NotebookKernel = {
                name: kernelName,
                language: this.getKernelLanguage(kernelName),
                process,
                connected: false
            }

            this.setupKernelHandlers(kernel)
            this.kernels.set(kernelId, kernel)

            log.info(`Started kernel: ${kernelName} (${kernelId})`)
            return kernelId
        } catch (error) {
            log.error(`Failed to start kernel ${kernelName}:`, error)
            throw error
        }
    }

    private getKernelLanguage(kernelName: string): string {
        const kernelLanguages: Record<string, string> = {
            'python3': 'python',
            'python2': 'python',
            'ipython': 'python',
            'ir': 'r',
            'ijavascript': 'javascript'
        }
        return kernelLanguages[kernelName] || kernelName
    }

    private setupKernelHandlers(kernel: NotebookKernel) {
        if (!kernel.process) return

        kernel.process.stdout?.on('data', (data) => {
            try {
                // Parse Jupyter kernel protocol messages
                const messages = data.toString().split('\n').filter(Boolean)
                for (const msg of messages) {
                    if (msg.startsWith('{')) {
                        const parsed = JSON.parse(msg)
                        this.handleKernelMessage(kernel, parsed)
                    }
                }
            } catch (error) {
                log.warn(`Failed to parse kernel message from ${kernel.name}:`, error)
            }
        })

        kernel.process.stderr?.on('data', (data) => {
            log.error(`Kernel ${kernel.name} stderr:`, data.toString())
        })

        kernel.process.on('close', (code) => {
            log.info(`Kernel ${kernel.name} closed with code ${code}`)
            kernel.connected = false
            kernel.process = null
        })

        kernel.process.on('error', (error) => {
            log.error(`Kernel ${kernel.name} error:`, error)
            kernel.connected = false
        })
    }

    private handleKernelMessage(kernel: NotebookKernel, message: any) {
        log.info(`Kernel message from ${kernel.name}:`, message)

        // Handle kernel initialization
        if (message.msg_type === 'kernel_info_reply') {
            kernel.connected = true
            log.info(`Kernel ${kernel.name} connected`)
        }
    }

    async executeCell(notebookId: string, cellId: string, kernelId: string): Promise<CellOutput[]> {
        const notebook = this.notebooks.get(notebookId)
        if (!notebook) {
            throw new Error(`Notebook not found: ${notebookId}`)
        }

        const cell = notebook.cells.find(c => c.id === cellId)
        if (!cell) {
            throw new Error(`Cell not found: ${cellId}`)
        }

        const kernel = this.kernels.get(kernelId)
        if (!kernel || !kernel.connected) {
            throw new Error(`Kernel not found or not connected: ${kernelId}`)
        }

        try {
            // Send execution request to kernel
            const outputs = await this.sendExecuteRequest(kernel, cell.content)

            // Update cell with outputs
            cell.outputs = outputs
            cell.executionCount = cell.executionCount ? cell.executionCount + 1 : 1

            return outputs
        } catch (error) {
            log.error('Failed to execute cell:', error)
            throw error
        }
    }

    private async sendExecuteRequest(kernel: NotebookKernel, code: string): Promise<CellOutput[]> {
        if (!kernel.process) {
            throw new Error('Kernel process not available')
        }

        return new Promise((resolve, reject) => {
            const message = {
                header: {
                    msg_id: `execute_${Date.now()}`,
                    msg_type: 'execute_request'
                },
                content: {
                    code,
                    silent: false,
                    store_history: true,
                    user_expressions: {},
                    allow_stdin: false
                }
            }

            const messageStr = JSON.stringify(message)

            const timeout = setTimeout(() => {
                reject(new Error('Kernel execution timeout'))
            }, 30000)

            // Set up response handler
            const responseHandler = (data: Buffer) => {
                try {
                    const response = JSON.parse(data.toString())
                    if (response.header?.msg_type === 'execute_reply') {
                        clearTimeout(timeout)
                        kernel.process?.stdout?.off('data', responseHandler)
                        resolve(response.content || [])
                    }
                } catch (error) {
                    // Ignore parse errors
                }
            }

            kernel.process.stdout?.once('data', responseHandler)
            kernel.process.stdin?.write(messageStr + '\n')

            kernel.process.on('error', (error) => {
                clearTimeout(timeout)
                reject(error)
            })
        })
    }

    async addCell(notebookId: string, cellType: 'code' | 'markdown', content: string = ''): Promise<string> {
        const notebook = this.notebooks.get(notebookId)
        if (!notebook) {
            throw new Error(`Notebook not found: ${notebookId}`)
        }

        const cellId = `cell-${Date.now()}`
        const cell: NotebookCell = {
            id: cellId,
            cellType,
            content,
            outputs: [],
            executionCount: null
        }

        notebook.cells.push(cell)
        log.info(`Added cell ${cellId} to notebook ${notebookId}`)
        return cellId
    }

    async updateCell(notebookId: string, cellId: string, content: string): Promise<void> {
        const notebook = this.notebooks.get(notebookId)
        if (!notebook) {
            throw new Error(`Notebook not found: ${notebookId}`)
        }

        const cell = notebook.cells.find(c => c.id === cellId)
        if (!cell) {
            throw new Error(`Cell not found: ${cellId}`)
        }

        cell.content = content
    }

    async deleteCell(notebookId: string, cellId: string): Promise<void> {
        const notebook = this.notebooks.get(notebookId)
        if (!notebook) {
            throw new Error(`Notebook not found: ${notebookId}`)
        }

        const index = notebook.cells.findIndex(c => c.id === cellId)
        if (index === -1) {
            throw new Error(`Cell not found: ${cellId}`)
        }

        notebook.cells.splice(index, 1)
    }

    async saveNotebook(notebookId: string): Promise<void> {
        const notebook = this.notebooks.get(notebookId)
        if (!notebook) {
            throw new Error(`Notebook not found: ${notebookId}`)
        }

        try {
            const jupyterNotebook = {
                cells: notebook.cells.map(cell => ({
                    cell_type: cell.cellType,
                    source: cell.content.split('\n'),
                    outputs: this.convertToJupyterOutputs(cell.outputs),
                    execution_count: cell.executionCount,
                    metadata: {}
                })),
                metadata: notebook.metadata,
                nbformat: 4,
                nbformat_minor: 4
            }

            const data = JSON.stringify(jupyterNotebook, null, 2)
            fs.writeFileSync(notebook.path, data, 'utf8')

            log.info(`Saved notebook: ${notebook.name}`)
        } catch (error) {
            log.error('Failed to save notebook:', error)
            throw error
        }
    }

    private convertToJupyterOutputs(outputs: CellOutput[]): any[] {
        return outputs.map(output => {
            if (output.outputType === 'stream') {
                return {
                    output_type: 'stream',
                    name: output.name || 'stdout',
                    text: output.text ? output.text.split('\n') : []
                }
            } else if (output.outputType === 'display_data') {
                return {
                    output_type: 'display_data',
                    data: output.data
                }
            } else if (output.outputType === 'execute_result') {
                return {
                    output_type: 'execute_result',
                    data: output.data,
                    execution_count: output.executionCount
                }
            } else if (output.outputType === 'error') {
                return {
                    output_type: 'error',
                    ename: output.ename,
                    evalue: output.evalue,
                    traceback: output.traceback
                }
            }
            return { output_type: 'stream', text: [] }
        })
    }

    async closeNotebook(notebookId: string): Promise<void> {
        const notebook = this.notebooks.get(notebookId)
        if (notebook) {
            await this.saveNotebook(notebookId)
            this.notebooks.delete(notebookId)
            log.info(`Closed notebook: ${notebook.name}`)
        }
    }

    async stopKernel(kernelId: string): Promise<void> {
        const kernel = this.kernels.get(kernelId)
        if (kernel && kernel.process) {
            kernel.process.kill()
            this.kernels.delete(kernelId)
            log.info(`Stopped kernel: ${kernel.name} (${kernelId})`)
        }
    }

    getNotebook(notebookId: string): Notebook | undefined {
        return this.notebooks.get(notebookId)
    }

    getNotebooks(): Notebook[] {
        return Array.from(this.notebooks.values())
    }

    getKernel(kernelId: string): NotebookKernel | undefined {
        return this.kernels.get(kernelId)
    }

    getKernels(): NotebookKernel[] {
        return Array.from(this.kernels.values())
    }
}

// Singleton instance
let notebookService: NotebookService | null = null

export function getNotebookService(): NotebookService {
    if (!notebookService) {
        notebookService = new NotebookService()
    }
    return notebookService
}

export function destroyNotebookService() {
    if (notebookService) {
        // Stop all kernels
        const kernels = notebookService.getKernels()
        for (const kernel of kernels) {
            notebookService.stopKernel(kernel.name)
        }
        notebookService = null
    }
}
