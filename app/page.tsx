'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Camera, Mic, FileText, Sparkles } from 'lucide-react'

export default function HomePage() {
  return <AuthLanding />
}

function AuthLanding() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session?.user) {
      router.push('/timeline')
    }
  }, [session, router])

  const handleLogin = () => {
    // Use NextAuth providers via the dedicated login page or direct call
    router.push('/login')
  }

  if (session?.user) return null

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
          <Button 
            onClick={handleLogin}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>

        <FeatureCards />

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

// Demo timeline removed; users will sign in and be redirected to /timeline

function FeatureCards() {
  return (
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
  )
}

