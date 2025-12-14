import { NextRequest, NextResponse } from 'next/server'
import { getTimelineEntries, searchTimelineEntries } from '@/lib/azure-cosmos'
import { generateReadSasUrl } from '@/lib/azure-storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const search = searchParams.get('search')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let entries
    if (search) {
      entries = await searchTimelineEntries(userId, search)
    } else {
      entries = await getTimelineEntries(userId)
    }

    // For each entry with a mediaUrl, try to convert the stored blob path/URL to a short-lived SAS URL
    const entriesWithSas = entries.map((e: any) => {
      if (!e.mediaUrl) return e

      try {
        const url = new URL(e.mediaUrl)
        // url.pathname: /container/blob/path
        const pathParts = url.pathname.split('/')
        const containerName = pathParts[1]
        const blobPath = decodeURIComponent(pathParts.slice(2).join('/'))

        // Only generate SAS if container matches our configured container
        if (containerName === process.env.AZURE_STORAGE_CONTAINER || containerName === 'timeline-media' || containerName === undefined) {
          const sas = generateReadSasUrl(blobPath)
          if (sas) {
            return { ...e, mediaUrl: sas }
          } else {
            // Fall back to plain blob URL since container has public blob access
            return { ...e, mediaUrl: url.origin + url.pathname }
          }
        }
      } catch (err) {
        // ignore and return original entry
      }

      return e
    })

    return NextResponse.json(entriesWithSas)
  } catch (error) {
    console.error('Error fetching entries:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    )
  }
}
