'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts'
import { TimelineEntry } from '@/lib/types'
import { aggregateEmotionsByMonth, getEmotionLabel } from '@/lib/utils'
import { MoodMeter } from '@/components/mood-meter'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

export default function InsightsPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [monthlyData, setMonthlyData] = useState<any[]>([])
  const [sentimentData, setSentimentData] = useState<any[]>([])

  useEffect(() => {
    if (session?.user) {
      fetchEntries()
    }
  }, [session])

  useEffect(() => {
    if (entries.length > 0) {
      processData()
    }
  }, [entries])

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

  const processData = () => {
    const monthly = aggregateEmotionsByMonth(entries)
    const monthlyChartData = Object.keys(monthly).map(month => ({
      month,
      positive: monthly[month].positive,
      negative: monthly[month].negative,
      neutral: monthly[month].neutral,
      total: monthly[month].count,
    })).sort((a, b) => a.month.localeCompare(b.month))

    setMonthlyData(monthlyChartData)

    const sentimentCounts = entries.reduce((acc, entry) => {
      const sentiment = entry.sentiment || 'neutral'
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const sentimentChartData = Object.keys(sentimentCounts).map(sentiment => ({
      name: getEmotionLabel(sentiment),
      value: sentimentCounts[sentiment],
    }))

    setSentimentData(sentimentChartData)
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading insights...</div>
  }

  const totalEntries = entries.length
  const avgSentiment = entries.reduce((acc, entry) => {
    if (entry.sentiment === 'positive') return acc + 1
    if (entry.sentiment === 'negative') return acc - 1
    return acc
  }, 0) / totalEntries

  return (
    <div className="container mx-auto px-4 py-8 text-foreground">
      <h1 className="text-3xl font-bold mb-8">Insights</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-card border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEntries}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Sentiment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {avgSentiment > 0 ? 'Positive' : avgSentiment < 0 ? 'Negative' : 'Neutral'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Active Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthlyData.length > 0 ? monthlyData.reduce((max, curr) => curr.total > max.total ? curr : max).month : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Photo Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entries.filter(e => e.type === 'photo').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-card border border-border">
          <CardHeader>
            <CardTitle>Emotion Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="positive" stroke="#00C49F" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="#FF8042" strokeWidth={2} />
                <Line type="monotone" dataKey="neutral" stroke="#FFBB28" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sentimentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {sentimentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall Mood Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <MoodMeter
            positive={entries.filter(e => e.sentiment === 'positive').length}
            negative={entries.filter(e => e.sentiment === 'negative').length}
            neutral={entries.filter(e => e.sentiment === 'neutral').length}
            total={totalEntries}
          />
        </CardContent>
      </Card>
    </div>
  )
}
