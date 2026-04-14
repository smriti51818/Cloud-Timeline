/**
 * Encryption Migration Script
 * Migrates existing plaintext data in Cosmos DB to AES-256-GCM ciphertext.
 * This script is idempotent.
 */

const { CosmosClient } = require('@azure/cosmos')
require('dotenv').config({ path: '.env.local' })
const { encrypt, decrypt } = require('../lib/encryption')

// Sensitive fields to migrate (must match azure-cosmos.ts)
const SENSITIVE_FIELDS = ['title', 'description', 'transcription', 'aiCaption', 'category']
const SENSITIVE_ARRAY_FIELDS = ['aiTags']

async function migrate() {
    console.log('--- Starting Encryption Migration ---')

    const endpoint = process.env.AZURE_COSMOS_ENDPOINT
    const key = process.env.AZURE_COSMOS_KEY
    const databaseId = process.env.AZURE_COSMOS_DATABASE || 'timeline-db'
    const containerId = process.env.AZURE_COSMOS_CONTAINER || 'timeline-entries'

    if (!endpoint || !key) {
        console.error('Error: Cosmos DB credentials missing in .env.local')
        process.exit(1)
    }

    if (!process.env.MASTER_ENCRYPTION_KEY) {
        console.error('Error: MASTER_ENCRYPTION_KEY missing in .env.local')
        process.exit(1)
    }

    const client = new CosmosClient({ endpoint, key })
    const container = client.database(databaseId).container(containerId)

    try {
        console.log(`Reading all items from ${containerId}...`)
        const { resources: items } = await container.items.readAll().fetchAll()
        console.log(`Found ${items.length} items.`)

        let updatedCount = 0
        let skippedCount = 0

        for (const item of items) {
            let needsUpdate = false
            const migratedItem = { ...item }

            // Handle string fields
            for (const field of SENSITIVE_FIELDS) {
                const val = item[field]
                if (typeof val === 'string' && val.trim() !== '') {
                    // Try to decrypt. If it returns the same value, it's likely plaintext.
                    // This is a simple heuristic. A better one is checking if decrypt throws/fails.
                    const decrypted = decrypt(val)
                    if (decrypted === val) {
                        migratedItem[field] = encrypt(val)
                        needsUpdate = true
                    }
                }
            }

            // Handle array fields
            for (const field of SENSITIVE_ARRAY_FIELDS) {
                const arr = item[field]
                if (Array.isArray(arr)) {
                    migratedItem[field] = arr.map(t => {
                        if (typeof t === 'string') {
                            const decrypted = decrypt(t)
                            if (decrypted === t) {
                                needsUpdate = true
                                return encrypt(t)
                            }
                        }
                        return t
                    })
                }
            }

            if (needsUpdate) {
                console.log(`Encrypting item: ${item.id}`)
                await container.item(item.id, item.userId).replace(migratedItem)
                updatedCount++
            } else {
                skippedCount++
            }
        }

        console.log('--- Migration Complete ---')
        console.log(`Total items processed: ${items.length}`)
        console.log(`Items encrypted: ${updatedCount}`)
        console.log(`Items already encrypted (skipped): ${skippedCount}`)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrate()
