import { NextRequest, NextResponse } from 'next/server'
import { azureConfig } from '@/lib/azure-config'

export async function POST(request: NextRequest) {
  try {
    const { audioUrl } = await request.json()

    if (!audioUrl) {
      return NextResponse.json({ error: 'Audio URL is required' }, { status: 400 })
    }

    // Fetch the audio file
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error(`Failed to fetch audio: ${audioResponse.status}`)
    }

    const audioBuffer = await audioResponse.arrayBuffer()

    // Use Azure Speech-to-Text REST API
    const region = azureConfig.cognitive.speech.region
    const key = azureConfig.cognitive.speech.key

    const sttResponse = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/mpeg', // Adjust based on actual format
      },
      body: audioBuffer,
    })

    if (!sttResponse.ok) {
      throw new Error(`Speech API error: ${sttResponse.status}`)
    }

    const result = await sttResponse.json()

    if (result.RecognitionStatus === 'Success') {
      return NextResponse.json({
        text: result.DisplayText || result.Text,
        confidence: result.Confidence || 0.8,
        language: result.Language || 'en-US'
      })
    } else {
      throw new Error(`Recognition failed: ${result.RecognitionStatus}`)
    }
  } catch (error) {
    console.error('Transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}
