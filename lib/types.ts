export interface TimelineEntry {
  id: string
  userId: string
  type: 'photo' | 'voice' | 'text'
  title: string
  description?: string
  date: string
  mediaUrl?: string
  transcription?: string
  aiTags: string[]
  sentiment?: 'positive' | 'negative' | 'neutral'
  emotionScore?: number // 0-1 scale for emotion intensity
  aiCaption?: string // AI-generated poetic caption
  isLocked?: boolean // For time capsule
  unlockDate?: string // ISO date string for unlock
  category?: string
  createdAt: string
  updatedAt: string
}

export interface UploadProgress {
  fileId: string
  progress: number
  status: 'uploading' | 'processing' | 'completed' | 'error'
  message?: string
}

export interface AITagResult {
  tags: string[]
  confidence: number
  category?: string
}

export interface TranscriptionResult {
  text: string
  confidence: number
  language: string
}

export interface SentimentResult {
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
  scores: {
    positive: number
    negative: number
    neutral: number
  }
}
