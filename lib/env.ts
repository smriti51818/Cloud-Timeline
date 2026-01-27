/**
 * Environment variable validation and type-safe access
 * Validates required environment variables at build time
 */

const requiredEnvVars = {
    // NextAuth
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,

    // Azure AD
    NEXT_PUBLIC_AZURE_CLIENT_ID: process.env.NEXT_PUBLIC_AZURE_CLIENT_ID,
    NEXT_PUBLIC_AZURE_TENANT_ID: process.env.NEXT_PUBLIC_AZURE_TENANT_ID,

    // Azure Storage
    AZURE_STORAGE_ACCOUNT: process.env.AZURE_STORAGE_ACCOUNT,
    AZURE_STORAGE_KEY: process.env.AZURE_STORAGE_KEY,
    AZURE_STORAGE_CONNECTION_STRING: process.env.AZURE_STORAGE_CONNECTION_STRING,

    // Azure Cosmos DB
    AZURE_COSMOS_ENDPOINT: process.env.AZURE_COSMOS_ENDPOINT,
    AZURE_COSMOS_KEY: process.env.AZURE_COSMOS_KEY,
    AZURE_COSMOS_DATABASE: process.env.AZURE_COSMOS_DATABASE,
    AZURE_COSMOS_CONTAINER: process.env.AZURE_COSMOS_CONTAINER,

    // Azure Cognitive Services
    AZURE_COGNITIVE_VISION_KEY: process.env.AZURE_COGNITIVE_VISION_KEY,
    AZURE_COGNITIVE_VISION_ENDPOINT: process.env.AZURE_COGNITIVE_VISION_ENDPOINT,
    AZURE_COGNITIVE_SPEECH_KEY: process.env.AZURE_COGNITIVE_SPEECH_KEY,
    AZURE_COGNITIVE_SPEECH_REGION: process.env.AZURE_COGNITIVE_SPEECH_REGION,
    AZURE_COGNITIVE_TEXT_KEY: process.env.AZURE_COGNITIVE_TEXT_KEY,
    AZURE_COGNITIVE_TEXT_ENDPOINT: process.env.AZURE_COGNITIVE_TEXT_ENDPOINT,
} as const

/**
 * Validates that all required environment variables are set
 * Throws an error with helpful message if any are missing
 */
export function validateEnv(): void {
    const missing: string[] = []

    for (const [key, value] of Object.entries(requiredEnvVars)) {
        if (!value || value.trim() === '') {
            missing.push(key)
        }
    }

    if (missing.length > 0) {
        const errorMessage = `
╔════════════════════════════════════════════════════════════════╗
║  Missing Required Environment Variables                        ║
╚════════════════════════════════════════════════════════════════╝

The following environment variables are required but not set:

${missing.map((key) => `  ❌ ${key}`).join('\n')}

Please ensure you have:
1. Copied .env.example to .env.local
2. Filled in all required values
3. Restarted your development server

For Azure setup instructions, see: docs/ENVIRONMENT_SETUP.md
`
        throw new Error(errorMessage)
    }
}

/**
 * Get an environment variable with type safety
 * Returns undefined if not set (for optional vars)
 */
export function getEnv(key: keyof NodeJS.ProcessEnv): string | undefined {
    return process.env[key]
}

/**
 * Get a required environment variable
 * Throws if not set
 */
export function getRequiredEnv(key: keyof NodeJS.ProcessEnv): string {
    const value = process.env[key]
    if (!value) {
        throw new Error(`Required environment variable ${key} is not set`)
    }
    return value
}

/**
 * Check if we're in production
 */
export const isProduction = process.env.NODE_ENV === 'production'

/**
 * Check if we're in development
 */
export const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Get the app URL
 */
export const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Validate environment variables in production builds
if (isProduction && typeof window === 'undefined') {
    validateEnv()
}
