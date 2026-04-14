/**
 * Application-wide constants
 */

// API Routes
export const API_ROUTES = {
    ENTRIES: '/api/entries',
    UPLOAD: '/api/upload',
    TRANSCRIBE: '/api/transcribe',
    ANALYZE_SENTIMENT: '/api/analyze-sentiment',
    CATEGORIZE_TEXT: '/api/categorize-text',
    GENERATE_PROMPT: '/api/generate-prompt',
    RANDOM_ENTRY: '/api/random-entry',
    AUTH: '/api/auth',
} as const

// App Routes
export const APP_ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    TIMELINE: '/timeline',
    DASHBOARD: '/dashboard',
    INSIGHTS: '/insights',
    STORY: '/story',
    VOICE: '/voice',
} as const

// Upload Limits
export const UPLOAD_LIMITS = {
    MAX_FILE_SIZE_MB: 10,
    MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
    MAX_AUDIO_DURATION_SECONDS: 300, // 5 minutes
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    ALLOWED_AUDIO_TYPES: ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/mp4'],
} as const

// Azure Storage
export const STORAGE_CONFIG = {
    CONTAINER_NAME: 'timeline-media',
    SAS_TOKEN_EXPIRY_HOURS: 24,
    IMAGE_FOLDER: 'images',
    AUDIO_FOLDER: 'audio',
} as const

// Cosmos DB
export const DB_CONFIG = {
    DATABASE_ID: 'timeline-db',
    CONTAINER_ID: 'timeline-entries',
    USERS_CONTAINER_ID: 'users',
    SESSIONS_CONTAINER_ID: 'sessions',
    PARTITION_KEY: '/userId',
    USERS_PARTITION_KEY: '/email',
    SESSIONS_PARTITION_KEY: '/userId',
    MAX_ITEMS_PER_PAGE: 50,
} as const

// AI Configuration
export const AI_CONFIG = {
    MIN_CONFIDENCE_SCORE: 0.6,
    MAX_TAGS_PER_ENTRY: 10,
    SENTIMENT_THRESHOLD: 0.7,
} as const

// UI Configuration
export const UI_CONFIG = {
    ANIMATION_DURATION_MS: 300,
    TOAST_DURATION_MS: 3000,
    ENTRIES_PER_PAGE: 20,
    TIMELINE_CARD_MIN_HEIGHT: 200,
} as const

// Time Capsule
export const TIME_CAPSULE = {
    MIN_LOCK_DAYS: 1,
    MAX_LOCK_DAYS: 365 * 5, // 5 years
} as const

// Error Messages
export const ERROR_MESSAGES = {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You must be logged in to perform this action.',
    FILE_TOO_LARGE: `File size exceeds ${UPLOAD_LIMITS.MAX_FILE_SIZE_MB}MB limit.`,
    INVALID_FILE_TYPE: 'Invalid file type. Please upload a supported format.',
    UPLOAD_FAILED: 'Failed to upload file. Please try again.',
    FETCH_FAILED: 'Failed to load data. Please refresh the page.',
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
    ENTRY_CREATED: 'Entry created successfully!',
    ENTRY_UPDATED: 'Entry updated successfully!',
    ENTRY_DELETED: 'Entry deleted successfully!',
    FILE_UPLOADED: 'File uploaded successfully!',
} as const
