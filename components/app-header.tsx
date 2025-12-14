'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sun, Moon, Sparkles, Grid3X3, Calendar, BarChart3, Play, Mic, LogOut, User, Menu } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid3X3 },
  { href: '/timeline', label: 'Timeline', icon: Calendar },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/story', label: 'Story Mode', icon: Play },
  { href: '/voice', label: 'Voice Journal', icon: Mic },
]

export function AppHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const user = session?.user

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 text-foreground">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href={user ? '/timeline' : '/'} className="flex items-center gap-2" aria-label="Go to home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="text-base font-semibold tracking-tight">Timeline of Me</span>
          </Link>

          <nav aria-label="Primary" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className={cn(
                  'inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                )}>
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>
            )}

            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.image} alt={user.name || 'User'} className="w-6 h-6 rounded-full" />
                  ) : (
                    <User className="w-4 h-4" />
                  )}
                  <span className="truncate max-w-[140px]">{user.name || user.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={() => signOut()} aria-label="Sign out">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center">
                <Button size="sm" onClick={() => router.push('/login')} aria-label="Sign in">Sign in</Button>
              </div>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav id="mobile-nav" aria-label="Mobile" className="md:hidden pb-4">
            <div className="flex flex-col gap-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2 px-3 py-2 rounded-md text-sm',
                      isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
              <div className="flex items-center gap-2 px-1 mt-2">
                {user ? (
                  <Button variant="outline" size="sm" className="w-full" onClick={() => signOut()} aria-label="Sign out">
                    <LogOut className="w-4 h-4 mr-2" /> Logout
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" onClick={() => router.push('/login')} aria-label="Sign in">
                    Sign in
                  </Button>
                )}
              </div>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}


