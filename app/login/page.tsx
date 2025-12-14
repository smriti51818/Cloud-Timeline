'use client'

import { signIn } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Github, Mail } from 'lucide-react'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Sign in to Timeline of Me</CardTitle>
          <CardDescription>Choose a provider to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={() => signIn('google', { callbackUrl: '/' })} className="w-full bg-red-600 hover:bg-red-700">
            <Mail className="w-4 h-4 mr-2" />
            Sign in with Google
          </Button>
          <Button onClick={() => signIn('github', { callbackUrl: '/' })} className="w-full" variant="outline">
            <Github className="w-4 h-4 mr-2" />
            Sign in with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}


