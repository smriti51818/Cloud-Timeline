import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateDMY(date: string | Date): string {
  const d = new Date(date)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}:${mm}:${yyyy}`
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function groupByYear(entries: any[]): { [year: string]: any[] } {
  return entries.reduce((groups, entry) => {
    const year = new Date(entry.date).getFullYear().toString()
    if (!groups[year]) {
      groups[year] = []
    }
    groups[year].push(entry)
    return groups
  }, {})
}

export function aggregateEmotionsByMonth(entries: any[]): { [month: string]: { positive: number, negative: number, neutral: number, count: number } } {
  const monthly = entries.reduce((acc, entry) => {
    const date = new Date(entry.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    if (!acc[monthKey]) {
      acc[monthKey] = { positive: 0, negative: 0, neutral: 0, count: 0 }
    }
    acc[monthKey].count++
    if (entry.sentiment === 'positive') acc[monthKey].positive++
    else if (entry.sentiment === 'negative') acc[monthKey].negative++
    else acc[monthKey].neutral++
    return acc
  }, {} as { [key: string]: { positive: number, negative: number, neutral: number, count: number } })
  return monthly
}

export function getRandomEntry(entries: any[]): any | null {
  if (entries.length === 0) return null
  const randomIndex = Math.floor(Math.random() * entries.length)
  return entries[randomIndex]
}

export function getThemeColor(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return '#FFD700' // Yellow for happy
    case 'negative': return '#4169E1' // Blue for calm/sad
    case 'neutral': return '#808080' // Gray
    default: return '#FFFFFF'
  }
}

export function getEmotionLabel(sentiment: string): string {
  switch (sentiment) {
    case 'positive': return 'Happy'
    case 'negative': return 'Reflective'
    case 'neutral': return 'Neutral'
    default: return 'Unknown'
  }
}
