 'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { TimelineEntry } from '@/lib/types'
import { formatDate, formatDateTime, formatDateDMY } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Image, Mic, FileText, Calendar, Tag, Heart, Frown, Meh, Lock, Sparkles } from 'lucide-react'
import NextImage from 'next/image'

interface TimelineCardProps {
  entry: TimelineEntry
  onUpdated?: (entry: TimelineEntry) => void
  onDeleted?: (id: string) => void
  isModal?: boolean
}

export function TimelineCard({ entry, onUpdated, onDeleted }: TimelineCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(entry.title)
  const [description, setDescription] = useState(entry.description || '')
  const [saving, setSaving] = useState(false)
  const [showAiCaption, setShowAiCaption] = useState(false)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)

  useEffect(() => {
    let abortController: AbortController | null = null
    let WaveSurferModule: any
    async function setup() {
      if (entry.type !== 'voice' || !entry.mediaUrl || !waveformRef.current || wavesurferRef.current) return
      abortController = new AbortController()
      try {
        WaveSurferModule = (await import('wavesurfer.js')).default
        const ws = WaveSurferModule.create({
          container: waveformRef.current,
          waveColor: '#9333ea',
          progressColor: '#a855f7',
          height: 40,
          normalize: true,
        })
        wavesurferRef.current = ws
        ws.load(entry.mediaUrl, { fetchOptions: { signal: abortController.signal } }).catch((error: any) => {
          if (error.name !== 'AbortError') {
            console.warn('WaveSurfer load error:', error)
          }
        })
      } catch (e) {
        console.warn('Failed to init WaveSurfer', e)
      }
    }
    setup()
    return () => {
      if (abortController) abortController.abort()
      if (wavesurferRef.current && !wavesurferRef.current.isDestroyed) {
        try {
          wavesurferRef.current.destroy()
        } catch (error) {
          console.warn('WaveSurfer destroy error:', error)
        }
      }
      wavesurferRef.current = null
    }
  }, [entry.mediaUrl, entry.type])

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/entries/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      onUpdated?.(updated)
      setIsEditing(false)
    } catch (err) {
      console.error('Failed to update entry', err)
      try {
        const body = await (err instanceof Response ? err.json() : null)
        alert('Failed to update entry: ' + (body?.message || (err as any)?.message || String(err)))
      } catch (_e) {
        alert('Failed to update entry')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this entry? This action cannot be undone.')) return
    try {
      const res = await fetch(`/api/entries/${entry.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      onDeleted?.(entry.id)
    } catch (err) {
      console.error('Failed to delete entry', err)
      try {
        const body = await (err instanceof Response ? err.json() : null)
        alert('Failed to delete entry: ' + (body?.message || (err as any)?.message || String(err)))
      } catch (_e) {
        alert('Failed to delete entry')
      }
    }
  }

  const getEntryIcon = () => {
    switch (entry.type) {
      case 'photo':
        return <Image className="w-5 h-5" />
      case 'voice':
        return <Mic className="w-5 h-5" />
      case 'text':
        return <FileText className="w-5 h-5" />
      default:
        return <Calendar className="w-5 h-5" />
    }
  }

  const getSentimentIcon = () => {
    switch (entry.sentiment) {
      case 'positive':
        return <Heart className="w-4 h-4 text-green-500" />
      case 'negative':
        return <Frown className="w-4 h-4 text-red-500" />
      default:
        return <Meh className="w-4 h-4 text-gray-500" />
    }
  }

  return (
    <motion.div
      className="timeline-item"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow relative overflow-hidden">
        {entry.isLocked && (
          <div className="absolute top-2 right-2 z-10">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            {/* Entry Type Icon */}
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              {getEntryIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  {!isEditing ? (
                    <>
                      <h3 className="text-lg font-semibold text-foreground mb-1">{entry.title}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDateDMY(entry.date)}</span>
                        {entry.sentiment && (
                          <>
                            <span>•</span>
                            {getSentimentIcon()}
                            <span className="capitalize">{entry.sentiment}</span>
                          </>
                        )}
                      </div>
                    </>
                  ) : (
                    <div>
                      <input
                        className="w-full px-2 py-1 border rounded mb-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                      <textarea
                        className="w-full px-2 py-1 border rounded"
                        rows={2}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="flex-shrink-0 ml-4 flex items-center gap-2">
                  {!isEditing ? (
                    <>
                      <button onClick={() => setIsEditing(true)} className="text-sm text-blue-600">Edit</button>
                      <button onClick={handleDelete} className="text-sm text-red-600">Delete</button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleSave} disabled={saving} className="text-sm text-green-600 mr-2">{saving ? 'Saving...' : 'Save'}</button>
                      <button onClick={() => { setIsEditing(false); setTitle(entry.title); setDescription(entry.description || '') }} className="text-sm text-gray-600">Cancel</button>
                    </>
                  )}
                </div>
              </div>

              {/* Emotion Score and AI Caption */}
              {entry.emotionScore && (
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-purple-700">
                    Emotion: {entry.emotionScore > 60 ? 'Positive' : entry.emotionScore < 40 ? 'Negative' : 'Neutral'}
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <motion.div
                        key={i}
                        className={`w-2 h-2 rounded-full ${i < Math.round(entry.emotionScore! / 20) ? 'bg-purple-500' : 'bg-gray-300'}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {entry.aiCaption && (
                <motion.div
                  className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg cursor-pointer"
                  onClick={() => setShowAiCaption(!showAiCaption)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">AI Caption</span>
                  </div>
                  <AnimatePresence>
                    {showAiCaption && (
                      <motion.p
                        className="text-sm text-gray-700"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        {entry.aiCaption}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}

              {/* Media Content */}
              {entry.mediaUrl && entry.type === 'photo' && (
                <div className="mb-4">
                  <div className="relative w-full h-64 rounded-lg overflow-hidden">
                  <NextImage
                      src={entry.mediaUrl}
                      alt={entry.title}
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {entry.mediaUrl && entry.type === 'voice' && (
                <div className="mb-4 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Mic className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium text-foreground">Voice Note</span>
                  </div>
                  <div ref={waveformRef} className="mb-2"></div>
                  <audio controls className="w-full">
                    <source src={entry.mediaUrl} type="audio/mpeg" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
              )}

              {/* Description */}
              {entry.description && (
                <p className="text-muted-foreground mb-4 leading-relaxed">
                  {entry.description}
                </p>
              )}

              {/* Transcription */}
              {entry.transcription && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground italic">
                    "{entry.transcription}"
                  </p>
                </div>
              )}

              {/* AI Tags */}
              {entry.aiTags && entry.aiTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Tag className="w-3 h-3" />
                    <span>AI Tags:</span>
                  </div>
                  {entry.aiTags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
