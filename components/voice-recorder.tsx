'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Mic } from 'lucide-react'

interface VoiceRecorderProps {
  onAudioCaptured: (file: File) => void
}

export function VoiceRecorder({ onAudioCaptured }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      audioRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        chunks.push(event.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setAudioBlob(blob)
        const file = new File([blob], 'voice-note.wav', { type: 'audio/wav' })
        onAudioCaptured(file)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Could not access microphone. Please check permissions.')
    }
  }

  const stopRecording = () => {
    if (audioRecorderRef.current && isRecording) {
      audioRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      {!isRecording && !audioBlob ? (
        <div>
          <Mic className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-2">
            Record a voice note
          </p>
          <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
            Start Recording
          </Button>
        </div>
      ) : isRecording ? (
        <div>
          <div className="w-8 h-8 bg-red-500 rounded-full mx-auto mb-2 animate-pulse"></div>
          <p className="text-sm text-red-600 mb-2">Recording...</p>
          <Button onClick={stopRecording} variant="outline">
            Stop Recording
          </Button>
        </div>
      ) : (
        <div>
          <Mic className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm text-green-600 mb-2">Recording complete!</p>
          <Button onClick={startRecording} variant="outline">
            Record Again
          </Button>
        </div>
      )}
    </div>
  )
}
