'use client'

import { useSession, signOut, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { LogOut, User, Sun, Moon } from 'lucide-react'

export function Header() {
  const { data: session } = useSession()
  const user = session?.user
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Timeline of Me
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              variant="outline"
              size="sm"
              suppressHydrationWarning
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            {user ? (
              <>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt={user.name || 'User'} className="w-6 h-6 rounded-full" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="text-sm">{user.name || user.email}</span>
                </div>
                <Button onClick={() => signOut()} variant="outline" size="sm">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">Not signed in</div>
                <Button size="sm" onClick={() => router.push('/login')}>Sign in</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
