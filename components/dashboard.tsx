'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { TimelineEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Filter, Grid, List, Sparkles, Shuffle } from 'lucide-react'
import { TimelineCard } from './timeline-card'
import { MoodMeter } from './mood-meter'
import { TagCloud } from './tag-cloud'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filters, setFilters] = useState({
    type: 'all',
    sentiment: 'all',
    dateFrom: '',
    dateTo: '',
    tag: '',
  })
  const [showFilters, setShowFilters] = useState(false)
  const [surpriseEntry, setSurpriseEntry] = useState<TimelineEntry | null>(null)

  useEffect(() => {
    if (session?.user?.id) {
      fetchEntries()
    }
  }, [session])

  useEffect(() => {
    applyFilters()
  }, [entries, filters])

  const fetchEntries = async () => {
    try {
      const response = await fetch(`/api/entries?userId=${session?.user?.email}`)
      if (response.ok) {
        const data = await response.json()
        setEntries(data)
      }
    } catch (error) {
      console.error('Failed to fetch entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = entries

    if (filters.type !== 'all') {
      filtered = filtered.filter(entry => entry.type === filters.type)
    }

    if (filters.sentiment !== 'all') {
      filtered = filtered.filter(entry => entry.sentiment === filters.sentiment)
    }

    if (filters.tag) {
      filtered = filtered.filter(entry =>
        entry.aiTags?.some(tag =>
          tag.toLowerCase().includes(filters.tag.toLowerCase())
        )
      )
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(entry => new Date(entry.date) >= new Date(filters.dateFrom))
    }

    if (filters.dateTo) {
      filtered = filtered.filter(entry => new Date(entry.date) <= new Date(filters.dateTo))
    }

    setFilteredEntries(filtered)
  }

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

  const allTags = entries.flatMap(entry => entry.aiTags || [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Your Memory Gallery
        </h1>
        <p className="text-gray-600">Explore and rediscover your life's beautiful moments</p>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border"
      >
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="flex items-center gap-2"
          >
            <Grid className="w-4 h-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="flex items-center gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>

        <div className="flex gap-2 flex-1">
          <Input
            placeholder="Search by tag..."
            value={filters.tag}
            onChange={(e) => setFilters(prev => ({ ...prev, tag: e.target.value }))}
            className="flex-1"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Button
            onClick={getSurpriseEntry}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white flex items-center gap-2"
            size="sm"
          >
            <Shuffle className="w-4 h-4" />
            Surprise Me
          </Button>
        </div>
      </motion.div>

      {/* Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 bg-gray-50 rounded-xl border"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="photo">Photos</SelectItem>
                    <SelectItem value="voice">Voice Notes</SelectItem>
                    <SelectItem value="text">Text Entries</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mood</label>
                <Select value={filters.sentiment} onValueChange={(value) => setFilters(prev => ({ ...prev, sentiment: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Moods</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Reflective</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={resetFilters}>
                Reset Filters
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Surprise Entry Modal */}
      <AnimatePresence>
        {surpriseEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSurpriseEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    <h3 className="text-lg font-semibold">Surprise Memory!</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setSurpriseEntry(null)}>
                    ×
                  </Button>
                </div>
                <TimelineCard entry={surpriseEntry} isModal={true} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      {filteredEntries.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <div className="max-w-md mx-auto">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-4"
            >
              📷
            </motion.div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No memories found</h3>
            <p className="text-gray-600 mb-4">
              {entries.length === 0
                ? "Start building your timeline by adding your first photo, voice note, or milestone."
                : "Try adjusting your filters to see more memories."
              }
            </p>
            {entries.length > 0 && (
              <Button onClick={resetFilters} variant="outline">
                Clear Filters
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <Card className="text-center">
              <CardContent className="p-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring" }}
                  className="text-2xl font-bold text-blue-600"
                >
                  {filteredEntries.length}
                </motion.div>
                <p className="text-sm text-gray-600">Memories</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="text-2xl font-bold text-green-600"
                >
                  {filteredEntries.filter(e => e.sentiment === 'positive').length}
                </motion.div>
                <p className="text-sm text-gray-600">Happy Moments</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.7, type: "spring" }}
                  className="text-2xl font-bold text-purple-600"
                >
                  {filteredEntries.filter(e => e.type === 'voice').length}
                </motion.div>
                <p className="text-sm text-gray-600">Voice Notes</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.8, type: "spring" }}
                  className="text-2xl font-bold text-pink-600"
                >
                  {allTags.length}
                </motion.div>
                <p className="text-sm text-gray-600">AI Tags</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Entries Grid/List */}
          {viewMode === 'grid' ? (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ y: -5 }}
                  className="group"
                >
                  <TimelineCard entry={entry} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TimelineCard entry={entry} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Mood Overview */}
          {filteredEntries.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Mood Overview</h3>
                  <MoodMeter
                    positive={filteredEntries.filter(e => e.sentiment === 'positive').length}
                    negative={filteredEntries.filter(e => e.sentiment === 'negative').length}
                    neutral={filteredEntries.filter(e => e.sentiment === 'neutral').length}
                    total={filteredEntries.length}
                  />
                </CardContent>
              </Card>

              {allTags.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Memory Tags</h3>
                    <TagCloud tags={allTags} />
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
