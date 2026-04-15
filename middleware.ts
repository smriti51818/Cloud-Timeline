import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { checkRateLimit } from './lib/rate-limiter'

// Rate limit configurations
const RATE_LIMITS = {
    LOGIN: { limit: 5, windowMs: 15 * 60 * 1000 },
    REGISTER: { limit: 10, windowMs: 60 * 60 * 1000 },
    RESET_REQUEST: { limit: 3, windowMs: 60 * 60 * 1000 },
    VERIFY_EMAIL: { limit: 5, windowMs: 60 * 60 * 1000 },
}

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/timeline', '/insights', '/story', '/voice']

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login']

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'anonymous'

    // Apply Rate Limiting to Auth Endpoints
    if (pathname.startsWith('/api/auth/')) {
        let config = null
        if (pathname.includes('/login')) config = RATE_LIMITS.LOGIN
        if (pathname.includes('/register')) config = RATE_LIMITS.REGISTER
        if (pathname.includes('/password-reset-request')) config = RATE_LIMITS.RESET_REQUEST
        if (pathname.includes('/verify-email')) config = RATE_LIMITS.VERIFY_EMAIL

        if (config) {
            const { success, retryAfter } = await checkRateLimit(`rl:${pathname}:${ip}`, config)
            if (!success) {
                return new NextResponse(
                    JSON.stringify({ error: 'Too many attempts. Please try again later.' }),
                    { 
                        status: 429, 
                        headers: { 
                            'Content-Type': 'application/json',
                            'Retry-After': retryAfter.toString() 
                        } 
                    }
                )
            }
        }
    }

    // Get the JWT token from the request
    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const isAuthenticated = !!token

    // Redirect to login if trying to access protected route without auth
    if (protectedRoutes.some((route) => pathname.startsWith(route)) && !isAuthenticated) {
        const url = new URL('/login', request.url)
        url.searchParams.set('callbackUrl', pathname)
        return NextResponse.redirect(url)
    }

    // Redirect to timeline if trying to access auth routes while authenticated
    if (authRoutes.some((route) => pathname.startsWith(route)) && isAuthenticated) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Use absolute URL for security headers
    const response = NextResponse.next()

    // ENFORCED SECURITY HEADERS
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('Referrer-Policy', 'no-referrer') // Senior spec requirement
    response.headers.set('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), geolocation=()')
    
    // Strict CSP
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'unsafe-eval' 'unsafe-inline';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        font-src 'self' data:;
        connect-src 'self' https://*.core.windows.net https://*.cognitive.microsoft.com https://login.microsoftonline.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
    `.replace(/\s{2,}/g, ' ').trim()
    
    response.headers.set('Content-Security-Policy', cspHeader)

    return response
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         * - api routes (handled separately)
         */
        '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
    ],
}
