'use client'

import { motion } from 'framer-motion'
import { Heart, Meh, Frown } from 'lucide-react'

interface MoodMeterProps {
  positive: number
  negative: number
  neutral: number
  total: number
}

export function MoodMeter({ positive, negative, neutral, total }: MoodMeterProps) {
  const positivePercent = total > 0 ? (positive / total) * 100 : 0
  const negativePercent = total > 0 ? (negative / total) * 100 : 0
  const neutralPercent = total > 0 ? (neutral / total) * 100 : 0

  const emotions = [
    {
      label: 'Positive',
      count: positive,
      percent: positivePercent,
      color: 'bg-gradient-to-r from-green-400 to-emerald-500',
      icon: Heart,
      bgColor: 'from-green-50 to-emerald-50',
      textColor: 'text-green-700'
    },
    {
      label: 'Neutral',
      count: neutral,
      percent: neutralPercent,
      color: 'bg-gradient-to-r from-gray-400 to-slate-500',
      icon: Meh,
      bgColor: 'from-gray-50 to-slate-50',
      textColor: 'text-gray-700'
    },
    {
      label: 'Negative',
      count: negative,
      percent: negativePercent,
      color: 'bg-gradient-to-r from-blue-400 to-indigo-500',
      icon: Frown,
      bgColor: 'from-blue-50 to-indigo-50',
      textColor: 'text-blue-700'
    },
  ]

  return (
    <div className="space-y-4">
      {emotions.map((emotion, index) => {
        const Icon = emotion.icon
        return (
          <motion.div
            key={emotion.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            className={`p-4 rounded-xl bg-gradient-to-r ${emotion.bgColor} border border-gray-200/50`}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className={`p-2 rounded-full bg-gradient-to-r ${emotion.color} shadow-lg`}
                >
                  <Icon className="w-4 h-4 text-white" />
                </motion.div>
                <div>
                  <h4 className={`font-semibold ${emotion.textColor}`}>{emotion.label}</h4>
                  <p className="text-sm text-gray-600">{emotion.count} memories</p>
                </div>
              </div>
              <motion.div
                className={`text-2xl font-bold ${emotion.textColor}`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
              >
                {emotion.percent.toFixed(0)}%
              </motion.div>
            </div>

            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                <motion.div
                  className={`h-4 rounded-full ${emotion.color} shadow-sm`}
                  initial={{ width: 0 }}
                  animate={{ width: `${emotion.percent}%` }}
                  transition={{ duration: 1.5, ease: 'easeOut', delay: index * 0.1 + 0.5 }}
                />
              </div>
              {/* Animated particles */}
              <motion.div
                className="absolute top-0 left-0 h-4 rounded-full bg-white/30"
                initial={{ width: 0 }}
                animate={{ width: `${emotion.percent}%` }}
                transition={{ duration: 1.5, ease: 'easeOut', delay: index * 0.1 + 0.5 }}
              />
            </div>

            {/* Progress indicators */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>0%</span>
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 + index * 0.1 }}
              >
                {emotion.percent.toFixed(1)}%
              </motion.span>
              <span>100%</span>
            </div>
          </motion.div>
        )
      })}

      {/* Overall mood indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200/50"
      >
        <div className="text-center">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-3xl mb-2"
          >
            {positivePercent > negativePercent ? '😊' : positivePercent < negativePercent ? '😌' : '😐'}
          </motion.div>
          <h4 className="font-semibold text-purple-700 mb-1">Overall Mood</h4>
          <p className="text-sm text-gray-600">
            {positivePercent > negativePercent
              ? 'Your memories are mostly positive! 🌟'
              : positivePercent < negativePercent
              ? 'Taking time to reflect and grow 💭'
              : 'A balanced mix of experiences ⚖️'
            }
          </p>
        </div>
      </motion.div>
    </div>
  )
}
