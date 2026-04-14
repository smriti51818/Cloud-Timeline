import { headers } from 'next/headers'
import { AppError } from './error-handler'

/**
 * CSRF Protection Utility
 * Ensures that state-changing requests originate from our own domain.
 * Combined with SameSite=Strict cookies, this provides strong protection.
 */

export function validateCsrf() {
    const headerList = headers()
    const origin = headerList.get('origin')
    const host = headerList.get('host')
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'localhost:3000'

    // Simple origin check
    if (origin && !appUrl.includes(new URL(origin).host)) {
        console.error(`[CSRF] Origin mismatch: ${origin} vs ${appUrl}`)
        throw new AppError('CSRF validation failed', 403, 'CSRF_ERROR')
    }

    // For non-GET requests without origin (e.g. some scripts), we can check referer
    const referer = headerList.get('referer')
    if (!origin && referer && !appUrl.includes(new URL(referer).host)) {
        console.error(`[CSRF] Referer mismatch: ${referer} vs ${appUrl}`)
        throw new AppError('CSRF validation failed', 403, 'CSRF_ERROR')
    }
}
