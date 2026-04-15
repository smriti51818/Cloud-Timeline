import { CosmosClient, Database, Container } from '@azure/cosmos'
import { azureConfig } from './azure-config'
import { TimelineEntry } from './types'
import { AppError } from './error-handler'
import { DB_CONFIG } from './constants'
import { encrypt, decrypt } from './encryption'

/**
 * Fields to be encrypted/decrypted transparently
 */
const SENSITIVE_FIELDS = ['title', 'description', 'transcription', 'aiCaption', 'category'] as const
const SENSITIVE_ARRAY_FIELDS = ['aiTags'] as const
const USER_SENSITIVE_FIELDS = ['name', 'image'] as const

/**
 * Helper to encrypt sensitive fields of an entry before storage
 */
function encryptEntry(entry: Partial<TimelineEntry>): any {
    const encrypted = { ...entry }
    
    for (const field of SENSITIVE_FIELDS) {
        if (typeof encrypted[field] === 'string') {
            encrypted[field] = encrypt(encrypted[field] as string)
        }
    }
    
    for (const field of SENSITIVE_ARRAY_FIELDS) {
        if (Array.isArray(encrypted[field])) {
            encrypted[field] = (encrypted[field] as string[]).map(t => encrypt(t))
        }
    }
    
    return encrypted
}

/**
 * Helper to decrypt sensitive fields of an entry after retrieval
 */
function decryptEntry(entry: any): TimelineEntry {
    const decrypted = { ...entry }
    
    for (const field of SENSITIVE_FIELDS) {
        if (typeof decrypted[field] === 'string') {
            decrypted[field] = decrypt(decrypted[field] as string)
        }
    }
    
    for (const field of SENSITIVE_ARRAY_FIELDS) {
        if (Array.isArray(decrypted[field])) {
            decrypted[field] = (decrypted[field] as string[]).map(t => decrypt(t))
        }
    }
    
    return decrypted as TimelineEntry
}

/**
 * Helper to encrypt sensitive user profile fields
 */
function encryptUser(user: any): any {
    const encrypted = { ...user }
    for (const field of USER_SENSITIVE_FIELDS) {
        if (typeof encrypted[field] === 'string' && encrypted[field]) {
            encrypted[field] = encrypt(encrypted[field])
        }
    }
    return encrypted
}

/**
 * Helper to decrypt sensitive user profile fields
 */
function decryptUser(user: any): any {
    if (!user) return null
    const decrypted = { ...user }
    for (const field of USER_SENSITIVE_FIELDS) {
        if (typeof decrypted[field] === 'string' && decrypted[field]) {
            try {
                decrypted[field] = decrypt(decrypted[field])
            } catch (err) {
                // Fallback for legacy plaintext or partial encryption
                console.warn(`[COSMOS] Decrypt user field ${field} failed, returning raw`, err)
            }
        }
    }
    return decrypted
}

/**
 * Initialize Cosmos DB client
 */
const cosmosClient = new CosmosClient({
  endpoint: azureConfig.cosmos.endpoint,
  key: azureConfig.cosmos.key,
})

export const database: Database = cosmosClient.database(azureConfig.cosmos.databaseId)
export const container: Container = database.container(azureConfig.cosmos.containerId)
export const usersContainer: Container = database.container(DB_CONFIG.USERS_CONTAINER_ID)
export const sessionsContainer: Container = database.container(DB_CONFIG.SESSIONS_CONTAINER_ID)

let isInitialized = false
/**
 * Ensures the database and container exist
 */
async function ensureInit(): Promise<void> {
  if (isInitialized) return
  try {
    await cosmosClient.databases.createIfNotExists({ id: azureConfig.cosmos.databaseId })
    await database.containers.createIfNotExists({
      id: azureConfig.cosmos.containerId,
      partitionKey: DB_CONFIG.PARTITION_KEY,
    })
    await database.containers.createIfNotExists({
      id: DB_CONFIG.USERS_CONTAINER_ID,
      partitionKey: DB_CONFIG.USERS_PARTITION_KEY,
    })
    await database.containers.createIfNotExists({
      id: DB_CONFIG.SESSIONS_CONTAINER_ID,
      partitionKey: DB_CONFIG.SESSIONS_PARTITION_KEY,
    })
    isInitialized = true
  } catch (error) {
    console.error('[COSMOS] Initialization failed:', error)
    throw new AppError('Database connection failed', 500, 'COSMOS_INIT_ERROR')
  }
}

/**
 * Create a new timeline entry
 */
export async function createTimelineEntry(
  entry: Omit<TimelineEntry, 'id' | 'createdAt' | 'updatedAt'>
): Promise<TimelineEntry> {
  try {
    await ensureInit()
    const newEntry: TimelineEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const encryptedEntry = encryptEntry(newEntry)
    const { resource } = await container.items.create(encryptedEntry)
    return decryptEntry(resource)
  } catch (error) {
    console.error('[COSMOS] Create failed:', error)
    throw new AppError('Failed to save entry', 500, 'DATABASE_ERROR')
  }
}

/**
 * Fetch all entries for a user
 */
