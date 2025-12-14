'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { VoiceRecorder } from '@/components/voice-recorder'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mic, Play, Pause, Trash2, Upload } from 'lucide-react'
import { TimelineEntry } from '@/lib/types'

export default function VoiceJournalPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showRecorder, setShowRecorder] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const user = session?.user

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (user?.email) {
      fetchEntries()
    }
  }, [user, status, router])

  const fetchEntries = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/entries?userId=${encodeURIComponent(user?.email || '')}&type=voice`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error fetching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAudioCaptured = async (file: File) => {
    if (!user?.email) return

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', user.email)
      formData.append('type', 'voice')
      formData.append('title', `Voice Note - ${new Date().toLocaleDateString()}`)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const newEntry = await response.json()
        setEntries(prev => [newEntry, ...prev])
        setShowRecorder(false)
      }
    } catch (error) {
      console.error('Error uploading voice note:', error)
    }
  }

  const togglePlayback = (entryId: string, mediaUrl?: string) => {
    if (playingId === entryId) {
      setPlayingId(null)
      // Stop audio playback
    } else {
      setPlayingId(entryId)
      // Start audio playback
    }
  }

  const deleteEntry = async (id: string) => {
    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setEntries(prev => prev.filter(e => e.id !== id))
      }
    } catch (error) {
      console.error('Error deleting entry:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            >
              <Mic className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Voice Journal
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Capture your thoughts, emotions, and memories through the power of voice.
            Let AI transcribe and analyze your spoken words.
          </p>
        </motion.div>

        {/* Record New Voice Note */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <Card className="bg-card border border-border shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Record New Voice Note</span>
                <Button
                  onClick={() => setShowRecorder(!showRecorder)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                >
                  {showRecorder ? 'Cancel' : 'Start Recording'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatePresence>
                {showRecorder && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <VoiceRecorder onAudioCaptured={handleAudioCaptured} />
                  </motion.div>
                )}
              </AnimatePresence>

              {!showRecorder && (
                <div className="text-center py-8">
                  <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Click "Start Recording" to begin capturing your voice note</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Voice Entries */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Voice Notes</h2>

          {entries.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <Mic className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No voice notes yet</h3>
              <p className="text-gray-600">
                Start recording your first voice note to begin your audio journey.
              </p>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {entries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="group"
                >
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        {/* Play Button */}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => togglePlayback(entry.id, entry.mediaUrl)}
                          className={`p-3 rounded-full shadow-lg ${
                            playingId === entry.id
                              ? 'bg-red-500 text-white'
                              : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700'
                          }`}
                        >
                          {playingId === entry.id ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </motion.button>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {entry.title}
                            </h3>
                            <div className="flex items-center gap-2 ml-4">
                              {entry.sentiment && (
                                <Badge variant="secondary" className="text-xs">
                                  {entry.sentiment}
                                </Badge>
                              )}
                              <span className="text-sm text-gray-500">
                                {new Date(entry.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          {entry.description && (
                            <p className="text-gray-700 mb-3 line-clamp-2">
                              {entry.description}
                            </p>
                          )}

                          {/* AI Tags */}
                          {entry.aiTags && entry.aiTags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {entry.aiTags.map((tag, tagIndex) => (
                                <Badge
                                  key={tagIndex}
                                  variant="outline"
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Waveform Visualization */}
                          {playingId === entry.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="mt-4"
                            >
                              <div className="flex items-end gap-1 h-8">
                                {[...Array(20)].map((_, i) => (
                                  <motion.div
                                    key={i}
                                    className="bg-gradient-to-t from-blue-400 to-purple-500 rounded-sm flex-1"
                                    animate={{
                                      height: Math.random() * 32 + 8,
                                    }}
                                    transition={{
                                      duration: 0.2,
                                      repeat: Infinity,
                                      repeatType: "reverse",
                                      delay: i * 0.05,
                                    }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteEntry(entry.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
