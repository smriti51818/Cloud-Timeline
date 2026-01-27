/**
 * Type definitions for environment variables
 * This provides autocomplete and type checking for process.env
 */

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Next.js
      NODE_ENV: 'development' | 'production' | 'test'
      NEXT_PUBLIC_APP_URL: string

      // NextAuth
      NEXTAUTH_SECRET: string
      NEXTAUTH_URL: string

      // Auth Providers
      GITHUB_CLIENT_ID?: string
      GITHUB_CLIENT_SECRET?: string
      GOOGLE_CLIENT_ID?: string
      GOOGLE_CLIENT_SECRET?: string
      NEXT_PUBLIC_AZURE_CLIENT_ID?: string
      NEXT_PUBLIC_AZURE_TENANT_ID?: string
      AZURE_CLIENT_SECRET?: string
      NEXT_PUBLIC_AZURE_AUTHORITY?: string

      // Azure Storage
      AZURE_STORAGE_ACCOUNT: string
      AZURE_STORAGE_KEY: string
      AZURE_STORAGE_CONNECTION_STRING: string

      // Azure Cosmos DB
      AZURE_COSMOS_ENDPOINT: string
      AZURE_COSMOS_KEY: string
      AZURE_COSMOS_DATABASE: string
      AZURE_COSMOS_CONTAINER: string

      // Azure Cognitive Services - Vision
      AZURE_COGNITIVE_VISION_KEY: string
      AZURE_COGNITIVE_VISION_ENDPOINT: string

      // Azure Cognitive Services - Speech
      AZURE_COGNITIVE_SPEECH_KEY: string
      AZURE_COGNITIVE_SPEECH_REGION: string

      // Azure Cognitive Services - Text Analytics
      AZURE_COGNITIVE_TEXT_KEY: string
      AZURE_COGNITIVE_TEXT_ENDPOINT: string

      // Optional
      NEXT_PUBLIC_ANALYTICS_ID?: string
      NEXT_PUBLIC_SENTRY_DSN?: string
    }
  }
}

export {}
