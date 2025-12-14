"use client"

import { useState, useEffect, useMemo, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { TimelineEntry } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Download } from 'lucide-react'

export default function StoryPage() {
  const { data: session } = useSession()
  const [entries, setEntries] = useState<TimelineEntry[]>([])
  const [loading, setLoading] = useState(false)
  // Slide indexing: 0 = Intro, 1..N = entries, N+1 = Outro
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showConfetti, setShowConfetti] = useState(false)
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportYear, setExportYear] = useState<string>(String(new Date().getFullYear()))
  const [exportMonth, setExportMonth] = useState<string>('all')
  const containerRef = useRef<HTMLDivElement | null>(null)

  const totalSlides = entries.length + 2

  useEffect(() => {
    // fetch when session is resolved
    if (session === undefined) return // still loading session
    if (!session?.user?.email) {
      setLoading(false)
      return
    }
    const fetchYearEntries = async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/entries?userId=${session?.user?.email}`)
        if (response.ok) {
          const data = await response.json()
          const currentYear = new Date().getFullYear()
          const yearEntries = data
            .filter((entry: TimelineEntry) => new Date(entry.date).getFullYear() === currentYear)
            .sort((a: TimelineEntry, b: TimelineEntry) => new Date(a.date).getTime() - new Date(b.date).getTime())
          setEntries(yearEntries)
        } else {
          console.warn('Failed to fetch entries: ', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch entries:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchYearEntries()
  }, [session])

  useEffect(() => {
    // keyboard navigation
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setCurrentSlide(s => Math.min(s + 1, totalSlides - 1))
      if (e.key === 'ArrowLeft') setCurrentSlide(s => Math.max(s - 1, 0))
      if (e.key === 'Escape') setExportModalOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [totalSlides])

  useEffect(() => {
    // show confetti when reaching outro
    if (currentSlide === totalSlides - 1 && entries.length > 0) {
      setShowConfetti(true)
      const t = setTimeout(() => setShowConfetti(false), 5000)
      return () => clearTimeout(t)
    }
  }, [currentSlide, totalSlides, entries.length])

  const nextSlide = () => setCurrentSlide(s => Math.min(s + 1, totalSlides - 1))
  const prevSlide = () => setCurrentSlide(s => Math.max(s - 1, 0))

  const isIntro = currentSlide === 0
  const isOutro = currentSlide === totalSlides - 1
  const currentEntry = currentSlide >= 1 && currentSlide <= entries.length ? entries[currentSlide - 1] : null

  const openExportModal = () => {
    setExportYear(String(new Date().getFullYear()))
    setExportMonth('all')
    setExportModalOpen(true)
  }

  // export implementation: professional layout with cover + TOC + entry pages
  const exportStory = async () => {
    setExportModalOpen(false)
    try {
      const html2canvas = (await import('html2canvas')).default as any
      const jspdf = await import('jspdf') as any
      const jsPDF = jspdf.jsPDF as any

      // filter entries by selected year/month
      const yearNum = parseInt(exportYear, 10)
      const filtered = entries.filter(e => {
        const d = new Date(e.date)
        if (d.getFullYear() !== yearNum) return false
        if (exportMonth === 'all') return true
        return d.getMonth() === parseInt(exportMonth, 10)
      })
      if (filtered.length === 0) {
        alert('No entries found for the selected range.')
        return
      }

      // Build temporary DOM with professional styling
      const temp = document.createElement('div')
      temp.style.position = 'fixed'
      temp.style.left = '-9999px'
      temp.style.top = '0'
      temp.style.width = '794px' // A4 @ 96dpi ~ 794px wide
      temp.style.padding = '0'
      temp.style.background = '#ffffff'
      temp.style.color = '#111827'
      temp.style.fontFamily = 'Inter, system-ui, -apple-system, sans-serif'
      document.body.appendChild(temp)

      // Cover Page with gradient background and modern design
      const cover = document.createElement('div')
      cover.style.height = '1123px' // A4 height
      cover.style.position = 'relative'
      cover.style.overflow = 'hidden'
      cover.style.background = 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
      cover.innerHTML = `
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(circle at 70% 20%, rgba(255,255,255,0.1) 0%, transparent 100%)"></div>
        <div style="position:relative;height:100%;padding:80px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center">
          <div style="margin-bottom:60px">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" style="margin:0 auto 20px">
              <path d="M12 8v4l3 3" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.9)" stroke-width="2"/>
            </svg>
          </div>
          <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);padding:8px 16px;border-radius:100px;margin-bottom:24px;border:1px solid rgba(255,255,255,0.1)">
            <span style="color:rgba(255,255,255,0.9);font-size:14px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em">Timeline of</span>
          </div>
          <h1 style="font-size:36px;font-weight:600;color:white;margin:0 0 16px;letter-spacing:-0.02em;text-shadow:0 2px 4px rgba(0,0,0,0.2)">${session?.user?.name || 'My'}</h1>
          <h2 style="font-size:48px;font-weight:800;color:white;margin:0 0 40px;letter-spacing:-0.02em;text-shadow:0 2px 4px rgba(0,0,0,0.2)">Year in Review</h2>
          <div style="width:100px;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent);margin-bottom:40px"></div>
          <p style="color:rgba(255,255,255,0.7);font-size:16px;margin:0 0 40px;font-weight:400">Generated on ${new Date().toLocaleString()}</p>
          <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(10px);padding:16px 32px;border-radius:12px;border:1px solid rgba(255,255,255,0.1)">
            <div style="color:rgba(255,255,255,0.7);font-size:14px;margin-bottom:4px">${yearNum}</div>
            <span style="color:white;font-size:18px;font-weight:500">${filtered.length} ${filtered.length === 1 ? 'Memory' : 'Memories'}</span>
          </div>
        </div>
      `
      temp.appendChild(cover)

      // Table of Contents with elegant styling
      const toc = document.createElement('div')
      toc.style.height = '1123px'
      toc.style.padding = '60px'
      toc.style.background = 'white'
      toc.style.position = 'relative'
      toc.innerHTML = `
        <div style="margin-bottom:40px">
          <h2 style="font-size:24px;color:#0f172a;margin:0 0 8px;font-weight:600;letter-spacing:-0.02em">Contents</h2>
          <div style="width:40px;height:3px;background:linear-gradient(90deg,#3b82f6,#8b5cf6)"></div>
        </div>
      `
      const ol = document.createElement('ol')
      ol.style.listStyle = 'none'
      ol.style.padding = '0'
      ol.style.margin = '0'
      ol.style.counterReset = 'item'

      for (let i = 0; i < filtered.length; i++) {
        const entry = filtered[i]
        const li = document.createElement('li')
        const pageNum = 3 + i
        li.style.marginBottom = '16px'
        li.style.paddingBottom = '16px'
        li.style.borderBottom = '1px solid #e2e8f0'
        li.style.counterIncrement = 'item'
        li.style.display = 'flex'
        li.style.alignItems = 'flex-start'
        li.style.gap = '12px'
        li.innerHTML = `
          <div style="color:#94a3b8;font-size:14px;font-weight:500;min-width:24px;padding-top:2px">
            ${String(i + 1).padStart(2, '0')}
          </div>
          <div style="flex:1;padding-right:16px">
            <div style="font-weight:500;color:#1e293b;margin-bottom:4px;line-height:1.4">${entry.title}</div>
            <div style="color:#64748b;font-size:13px">${new Date(entry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          </div>
          <div style="color:#94a3b8;font-size:13px;font-weight:500;flex-shrink:0">Page ${pageNum}</div>
        `
        ol.appendChild(li)
      }
      toc.appendChild(ol)
      temp.appendChild(toc)

      // Create entry pages with refined layout
      for (const entry of filtered) {
        const card = document.createElement('div')
        card.style.height = '1123px'
        card.style.padding = '60px'
        card.style.boxSizing = 'border-box'
        card.style.background = 'white'
        card.style.position = 'relative'
        card.style.display = 'flex'
        card.style.flexDirection = 'column'

        // Header section with date and type
        const header = document.createElement('div')
        header.style.marginBottom = '40px'
        header.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
            <div style="flex:1">
              <h2 style="font-size:32px;font-weight:600;color:#0f172a;margin:0 0 8px;letter-spacing:-0.02em">${entry.title}</h2>
              <div style="color:#64748b;font-size:14px;display:flex;align-items:center;gap:12px">
                <span>${new Date(entry.date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}</span>
                <span style="width:4px;height:4px;background:#cbd5e1;border-radius:50%"></span>
                <span style="color:#3b82f6;font-weight:500">${entry.type.toUpperCase()}</span>
              </div>
            </div>
          </div>
        `
        card.appendChild(header)

        // Content section with media and text
        const content = document.createElement('div')
        content.style.flex = '1'
        content.style.display = 'flex'
        content.style.flexDirection = 'column'
        content.style.gap = '24px'
        content.style.position = 'relative'

        // Photo if exists
        if (entry.mediaUrl && entry.type === 'photo') {
          content.innerHTML += `
            <div style="margin-bottom:24px">
              <div style="position:relative;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(15,23,42,0.08)">
                <img src="${entry.mediaUrl}" style="width:100%;height:auto;display:block" />
              </div>
            </div>
          `
        }

        // Description with better typography
        if (entry.description) {
          content.innerHTML += `
            <div style="color:#334155;font-size:16px;line-height:1.8;font-weight:400">
              ${entry.description}
            </div>
          `
        }

        // AI Caption with elegant styling
        if (entry.aiCaption) {
          content.innerHTML += `
            <blockquote style="margin:24px 0;padding:24px;background:linear-gradient(135deg,#f8fafc,#f1f5f9);border-radius:12px;position:relative">
              <div style="position:absolute;top:-12px;left:24px;background:#3b82f6;color:white;font-size:12px;padding:4px 8px;border-radius:4px;font-weight:500">AI INSIGHT</div>
              <p style="color:#1e293b;font-size:16px;line-height:1.8;font-style:italic;margin:0">
                "${entry.aiCaption}"
              </p>
            </blockquote>
          `
        }

        // Tags with modern design
        if (entry.aiTags && entry.aiTags.length) {
          content.innerHTML += `
            <div style="margin-top:auto;padding-top:24px;border-top:1px solid #e2e8f0">
              <div style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;font-weight:500">Tags</div>
              <div style="display:flex;flex-wrap:wrap;gap:8px">
                ${entry.aiTags.map(tag => `
                  <span style="background:#f1f5f9;color:#475569;font-size:13px;padding:4px 12px;border-radius:100px;font-weight:500">${tag}</span>
                `).join('')}
              </div>
            </div>
          `
        }

        card.appendChild(content)
        temp.appendChild(card)
      }

      // Render to PDF with improved quality
      const pdf = new jsPDF({ unit: 'px', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = pdf.internal.pageSize.getHeight()
      const margin = 0 // Full bleed for professional look
      const footerHeight = 24

      for (let i = 0; i < temp.children.length; i++) {
        const child = temp.children[i] as HTMLElement
        if (i > 0) pdf.addPage()
        try {
          const canvas = await html2canvas(child, { 
            scale: 3, // Higher quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: null 
          })
          const imgData = canvas.toDataURL('image/png')
          pdf.addImage(imgData, 'PNG', margin, margin, pdfW, pdfH)

          // Elegant page numbers
          if (i > 0) { // No page number on cover
            pdf.setFillColor(255, 255, 255)
            pdf.setFontSize(10)
            pdf.setTextColor('#64748b')
            const pageText = `${i + 1} / ${temp.children.length}`
            pdf.text(pageText, pdfW / 2, pdfH - 12, { align: 'center' })
          }
        } catch (err) {
          console.warn('Export capture failed for element', err)
        }
      }

      const fileName = `MyTimeLine-${yearNum}${exportMonth !== 'all' ? `-${new Date(2025, parseInt(exportMonth, 10)).toLocaleString('en-US', { month: 'short' })}` : ''}.pdf`
      pdf.save(fileName)

      // cleanup
      document.body.removeChild(temp)
    } catch (err) {
      console.error('Export failed', err)
      alert('Export failed: ' + ((err as any)?.message || String(err)))
    }
  }

  const yearsOptions = useMemo(() => {
    const set = new Set<number>()
    entries.forEach(e => set.add(new Date(e.date).getFullYear()))
    set.add(new Date().getFullYear())
    return Array.from(set).sort((a, b) => b - a).map(String)
  }, [entries])

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading your story...</div>
  }

  if (entries.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Your {new Date().getFullYear()} Story</h1>
        <p className="text-gray-600">No entries found for this year. Start creating memories!</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      {showConfetti && <Confetti />}

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Your {new Date().getFullYear()} Story</h1>
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-600 mr-2">{currentSlide + 1} / {totalSlides}</div>
            <Button onClick={openExportModal} variant="outline" aria-label="Export story">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div ref={containerRef} className="relative max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {isIntro && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="text-center py-12"
              >
                <h2 className="text-4xl font-bold mb-2">Welcome to Your Year in Review</h2>
                <p className="text-lg text-gray-600 mb-6">Let's journey through {entries.length} memories from {new Date().getFullYear()}</p>
              </motion.div>
            )}

            {currentEntry && (
              <motion.div
                key={currentEntry.id}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
              >
                <Card className="overflow-hidden">
                  {currentEntry.type === 'photo' && currentEntry.mediaUrl && (
                    <div className="relative h-96">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentEntry.mediaUrl}
                        alt={currentEntry.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
                        <h3 className="text-white text-2xl font-bold">{currentEntry.title}</h3>
                        <p className="text-white text-sm opacity-90">{new Date(currentEntry.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                      </div>
                    </div>
                  )}

                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold">{currentEntry.title}</h3>
                        <p className="text-gray-600">{currentEntry.description}</p>
                      </div>

                      {currentEntry.aiCaption && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm italic text-blue-800">"{currentEntry.aiCaption}"</p>
                        </div>
                      )}

                      {currentEntry.aiTags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {currentEntry.aiTags.map((tag, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded-full text-xs">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {isOutro && (
              <motion.div
                key="outro"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                className="text-center py-20"
              >
                <h2 className="text-4xl font-bold mb-4">The End of Your Story</h2>
                <p className="text-xl text-gray-600 mb-8">Thank you for reliving these memories. Here's to many more adventures in {new Date().getFullYear() + 1}!</p>
                <div className="text-6xl mb-8">🎉</div>
                <p className="text-lg text-gray-500">You've created {entries.length} beautiful memories this year.</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center mt-8">
            <Button onClick={prevSlide} disabled={currentSlide === 0} variant="outline" size="lg" aria-label="Previous slide">
              <ChevronLeft className="w-5 h-5 mr-2" />
              Previous
            </Button>

            <div className="text-center">
              <div className="text-sm text-gray-600">{currentSlide === 0 ? 'Intro' : currentSlide === totalSlides - 1 ? 'Outro' : `Entry ${currentSlide} of ${entries.length}`}</div>
              <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${(currentSlide) / (totalSlides - 1) * 100}%` }} />
              </div>
            </div>

            <Button onClick={nextSlide} disabled={currentSlide === totalSlides - 1} size="lg" aria-label="Next slide">
              Next
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>

        {/* Export Modal */}
        <AnimatePresence>
          {exportModalOpen && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setExportModalOpen(false)}>
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-white rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-xl font-semibold mb-3">Export Story to PDF</h3>
                <div className="mb-3">
                  <label className="block text-sm text-gray-600 mb-1">Year</label>
                  <select value={exportYear} onChange={(e) => setExportYear(e.target.value)} className="w-full border px-2 py-1 rounded">
                    {yearsOptions.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">Month</label>
                  <select value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="w-full border px-2 py-1 rounded">
                    <option value="all">All Months</option>
                    <option value="0">January</option>
                    <option value="1">February</option>
                    <option value="2">March</option>
                    <option value="3">April</option>
                    <option value="4">May</option>
                    <option value="5">June</option>
                    <option value="6">July</option>
                    <option value="7">August</option>
                    <option value="8">September</option>
                    <option value="9">October</option>
                    <option value="10">November</option>
                    <option value="11">December</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setExportModalOpen(false)}>Cancel</Button>
                  <Button onClick={exportStory}>Generate PDF</Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
