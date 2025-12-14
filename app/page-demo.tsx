'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Mic, FileText, Sparkles, Calendar, Image, Tag, Heart } from 'lucide-react'

export default function DemoPage() {
  const [currentView, setCurrentView] = useState<'landing' | 'timeline'>('landing')

  // Mock timeline data for demo
  const mockEntries = [
    {
      id: '1',
      type: 'photo' as const,
      title: 'Beach Vacation 2024',
      description: 'Amazing trip to the coast with friends',
      date: '2024-07-15',
      mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400',
      aiTags: ['travel', 'beach', 'friends', 'vacation'],
      sentiment: 'positive' as const,
    },
    {
      id: '2',
      type: 'voice' as const,
      title: 'Voice Note: Project Ideas',
      description: 'Recording my thoughts on new project ideas',
      date: '2024-06-20',
      transcription: 'I had some great ideas for a new mobile app today. The concept involves using AI to help people organize their daily tasks more efficiently.',
      aiTags: ['work', 'ideas', 'productivity', 'AI'],
      sentiment: 'positive' as const,
    },
    {
      id: '3',
      type: 'text' as const,
      title: 'Graduation Day',
      description: 'Finally completed my computer science degree!',
      date: '2024-05-15',
      aiTags: ['education', 'achievement', 'milestone'],
      sentiment: 'positive' as const,
    },
  ]

  const groupedEntries = mockEntries.reduce((groups, entry) => {
    const year = new Date(entry.date).getFullYear().toString()
    if (!groups[year]) {
      groups[year] = []
    }
    groups[year].push(entry)
    return groups
  }, {} as { [year: string]: typeof mockEntries })

  if (currentView === 'timeline') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Timeline of Me
                </h1>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-gray-600">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">DM</span>
                  </div>
                  <span className="text-sm">Demo User</span>
                </div>
                
                <Button onClick={() => setCurrentView('landing')} variant="outline" size="sm">
                  Back to Landing
                </Button>
              </div>
            </div>
          </div>
        </header>
        
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Timeline</h1>
              <p className="text-gray-600 mt-2">Welcome back, Demo User</p>
            </div>
            
            <div className="flex gap-4">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="w-4 h-4 mr-2" />
                Add Entry
              </Button>
            </div>
          </div>

          {/* Timeline */}
          <div className="timeline-container max-w-4xl mx-auto">
            {Object.keys(groupedEntries).map((year) => (
              <div key={year} className="mb-12">
                <div className="flex items-center gap-4 mb-6">
                  <h2 className="text-3xl font-bold text-gray-900">{year}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-gray-300 to-transparent"></div>
                  <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {groupedEntries[year].length} {groupedEntries[year].length === 1 ? 'entry' : 'entries'}
                  </span>
                </div>
                
                <div className="space-y-6">
                  {groupedEntries[year].map((entry) => (
                    <div key={entry.id} className="timeline-item">
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Entry Type Icon */}
                            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                              {entry.type === 'photo' && <Image className="w-5 h-5" />}
                              {entry.type === 'voice' && <Mic className="w-5 h-5" />}
                              {entry.type === 'text' && <FileText className="w-5 h-5" />}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Header */}
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {entry.title}
                                  </h3>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <Calendar className="w-4 h-4" />
                                    <span>{new Date(entry.date).toLocaleDateString('en-US', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                    })}</span>
                                    {entry.sentiment && (
                                      <>
                                        <span>•</span>
                                        <Heart className="w-4 h-4 text-green-500" />
                                        <span className="capitalize">{entry.sentiment}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Media Content */}
                              {entry.mediaUrl && entry.type === 'photo' && (
                                <div className="mb-4">
                                  <div className="relative w-full h-64 rounded-lg overflow-hidden">
                                    <img
                                      src={entry.mediaUrl}
                                      alt={entry.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              )}

                              {entry.type === 'voice' && (
                                <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Mic className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-900">Voice Note</span>
                                  </div>
                                  <div className="w-full h-12 bg-purple-100 rounded flex items-center justify-center">
                                    <div className="flex gap-1">
                                      <div className="w-1 h-6 bg-purple-400 rounded"></div>
                                      <div className="w-1 h-8 bg-purple-400 rounded"></div>
                                      <div className="w-1 h-4 bg-purple-400 rounded"></div>
                                      <div className="w-1 h-7 bg-purple-400 rounded"></div>
                                      <div className="w-1 h-5 bg-purple-400 rounded"></div>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Description */}
                              {entry.description && (
                                <p className="text-gray-700 mb-4 leading-relaxed">
                                  {entry.description}
                                </p>
                              )}

                              {/* Transcription */}
                              {entry.transcription && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-sm text-gray-600 italic">
                                    "{entry.transcription}"
                                  </p>
                                </div>
                              )}

                              {/* AI Tags */}
                              {entry.aiTags && entry.aiTags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Tag className="w-3 h-3" />
                                    <span>AI Tags:</span>
                                  </div>
                                  {entry.aiTags.map((tag, index) => (
                                    <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Timeline of Me
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            Your personal life journal powered by AI. Upload photos, voice notes, and milestones to create a beautiful timeline of your memories.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => setCurrentView('timeline')}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
            >
              View Demo Timeline
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="px-8 py-3 text-lg"
            >
              Learn More
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Camera className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Photo Memories</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Upload photos and let AI automatically tag them with relevant categories like "travel", "friends", or "celebration".
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <Mic className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Voice Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Record voice notes that get automatically transcribed and analyzed for sentiment and key topics.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center hover:shadow-lg transition-shadow">
            <CardHeader>
              <FileText className="w-12 h-12 text-pink-600 mx-auto mb-4" />
              <CardTitle>Text Milestones</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Add important life events and milestones. AI will categorize and help organize your timeline.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-16">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <Sparkles className="w-5 h-5" />
            <span>Powered by Azure Cognitive Services</span>
          </div>
        </div>
      </div>
    </div>
  )
}
