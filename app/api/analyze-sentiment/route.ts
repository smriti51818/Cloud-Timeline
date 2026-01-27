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
      throw new ValidationError('Text content is required for sentiment analysis')
    }

    // 3. Initialize Azure client
    const client = new TextAnalyticsClient(
      azureConfig.cognitive.text.endpoint,
      new AzureKeyCredential(azureConfig.cognitive.text.key)
    )

    // 4. Analyze sentiment
    const [result] = await client.analyzeSentiment([text])

    if ('error' in result) {
      throw new Error(result.error?.message || 'Sentiment analysis failed')
    }

    const sentiment = result.sentiment
    const confidence = Math.max(
      result.confidenceScores.positive,
      result.confidenceScores.negative,
      result.confidenceScores.neutral
    )

    return NextResponse.json({
      sentiment,
      confidence,
      scores: result.confidenceScores
    })
  } catch (error) {
    // If it's a validation or auth error, return it
    if (error instanceof AuthenticationError || error instanceof ValidationError) {
      const { message, statusCode } = handleApiError(error)
      return NextResponse.json({ error: message }, { status: statusCode })
    }

    // For service errors, we might want to return a neutral fallback instead of a 500
    console.warn('[API/SENTIMENT] Service error, returning mock fallback', error)
    return NextResponse.json({
      sentiment: 'neutral',
      confidence: 0.5,
      scores: {
        positive: 0.33,
        negative: 0.33,
        neutral: 0.34
      }
    })
  }
}
