'use client'

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

interface TagCloudProps {
  tags: string[]
  onTagClick?: (tag: string) => void
}

export function TagCloud({ tags, onTagClick }: TagCloudProps) {
  const [hoveredTag, setHoveredTag] = useState<string | null>(null)

  const colors = [
    'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border-blue-300',
    'bg-gradient-to-r from-green-100 to-green-200 text-green-800 border-green-300',
    'bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 border-purple-300',
    'bg-gradient-to-r from-pink-100 to-pink-200 text-pink-800 border-pink-300',
    'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 border-yellow-300',
    'bg-gradient-to-r from-indigo-100 to-indigo-200 text-indigo-800 border-indigo-300',
    'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300',
    'bg-gradient-to-r from-teal-100 to-teal-200 text-teal-800 border-teal-300'
  ]

  // Calculate tag frequencies for sizing
  const tagFrequency = tags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  const maxFrequency = Math.max(...Object.values(tagFrequency))

  const getTagSize = (frequency: number) => {
    const ratio = frequency / maxFrequency
    if (ratio > 0.8) return 'text-lg font-bold'
    if (ratio > 0.6) return 'text-base font-semibold'
    if (ratio > 0.4) return 'text-sm font-medium'
    return 'text-xs'
  }

  const getTagPosition = (index: number) => {
    const positions = [
      { x: 0, y: 0 },
      { x: 20, y: -10 },
      { x: -15, y: 15 },
      { x: 25, y: 20 },
      { x: -20, y: -15 },
      { x: 15, y: 25 },
      { x: -25, y: 10 },
      { x: 30, y: -5 },
    ]
    return positions[index % positions.length]
  }

  return (
    <div className="relative flex flex-wrap gap-3 justify-center items-center min-h-32">
      {tags.map((tag, index) => {
        const color = colors[index % colors.length]
        const frequency = tagFrequency[tag]
        const size = getTagSize(frequency)
        const position = getTagPosition(index)

        return (
          <motion.div
            key={`${tag}-${index}`}
            initial={{
              opacity: 0,
              scale: 0.3,
              x: position.x,
              y: position.y,
              rotate: Math.random() * 20 - 10
            }}
            animate={{
              opacity: 1,
              scale: 1,
              x: hoveredTag === tag ? 0 : position.x,
              y: hoveredTag === tag ? 0 : position.y,
              rotate: hoveredTag === tag ? 0 : Math.random() * 20 - 10
            }}
            transition={{
              delay: index * 0.05,
              duration: 0.6,
              type: "spring",
              stiffness: 200,
              damping: 20
            }}
            whileHover={{
              scale: 1.2,
              rotate: 0,
              x: 0,
              y: 0,
              zIndex: 10
            }}
            whileTap={{ scale: 0.95 }}
            onHoverStart={() => setHoveredTag(tag)}
            onHoverEnd={() => setHoveredTag(null)}
            onClick={() => onTagClick?.(tag)}
            className="relative cursor-pointer"
          >
            <Badge
              variant="secondary"
              className={`${color} ${size} px-3 py-2 border shadow-sm hover:shadow-md transition-all duration-300 rounded-full backdrop-blur-sm`}
            >
              {tag}
              {frequency > 1 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.05 + 0.3 }}
                  className="ml-1 text-xs opacity-75"
                >
                  ×{frequency}
                </motion.span>
              )}
            </Badge>

            {/* Floating particles for popular tags */}
            {frequency === maxFrequency && (
              <>
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-current rounded-full opacity-60"
                    initial={{
                      x: Math.random() * 40 - 20,
                      y: Math.random() * 40 - 20,
                      scale: 0
                    }}
                    animate={{
                      x: Math.random() * 60 - 30,
                      y: Math.random() * 60 - 30,
                      scale: [0, 1, 0]
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </>
            )}
          </motion.div>
        )
      })}

      {/* Background decorative elements */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.1 }}
        transition={{ delay: 1, duration: 1 }}
      >
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
        <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </motion.div>
    </div>
  )
}
