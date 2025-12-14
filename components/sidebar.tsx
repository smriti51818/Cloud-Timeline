'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Grid3X3, BarChart3, Play, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Home', icon: Grid3X3 },
  { href: '/timeline', label: 'Timeline', icon: Calendar },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
  { href: '/story', label: 'Story', icon: Play },
]

export function Sidebar() {
  const { data: session } = useSession()
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  if (!session) return null

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 h-full w-64 bg-white shadow-xl z-50 flex flex-col"
            >
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Navigation</h2>
              </div>
              <nav className="flex-1 p-4">
                <ul className="space-y-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          onClick={() => setIsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                            isActive
                              ? 'bg-blue-100 text-blue-600'
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
