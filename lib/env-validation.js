/**
 * Validates that all required environment variables are set.
 * This should be called in server-side entry points or next.config.js.
 */
function validateEnv() {
    const requiredVars = [
        'NEXTAUTH_SECRET',
        // One of these auth providers must be configured
        ['GOOGLE_CLIENT_ID', 'GITHUB_CLIENT_ID', 'NEXT_PUBLIC_AZURE_CLIENT_ID'],
        'AZURE_STORAGE_ACCOUNT',
        'AZURE_STORAGE_KEY',
        'AZURE_STORAGE_CONNECTION_STRING',
        'AZURE_COSMOS_ENDPOINT',
        'AZURE_COSMOS_KEY',
        'AZURE_COGNITIVE_VISION_KEY',
        'AZURE_COGNITIVE_VISION_ENDPOINT',
        'AZURE_COGNITIVE_SPEECH_KEY',
        'AZURE_COGNITIVE_SPEECH_REGION',
        'AZURE_COGNITIVE_TEXT_KEY',
        'AZURE_COGNITIVE_TEXT_ENDPOINT',
    ];

    const missing = [];

    for (const v of requiredVars) {
        if (Array.isArray(v)) {
            // Logic for "at least one of these"
            const hasOne = v.some(name => process.env[name]);
            if (!hasOne) {
                missing.push(`At least one of: ${v.join(', ')}`);
            }
        } else if (!process.env[v]) {
            missing.push(v);
        }
    }

    if (missing.length > 0) {
        const errorMsg = `\n[Environment Validation Error] Missing required environment variables:\n- ${missing.join('\n- ')}\n\nPlease check your .env.local file or server configuration.\n`;

        if (process.env.NODE_ENV === 'production') {
            console.error(errorMsg);
            // In production, we might want to fail the build
            // process.exit(1); 
        } else {
            console.error(errorMsg);
        }
    }
}

module.exports = { validateEnv };
