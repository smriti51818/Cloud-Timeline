'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { themeConfigs, applyTheme } from '@/lib/theme-config'
import { Palette, Sparkles } from 'lucide-react'

type ThemeKey = keyof typeof themeConfigs

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState<ThemeKey>('minimal')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('selectedTheme') as ThemeKey
    if (saved && saved in themeConfigs) {
      setCurrentTheme(saved)
      applyTheme(saved)
    } else {
      applyTheme('minimal')
    }
  }, [])

  const handleThemeChange = (theme: ThemeKey) => {
    setCurrentTheme(theme)
    applyTheme(theme)
    localStorage.setItem('selectedTheme', theme)
    setIsOpen(false)
  }

  const getThemePreview = (themeKey: ThemeKey) => {
    const theme = themeConfigs[themeKey]
    return {
      background: theme.background,
      primary: theme.primary,
      secondary: theme.secondary,
    }
  }

  return (
    <div className="relative">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white/90"
        >
          <Palette className="w-4 h-4" />
          <span className="capitalize">{currentTheme}</span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sparkles className="w-3 h-3" />
          </motion.div>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Theme selector panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full mt-2 right-0 z-50 w-80"
            >
              <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-md">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Palette className="w-5 h-5 text-purple-500" />
                    </motion.div>
                    Choose Your Theme
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(themeConfigs).map(([themeKey, theme], index) => {
                    const isSelected = currentTheme === themeKey
                    const preview = getThemePreview(themeKey as ThemeKey)

                    return (
                      <motion.div
                        key={themeKey}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.3 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <button
                          onClick={() => handleThemeChange(themeKey as ThemeKey)}
                          className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                            isSelected
                              ? 'border-purple-400 bg-purple-50 shadow-lg'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            {/* Theme preview */}
                            <div className="flex-shrink-0">
                              <div
                                className="w-12 h-12 rounded-lg shadow-sm border border-gray-200"
                                style={{ background: preview.background }}
                              >
                                <div className="flex items-center justify-center h-full">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: preview.primary }}
                                  />
                                  <div
                                    className="w-3 h-3 rounded-full ml-1"
                                    style={{ backgroundColor: preview.secondary }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Theme info */}
                            <div className="flex-1 text-left">
                              <h4 className={`font-semibold capitalize ${
                                isSelected ? 'text-purple-700' : 'text-gray-900'
                              }`}>
                                {themeKey}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {themeKey === 'minimal' && 'Clean and simple'}
                                {themeKey === 'vibrant' && 'Bright and energetic'}
                                {themeKey === 'calm' && 'Peaceful and serene'}
                                {themeKey === 'retro' && 'Classic and warm'}
                                {themeKey === 'dreamy' && 'Magical and whimsical'}
                                {themeKey === 'sunset' && 'Warm and inviting'}
                                {themeKey === 'ocean' && 'Fresh and cool'}
                                {themeKey === 'forest' && 'Natural and grounding'}
                              </p>
                            </div>

                            {/* Selection indicator */}
                            {isSelected && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="flex-shrink-0"
                              >
                                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                                  <Sparkles className="w-3 h-3 text-white" />
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </button>
                      </motion.div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
