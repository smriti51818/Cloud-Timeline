'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { TimelineEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Filter, Grid, List, Search, Sparkles, Shuffle, Heart, Meh, Frown, Image, Mic, FileText, TrendingUp, Calendar, Users } from 'lucide-react'

export default function DashboardPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [showSurpriseModal, setShowSurpriseModal] = useState(false)
  const [surpriseEntry, setSurpriseEntry] = useState<TimelineEntry | null>(null)
  const [filters, setFilters] = useState({
    type: 'all',
    sentiment: 'all',
    tag: 'all',
    dateFrom: '',
    dateTo: '',
  })

  useEffect(() => {
    if (session?.user?.email) {
      fetchEntries()
    }
  }, [session])

  useEffect(() => {
    applyFilters()
  }, [entries, filters, searchTerm])

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

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.aiTags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(entry => entry.type === filters.type)
    }

    // Sentiment filter
    if (filters.sentiment !== 'all') {
      filtered = filtered.filter(entry => entry.sentiment === filters.sentiment)
    }

    // Tag filter
    if (filters.tag !== 'all') {
      filtered = filtered.filter(entry => entry.aiTags?.includes(filters.tag))
    }

    // Date filters
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
      tag: 'all',
      dateFrom: '',
      dateTo: '',
    })
    setSearchTerm('')
  }

  const getSurpriseEntry = async () => {
    try {
      const response = await fetch(`/api/random-entry?userId=${session?.user?.email}`)
      if (response.ok) {
        const entry = await response.json()
        setSurpriseEntry(entry)
        setShowSurpriseModal(true)
      }
    } catch (error) {
      console.error('Failed to get surprise entry:', error)
    }
  }

  const getAllTags = () => {
    const tagSet = new Set<string>()
    entries.forEach(entry => {
      entry.aiTags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet)
  }

  const getStats = () => {
    const total = entries.length
    const photos = entries.filter(e => e.type === 'photo').length
    const voices = entries.filter(e => e.type === 'voice').length
    const texts = entries.filter(e => e.type === 'text').length
    const positive = entries.filter(e => e.sentiment === 'positive').length
    const thisMonth = entries.filter(e => {
      const entryDate = new Date(e.date)
      const now = new Date()
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear()
    }).length

    return { total, photos, voices, texts, positive, thisMonth }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
        />
      </div>
    )
  }

  const stats = getStats()
  const allTags = getAllTags()

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
              <Grid className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Your Memory Gallery
            </h1>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore your personal collection of memories, filtered by emotion, time, and content.
          </p>
        </motion.div>

        {/* Animated Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          {[
            { label: 'Total Memories', value: stats.total, icon: Heart, color: 'from-pink-500 to-rose-500' },
            { label: 'Photos', value: stats.photos, icon: Image, color: 'from-blue-500 to-cyan-500' },
            { label: 'Voice Notes', value: stats.voices, icon: Mic, color: 'from-purple-500 to-violet-500' },
            { label: 'This Month', value: stats.thisMonth, icon: Calendar, color: 'from-green-500 to-emerald-500' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 * index, type: "spring", stiffness: 200 }}
              whileHover={{ scale: 1.05 }}
            >
                <Card className="bg-card border border-border shadow hover:shadow-lg transition-all duration-300">
                <CardContent className="p-4 text-center">
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${stat.color} mb-3`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <motion.div
                    className="text-2xl font-bold text-gray-900"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, type: "spring" }}
                  >
                    {stat.value}
                  </motion.div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                {/* Search */}
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search memories, tags, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/50 border-gray-200 focus:border-blue-400"
                  />
                </div>

                {/* Surprise Me Button */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={getSurpriseEntry}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
                  >
                    <Shuffle className="w-4 h-4 mr-2" />
                    Surprise Me
                  </Button>
                </motion.div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="photo">Photos</SelectItem>
                    <SelectItem value="voice">Voice Notes</SelectItem>
                    <SelectItem value="text">Text Entries</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.sentiment} onValueChange={(value) => setFilters(prev => ({ ...prev, sentiment: value }))}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Emotion" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Emotions</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="negative">Negative</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.tag} onValueChange={(value) => setFilters(prev => ({ ...prev, tag: value }))}>
                  <SelectTrigger className="bg-white/50">
                    <SelectValue placeholder="Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="date"
                  placeholder="From Date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  className="bg-white/50"
                />

                <Input
                  type="date"
                  placeholder="To Date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  className="bg-white/50"
                />
              </div>

              <div className="flex justify-between items-center mt-4">
                <Button variant="outline" onClick={resetFilters} className="text-gray-600">
                  Reset Filters
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Entries Grid/List */}
        <AnimatePresence mode="wait">
          {filteredEntries.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12"
            >
              <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No memories found</h3>
              <p className="text-gray-600">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="entries"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={viewMode === 'grid'
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }
            >
              {filteredEntries.map((entry, index) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  whileHover={{ scale: 1.03, y: -5 }}
                  className="group cursor-pointer"
                >
                  <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                    <CardContent className="p-0">
                      {viewMode === 'grid' ? (
                        <>
                          {/* Grid View */}
                          <div className="aspect-square relative overflow-hidden">
                            {entry.type === 'photo' && entry.mediaUrl ? (
                              <motion.img
                                src={entry.mediaUrl}
                                alt={entry.title}
                                className="w-full h-full object-cover"
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.3 }}
                              />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                entry.type === 'voice' ? 'bg-gradient-to-br from-blue-100 to-purple-100' :
                                entry.type === 'text' ? 'bg-gradient-to-br from-green-100 to-emerald-100' :
                                'bg-gradient-to-br from-gray-100 to-gray-200'
                              }`}>
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 10 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  {entry.type === 'voice' ? <Mic className="w-12 h-12 text-blue-600" /> :
                                   entry.type === 'text' ? <FileText className="w-12 h-12 text-green-600" /> :
                                   <Image className="w-12 h-12 text-gray-600" />}
                                </motion.div>
                              </div>
                            )}

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="absolute bottom-0 left-0 right-0 p-4">
                                <h3 className="text-white font-semibold truncate mb-1">{entry.title}</h3>
                                <p className="text-white/80 text-sm line-clamp-2">{entry.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  {entry.sentiment && (
                                    <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                                      {entry.sentiment === 'positive' ? '😊' : entry.sentiment === 'negative' ? '😔' : '😐'} {entry.sentiment}
                                    </Badge>
                                  )}
                                  <span className="text-white/80 text-xs">
                                    {new Date(entry.date).toLocaleDateString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        /* List View */
                        <div className="p-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-lg ${
                              entry.type === 'photo' ? 'bg-blue-100' :
                              entry.type === 'voice' ? 'bg-purple-100' :
                              'bg-green-100'
                            }`}>
                              {entry.type === 'photo' ? <Image className="w-6 h-6 text-blue-600" /> :
                               entry.type === 'voice' ? <Mic className="w-6 h-6 text-purple-600" /> :
                               <FileText className="w-6 h-6 text-green-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate mb-1">{entry.title}</h3>
                              <p className="text-gray-600 text-sm line-clamp-2 mb-2">{entry.description}</p>
                              <div className="flex items-center gap-2">
                                {entry.sentiment && (
                                  <Badge variant="outline" className="text-xs">
                                    {entry.sentiment}
                                  </Badge>
                                )}
                                <span className="text-gray-500 text-xs">
                                  {new Date(entry.date).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Surprise Me Modal */}
        <AnimatePresence>
          {showSurpriseModal && surpriseEntry && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowSurpriseModal(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="bg-white/95 backdrop-blur-md border-0 shadow-2xl">
                  <CardHeader className="text-center">
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="text-6xl mb-4"
                    >
                      🎉
                    </motion.div>
                    <CardTitle className="text-2xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Surprise Memory!
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold mb-2">{surpriseEntry.title}</h3>
                      <p className="text-gray-600 mb-4">{surpriseEntry.description}</p>
                      <div className="flex justify-center gap-2 mb-4">
                        {surpriseEntry.sentiment && (
                          <Badge variant="secondary" className="text-sm">
                            {surpriseEntry.sentiment}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-sm">
                          {new Date(surpriseEntry.date).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>

                    {surpriseEntry.mediaUrl && surpriseEntry.type === 'photo' && (
                      <motion.img
                        src={surpriseEntry.mediaUrl}
                        alt={surpriseEntry.title}
                        className="w-full rounded-lg shadow-lg"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      />
                    )}

                    {surpriseEntry.aiTags && surpriseEntry.aiTags.length > 0 && (
                      <div className="flex flex-wrap gap-2 justify-center">
                        {surpriseEntry.aiTags.map((tag, index) => (
                          <motion.div
                            key={tag}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.3 + index * 0.1 }}
                          >
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                              {tag}
                            </Badge>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