export async function getTimelineEntries(userId: string): Promise<TimelineEntry[]> {
  try {
    await ensureInit()
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC',
      parameters: [{ name: '@userId', value: userId }],
    }

    const { resources } = await container.items.query(querySpec).fetchAll()
    return resources.map(decryptEntry)
  } catch (error) {
    console.error('[COSMOS] Query failed:', error)
    throw new AppError('Failed to fetch entries', 500, 'DATABASE_ERROR')
  }
}

/**
 * Update an existing timeline entry
 */
export async function updateTimelineEntry(
  id: string,
  updates: Partial<TimelineEntry>
): Promise<TimelineEntry | null> {
  try {
    await ensureInit()
    // 1. Get the current document to find the partition key
    const { resource: existing } = await container.item(id).read()
    if (!existing) return null

    // 2. Perform optimistic merge
    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    // 3. Replace the item
    const encryptedUpdates = encryptEntry({ ...existing, ...updates, updatedAt: new Date().toISOString() })
    const { resource } = await container.item(id, existing.userId).replace(encryptedUpdates)
    return decryptEntry(resource)
  } catch (error) {
    console.error('[COSMOS] Update failed:', error)
    throw new AppError('Failed to update entry', 500, 'DATABASE_ERROR')
  }
}

/**
 * Delete a timeline entry
 */
export async function deleteTimelineEntry(id: string): Promise<TimelineEntry | null> {
  try {
    await ensureInit()
    // Need to find it first to get the partition key for deletion
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }
    const { resources } = await container.items.query(querySpec).fetchAll()

    if (resources.length === 0) return null
    const existing = resources[0]

    await container.item(id, existing.userId).delete()
    return decryptEntry(existing)
  } catch (error) {
    console.error('[COSMOS] Delete failed:', error)
    throw new AppError('Failed to delete entry', 500, 'DATABASE_ERROR')
  }
}

/**
 * Search entries for a user
 */
export async function searchTimelineEntries(
  userId: string,
  searchTerm: string
): Promise<TimelineEntry[]> {
  try {
    await ensureInit()
    const querySpecOnlyPartition = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC',
      parameters: [{ name: '@userId', value: userId }],
    }

    const { resources } = await container.items.query(querySpecOnlyPartition).fetchAll()
    const allEntries = resources.map(decryptEntry)

    // filter in memory because DB ciphertext doesn't support SQL CONTAINS
    return allEntries.filter(e => 
      e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.aiTags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())))
    )
  } catch (error) {
    console.error('[COSMOS] Search failed:', error)
    throw new AppError('Search failed', 500, 'DATABASE_ERROR')
  }
}

/**
 * User Management Methods
 */

export async function getUserByEmail(email: string): Promise<any | null> {
  try {
    await ensureInit()
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.email = @email',
      parameters: [{ name: '@email', value: email.toLowerCase() }],
    }
    const { resources } = await usersContainer.items.query(querySpec).fetchAll()
    return decryptUser(resources[0]) || null
  } catch (error) {
    console.error('[COSMOS] Get user failed:', error)
    return null
  }
}

export async function createUser(userData: any): Promise<any> {
    try {
        await ensureInit()
        const newUser = {
            ...userData,
            email: userData.email.toLowerCase(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        const encryptedUser = encryptUser(newUser)
        const { resource } = await usersContainer.items.create(encryptedUser)
        return decryptUser(resource)
    } catch (error) {
        console.error('[COSMOS] Create user failed:', error)
        throw new AppError('Failed to create user', 500, 'DATABASE_ERROR')
    }
}

export async function updateUser(email: string, updates: any): Promise<any> {
    try {
        await ensureInit()
        const existing = await getUserByEmail(email)
        if (!existing) throw new AppError('User not found', 404)

        const merged = {
            ...existing,
            ...updates,
            updatedAt: new Date().toISOString(),
        }
        const encryptedMerged = encryptUser(merged)
        const { resource } = await usersContainer.item(existing.id, email.toLowerCase()).replace(encryptedMerged)
        return decryptUser(resource)
    } catch (error) {
        console.error('[COSMOS] Update user failed:', error)
        throw new AppError('Failed to update user', 500, 'DATABASE_ERROR')
    }
}

/**
 * Session Management Methods
 */

export async function createSession(sessionData: any): Promise<any> {
    try {
        await ensureInit()
        const { resource } = await sessionsContainer.items.create(sessionData)
        return resource
    } catch (error) {
        console.error('[COSMOS] Create session failed:', error)
        return null
    }
}

export async function getSessionByToken(token: string): Promise<any | null> {
    try {
        await ensureInit()
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.refreshToken = @token',
            parameters: [{ name: '@token', value: token }],
        }
        const { resources } = await sessionsContainer.items.query(querySpec).fetchAll()
        return resources[0] || null
    } catch (error) {
        return null
    }
}

export async function revokeSession(id: string, userId: string): Promise<void> {
    try {
        await sessionsContainer.item(id, userId).delete()
    } catch (error) {
        console.error('[COSMOS] Revoke session failed:', error)
    }
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
    try {
        const querySpec = {
            query: 'SELECT * FROM c WHERE c.userId = @userId',
            parameters: [{ name: '@userId', value: userId }],
        }
        const { resources } = await sessionsContainer.items.query(querySpec).fetchAll()
        for (const session of resources) {
            await sessionsContainer.item(session.id, userId).delete()
        }
    } catch (error) {
        console.error('[COSMOS] Revoke all sessions failed:', error)
    }
}
