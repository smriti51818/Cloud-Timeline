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
const USER_SENSITIVE_FIELDS = ['name', 'image']

async function migrate() {
    console.log('--- Starting Encryption Migration ---')

    const endpoint = process.env.AZURE_COSMOS_ENDPOINT
    const key = process.env.AZURE_COSMOS_KEY
    const databaseId = process.env.AZURE_COSMOS_DATABASE || 'timeline-db'
    const containerId = process.env.AZURE_COSMOS_CONTAINER || 'timeline-entries'
    const usersContainerId = 'users'

    if (!endpoint || !key) {
        console.error('Error: Cosmos DB credentials missing in .env.local')
        process.exit(1)
    }

    if (!process.env.MASTER_ENCRYPTION_KEY) {
        console.error('Error: MASTER_ENCRYPTION_KEY missing in .env.local')
        process.exit(1)
    }

    const client = new CosmosClient({ endpoint, key })
    const db = client.database(databaseId)
    const container = db.container(containerId)
    const usersContainer = db.container(usersContainerId)

    try {
        // 1. Migrate Timeline Entries
        console.log(`Reading all items from ${containerId}...`)
        const { resources: items } = await container.items.readAll().fetchAll()
        console.log(`Found ${items.length} items in ${containerId}.`)

        let updatedCount = 0
        let skippedCount = 0

        for (const item of items) {
            let needsUpdate = false
            const migratedItem = { ...item }

            for (const field of SENSITIVE_FIELDS) {
                const val = item[field]
                if (typeof val === 'string' && val.trim() !== '') {
                    const decrypted = decrypt(val)
                    if (decrypted === val) {
                        migratedItem[field] = encrypt(val)
                        needsUpdate = true
                    }
                }
            }

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
                console.log(`Encrypting entry: ${item.id}`)
                await container.item(item.id, item.userId).replace(migratedItem)
                updatedCount++
            } else {
                skippedCount++
            }
        }

        console.log(`Timeline migration complete. Encrypted: ${updatedCount}, Skipped: ${skippedCount}`)

        // 2. Migrate User Profiles
        console.log(`Reading all items from ${usersContainerId}...`)
        const { resources: users } = await usersContainer.items.readAll().fetchAll()
        console.log(`Found ${users.length} users.`)

        let userUpdatedCount = 0
        let userSkippedCount = 0

        for (const user of users) {
            let needsUpdate = false
            const migratedUser = { ...user }

            for (const field of USER_SENSITIVE_FIELDS) {
                const val = user[field]
                if (typeof val === 'string' && val.trim() !== '') {
                    const decrypted = decrypt(val)
                    if (decrypted === val) {
                        migratedUser[field] = encrypt(val)
                        needsUpdate = true
                    }
                }
            }

            if (needsUpdate) {
                console.log(`Encrypting user profile: ${user.email}`)
                await usersContainer.item(user.id, user.email).replace(migratedUser)
                userUpdatedCount++
            } else {
                userSkippedCount++
            }
        }

        console.log('--- Migration Complete ---')
        console.log(`Entries encrypted: ${updatedCount}`)
        console.log(`Users encrypted: ${userUpdatedCount}`)

    } catch (error) {
        console.error('Migration failed:', error)
        process.exit(1)
    }
}

migrate()
