'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Grid3X3, BarChart3, Play, Mic, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Grid3X3 },
  { href: '/timeline', label: 'Timeline', icon: Calendar },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/story', label: 'Story Mode', icon: Play },
  { href: '/voice', label: 'Voice Journal', icon: Mic },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <>
      {/* Sticky Navigation Bar */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link href="/timeline" className="flex items-center gap-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Timeline of Me
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <Link key={item.href} href={item.href} className="relative">
                    <motion.div
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
                        isActive
                          ? 'text-blue-600 bg-blue-50'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </motion.div>
                    {isActive && (
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"
                        layoutId="activeTab"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2"
              >
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded" />
              </motion.div>
            </div>
          </div>
        </div>
      </motion.nav>
    </>
  )
}
