import { CosmosClient, Database, Container } from '@azure/cosmos'
import { azureConfig } from './azure-config'
import { TimelineEntry } from './types'

async function ensureDatabaseExists(): Promise<void> {
  try {
    await cosmosClient.databases.createIfNotExists({ id: azureConfig.cosmos.databaseId })
    console.log(`Database "${azureConfig.cosmos.databaseId}" is ready`)
  } catch (error) {
    console.error('Error ensuring database exists:', error)
    throw new Error('Database is not available')
  }
}

async function ensureContainerExists(): Promise<void> {
  try {
    await database.containers.createIfNotExists({
      id: azureConfig.cosmos.containerId,
      partitionKey: '/userId',
      indexingPolicy: {
        indexingMode: 'consistent',
        includedPaths: [{ path: '/*' }],
        excludedPaths: [{ path: '/"_etag"/?' }]
      }
    })
    console.log(`Container "${azureConfig.cosmos.containerId}" is ready`)
  } catch (error) {
    console.error('Error ensuring container exists:', error)
    throw new Error('Container is not available')
  }
}

// Initialize Cosmos DB client
const cosmosClient = new CosmosClient({
  endpoint: azureConfig.cosmos.endpoint,
  key: azureConfig.cosmos.key,
})

export const database: Database = cosmosClient.database(azureConfig.cosmos.databaseId)
export const container: Container = database.container(azureConfig.cosmos.containerId)

export async function createTimelineEntry(entry: Omit<TimelineEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimelineEntry> {
  try {
    await ensureDatabaseExists()
    await ensureContainerExists()

    const newEntry: TimelineEntry = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const { resource } = await container.items.create(newEntry)
    return resource as TimelineEntry
  } catch (error) {
    console.error('Error creating timeline entry:', error)
    throw new Error('Failed to create timeline entry')
  }
}

export async function getTimelineEntries(userId: string): Promise<TimelineEntry[]> {
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.date DESC',
      parameters: [
        {
          name: '@userId',
          value: userId,
        },
      ],
    }

    const { resources } = await container.items.query(querySpec).fetchAll()
    return resources as TimelineEntry[]
  } catch (error) {
    console.error('Error fetching timeline entries:', error)
    throw new Error('Failed to fetch timeline entries')
  }
}

export async function updateTimelineEntry(id: string, updates: Partial<TimelineEntry>): Promise<TimelineEntry> {
  try {
    // First, query to find the item and get the partition key (userId)
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }
    const { resources } = await container.items.query(querySpec).fetchAll()
    if (resources.length === 0) throw new Error('Entry not found')

    const existing = resources[0]
    const merged = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const { resource } = await container.item(id, existing.userId).replace(merged)
    return resource as TimelineEntry
  } catch (error) {
    console.error('Error updating timeline entry:', error)
    throw new Error('Failed to update timeline entry')
  }
}

export async function deleteTimelineEntry(id: string): Promise<TimelineEntry> {
  try {
    // First, query to find the item and get the partition key (userId)
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    }
    const { resources } = await container.items.query(querySpec).fetchAll()
    if (resources.length === 0) throw new Error('Entry not found')

    const existing = resources[0]
    await container.item(id, existing.userId).delete()
    return existing as TimelineEntry
  } catch (error) {
    console.error('Error deleting timeline entry:', error)
    throw new Error('Failed to delete timeline entry')
  }
}

export async function searchTimelineEntries(userId: string, searchTerm: string): Promise<TimelineEntry[]> {
  try {
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId AND (CONTAINS(c.title, @searchTerm, true) OR CONTAINS(c.description, @searchTerm, true) OR ARRAY_CONTAINS(c.aiTags, @searchTerm, true)) ORDER BY c.date DESC',
      parameters: [
        {
          name: '@userId',
          value: userId,
        },
        {
          name: '@searchTerm',
          value: searchTerm,
        },
      ],
    }

    const { resources } = await container.items.query(querySpec).fetchAll()
    return resources as TimelineEntry[]
  } catch (error) {
    console.error('Error searching timeline entries:', error)
    throw new Error('Failed to search timeline entries')
  }
}
