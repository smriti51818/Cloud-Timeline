/**
 * Environment validation script
 * Run before build to ensure all required environment variables are set
 */

const requiredEnvVars = [
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_AZURE_CLIENT_ID',
    'NEXT_PUBLIC_AZURE_TENANT_ID',
    'AZURE_STORAGE_ACCOUNT',
    'AZURE_STORAGE_KEY',
    'AZURE_STORAGE_CONNECTION_STRING',
    'AZURE_COSMOS_ENDPOINT',
    'AZURE_COSMOS_KEY',
    'AZURE_COSMOS_DATABASE',
    'AZURE_COSMOS_CONTAINER',
    'AZURE_COGNITIVE_VISION_KEY',
    'AZURE_COGNITIVE_VISION_ENDPOINT',
    'AZURE_COGNITIVE_SPEECH_KEY',
    'AZURE_COGNITIVE_SPEECH_REGION',
    'AZURE_COGNITIVE_TEXT_KEY',
    'AZURE_COGNITIVE_TEXT_ENDPOINT',
]

function validateEnv() {
    const missing = []
    const empty = []

    for (const varName of requiredEnvVars) {
        if (!process.env[varName]) {
            missing.push(varName)
        } else if (process.env[varName].trim() === '') {
            empty.push(varName)
        }
    }

    if (missing.length > 0 || empty.length > 0) {
        console.error('\n╔════════════════════════════════════════════════════════════════╗')
        console.error('║  ❌ Environment Variable Validation Failed                    ║')
        console.error('╚════════════════════════════════════════════════════════════════╝\n')

        if (missing.length > 0) {
            console.error('Missing environment variables:\n')
            missing.forEach((varName) => {
                console.error(`  ❌ ${varName}`)
            })
            console.error('')
        }

        if (empty.length > 0) {
            console.error('Empty environment variables:\n')
            empty.forEach((varName) => {
                console.error(`  ⚠️  ${varName}`)
            })
            console.error('')
        }

        console.error('📋 Setup Instructions:')
        console.error('  1. Copy .env.example to .env.local')
        console.error('  2. Fill in all required values')
        console.error('  3. Restart your development server')
        console.error('')
        console.error('📖 For detailed setup guide, see: docs/ENVIRONMENT_SETUP.md\n')

        process.exit(1)
    }

    console.log('\n✅ All required environment variables are set!\n')
}

// Run validation
validateEnv()
