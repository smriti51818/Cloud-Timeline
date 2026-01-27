/**
 * Global error handling utilities
 * Provides consistent error handling across the application
 */

export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public code?: string
    ) {
        super(message)
        this.name = 'AppError'
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(message, 400, 'VALIDATION_ERROR')
        this.name = 'ValidationError'
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string = 'Authentication required') {
        super(message, 401, 'AUTH_ERROR')
        this.name = 'AuthenticationError'
    }
}

export class AuthorizationError extends AppError {
    constructor(message: string = 'Insufficient permissions') {
        super(message, 403, 'AUTHORIZATION_ERROR')
        this.name = 'AuthorizationError'
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string = 'Resource') {
        super(`${resource} not found`, 404, 'NOT_FOUND')
        this.name = 'NotFoundError'
    }
}

export class RateLimitError extends AppError {
    constructor(message: string = 'Too many requests') {
        super(message, 429, 'RATE_LIMIT_ERROR')
        this.name = 'RateLimitError'
    }
}

/**
 * Error handler for API routes
 */
export function handleApiError(error: unknown): {
    message: string
    statusCode: number
    code?: string
} {
    // Known AppError
    if (error instanceof AppError) {
        return {
            message: error.message,
            statusCode: error.statusCode,
            code: error.code,
        }
    }

    // Azure SDK errors
    if (error && typeof error === 'object' && 'statusCode' in error) {
        const azureError = error as { statusCode: number; message?: string }
        return {
            message: azureError.message || 'Azure service error',
            statusCode: azureError.statusCode || 500,
            code: 'AZURE_ERROR',
        }
    }

    // Generic error
    if (error instanceof Error) {
        console.error('Unhandled error:', error)
        return {
            message: process.env.NODE_ENV === 'development'
                ? error.message
                : 'Internal server error',
            statusCode: 500,
            code: 'INTERNAL_ERROR',
        }
    }

    // Unknown error type
    console.error('Unknown error:', error)
    return {
        message: 'An unexpected error occurred',
        statusCode: 500,
        code: 'UNKNOWN_ERROR',
    }
}

/**
 * Error handler for client-side
 */
export function handleClientError(error: unknown): string {
    if (error instanceof AppError) {
        return error.message
    }

    if (error instanceof Error) {
        return error.message
    }

    if (typeof error === 'string') {
        return error
    }

    return 'An unexpected error occurred'
}

/**
 * Create a standardized API error response
 */
export function createErrorResponse(
    error: unknown,
    customMessage?: string
) {
    const { message, statusCode, code } = handleApiError(error)

    return {
        status: statusCode,
        body: {
            error: {
                message: customMessage || message,
                code,
                timestamp: new Date().toISOString(),
            },
        },
    }
}

/**
 * Log error with context
 */
export function logError(
    error: unknown,
    context?: Record<string, unknown>
) {
    const timestamp = new Date().toISOString()
    const errorInfo = handleApiError(error)

    console.error('[ERROR]', {
        timestamp,
        ...errorInfo,
        context,
        stack: error instanceof Error ? error.stack : undefined,
    })
}
