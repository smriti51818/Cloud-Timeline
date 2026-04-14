import { ValidationError } from './error-handler'

/**
 * Input Validation & Sanitization Utility
 */

export function validateEmail(email: string) {
    if (!email || typeof email !== 'string') throw new ValidationError('Email is required')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) throw new ValidationError('Invalid email format')
    return email.toLowerCase().trim()
}

export function validatePassword(password: string) {
    if (!password || typeof password !== 'string') throw new ValidationError('Password is required')
    if (password.length < 12) throw new ValidationError('Password must be at least 12 characters long')
    // Check for complexity if needed
    return password
}

/**
 * Sanitize user-provided strings to prevent basic injection
 */
export function sanitizeString(str: string, maxLength = 1000) {
    if (!str) return ''
    return str
        .slice(0, maxLength)
        .replace(/[<>]/g, '') // Basic tag stripping
        .trim()
}

export function validateRegistration(data: any) {
    return {
        email: validateEmail(data.email),
        password: validatePassword(data.password),
        name: sanitizeString(data.name || '', 100)
    }
}
