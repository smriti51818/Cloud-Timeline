'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { TimelineEntry } from '@/lib/types'
import { groupByYear } from '@/lib/utils'
import { TimelineView } from '@/components/timeline-view'
import { CalendarView } from '@/components/calendar-view'
import { UploadModal } from '@/components/upload-modal'
import { MoodMeter } from '@/components/mood-meter'
import { TagCloud } from '@/components/tag-cloud'
import { ReflectionPrompts } from '@/components/reflection-prompts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search } from 'lucide-react'

export default function TimelinePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const user = session?.user
  const [mode, setMode] = useState<'timeline' | 'calendar'>('timeline')

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
      const response = await fetch(`/api/entries?userId=${encodeURIComponent(user?.email || '')}`)
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

  const handleEntryAdded = (newEntry: TimelineEntry) => {
    setEntries(prev => [newEntry, ...prev])
    setShowUploadModal(false)
  }

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchEntries()
      return
    }

    try {
      setLoading(true)
      const response = await fetch(`/api/entries?userId=${encodeURIComponent(user?.email || '')}&search=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Error searching entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupedEntries = groupByYear(entries)

  const allTags = entries.flatMap(e => e.aiTags || [])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Timeline</h1>
            <p className="text-muted-foreground mt-2">Welcome back, {user.name}</p>
          </div>

          <div className="flex gap-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline" size="icon">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <div className="hidden md:flex items-center border rounded-lg overflow-hidden">
              <button
                className={`px-3 py-2 text-sm ${mode === 'timeline' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                onClick={() => setMode('timeline')}
                aria-pressed={mode === 'timeline'}
              >
                Timeline
              </button>
              <button
                className={`px-3 py-2 text-sm ${mode === 'calendar' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                onClick={() => setMode('calendar')}
                aria-pressed={mode === 'calendar'}
              >
                Calendar
              </button>
            </div>
            <Button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Entry
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {mode === 'timeline' ? (
              <TimelineView
                entries={groupedEntries}
                onEntryUpdated={(updated) => setEntries(prev => prev.map(e => e.id === updated.id ? updated : e))}
                onEntryDeleted={(id) => setEntries(prev => prev.filter(e => e.id !== id))}
              />
            ) : (
              <div className="mt-4">
                <CalendarView entries={entries} />
              </div>
            )}

            <div className="mt-12 space-y-8">
              {allTags.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>AI Tags</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <TagCloud tags={allTags} />
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Reflection Prompts</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReflectionPrompts />
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {showUploadModal && user?.email && (
          <UploadModal
            userId={user.email}
            onClose={() => setShowUploadModal(false)}
            onEntryAdded={handleEntryAdded}
          />
        )}
      </div>
    </div>
  )
}
