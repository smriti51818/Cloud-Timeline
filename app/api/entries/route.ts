import { NextRequest, NextResponse } from 'next/server'
import { getTimelineEntries, searchTimelineEntries } from '@/lib/azure-cosmos'
import { generateReadSasUrl } from '@/lib/azure-storage'
import { getSession } from '@/lib/auth'
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/error-handler'
import { DB_CONFIG } from '@/lib/constants'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession()
    if (!session?.user) {
      throw new AuthenticationError()
    }

    const { searchParams } = new URL(request.url)
    const userId = session.user.id
    const search = searchParams.get('search')
    const category = searchParams.get('category')
    const type = searchParams.get('type')

    if (!userId) {
      throw new ValidationError('User ID is missing from session')
    }

    // 2. Fetch entries from Cosmos DB
    let entries
    if (search) {
      entries = await searchTimelineEntries(userId, search)
    } else {
      // In a real app, we'd add category/type filtering here
      entries = await getTimelineEntries(userId)
    }

    // 3. Process entries (generate SAS URLs for media)
    const entriesWithSas = entries.map((entry: any) => {
      if (!entry.mediaUrl) return entry

      try {
        const url = new URL(entry.mediaUrl)
        const pathParts = url.pathname.split('/')
        // URL structure typically: /container/blob/path
        const containerName = pathParts[1]
        const blobPath = decodeURIComponent(pathParts.slice(2).join('/'))

        if (containerName === DB_CONFIG.CONTAINER_ID || containerName === 'timeline-media') {
          const sas = generateReadSasUrl(blobPath)
          if (sas) {
            return { ...entry, mediaUrl: sas }
          }
        }
      } catch (err) {
        // Fallback to original URL or log error
        console.warn(`[API] Failed to generate SAS for entry ${entry.id}`, err)
      }

      return entry
    })

    return NextResponse.json(entriesWithSas)
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
