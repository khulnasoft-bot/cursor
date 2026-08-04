/**
 * Error handling utilities
 * Custom error classes for expected backend errors
 */

/**
 * Base class for expected backend errors
 */
export class ExpectedBackendError extends Error {
    public title: string | null = null
    constructor(message: string) {
        super(message)
        this.name = 'ExpectedBackendError'
    }
}

/**
 * Rate limit error for unauthenticated requests
 */
export class NoAuthRateLimitError extends ExpectedBackendError {
    constructor(
        message = "You've reached the rate limit for unauthenticated requests. Please log in to continue."
    ) {
        super(message)
        this.name = 'NoAuthRateLimitError'
        this.title = 'Please log in to continue...'
    }
}

/**
 * Rate limit error for authenticated requests
 */
export class AuthRateLimitError extends ExpectedBackendError {
    constructor(
        message = "It seems like you're making an unusual number of AI requests. Please try again later. If you think this is a mistake, please contact support."
    ) {
        super(message)
        this.name = 'AuthRateLimitError'
        this.title = "You're going a bit fast..."
    }
}

/**
 * Local rate limit error for free users
 */
export class NoAuthLocalRateLimitError extends ExpectedBackendError {
    constructor(
        message = 'To protect our backend, we ask that free users limit their usage to 30 prompts per hour. To raise this limit, feel free to upgrade to pro.'
    ) {
        super(message)
        this.name = 'NoAuthLocalRateLimitError'
        this.title = "You're going a bit fast..."
    }
}

/**
 * Global old rate limit error
 */
export class NoAuthGlobalOldRateLimitError extends ExpectedBackendError {
    constructor(
        message = "If you've enjoyed using this service, please consider subscribing to one of our paid plans. Otherwise, you can enter your API key to continue using the AI features at-cost."
    ) {
        super(message)
        this.name = 'NoAuthGlobalOldRateLimitError'
        this.title = 'Free tier limit exceeded'
    }
}

/**
 * Global new rate limit error (server overload)
 */
export class NoAuthGlobalNewRateLimitError extends ExpectedBackendError {
    constructor(
        message = "We're currently experiencing a high volume of requests. Please try again in a few minutes. For support, please contact support."
    ) {
        super(message)
        this.name = 'NoAuthGlobalNewRateLimitError'
        this.title = 'Our servers are overloaded...'
    }
}

/**
 * Base OpenAI error
 */
export class OpenAIError extends ExpectedBackendError {
    constructor(message: string) {
        super(message)
        this.name = 'OpenAIError'
    }
}

/**
 * Invalid OpenAI API key error
 */
export class BadOpenAIAPIKeyError extends OpenAIError {
    constructor(
        message = 'The provided OpenAI API key is invalid. Please provide a valid API key.'
    ) {
        super(message)
        this.name = 'BadOpenAIAPIKeyError'
    }
}

/**
 * Invalid model ID error
 */
export class BadModelError extends ExpectedBackendError {
    constructor(
        message = 'The provided model ID is invalid. Please provide a valid model ID.'
    ) {
        super(message)
        this.name = 'BadModelError'
    }
}

/**
 * Not logged in error
 */
export class NotLoggedInError extends ExpectedBackendError {
    constructor(message = 'You are not logged in. Please log in to continue.') {
        super(message)
        this.name = 'NotLoggedInError'
    }
}

/**
 * Union type for all expected errors
 */
export type ExpectedError =
    | NoAuthRateLimitError
    | AuthRateLimitError
    | NoAuthLocalRateLimitError
    | NoAuthGlobalOldRateLimitError
    | NoAuthGlobalNewRateLimitError
    | BadOpenAIAPIKeyError
    | BadModelError
    | NotLoggedInError

/**
 * Check if an error is an expected error
 */
export function isExpectedError(error: any): error is ExpectedError {
    return (
        error instanceof NoAuthRateLimitError ||
        error instanceof AuthRateLimitError ||
        error instanceof NoAuthLocalRateLimitError ||
        error instanceof NoAuthGlobalOldRateLimitError ||
        error instanceof NoAuthGlobalNewRateLimitError ||
        error instanceof BadOpenAIAPIKeyError ||
        error instanceof BadModelError ||
        error instanceof NotLoggedInError
    )
}