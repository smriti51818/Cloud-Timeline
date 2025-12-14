import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/azure-storage'
import { createTimelineEntry } from '@/lib/azure-cosmos'
import { analyzeImage, transcribeAudio, analyzeSentiment, categorizeText } from '@/lib/azure-cognitive'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const type = formData.get('type') as 'photo' | 'voice' | 'text'
    const userId = formData.get('userId') as string

    console.log('[UPLOAD] Request received', {
      hasFile: Boolean(file),
      fileName: file?.name,
      fileType: file?.type,
      fileSize: file ? `${file.size} bytes` : undefined,
      title,
      type,
      userId,
    })

    if (!file && type !== 'text') {
      return NextResponse.json({ error: 'File is required' }, { status: 400 })
    }

    if (!title || !userId) {
      return NextResponse.json({ error: 'Title and userId are required' }, { status: 400 })
    }

    let mediaUrl = ''
    let aiTags: string[] = []
    let transcription: string | undefined = undefined
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'

    // Upload file to Azure Blob Storage if it's not a text entry
    if (file && type !== 'text') {
      const entryId = crypto.randomUUID()
      try {
        mediaUrl = await uploadFile(file, userId, entryId, (p) => {
          if (Number.isFinite(p)) console.log('[UPLOAD] Progress %', Math.round(p))
        })
        console.log('[UPLOAD] Blob uploaded', { mediaUrl })
      } catch (err: any) {
        console.error('[UPLOAD] Blob upload failed', {
          message: err?.message,
          name: err?.name,
          code: err?.code,
          statusCode: err?.statusCode,
          details: err?.details,
          stack: err?.stack,
        })
        throw err
      }
    }

    // Process based on entry type
    try {
      if (type === 'photo' && mediaUrl) {
        const imageAnalysis = await analyzeImage(mediaUrl)
        aiTags = imageAnalysis.tags
      } else if (type === 'voice' && mediaUrl) {
        const transcriptionResult = await transcribeAudio(mediaUrl)
        transcription = transcriptionResult.text

        // Analyze sentiment of transcribed text
        const sentimentResult = await analyzeSentiment(transcription)
        sentiment = sentimentResult.sentiment

        // Categorize the transcribed text
        const categories = await categorizeText(transcription)
        aiTags = categories
      } else if (type === 'text') {
        // Analyze sentiment and categorize text entries
        const sentimentResult = await analyzeSentiment(description || title)
        sentiment = sentimentResult.sentiment

        const categories = await categorizeText(description || title)
        aiTags = categories
      }
    } catch (aiError) {
      console.warn('[UPLOAD] AI analysis failed, proceeding with defaults', aiError)
      // Use defaults if AI fails
      aiTags = []
      sentiment = 'neutral'
      transcription = type === 'voice' ? 'Transcription failed' : undefined
    }

    // Create timeline entry in Cosmos DB
    const entry = await createTimelineEntry({
      userId,
      type,
      title,
      description,
      date: new Date().toISOString(),
      mediaUrl: mediaUrl || undefined,
      transcription: transcription || undefined,
      aiTags,
      sentiment,
    })

    return NextResponse.json(entry)
  } catch (error) {
    const e = error as any
    console.error('[UPLOAD] Error', {
      message: e?.message,
      name: e?.name,
      code: e?.code,
      statusCode: e?.statusCode,
      details: e?.details,
      stack: e?.stack,
    })
    return NextResponse.json({
      error: 'Failed to upload entry',
      message: e?.message,
      code: e?.code,
      statusCode: e?.statusCode,
      details: e?.details,
    }, { status: 500 })
  }
}
