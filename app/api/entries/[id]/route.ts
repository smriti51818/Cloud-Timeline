import { NextRequest, NextResponse } from 'next/server'
import { updateTimelineEntry, deleteTimelineEntry } from '@/lib/azure-cosmos'
import { deleteFile, generateReadSasUrl } from '@/lib/azure-storage'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    let entry: any = null
    try {
      entry = await deleteTimelineEntry(id)
    } catch (delErr) {
      console.error('Failed to delete timeline entry from DB:', delErr)
      return NextResponse.json({ error: 'Failed to delete entry from database', message: (delErr as any)?.message }, { status: 500 })
    }

    if (entry?.mediaUrl) {
      try {
        await deleteFile(entry.mediaUrl)
      } catch (e) {
        console.warn('Failed to delete blob for entry', id, e)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting entry:', error)
    return NextResponse.json({ error: 'Failed to delete entry', message: (error as any)?.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    console.log(`PATCH /api/entries/${id} body:`, body)

    // Only allow certain fields to be updated
    const allowed: Partial<any> = {}
    if (typeof body.title === 'string') allowed.title = body.title
    if (typeof body.description === 'string') allowed.description = body.description

    try {
      const updated = await updateTimelineEntry(id, allowed)

      // Regenerate mediaUrl if present, similar to GET route
      let finalUpdated = updated
      if (updated.mediaUrl) {
        try {
          const url = new URL(updated.mediaUrl)
          const pathParts = url.pathname.split('/')
          const containerName = pathParts[1]
          const blobPath = decodeURIComponent(pathParts.slice(2).join('/'))

          if (containerName === process.env.AZURE_STORAGE_CONTAINER || containerName === 'timeline-media' || containerName === undefined) {
            const sas = generateReadSasUrl(blobPath)
            if (sas) {
              finalUpdated = { ...updated, mediaUrl: sas }
            } else {
              finalUpdated = { ...updated, mediaUrl: url.origin + url.pathname }
            }
          }
        } catch (err) {
          // ignore and return original
        }
      }

      return NextResponse.json(finalUpdated)
    } catch (updateErr) {
      console.error('Failed to update entry:', updateErr)
      return NextResponse.json({ error: 'Failed to update entry', message: (updateErr as any)?.message }, { status: 500 })
    }
  } catch (error) {
    console.error('Error updating entry:', error)
    return NextResponse.json({ error: 'Failed to update entry', message: (error as any)?.message }, { status: 500 })
  }
}
