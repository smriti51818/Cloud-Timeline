'use client'

  import { useMemo, useState, useEffect } from 'react'
import { TimelineEntry } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CalendarViewProps {
  entries: TimelineEntry[]
}

function getMonthMatrix(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const startDay = firstDay.getDay() // 0-6 Sun-Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const weeks: Array<Array<number | null>> = []
  let current = 1 - startDay
  for (let w = 0; w < 6; w++) {
    const week: Array<number | null> = []
    for (let d = 0; d < 7; d++) {
      if (current < 1 || current > daysInMonth) week.push(null)
      else week.push(current)
      current++
    }
    weeks.push(week)
  }
  return weeks
}

export function CalendarView({ entries }: CalendarViewProps) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const year = cursor.getFullYear()
  const month = cursor.getMonth()

  const entriesByDay = useMemo(() => {
    const map = new Map<number, TimelineEntry[]>()
    for (const e of entries) {
      const d = new Date(e.date)
      if (d.getMonth() !== month || d.getFullYear() !== year) continue
      const day = d.getDate()
      const arr = map.get(day) || []
      arr.push(e)
      map.set(day, arr)
    }
    return map
  }, [entries, month, year])

  const weeks = getMonthMatrix(year, month)

  const sentimentColor = (s?: string) =>
    s === 'positive' ? 'bg-green-500' : s === 'negative' ? 'bg-red-500' : 'bg-gray-400'

  const monthLabel = cursor.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  const [openDay, setOpenDay] = useState<number | null>(null)

  const dayEntries = useMemo(() => {
    if (!openDay) return [] as TimelineEntry[]
    return entriesByDay.get(openDay) || []
  }, [openDay, entriesByDay])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenDay(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3">
        <button
          className="px-2 py-1 text-sm rounded-md border border-border bg-background text-foreground hover:bg-accent"
          onClick={() => { setOpenDay(null); setCursor(new Date(year, month - 1, 1)) }}
          aria-label="Previous month"
        >
          ←
        </button>
        <div className="text-base md:text-lg font-bold tracking-tight">
          <span className="inline-block px-3 py-1 rounded-md bg-card text-foreground border border-border shadow select-none">
            {monthLabel}
          </span>
        </div>
        <button
          className="px-2 py-1 text-sm rounded-md border border-border bg-background text-foreground hover:bg-accent"
          onClick={() => { setOpenDay(null); setCursor(new Date(year, month + 1, 1)) }}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-muted-foreground mb-2">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center font-medium">{d}</div>
        ))}
      </div>
      <div className="grid grid-rows-6 gap-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-2">
            {week.map((day, di) => {
              const dayEntriesLocal = day ? entriesByDay.get(day) || [] : []
              return (
                <Card
                  key={di}
                  className={`min-h-28 p-2 bg-card border border-border ${day ? 'cursor-pointer hover:bg-accent transition-colors' : 'opacity-40'}`}
                  onClick={() => day && setOpenDay(day)}
                  role={day ? 'button' : undefined}
                  aria-label={day ? `View entries for ${year}-${month + 1}-${day}` : undefined}
                >
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-muted-foreground">{day || ''}</span>
                    {dayEntriesLocal.length > 0 && (
                      <span className="text-[10px] text-muted-foreground">{dayEntriesLocal.length}</span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    {dayEntriesLocal.slice(0, 3).map((e) => (
                      <div key={e.id} className="flex items-center gap-2 truncate">
                        <span className={`inline-block w-2 h-2 rounded-full ${sentimentColor(e.sentiment)}`} />
                        <span className="text-xs truncate text-foreground">{e.title}</span>
                      </div>
                    ))}
                    {dayEntriesLocal.length > 3 && (
                      <Badge variant="outline" className="px-1 py-0 text-[10px]">+{dayEntriesLocal.length - 3} more</Badge>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        ))}
      </div>

      {openDay && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setOpenDay(null)}
        >
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-background text-foreground rounded-lg shadow-2xl border border-border"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Entries for ${monthLabel} ${openDay}`}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="font-semibold text-sm text-foreground">
                {String(openDay).padStart(2,'0')}:{String(month + 1).padStart(2,'0')}:{year}
              </div>
              <button className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setOpenDay(null)} aria-label="Close">Close</button>
            </div>
            <div className="p-4 space-y-3">
              {dayEntries.length === 0 ? (
                <div className="text-sm text-muted-foreground">No entries</div>
              ) : (
                dayEntries.map((e) => (
                  <div key={e.id} className="p-3 rounded-md border border-border hover:bg-accent">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span className={`inline-block w-2 h-2 rounded-full ${sentimentColor(e.sentiment)}`} />
                      <span className="text-foreground">
                        {String(new Date(e.date).getDate()).padStart(2,'0')}:{String(new Date(e.date).getMonth()+1).padStart(2,'0')}:{new Date(e.date).getFullYear()}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-foreground">{e.title}</div>
                    {e.description && (
                      <div className="text-sm text-muted-foreground line-clamp-3">{e.description}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


