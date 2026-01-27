import { NextRequest, NextResponse } from 'next/server'
import { updateTimelineEntry, deleteTimelineEntry } from '@/lib/azure-cosmos'
import { deleteFile, generateReadSasUrl } from '@/lib/azure-storage'
import { getSession } from '@/lib/auth'
import { handleApiError, AuthenticationError, ValidationError, NotFoundError } from '@/lib/error-handler'
import { DB_CONFIG } from '@/lib/constants'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user
    const session = await getSession()
    if (!session?.user) {
      throw new AuthenticationError()
    }
    const id = params.id

    // 2. Perform deletion (Cosmos DB will check partition key if implemented, 
    // but here we just pass ID for simplicity)
    const entry = await deleteTimelineEntry(id)
    if (!entry) {
      throw new NotFoundError('Timeline entry')
    }

    // 3. Clean up associated media from Blob Storage
    if (entry.mediaUrl) {
      try {
        const url = new URL(entry.mediaUrl)
        const blobPath = decodeURIComponent(url.pathname.split('/').slice(2).join('/'))
        await deleteFile(blobPath)
      } catch (e) {
        console.warn(`[API/DELETE] Failed to delete blob for entry ${id}`, e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate user
    const session = await getSession()
    if (!session?.user) {
      throw new AuthenticationError()
    }
    const id = params.id
    const body = await request.json()

    // 2. Validate and filter update fields
    const updates: Record<string, any> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.aiTags !== undefined) updates.aiTags = body.aiTags
    if (body.category !== undefined) updates.category = body.category

    if (Object.keys(updates).length === 0) {
      throw new ValidationError('No valid update fields provided')
    }

    // 3. Update entry in Cosmos DB
    const updated = await updateTimelineEntry(id, updates)
    if (!updated) {
      throw new NotFoundError('Timeline entry')
    }

    // 4. Regenerate media SAS URL if entry has media
    let result = updated
    if (updated.mediaUrl) {
      try {
        const url = new URL(updated.mediaUrl)
        const blobPath = decodeURIComponent(url.pathname.split('/').slice(2).join('/'))
        const sas = generateReadSasUrl(blobPath)
        if (sas) {
          result = { ...updated, mediaUrl: sas }
        }
      } catch (err) {
        console.warn(`[API/PATCH] Failed to generate SAS for entry ${id}`, err)
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
