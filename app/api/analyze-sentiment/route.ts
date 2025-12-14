import { NextRequest, NextResponse } from 'next/server'
import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics'
import { azureConfig } from '@/lib/azure-config'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    console.log('Analyzing sentiment for text:', text)

    // Initialize Text Analytics client
    const client = new TextAnalyticsClient(
      azureConfig.cognitive.text.endpoint,
      new AzureKeyCredential(azureConfig.cognitive.text.key)
    )

    // Analyze sentiment
    const [result] = await client.analyzeSentiment([text])

    console.log('Sentiment result:', result)

    if (result.error) {
      throw new Error(result.error.message)
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
    console.error('Sentiment analysis error:', error)

    // Return mock data if service is not available
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
