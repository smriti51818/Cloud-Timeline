import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/lib/azure-cosmos'
import { getSession } from '@/lib/auth'
import { handleApiError, AuthenticationError, ValidationError, NotFoundError } from '@/lib/error-handler'

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession()
    if (!session?.user) {
      throw new AuthenticationError()
    }
    const userId = session.user.id

    // 2. Query random entry from Cosmos DB
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    }

    const { resources: entries } = await container.items.query(querySpec).fetchAll()

    if (entries.length === 0) {
      throw new NotFoundError('Timeline entries')
    }

    // 3. Select a random entry
    const randomEntry = entries[Math.floor(Math.random() * entries.length)]

    return NextResponse.json(randomEntry)
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
