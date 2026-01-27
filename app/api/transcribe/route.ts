import { NextRequest, NextResponse } from 'next/server'
import { azureConfig } from '@/lib/azure-config'
import { getSession } from '@/lib/auth'
import { handleApiError, AuthenticationError, ValidationError, AppError } from '@/lib/error-handler'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession()
    if (!session?.user) {
      throw new AuthenticationError()
    }

    // 2. Parse and validate request
    const { audioUrl } = await request.json()
    if (!audioUrl) {
      throw new ValidationError('Audio URL is required for transcription')
    }

    // 3. Fetch the audio file
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new AppError(`Failed to fetch audio: ${audioResponse.status}`, 400)
    }

    const audioBuffer = await audioResponse.arrayBuffer()

    // 4. Use Azure Speech-to-Text REST API
    const region = azureConfig.cognitive.speech.region
    const key = azureConfig.cognitive.speech.key

    const sttResponse = await fetch(`https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=en-US&format=detailed`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'audio/mpeg',
      },
      body: audioBuffer,
    })

    if (!sttResponse.ok) {
      throw new AppError(`Speech API error: ${sttResponse.status}`, sttResponse.status)
    }

    const result = await sttResponse.json()

    if (result.RecognitionStatus === 'Success') {
      return NextResponse.json({
        text: result.DisplayText || result.Text,
        confidence: result.Confidence || 0.8,
        language: result.Language || 'en-US'
      })
    } else {
      throw new AppError(`Recognition failed: ${result.RecognitionStatus}`, 500)
    }
  } catch (error) {
    const { message, statusCode } = handleApiError(error)
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
