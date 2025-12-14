'use client'

import { useState, useEffect } from 'react'
import { TimelineEntry } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lock, Unlock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface TimeCapsuleProps {
  entry: TimelineEntry
}

export function TimeCapsule({ entry }: TimeCapsuleProps) {
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!entry.unlockDate) return

    const unlockDate = new Date(entry.unlockDate)
    const now = new Date()

    if (now >= unlockDate) {
      setIsUnlocked(true)
    } else {
      const interval = setInterval(() => {
        const now = new Date()
        const diff = unlockDate.getTime() - now.getTime()

        if (diff <= 0) {
          setIsUnlocked(true)
          clearInterval(interval)
        } else {
          const days = Math.floor(diff / (1000 * 60 * 60 * 24))
          const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
          setTimeLeft(`${days}d ${hours}h ${minutes}m`)
        }
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [entry.unlockDate])

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isUnlocked ? <Unlock className="w-5 h-5 text-green-600" /> : <Lock className="w-5 h-5 text-gray-600" />}
          Time Capsule
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">{entry.title}</h3>
            <p className="text-sm text-gray-600">Created on {formatDate(entry.date)}</p>
          </div>

          {isUnlocked ? (
            <div>
              <p className="text-green-600 font-medium">Unlocked!</p>
              <p className="text-sm">{entry.description}</p>
              {entry.mediaUrl && (
                <div className="mt-2">
                  {entry.type === 'photo' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.mediaUrl} alt={entry.title} className="w-full h-32 object-cover rounded" />
                  )}
                  {entry.type === 'voice' && (
                    <audio controls src={entry.mediaUrl} className="w-full" />
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-gray-600">This entry is locked until {formatDate(entry.unlockDate!)}</p>
              <p className="text-sm text-gray-500">Time remaining: {timeLeft}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
