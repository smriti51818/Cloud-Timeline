
'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { UploadModal } from '@/components/upload-modal'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, Sparkles, Lightbulb, Heart, Brain, Star } from 'lucide-react'

interface ReflectionPromptsProps {
  onPromptSelect?: (prompt: string) => void
}

const defaultPrompts = [
  {
    text: "What made you smile today?",
    category: "joy",
    icon: Heart,
    color: "from-pink-100 to-rose-100"
  },
  {
    text: "What challenged you this week?",
    category: "growth",
    icon: Brain,
    color: "from-blue-100 to-indigo-100"
  },
  {
    text: "What are you grateful for right now?",
    category: "gratitude",
    icon: Star,
    color: "from-yellow-100 to-amber-100"
  },
  {
    text: "How have you grown in the past month?",
    category: "reflection",
    icon: Lightbulb,
    color: "from-purple-100 to-violet-100"
  },
  {
    text: "What memory would you like to revisit?",
    category: "nostalgia",
    icon: Sparkles,
    color: "from-green-100 to-emerald-100"
  },
]

export function ReflectionPrompts({ onPromptSelect }: ReflectionPromptsProps) {
  const [prompts, setPrompts] = useState(defaultPrompts)
  const [loading, setLoading] = useState(false)
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const { data: session } = useSession()
  const [showModal, setShowModal] = useState(false)

  const generateNewPrompt = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-prompt')
      if (!response.ok) throw new Error('Failed to generate prompt')
      const data = await response.json()
      const newPrompt = {
        text: data.prompt,
        category: "ai-generated",
        icon: Sparkles,
        color: "from-purple-100 to-pink-100"
      }
      setPrompts(prev => [...prev, newPrompt])
    } catch (error) {
      console.error('Failed to generate prompt:', error)
      // Fallback to a static prompt
      const fallbackPrompt = {
        text: "What would you tell your younger self?",
        category: "wisdom",
        icon: Lightbulb,
        color: "from-orange-100 to-red-100"
      }
      setPrompts(prev => [...prev, fallbackPrompt])
    } finally {
      setLoading(false)
    }
  }

  const handlePromptClick = (prompt: typeof defaultPrompts[0]) => {
    setSelectedPrompt(prompt.text)
    onPromptSelect?.(prompt.text)
    if (session?.user?.email) {
      setShowModal(true)
    }
  }

  return (
    <>
    <Card className="overflow-hidden bg-card border border-border shadow">
      <CardHeader className="bg-muted border-b border-border">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Reflection Prompts</h3>
              <p className="text-sm text-muted-foreground">Spark meaningful memories</p>
            </div>
          </div>
          <Button
            onClick={generateNewPrompt}
            disabled={loading}
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all duration-300"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Generate New
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid gap-4">
          {prompts.map((prompt, index) => {
            const Icon = prompt.icon
            const isSelected = selectedPrompt === prompt.text

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.5,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{
                  scale: 1.02,
                  y: -2
                }}
                whileTap={{ scale: 0.98 }}
                className={`relative p-4 rounded-xl cursor-pointer border transition-all duration-300 bg-card ${
                  isSelected
                    ? 'border-purple-400 shadow-lg'
                    : 'border-border hover:shadow-md'
                }`}
                onClick={() => handlePromptClick(prompt)}
              >
                <div className="flex items-start gap-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="flex-shrink-0 p-2 bg-muted rounded-lg shadow-sm"
                  >
                    <Icon className="w-4 h-4 text-foreground" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground leading-relaxed">
                      {prompt.text}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-muted-foreground capitalize">
                        {prompt.category}
                      </span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 bg-purple-500 rounded-full"
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Selection indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-3 h-3 text-white" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover effect particles */}
                <motion.div className="absolute inset-0 rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </motion.div>
            )
          })}
        </div>

        {/* Loading state */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-muted rounded-xl border border-border"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full"
                />
                <p className="text-sm text-muted-foreground">Generating a thoughtful prompt...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>

    {showModal && session?.user?.email && (
      <UploadModal
        userId={session.user.email}
        onClose={() => setShowModal(false)}
        onEntryAdded={() => setShowModal(false)}
        initialTab="text"
        initialTitle={selectedPrompt || ''}
        initialDescription={selectedPrompt || ''}
      />
    )}
    </>
  )
}
