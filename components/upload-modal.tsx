'use client'

import { useState, useRef, useEffect } from 'react'
import { TimelineEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Upload, Camera, Mic, FileText, Loader2 } from 'lucide-react'

interface UploadModalProps {
  userId: string
  onClose: () => void
  onEntryAdded: (entry: TimelineEntry) => void
  initialTab?: 'photo' | 'voice' | 'text'
  initialTitle?: string
  initialDescription?: string
}

export function UploadModal({ userId, onClose, onEntryAdded, initialTab, initialTitle, initialDescription }: UploadModalProps) {
  const [activeTab, setActiveTab] = useState<'photo' | 'voice' | 'text'>(initialTab || 'photo')
  const [title, setTitle] = useState(initialTitle || '')
  const [description, setDescription] = useState(initialDescription || '')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRecorderRef = useRef<MediaRecorder | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)

  // Initialize fields from props when provided
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab)
    if (typeof initialTitle === 'string') setTitle(initialTitle)
    if (typeof initialDescription === 'string') setDescription(initialDescription)
  }, [initialTab, initialTitle, initialDescription])

  // Close on Escape for accessibility
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (activeTab === 'photo' && !selectedFile.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      if (activeTab === 'voice' && !selectedFile.type.startsWith('audio/')) {
        alert('Please select an audio file')
        return
      }
      if (selectedFile.size > 15 * 1024 * 1024) {
        alert('File too large. Max 15 MB')
        return
      }
      setFile(selectedFile)
    }
  }

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
        setFile(new File([blob], 'voice-note.wav', { type: 'audio/wav' }))
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

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('Please enter a title')
      return
    }

    if (activeTab !== 'text' && !file) {
      alert('Please select a file')
      return
    }

    setUploading(true)
    setProgress(0)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('type', activeTab)
      formData.append('userId', userId)
      
      if (file) {
        formData.append('file', file)
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const newEntry = await response.json()
        onEntryAdded(newEntry)
        resetForm()
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload entry. Please try again.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setFile(null)
    setAudioBlob(null)
    setIsRecording(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const tabs = [
    { id: 'photo', label: 'Photo', icon: Camera },
    { id: 'voice', label: 'Voice Note', icon: Mic },
    { id: 'text', label: 'Text Entry', icon: FileText },
  ] as const

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
    >
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-background text-foreground">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle id="upload-modal-title">Add New Entry</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-background text-blue-600 shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  aria-pressed={activeTab === tab.id}
                  aria-label={`Select ${tab.label}`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background"
                placeholder="Enter a title for your entry"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-background"
                placeholder="Add a description (optional)"
              />
            </div>

            {/* File Upload Section */}
            {activeTab === 'photo' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Photo
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-background">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Click to upload a photo or drag and drop
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Select Photo
                  </Button>
                  {file && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {file.name}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Voice Note
                </label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center bg-background">
                  {!isRecording && !audioBlob ? (
                    <div>
                      <Mic className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
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
              </div>
            )}

            {activeTab === 'text' && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  This will create a text-only entry. AI will analyze the sentiment and categorize your milestone.
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Uploading...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Add Entry'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
