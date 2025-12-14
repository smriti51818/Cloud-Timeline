import { NextRequest, NextResponse } from 'next/server'
import { TextAnalyticsClient, AzureKeyCredential } from '@azure/ai-text-analytics'
import { azureConfig } from '@/lib/azure-config'

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Initialize Text Analytics client
    const client = new TextAnalyticsClient(
      azureConfig.cognitive.text.endpoint,
      new AzureKeyCredential(azureConfig.cognitive.text.key)
    )

    // Extract key phrases
    const [result] = await client.extractKeyPhrases([text])

    if (result.error) {
      throw new Error(result.error.message)
    }

    const keyPhrases = result.keyPhrases || []
    const lowerPhrases = keyPhrases.map(p => p.toLowerCase())

    // Categorize based on key phrases
    const categories = []
    const lowerText = text.toLowerCase()

    // Education
    if (lowerPhrases.some(p => p.includes('graduation') || p.includes('degree') || p.includes('school') || p.includes('university') || p.includes('college'))) {
      categories.push('education')
    }
    // Celebration
    if (lowerPhrases.some(p => p.includes('birthday') || p.includes('celebration') || p.includes('party') || p.includes('anniversary'))) {
      categories.push('celebration')
    }
    // Career
    if (lowerPhrases.some(p => p.includes('job') || p.includes('work') || p.includes('career') || p.includes('promotion') || p.includes('interview'))) {
      categories.push('career')
    }
    // Travel
    if (lowerPhrases.some(p => p.includes('travel') || p.includes('trip') || p.includes('vacation') || p.includes('flight') || p.includes('hotel'))) {
      categories.push('travel')
    }
    // Relationship
    if (lowerPhrases.some(p => p.includes('wedding') || p.includes('marriage') || p.includes('engagement') || p.includes('divorce'))) {
      categories.push('relationship')
    }
    // Family
    if (lowerPhrases.some(p => p.includes('baby') || p.includes('child') || p.includes('family') || p.includes('parent') || p.includes('sibling'))) {
      categories.push('family')
    }
    // Health
    if (lowerPhrases.some(p => p.includes('health') || p.includes('medical') || p.includes('doctor') || p.includes('hospital') || p.includes('illness'))) {
      categories.push('health')
    }

    // Default category if no specific match
    if (categories.length === 0) {
      categories.push('general')
    }

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Text categorization error:', error)
    return NextResponse.json(
      { error: 'Failed to categorize text' },
      { status: 500 }
    )
  }
}
