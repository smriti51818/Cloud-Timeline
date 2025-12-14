'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TimelineEntry } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { TimelineCard } from './timeline-card'
import { Calendar, Image, Mic, FileText, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

interface TimelineViewProps {
  entries: { [year: string]: TimelineEntry[] }
  onEntryUpdated?: (entry: TimelineEntry) => void
  onEntryDeleted?: (id: string) => void
}

export function TimelineView({ entries, onEntryUpdated, onEntryDeleted }: TimelineViewProps) {
  const years = Object.keys(entries).sort((a, b) => parseInt(b) - parseInt(a))
  const [zoomedYear, setZoomedYear] = useState<string | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedEntry, setSelectedEntry] = useState<TimelineEntry | null>(null)

  if (years.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <div className="max-w-md mx-auto">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Calendar className="w-10 h-10 text-blue-500" />
          </motion.div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Your timeline awaits</h3>
          <p className="text-gray-600 leading-relaxed">
            Begin your journey of memories. Every photo, voice note, and milestone creates a beautiful story of your life.
          </p>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="mt-6"
          >
            <Sparkles className="w-6 h-6 text-purple-400 mx-auto" />
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const scrollToYear = (index: number) => {
    const element = document.getElementById(`year-${years[index]}`)
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setCurrentIndex(index)
  }

  return (
    <div className="relative">


      {/* Timeline Content */}
      <div className="overflow-x-auto">
        <div className="flex gap-12 p-8 min-w-max">
          {years.map((year, yearIndex) => (
            <motion.div
              key={year}
              id={`year-${year}`}
              className="flex-shrink-0 w-96"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: yearIndex * 0.1 }}
            >
              {/* Year Header */}
              <motion.div
                className="mb-8 text-center"
                whileHover={{ scale: 1.02 }}
              >
                <motion.h2
                  className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3"
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: yearIndex * 0.1 + 0.2 }}
                >
                  {year}
                </motion.h2>
                <div className="flex items-center justify-center gap-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                  <motion.span
                    className="text-sm text-gray-500 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 rounded-full border border-gray-200"
                    whileHover={{ scale: 1.05 }}
                  >
                    {entries[year].length} {entries[year].length === 1 ? 'memory' : 'memories'}
                  </motion.span>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                {zoomedYear === year ? (
                  <motion.div
                    key={`zoomed-${year}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {entries[year].map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => setSelectedEntry(entry)}
                        className="cursor-pointer"
                      >
                        <TimelineCard
                          entry={entry}
                          onUpdated={onEntryUpdated}
                          onDeleted={onEntryDeleted}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={`grid-${year}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 gap-4"
                  >
                    {entries[year].slice(0, 4).map((entry, index) => (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1, duration: 0.4 }}
                        whileHover={{ scale: 1.08, rotate: 2 }}
                        whileTap={{ scale: 0.95 }}
                        className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200"
                        onClick={() => setSelectedEntry(entry)}
                      >
                        {entry.type === 'photo' && entry.mediaUrl ? (
                          <motion.img
                            src={entry.mediaUrl}
                            alt={entry.title}
                            className="w-full h-full object-cover"
                            whileHover={{ scale: 1.1 }}
                            transition={{ duration: 0.3 }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-blue-50 to-purple-50">
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 10 }}
                              transition={{ duration: 0.2 }}
                            >
                              {entry.type === 'voice' ? <Mic className="w-10 h-10" /> : <FileText className="w-10 h-10" />}
                            </motion.div>
                          </div>
                        )}
                        {/* Overlay with title */}
                        <motion.div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3"
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="text-white text-sm font-medium truncate">{entry.title}</p>
                          <p className="text-white/80 text-xs">{formatDate(entry.date)}</p>
                        </motion.div>
                      </motion.div>
                    ))}
                    {entries[year].length > 4 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="aspect-square bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl flex items-center justify-center text-gray-600 font-semibold cursor-pointer shadow-md hover:shadow-xl transition-all duration-300 border border-purple-200"
                        onClick={() => setZoomedYear(year)}
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-center">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="text-2xl mb-1"
                          >
                            ✨
                          </motion.div>
                          <div>+{entries[year].length - 4} more</div>
                          <div className="text-xs text-gray-500">Click to expand</div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Zoom Toggle */}
              <motion.div
                className="mt-6 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.button
                  onClick={() => setZoomedYear(zoomedYear === year ? null : year)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {zoomedYear === year ? '← Back to Overview' : 'View All Memories →'}
                </motion.button>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Entry Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <TimelineCard
                entry={selectedEntry}
                onUpdated={(updated) => {
                  onEntryUpdated?.(updated)
                  setSelectedEntry(updated)
                }}
                onDeleted={(id) => {
                  onEntryDeleted?.(id)
                  setSelectedEntry(null)
                }}
                isModal={true}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
