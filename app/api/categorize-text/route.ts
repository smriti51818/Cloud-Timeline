import { NextRequest, NextResponse } from 'next/server'
import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics'
import { azureConfig } from '@/lib/azure-config'
import { getSession } from '@/lib/auth'
import { handleApiError, AuthenticationError, ValidationError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession()
    if (!session?.user) {
      throw new AuthenticationError()
    }

    // 2. Parse and validate request
    const { text } = await request.json()
    if (!text) {
      throw new ValidationError('Text content is required for categorization')
    }

    // 3. Initialize Azure client
    const client = new TextAnalyticsClient(
      azureConfig.cognitive.text.endpoint,
      new AzureKeyCredential(azureConfig.cognitive.text.key)
    )

    // 4. Extract key phrases
    const [result] = await client.extractKeyPhrases([text])

    if ('error' in result) {
      throw new Error(result.error?.message || 'Extraction failed')
    }

    const keyPhrases = result.keyPhrases || []
    const lowerPhrases = keyPhrases.map(p => p.toLowerCase())
    const categories: string[] = []

    // 5. Categorize based on keywords
    const keywordMap: Record<string, string[]> = {
      education: ['graduation', 'degree', 'school', 'university', 'college', 'study', 'education'],
      celebration: ['birthday', 'celebration', 'party', 'anniversary', 'wedding', 'event'],
      career: ['job', 'work', 'career', 'promotion', 'interview', 'office', 'salary'],
      travel: ['travel', 'trip', 'vacation', 'flight', 'hotel', 'journey', 'airport'],
      relationship: ['wedding', 'marriage', 'engagement', 'partner', 'date'],
      family: ['baby', 'child', 'family', 'parent', 'sibling', 'mom', 'dad'],
      health: ['health', 'medical', 'doctor', 'hospital', 'illness', 'fitness', 'exercise'],
    }

    for (const [category, keywords] of Object.entries(keywordMap)) {
      if (lowerPhrases.some(p => keywords.some(k => p.includes(k)))) {
        categories.push(category)
      }
    }

    // Default category if no specific match
    if (categories.length === 0) {
      categories.push('general')
    }

    return NextResponse.json({ categories })
  } catch (error) {
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      const { message, statusCode } = handleApiError(error)
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    console.warn('[API/CATEGORIZE] Service error, returning fallback', error)
    return NextResponse.json({ categories: ['general'] })
  }
}
