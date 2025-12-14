import { NextRequest, NextResponse } from 'next/server'
import { container } from '@/lib/azure-cosmos'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Use the imported container

    // Query all entries for the user
    const querySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId',
      parameters: [{ name: '@userId', value: userId }],
    }

    const { resources: entries } = await container.items.query(querySpec).fetchAll()

    if (entries.length === 0) {
      return NextResponse.json({ error: 'No entries found' }, { status: 404 })
    }

    // Select a random entry
    const randomEntry = entries[Math.floor(Math.random() * entries.length)]

    return NextResponse.json(randomEntry)
  } catch (error) {
    console.error('Error fetching random entry:', error)
    return NextResponse.json({ error: 'Failed to fetch random entry' }, { status: 500 })
  }
}
