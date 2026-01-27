import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/azure-storage'
import { createTimelineEntry } from '@/lib/azure-cosmos'
import { analyzeImage, transcribeAudio, analyzeSentiment, categorizeText } from '@/lib/azure-cognitive'
import { getSession } from '@/lib/auth'
import { handleApiError, AuthenticationError, ValidationError, AppError } from '@/lib/error-handler'
import { UPLOAD_LIMITS, SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getSession()
    if (!session?.user) {
      throw new AuthenticationError()
    }
    const userId = session.user.id

    // 2. Parse and validate form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string
    const description = formData.get('description') as string
    const entryTypeStr = formData.get('type') as string
    if (!['photo', 'voice', 'text'].includes(entryTypeStr)) {
      throw new ValidationError('Invalid entry type')
    }
    const type = entryTypeStr as 'photo' | 'voice' | 'text'

    if (!title) {
      throw new ValidationError('Title is required')
    }

    if (type !== 'text' && !file) {
      throw new ValidationError('File is required for media entries')
    }

    // 3. File validation
    if (file) {
      if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
        throw new ValidationError(ERROR_MESSAGES.FILE_TOO_LARGE)
      }

      const allowedTypes = (type === 'photo'
        ? UPLOAD_LIMITS.ALLOWED_IMAGE_TYPES
        : UPLOAD_LIMITS.ALLOWED_AUDIO_TYPES) as readonly string[]

      if (!allowedTypes.includes(file.type)) {
        throw new ValidationError(ERROR_MESSAGES.INVALID_FILE_TYPE)
      }
    }

    let mediaUrl = ''
    let aiTags: string[] = []
    let transcription: string | undefined = undefined
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral'

    // 4. Upload file to Azure Blob Storage
    if (file && type !== 'text') {
      const entryId = crypto.randomUUID()
      try {
        mediaUrl = await uploadFile(file, userId, entryId)
      } catch (err) {
        console.error('[API/UPLOAD] Blob upload failed', err)
        throw new AppError(ERROR_MESSAGES.UPLOAD_FAILED, 500, 'UPLOAD_FAILED')
      }
    }

    // 5. Intelligent Processing (AI)
    try {
      if (type === 'photo' && mediaUrl) {
        const imageAnalysis = await analyzeImage(mediaUrl)
        aiTags = imageAnalysis.tags
      } else if (type === 'voice' && mediaUrl) {
        const transcriptionResult = await transcribeAudio(mediaUrl)
        transcription = transcriptionResult.text

        const sentimentResult = await analyzeSentiment(transcription)
        sentiment = sentimentResult.sentiment

        const categories = await categorizeText(transcription)
        aiTags = categories
      } else if (type === 'text') {
        const content = description || title
        const sentimentResult = await analyzeSentiment(content)
        sentiment = sentimentResult.sentiment

        const categories = await categorizeText(content)
        aiTags = categories
      }
    } catch (aiError) {
      // AI errors are non-blocking; we still want to save the entry
      console.warn('[API/UPLOAD] AI processing failed', aiError)
    }

    // 6. Persistence (Cosmos DB)
    const entry = await createTimelineEntry({
      userId,
      type,
      title,
      description,
      date: new Date().toISOString(),
      mediaUrl: mediaUrl || undefined,
      transcription,
      aiTags,
      sentiment,
    })

    return NextResponse.json({
      message: SUCCESS_MESSAGES.ENTRY_CREATED,
      data: entry
    })
  } catch (error) {
    const { message, statusCode, code } = handleApiError(error)
    return NextResponse.json({ error: { message, code } }, { status: statusCode })
  }
}
