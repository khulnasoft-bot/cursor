/**
 * Streaming utilities
 * Functions for handling streaming responses
 */

import { NoAuthRateLimitError, AuthRateLimitError } from './error-handling'

/**
 * Stream data from a server-sent events response
 * @param response - The fetch response object
 * @yields Parsed JSON objects from the stream
 */
export async function* streamSource(response: Response): AsyncGenerator<any> {
    if (response.status === 429) {
        // Check the error text
        if (response.statusText === 'NO_AUTH') {
            throw new NoAuthRateLimitError()
        } else {
            throw new AuthRateLimitError()
        }
    }

    // Check if the response is an event-stream
    if (
        response.headers.get('content-type') ===
        'text/event-stream; charset=utf-8'
    ) {
        // Create a reader to read the response body as a stream
        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('Response body is null')
        }

        // Create a decoder to decode the stream as UTF-8 text
        const decoder = new TextDecoder('utf-8')

        // Loop until the stream is done
        while (true) {
            const { value, done } = await reader.read()
            if (done) {
                break
            }

            const rawValue = decoder.decode(value)
            const lines = rawValue.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonString = line.slice(6)
                    if (jsonString === '[DONE]') {
                        return
                    }
                    try {
                        yield JSON.parse(jsonString)
                    } catch (e) {
                        // Skip invalid JSON
                        console.warn('Failed to parse JSON:', jsonString)
                    }
                }
            }
        }
    } else {
        // Raise exception
        throw new Error('Response is not an event-stream')
    }
}

/**
 * Another streaming function that wraps parsed data in an object
 * @param response - The fetch response object
 * @yields Objects with a 'data' property containing parsed JSON
 */
export async function* anotherStreamSource(
    response: Response
): AsyncGenerator<any> {
    // Check if the response is an event-stream
    if (
        response.headers.get('content-type') ===
        'text/event-stream; charset=utf-8'
    ) {
        // Create a reader to read the response body as a stream
        const reader = response.body?.getReader()
        if (!reader) {
            throw new Error('Response body is null')
        }

        // Create a decoder to decode the stream as UTF-8 text
        const decoder = new TextDecoder('utf-8')

        // Loop until the stream is done
        while (true) {
            const { value, done } = await reader.read()
            if (done) {
                break
            }

            const rawValue = decoder.decode(value)
            const lines = rawValue.split('\n')

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonString = line.slice(6)
                    if (jsonString === '[DONE]') {
                        return
                    }
                    try {
                        // Wrap the parsed JSON object in an additional object
                        yield { data: JSON.parse(jsonString) }
                    } catch (e) {
                        // Skip invalid JSON
                        console.warn('Failed to parse JSON:', jsonString)
                    }
                }
            }
        }
    } else {
        // Raise exception
        throw new Error('Response is not an event-stream')
    }
}

/**
 * Stream data from a response with custom parsing
 * @param response - The fetch response object
 * @param parser - Custom parser function for each line
 * @yields Parsed data from the stream
 */
export async function* streamWithParser<T>(
    response: Response,
    parser: (line: string) => T
): AsyncGenerator<T> {
    if (!response.body) {
        throw new Error('Response body is null')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')

    while (true) {
        const { value, done } = await reader.read()
        if (done) {
            break
        }

        const rawValue = decoder.decode(value)
        const lines = rawValue.split('\n')

        for (const line of lines) {
            if (line.trim()) {
                try {
                    yield parser(line)
                } catch (e) {
                    console.warn('Failed to parse line:', line)
                }
            }
        }
    }
}