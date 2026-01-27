'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { TimelineEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Filter, Grid, List, Sparkles, Shuffle, RefreshCw } from 'lucide-react'
import { TimelineCard } from './timeline-card'
import { MoodMeter } from './mood-meter'
import { TagCloud } from './tag-cloud'
import { api } from '@/lib/api-client'
import { UI_CONFIG } from '@/lib/constants'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [surpriseEntry, setSurpriseEntry] = useState<TimelineEntry | null>(null)

  const [filters, setFilters] = useState({
    type: 'all',
    sentiment: 'all',
    dateFrom: '',
    dateTo: '',
    tag: '',
  })

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getEntries()
      if (response.data) {
        setEntries(response.data as TimelineEntry[])
      } else if (response.error) {
        setError(response.error)
      }
    } catch (err) {
      setError('Failed to load memories. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (session?.user) {
      fetchEntries()
    }
  }, [session, fetchEntries])

  useEffect(() => {
    let filtered = [...entries]

    if (filters.type !== 'all') {
      filtered = filtered.filter(entry => entry.type === filters.type)
    }

    if (filters.sentiment !== 'all') {
      filtered = filtered.filter(entry => entry.sentiment === filters.sentiment)
    }

    if (filters.tag) {
      const searchTag = filters.tag.toLowerCase()
      filtered = filtered.filter(entry =>
        entry.aiTags?.some(tag => tag.toLowerCase().includes(searchTag)) ||
        entry.title.toLowerCase().includes(searchTag)
      )
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.date) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      filtered = filtered.filter(entry => new Date(entry.date) <= new Date(filters.dateTo))
    }

    setFilteredEntries(filtered)
  }, [entries, filters])

  const resetFilters = () => {
    setFilters({
      type: 'all',
      sentiment: 'all',
      dateFrom: '',
      dateTo: '',
      tag: '',
    })
  }

  const getSurpriseEntry = () => {
    if (filteredEntries.length === 0) return
    const randomIndex = Math.floor(Math.random() * filteredEntries.length)
    setSurpriseEntry(filteredEntries[randomIndex])
  }

  const allTags = Array.from(new Set(entries.flatMap(entry => entry.aiTags || [])))

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full"
        />
        <p className="text-gray-500 font-medium">Coming back to your memories...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="text-red-500 text-center">
          <p className="text-lg font-semibold mb-2">Oops! Something went wrong</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
        <Button onClick={fetchEntries} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
          Your Memory Gallery
        </h1>
        <p className="text-gray-600 text-lg">Rediscover the beautiful moments you've captured.</p>
      </motion.div>

      {/* Controls Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 mb-8"
      >
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-lg"
            >
              <Grid className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-lg"
            >
              <List className="w-4 h-4 mr-2" />
              List
            </Button>
          </div>

          <div className="flex flex-1 gap-2">
            <div className="relative flex-1">
              <Input
                placeholder="Search tags or titles..."
                value={filters.tag}
                onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
                className="bg-gray-50/50 border-gray-200 rounded-lg pl-3"
              />
            </div>
            <Button
              variant={showFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 rounded-lg"
            >
              <Filter className="w-4 h-4" />
              Filters
            </Button>
            <Button
              onClick={getSurpriseEntry}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white flex items-center gap-2 rounded-lg"
              size="sm"
            >
              <Shuffle className="w-4 h-4" />
              Surprise
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="p-5 bg-white rounded-2xl border border-gray-100 shadow-md"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
                  <Select value={filters.type} onValueChange={(v) => setFilters(p => ({ ...p, type: v }))}>
                    <SelectTrigger className="bg-gray-50 border-none">
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="photo">Photos</SelectItem>
                      <SelectItem value="voice">Voice Notes</SelectItem>
                      <SelectItem value="text">Text Entries</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mood</label>
                  <Select value={filters.sentiment} onValueChange={(v) => setFilters(p => ({ ...p, sentiment: v }))}>
                    <SelectTrigger className="bg-gray-50 border-none">
                      <SelectValue placeholder="All Moods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Moods</SelectItem>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="negative">Reflective</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(p => ({ ...p, dateFrom: e.target.value }))}
                    className="bg-gray-50 border-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(p => ({ ...p, dateTo: e.target.value }))}
                    className="bg-gray-50 border-none"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6 pt-4 border-t border-gray-50">
                <Button variant="ghost" onClick={resetFilters} className="text-gray-500 hover:text-gray-700">
                  Reset All Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Surprise Entry Modal */}
      <AnimatePresence>
        {surpriseEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSurpriseEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-xl">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">A Surprise Memory</h3>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSurpriseEntry(null)} className="rounded-full">
                    ×
                  </Button>
                </div>
                <div className="overflow-y-auto max-h-[60vh] rounded-2xl">
                  <TimelineCard entry={surpriseEntry} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Rendering */}
      {filteredEntries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white/50 rounded-3xl border-2 border-dashed border-gray-200 py-20 text-center"
        >
          <div className="max-w-xs mx-auto">
            <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Grid className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No memories found</h3>
            <p className="text-gray-500 mb-6">
              {entries.length === 0
                ? "Your timeline is empty. Start adding your life stories now!"
                : "Try adjusting your filters to find what you're looking for."
              }
            </p>
            {entries.length > 0 && (
              <Button onClick={resetFilters} variant="outline" className="rounded-full px-6">
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="space-y-12">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Total Stories', value: entries.length, color: 'blue' },
              { label: 'Featured', value: filteredEntries.length, color: 'indigo' },
              { label: 'Mood Score', value: `${Math.round((filteredEntries.filter(e => e.sentiment === 'positive').length / filteredEntries.length) * 100)}%`, color: 'emerald' },
              { label: 'Voice Notes', value: entries.filter(e => e.type === 'voice').length, color: 'purple' }
            ].map((stat, i) => (
              <Card key={i} className="border-none shadow-sm bg-white/50 overflow-hidden group hover:shadow-md transition-shadow">
                <CardContent className="p-6 relative">
                  <div className={`absolute top-0 right-0 w-1 h-full bg-${stat.color}-500/20`} />
                  <p className="text-sm font-semibold text-gray-500 uppercase mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timeline Grid/List */}
          {viewMode === 'grid' ? (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry, index) => (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <TimelineCard entry={entry} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {filteredEntries.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <TimelineCard entry={entry} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Insights Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-8 border-t border-gray-100">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                Emotional Landscape
              </h3>
              <MoodMeter
                positive={entries.filter(e => e.sentiment === 'positive').length}
                negative={entries.filter(e => e.sentiment === 'negative').length}
                neutral={entries.filter(e => e.sentiment === 'neutral').length}
                total={entries.length}
              />
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-500" />
                Active Themes
              </h3>
              <TagCloud tags={allTags} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
