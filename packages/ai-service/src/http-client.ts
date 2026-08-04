/**
 * HTTP Client Abstraction
 * Provides a consistent interface for HTTP requests with streaming support
 */

/**
 * HTTP response interface
 */
export interface HttpResponse<T = any> {
    data: T
    status: number
    statusText: string
    headers: Record<string, string>
}

/**
 * HTTP client interface
 */
export interface HttpClient {
    post(url: string, body: any, headers?: Record<string, string>): Promise<HttpResponse>
    stream(url: string, body: any, onChunk: (chunk: string) => void, headers?: Record<string, string>): Promise<void>
}

/**
 * HTTP error interface
 */
export interface HttpError extends Error {
    status?: number
    statusText?: string
    data?: any
}

/**
 * Create an HTTP error
 */
export function createHttpError(message: string, status?: number, statusText?: string, data?: any): HttpError {
    const error = new Error(message) as HttpError
    error.status = status
    error.statusText = statusText
    error.data = data
    return error
}

/**
 * Fetch-based HTTP client implementation
 * Uses the global fetch API when available, requires node-fetch in Node.js
 */
export class FetchHttpClient implements HttpClient {
    private fetch: any

    constructor() {
        // Use global fetch if available, otherwise require node-fetch
        if (typeof fetch !== 'undefined') {
            this.fetch = fetch
        } else {
            // Dynamic import for Node.js environment
            try {
                const nodeFetch = require('node-fetch')
                this.fetch = nodeFetch.default || nodeFetch
            } catch (error) {
                throw new Error('fetch is not available. Please install node-fetch or run in a browser environment.')
            }
        }
    }

    async post(url: string, body: any, headers?: Record<string, string>): Promise<HttpResponse> {
        try {
            const response = await this.fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(body)
            })

            const responseHeaders: Record<string, string> = {}
            response.headers.forEach((value: string, key: string) => {
                responseHeaders[key] = value
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw createHttpError(
                    `HTTP ${response.status}: ${errorText}`,
                    response.status,
                    response.statusText,
                    errorText
                )
            }

            const data = await response.json()
            return {
                data,
                status: response.status,
                statusText: response.statusText,
                headers: responseHeaders
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
            throw createHttpError(`HTTP request failed: ${String(error)}`)
        }
    }

    async stream(
        url: string,
        body: any,
        onChunk: (chunk: string) => void,
        headers?: Record<string, string>
    ): Promise<void> {
        try {
            const response = await this.fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...headers
                },
                body: JSON.stringify(body)
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw createHttpError(
                    `HTTP ${response.status}: ${errorText}`,
                    response.status,
                    response.statusText,
                    errorText
                )
            }

            if (!response.body) {
                throw new Error('Response body is null')
            }

            const reader = response.body.getReader()
            const decoder = new TextDecoder('utf-8')

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                onChunk(chunk)
            }
        } catch (error) {
            if (error instanceof Error) {
                throw error
            }
            throw createHttpError(`HTTP stream failed: ${String(error)}`)
        }
    }
}

/**
 * Mock HTTP client for testing
 */
export class MockHttpClient implements HttpClient {
    private responses: Map<string, any> = new Map()
    private streamResponses: Map<string, string[]> = new Map()

    setMockResponse(url: string, response: any): void {
        this.responses.set(url, response)
    }

    setMockStreamResponse(url: string, chunks: string[]): void {
        this.streamResponses.set(url, chunks)
    }

    async post(url: string, body: any, headers?: Record<string, string>): Promise<HttpResponse> {
        const response = this.responses.get(url)
        if (response === undefined) {
            throw createHttpError(`No mock response for ${url}`)
        }
        return {
            data: response,
            status: 200,
            statusText: 'OK',
            headers: {}
        }
    }

    async stream(
        url: string,
        body: any,
        onChunk: (chunk: string) => void,
        headers?: Record<string, string>
    ): Promise<void> {
        const chunks = this.streamResponses.get(url)
        if (chunks === undefined) {
            throw createHttpError(`No mock stream response for ${url}`)
        }
        for (const chunk of chunks) {
            onChunk(chunk)
        }
    }

    clear(): void {
        this.responses.clear()
        this.streamResponses.clear()
    }
}