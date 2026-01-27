import { CosmosClient, Database, Container } from '@azure/cosmos'
import { azureConfig } from './azure-config'
import { TimelineEntry } from './types'
import { AppError } from './error-handler'
import { DB_CONFIG } from './constants'

/**
 * Initialize Cosmos DB client
 */
const cosmosClient = new CosmosClient({
  endpoint: azureConfig.cosmos.endpoint,
  key: azureConfig.cosmos.key,
})

export const database: Database = cosmosClient.database(azureConfig.cosmos.databaseId)
export const container: Container = database.container(azureConfig.cosmos.containerId)

/**
 * Ensures the database and container exist
 */
async function ensureInit(): Promise<void> {
  try {
    await cosmosClient.databases.createIfNotExists({ id: azureConfig.cosmos.databaseId })
    await database.containers.createIfNotExists({
      id: azureConfig.cosmos.containerId,
      partitionKey: DB_CONFIG.PARTITION_KEY,
    })
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
    const newEntry: TimelineEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { resource } = await container.items.create(newEntry)
    return resource as TimelineEntry
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
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC',
      parameters: [{ name: '@userId', value: userId }],
    }

    const { resources } = await container.items.query(querySpec).fetchAll()
    return resources as TimelineEntry[]
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
    const { resource } = await container.item(id, existing.userId).replace(merged)
    return resource as TimelineEntry
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
    // Need to find it first to get the partition key for deletion
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }
    const { resources } = await container.items.query(querySpec).fetchAll()

    if (resources.length === 0) return null
    const existing = resources[0]

    await container.item(id, existing.userId).delete()
    return existing as TimelineEntry
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
    const querySpec = {
      query: `SELECT * FROM c WHERE c.userId = @userId 
              AND (CONTAINS(c.title, @searchTerm, true) 
              OR CONTAINS(c.description, @searchTerm, true) 
              OR ARRAY_CONTAINS(c.aiTags, @searchTerm, true)) 
              ORDER BY c.date DESC`,
      parameters: [
        { name: '@userId', value: userId },
        { name: '@searchTerm', value: searchTerm },
      ],
    }

    const { resources } = await container.items.query(querySpec).fetchAll()
    return resources as TimelineEntry[]
  } catch (error) {
    console.error('[COSMOS] Search failed:', error)
    throw new AppError('Search failed', 500, 'DATABASE_ERROR')
  }
}
