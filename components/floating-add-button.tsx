'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Plus, Camera, Mic, FileText } from 'lucide-react'

export function FloatingAddButton() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const options = [
    {
      icon: Camera,
      label: 'Add Photo',
      action: () => router.push('/add?type=photo'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      icon: Mic,
      label: 'Voice Note',
      action: () => router.push('/voice'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      icon: FileText,
      label: 'Text Entry',
      action: () => router.push('/add?type=text'),
      color: 'bg-green-500 hover:bg-green-600',
    },
  ]

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              onClick={() => setIsOpen(false)}
            />

            {/* Options */}
            <div className="absolute bottom-16 right-0 space-y-3">
              {options.map((option, index) => (
                <motion.div
                  key={option.label}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ delay: index * 0.1, type: "spring", stiffness: 200 }}
                  className="flex items-center gap-3"
                >
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={() => {
                        option.action()
                        setIsOpen(false)
                      }}
                      className={`${option.color} text-white shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 px-4 py-2`}
                    >
                      <option.icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{option.label}</span>
                    </Button>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="relative"
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white shadow-2xl hover:shadow-3xl transition-all duration-300"
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-6 h-6" />
          </motion.div>
        </Button>


      </motion.div>
    </div>
  )
}
