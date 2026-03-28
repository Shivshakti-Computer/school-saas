'use client'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  Menu, X, Phone, Mail, MapPin, Facebook, Instagram,
  Youtube, MessageCircle, Download, ChevronLeft, ChevronRight,
  Play, Award, Calendar, Bus, GraduationCap, ExternalLink
} from 'lucide-react'

// ── Types ──
export interface TemplateProps {
  school: { name: string; address: string; phone: string; email: string; logo?: string }
  website: any
  currentPage: string
  subdomain: string
}

// ════════════════════════════════════════
// NAVIGATION
// ════════════════════════════════════════
export function WebsiteNav({ school, website, currentPage, subdomain, style }: TemplateProps & { style: 'light' | 'dark' }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pages = (website.pages || []).filter((p: any) => p.enabled)
  const primary = website.primaryColor || '#4F46E5'
  const isDark = style === 'dark'

  return (
    <header className={`${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'} border-b sticky top-0 z-40`}>
      {/* Announcement Ticker */}
      {website.announcementText && (
        <div className="overflow-hidden py-1.5" style={{ background: primary }}>
          <div className="animate-marquee whitespace-nowrap">
            <span className="text-xs text-white font-medium mx-8">
              📢 {website.announcementText}
            </span>
            <span className="text-xs text-white font-medium mx-8">
              📢 {website.announcementText}
            </span>
          </div>
        </div>
      )}

      {/* Top info bar */}
      {(website?.phone || website?.email) && (
        <div className={`${isDark ? 'bg-slate-800' : 'bg-slate-50'} py-1.5 px-4 hidden md:block`}>
          <div className="max-w-6xl mx-auto flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              {website?.phone && (
                <a href={`tel:${website.phone}`} className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Phone size={10} /> {website.phone}
                </a>
              )}
              {website?.email && (
                <a href={`mailto:${website.email}`} className={`flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Mail size={10} /> {website.email}
                </a>
              )}
            </div>
            <div className="flex items-center gap-3">
              {website.facebook && <a href={website.facebook} target="_blank" rel="noreferrer" className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}><Facebook size={12} /></a>}
              {website.instagram && <a href={website.instagram} target="_blank" rel="noreferrer" className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}><Instagram size={12} /></a>}
              {website.youtube && <a href={website.youtube} target="_blank" rel="noreferrer" className={isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'}><Youtube size={12} /></a>}
              {/* Login button */}
              <a href="/login" className={`ml-2 px-2 py-0.5 rounded text-[10px] font-medium ${isDark ? 'bg-slate-700 text-slate-300 hover:text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                Student/Parent Login
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Main nav */}
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${subdomain}`} className="flex items-center gap-2.5">
          {website.logo ? (
            <img src={website.logo} alt={school.name} className="h-10 w-auto object-contain" />
          ) : (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold" style={{ background: primary }}>
              {school.name.charAt(0)}
            </div>
          )}
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{school.name}</p>
            {website.tagline && <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{website.tagline}</p>}
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {pages.map((page: any) => (
            <Link key={page.slug} href={`/${subdomain}?page=${page.slug}`}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                currentPage === page.slug
                  ? `font-semibold`
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
              style={currentPage === page.slug ? { color: primary } : {}}>
              {page.title}
            </Link>
          ))}
          {website.admissionOpen && (
            <a href={website.admissionLink || `/${subdomain}?page=admissions`}
              className="ml-2 px-4 py-2 text-sm font-semibold text-white rounded-lg" style={{ background: primary }}>
              Apply Now
            </a>
          )}
        </nav>

        <button className="md:hidden p-2" onClick={() => setMobileOpen(true)}>
          <Menu size={20} className={isDark ? 'text-white' : 'text-slate-900'} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <div className={`relative w-72 h-full ${isDark ? 'bg-slate-900' : 'bg-white'} p-4 shadow-xl`}>
            <div className="flex items-center justify-between mb-4">
              <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{school.name}</p>
              <button onClick={() => setMobileOpen(false)} className={isDark ? 'text-slate-400' : 'text-slate-500'}><X size={18} /></button>
            </div>
            <nav className="space-y-1">
              {pages.map((page: any) => (
                <Link key={page.slug} href={`/${subdomain}?page=${page.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-3 py-2.5 rounded-lg text-sm ${
                    currentPage === page.slug ? 'font-semibold' : isDark ? 'text-slate-300' : 'text-slate-600'
                  }`}
                  style={currentPage === page.slug ? { color: primary } : {}}>
                  {page.title}
                </Link>
              ))}
              <a href="/login" className="block px-3 py-2.5 rounded-lg text-sm text-slate-500 mt-4 border-t border-slate-200 pt-4">
                Student/Parent Login →
              </a>
            </nav>
          </div>
        </div>
      )}

      {/* Marquee CSS */}
      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-block; animation: marquee 20s linear infinite; }
      `}</style>
    </header>
  )
}

// ════════════════════════════════════════
// FOOTER
// ════════════════════════════════════════
export function WebsiteFooter({ school, website, subdomain, style }: TemplateProps & { style: 'light' | 'dark' }) {
  const primary = website.primaryColor || '#4F46E5'
  const pages = (website.pages || []).filter((p: any) => p.enabled)
  const isDark = style === 'dark'

  return (
    <footer className={isDark ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-600'}>
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              {website.logo ? (
                <img src={website.logo} alt="" className="h-8 w-auto" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: primary }}>
                  {school.name.charAt(0)}
                </div>
              )}
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{school.name}</h3>
            </div>
            {website.about && <p className="text-sm leading-relaxed opacity-70">{website.about.slice(0, 200)}...</p>}
          </div>
          <div>
            <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Links</h4>
            <div className="space-y-2">
              {pages.slice(0, 6).map((page: any) => (
                <Link key={page.slug} href={`/${subdomain}?page=${page.slug}`}
                  className="block text-sm opacity-70 hover:opacity-100">{page.title}</Link>
              ))}
              <a href="/login" className="block text-sm opacity-70 hover:opacity-100">Student/Parent Login</a>
            </div>
          </div>
          <div>
            <h4 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Contact</h4>
            <div className="space-y-2 text-sm">
              {website.address && <div className="flex items-start gap-2 opacity-70"><MapPin size={14} className="mt-0.5 flex-shrink-0" /><span>{website.address}</span></div>}
              {website.phone && <a href={`tel:${website.phone}`} className="flex items-center gap-2 opacity-70 hover:opacity-100"><Phone size={14} />{website.phone}</a>}
              {website.email && <a href={`mailto:${website.email}`} className="flex items-center gap-2 opacity-70 hover:opacity-100"><Mail size={14} />{website.email}</a>}
            </div>
            <div className="flex items-center gap-3 mt-4">
              {website.facebook && <a href={website.facebook} target="_blank" rel="noreferrer" className="opacity-60 hover:opacity-100"><Facebook size={16} /></a>}
              {website.instagram && <a href={website.instagram} target="_blank" rel="noreferrer" className="opacity-60 hover:opacity-100"><Instagram size={16} /></a>}
              {website.youtube && <a href={website.youtube} target="_blank" rel="noreferrer" className="opacity-60 hover:opacity-100"><Youtube size={16} /></a>}
              {website.whatsapp && <a href={`https://wa.me/${website.whatsapp}`} target="_blank" rel="noreferrer" className="opacity-60 hover:opacity-100"><MessageCircle size={16} /></a>}
            </div>
          </div>
        </div>
        <div className={`mt-8 pt-6 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'} flex flex-col sm:flex-row items-center justify-between gap-2`}>
          <p className="text-xs opacity-50">© {new Date().getFullYear()} {school.name}. All rights reserved.</p>
          <p className="text-xs opacity-40">Powered by <a href="https://vidyaflow.in" target="_blank" rel="noreferrer" className="hover:opacity-100 underline">VidyaFlow</a></p>
        </div>
      </div>

      {/* WhatsApp floating */}
      {website.whatsapp && (
        <a href={`https://wa.me/${website.whatsapp}`} target="_blank" rel="noreferrer"
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors z-50">
          <MessageCircle size={24} />
        </a>
      )}
    </footer>
  )
}

// ════════════════════════════════════════
// ANNOUNCEMENT POPUP
// ════════════════════════════════════════
export function AnnouncementPopup({ website }: { website: any }) {
  const [show, setShow] = useState(false)
  const popup = website.announcementPopup

  useEffect(() => {
    if (popup?.enabled && popup?.title) {
      const dismissed = sessionStorage.getItem('popup_dismissed')
      if (!dismissed) {
        setTimeout(() => setShow(true), 2000)
      }
    }
  }, [popup])

  if (!show || !popup) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={() => { setShow(false); sessionStorage.setItem('popup_dismissed', '1') }} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {popup.image && <img src={popup.image} alt="" className="w-full h-40 object-cover" />}
        <div className="p-6">
          <h3 className="text-lg font-bold text-slate-900">{popup.title}</h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">{popup.body}</p>
          <button onClick={() => { setShow(false); sessionStorage.setItem('popup_dismissed', '1') }}
            className="mt-4 w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800">
            OK, Got it
          </button>
        </div>
      </div>
    </div>
  )
}

// ════════════════════════════════════════
// SECTION RENDERER (Master)
// ════════════════════════════════════════
export function SectionRenderer({ section, website, school, primary }: {
  section: any; website: any; school: any; primary: string
}) {
  if (!section.enabled) return null

  const props = { website, school, primary }

  switch (section.type) {
    case 'hero': return null // Hero is handled by template directly
    case 'stats': return <StatsSection {...props} />
    case 'about': return <AboutSection {...props} />
    case 'facilities': return <FacilitiesSection {...props} />
    case 'faculty': return <FacultySection {...props} />
    case 'gallery': return <GallerySection {...props} />
    case 'testimonials': return <TestimonialsSection {...props} />
    case 'events': return <EventsSection {...props} />
    case 'contact': return <ContactSection {...props} />
    case 'cta': return <CTASection {...props} />
    case 'academics': return <AcademicsSection primary={primary} />
    case 'custom': return <CustomSection content={section.content} primary={primary} />
    // Premium sections
    case 'principalMessage': return <PrincipalMessageSection {...props} />
    case 'videoTour': return <VideoTourSection {...props} />
    case 'achievements': return <AchievementsSection {...props} />
    case 'downloads': return <DownloadsSection {...props} />
    case 'infrastructure': return <InfrastructureSection {...props} />
    case 'feeStructure': return <FeeStructureSection {...props} />
    case 'transportRoutes': return <TransportRoutesSection {...props} />
    case 'alumni': return <AlumniSection {...props} />
    default: return null
  }
}

// ════════════════════════════════════════
// ANIMATED COUNTER HOOK
// ════════════════════════════════════════
function useCountUp(target: number, duration = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const counted = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true
          let start = 0
          const step = target / (duration / 16)
          const timer = setInterval(() => {
            start += step
            if (start >= target) { setCount(target); clearInterval(timer) }
            else setCount(Math.floor(start))
          }, 16)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return { count, ref }
}

// ════════════════════════════════════════
// SCROLL ANIMATION WRAPPER
// ════════════════════════════════════════
function ScrollReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}>
      {children}
    </div>
  )
}

// ════════════════════════════════════════
// INDIVIDUAL SECTIONS
// ════════════════════════════════════════

type SectionProps = { website: any; school: any; primary: string }

// ── Stats with animated counter ──
function StatsSection({ website, primary }: SectionProps) {
  const stats = website.stats || []
  if (stats.length === 0) return null

  return (
    <section className="py-14 bg-slate-50">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((s: any, i: number) => (
            <StatItem key={i} label={s.label} value={s.value} primary={primary} />
          ))}
        </div>
      </div>
    </section>
  )
}

function StatItem({ label, value, primary }: { label: string; value: string; primary: string }) {
  const numericValue = parseInt(value.replace(/[^0-9]/g, '')) || 0
  const suffix = value.replace(/[0-9]/g, '').trim()
  const { count, ref } = useCountUp(numericValue)

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl md:text-4xl font-extrabold" style={{ color: primary }}>
        {count}{suffix}
      </p>
      <p className="text-sm text-slate-600 mt-1 font-medium">{label}</p>
    </div>
  )
}

// ── About ──
function AboutSection({ website, school, primary }: SectionProps) {
  if (!website.about) return null
  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>About Us</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Welcome to {school.name}</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">{website.about}</p>
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Facilities with icons ──
function FacilitiesSection({ website, primary }: SectionProps) {
  const facilities = website.facilities || []
  if (facilities.length === 0) return null
  const icons = ['🎓', '🔬', '💻', '📚', '⚽', '🎭', '🎵', '🏊', '🚌', '🏥', '🍽️', '🎨', '🏋️', '🎪', '🖥️']

  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>What We Offer</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Our Facilities</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {facilities.map((f: string, i: number) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                <span className="text-3xl block mb-2">{icons[i % icons.length]}</span>
                <p className="text-sm font-semibold text-slate-800">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Faculty ──
function FacultySection({ website, primary }: SectionProps) {
  const faculty = website.faculty || []
  if (faculty.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Our Team</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Meet Our Faculty</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {faculty.map((f: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 text-center group hover:shadow-lg transition-all duration-300">
                <div className="w-20 h-20 rounded-full mx-auto mb-3 overflow-hidden flex items-center justify-center text-white text-xl font-bold" style={{ background: primary }}>
                  {f.photo ? <img src={f.photo} alt={f.name} className="w-full h-full object-cover" /> : f.name?.charAt(0)}
                </div>
                <p className="text-sm font-bold text-slate-900">{f.name}</p>
                <p className="text-xs text-slate-500">{f.designation}</p>
                {f.subject && <p className="text-xs mt-1 font-medium" style={{ color: primary }}>{f.subject}</p>}
                {f.qualification && <p className="text-[10px] text-slate-400 mt-0.5">{f.qualification}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Gallery with Lightbox ──
function GallerySection({ website }: SectionProps) {
  const gallery = website.gallery || []
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [activeAlbum, setActiveAlbum] = useState<string>('all')

  if (gallery.length === 0) return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Photo Gallery</h2>
        <p className="text-slate-500">Photos coming soon!</p>
      </div>
    </section>
  )

  const albums: string[] = ['all', ...Array.from(new Set<string>(gallery.filter((g: any) => g.album).map((g: any) => g.album)))]
  const filtered = activeAlbum === 'all' ? gallery : gallery.filter((g: any) => g.album === activeAlbum)

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-6">Photo Gallery</h2>

        {/* Album filter */}
        {albums.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {albums.map((album: string) => (
              <button key={album} onClick={() => setActiveAlbum(album)}
                className={`px-3 py-1.5 text-xs rounded-full font-medium capitalize transition-colors ${
                  activeAlbum === album ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {album}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((img: any, i: number) => (
            <div key={i} onClick={() => setLightbox(i)}
              className="aspect-square rounded-xl overflow-hidden bg-slate-100 cursor-pointer group relative">
              <img src={img.url} alt={img.caption || `Photo ${i + 1}`}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 flex items-end">
                {img.caption && (
                  <p className="text-white text-xs p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-medium">
                    {img.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4">
          <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 text-white/70 hover:text-white z-10">
            <X size={28} />
          </button>
          <button onClick={() => setLightbox(Math.max(0, lightbox - 1))} className="absolute left-4 text-white/70 hover:text-white">
            <ChevronLeft size={32} />
          </button>
          <button onClick={() => setLightbox(Math.min(filtered.length - 1, lightbox + 1))} className="absolute right-4 text-white/70 hover:text-white">
            <ChevronRight size={32} />
          </button>
          <div className="max-w-4xl max-h-[85vh] relative">
            <img src={filtered[lightbox]?.url} alt="" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
            {filtered[lightbox]?.caption && (
              <p className="text-white text-center text-sm mt-3 opacity-70">{filtered[lightbox].caption}</p>
            )}
          </div>
          <p className="absolute bottom-4 text-white/50 text-xs">{lightbox + 1} / {filtered.length}</p>
        </div>
      )}
    </section>
  )
}

// ── Testimonials ──
function TestimonialsSection({ website, primary }: SectionProps) {
  const testimonials = website.testimonials || []
  if (testimonials.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Testimonials</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">What People Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <svg key={s} className="w-4 h-4" fill={primary} viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: primary }}>
                    {t.photo ? <img src={t.photo} alt="" className="w-full h-full rounded-full object-cover" /> : t.name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Events ──
function EventsSection({ website, primary }: SectionProps) {
  const events = website.events || []
  if (events.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Stay Updated</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Events & News</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((ev: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
                {ev.image && <img src={ev.image} alt={ev.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />}
                <div className="p-5">
                  {ev.date && <p className="text-xs font-semibold mb-2" style={{ color: primary }}>
                    {new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>}
                  <h3 className="text-sm font-bold text-slate-900">{ev.title}</h3>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3">{ev.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Contact ──
function ContactSection({ website, school, primary }: SectionProps) {
  const [formData, setFormData] = useState({ name: '', phone: '', message: '' })
  const [submitted, setSubmitted] = useState(false)

  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Get In Touch</p>
          <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Contact Us</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            {website.address && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: primary }}>
                  <MapPin size={18} />
                </div>
                <div><p className="text-sm font-semibold text-slate-900">Address</p><p className="text-sm text-slate-600 mt-1">{website.address}</p></div>
              </div>
            )}
            {website.phone && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: primary }}>
                  <Phone size={18} />
                </div>
                <div><p className="text-sm font-semibold text-slate-900">Phone</p><a href={`tel:${website.phone}`} className="text-sm text-slate-600 mt-1 hover:underline">{website.phone}</a></div>
              </div>
            )}
            {website.email && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: primary }}>
                  <Mail size={18} />
                </div>
                <div><p className="text-sm font-semibold text-slate-900">Email</p><a href={`mailto:${website.email}`} className="text-sm text-slate-600 mt-1 hover:underline">{website.email}</a></div>
              </div>
            )}
          </div>

          {/* Contact Form or Map */}
          {website.mapUrl ? (
            <div className="rounded-xl overflow-hidden border border-slate-200 h-64 md:h-auto">
              <iframe src={website.mapUrl} className="w-full h-full" style={{ border: 0 }} allowFullScreen loading="lazy" />
            </div>
          ) : (
            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
              {submitted ? (
                <div className="text-center py-8">
                  <p className="text-2xl mb-2">✅</p>
                  <p className="text-sm font-semibold text-slate-800">Thank you!</p>
                  <p className="text-xs text-slate-500 mt-1">We will get back to you soon.</p>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); setSubmitted(true) }} className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-800 mb-2">Send us a message</h3>
                  <input type="text" required placeholder="Your Name" value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                  <input type="tel" required placeholder="Phone Number" value={formData.phone}
                    onChange={e => setFormData(f => ({ ...f, phone: e.target.value }))}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                  <textarea rows={3} required placeholder="Your Message" value={formData.message}
                    onChange={e => setFormData(f => ({ ...f, message: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 resize-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100" />
                  <button type="submit" className="w-full py-2.5 text-white rounded-lg text-sm font-medium" style={{ background: primary }}>
                    Send Message
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ── CTA ──
function CTASection({ website, school, primary }: SectionProps) {
  return (
    <section className="py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="rounded-2xl p-8 md:p-12 text-white text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}dd)` }}>
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
          <div className="relative">
            <h2 className="text-2xl md:text-3xl font-bold">{website.admissionOpen ? 'Admissions Are Open!' : `Welcome to ${school.name}`}</h2>
            <p className="mt-3 text-sm md:text-base opacity-90 max-w-xl mx-auto">
              {website.admissionOpen ? 'Apply now for the new academic session. Limited seats available.' : 'Contact us to know more about our programs.'}
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              {website.admissionOpen && (
                <a href={website.admissionLink || `tel:${website.phone}`} className="px-6 py-3 bg-white font-semibold rounded-xl text-sm" style={{ color: primary }}>Apply Now</a>
              )}
              {website.phone && (
                <a href={`tel:${website.phone}`} className="px-6 py-3 bg-white/20 font-semibold rounded-xl text-sm text-white hover:bg-white/30">Call: {website.phone}</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Academics ──
function AcademicsSection({ primary }: { primary: string }) {
  const classes = ['Nursery', 'LKG', 'UKG', 'Class 1-5 (Primary)', 'Class 6-8 (Middle)', 'Class 9-10 (Secondary)', 'Class 11-12 (Senior Secondary)']
  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Academics</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Academic Programs</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-all hover:-translate-y-1 duration-300">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold mb-3" style={{ background: primary }}>{i + 1}</div>
                <p className="text-sm font-bold text-slate-900">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Custom ──
function CustomSection({ content, primary }: { content: any; primary: string }) {
  if (!content) return null
  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          {content.heading && <div className="text-center mb-8"><h2 className="text-2xl md:text-3xl font-bold text-slate-900">{content.heading}</h2></div>}
          {content.body && <div className="max-w-3xl mx-auto text-slate-600 leading-relaxed whitespace-pre-wrap">{content.body}</div>}
          {content.items?.length > 0 && (
            <div className="max-w-3xl mx-auto mt-6">
              <ul className="space-y-2">
                {content.items.map((item: string, i: number) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5" style={{ background: primary }}>{i + 1}</div>
                    <span className="text-sm text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </section>
    </ScrollReveal>
  )
}

// ════════════════════════════════════════
// PREMIUM SECTIONS
// ════════════════════════════════════════

// ── Principal Message ──
function PrincipalMessageSection({ website, primary }: SectionProps) {
  const pm = website.principalMessage
  if (!pm?.name || !pm?.message) return null

  return (
    <ScrollReveal>
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>From the Desk</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Principal&apos;s Message</h2>
          </div>
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0 text-center md:text-left">
                <div className="w-24 h-24 rounded-full overflow-hidden mx-auto md:mx-0 flex items-center justify-center text-white text-2xl font-bold" style={{ background: primary }}>
                  {pm.photo ? <img src={pm.photo} alt={pm.name} className="w-full h-full object-cover" /> : pm.name.charAt(0)}
                </div>
                <p className="mt-3 text-sm font-bold text-slate-900">{pm.name}</p>
                <p className="text-xs text-slate-500">{pm.designation || 'Principal'}</p>
              </div>
              <div className="flex-1">
                <div className="text-3xl text-slate-200 font-serif leading-none mb-2">&ldquo;</div>
                <p className="text-sm text-slate-700 leading-relaxed italic">{pm.message}</p>
                <div className="text-3xl text-slate-200 font-serif leading-none text-right mt-2">&rdquo;</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Video Tour ──
function VideoTourSection({ website, primary }: SectionProps) {
  if (!website.videoTourUrl) return null

  // Convert YouTube URL to embed URL
  let embedUrl = website.videoTourUrl
  const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (ytMatch) embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}`

  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Virtual Tour</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Take a Tour</h2>
          </div>
          <div className="max-w-4xl mx-auto">
            <div className="aspect-video rounded-2xl overflow-hidden border border-slate-200 shadow-lg">
              <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Achievements ──
function AchievementsSection({ website, primary }: SectionProps) {
  const achievements = website.achievements || []
  if (achievements.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Our Pride</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Achievements & Awards</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((a: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${primary}20` }}>
                    <Award size={18} style={{ color: primary }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{a.title}</p>
                    {a.year && <p className="text-xs font-medium mt-0.5" style={{ color: primary }}>{a.year}</p>}
                    <p className="text-xs text-slate-600 mt-1">{a.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Downloads ──
function DownloadsSection({ website, primary }: SectionProps) {
  const downloads = website.downloads || []
  if (downloads.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Resources</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Downloads</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {downloads.map((d: any, i: number) => (
              <a key={i} href={d.url} target="_blank" rel="noreferrer"
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-all group">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${primary}15` }}>
                  <Download size={18} style={{ color: primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{d.title}</p>
                  {d.category && <p className="text-xs text-slate-400">{d.category}</p>}
                </div>
                <ExternalLink size={14} className="text-slate-300 group-hover:text-slate-600 flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Infrastructure ──
function InfrastructureSection({ website, primary }: SectionProps) {
  const items = website.infrastructureItems || []
  if (items.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Campus</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Our Infrastructure</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all group">
                {item.image ? (
                  <img src={item.image} alt={item.title} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center" style={{ background: `${primary}10` }}>
                    <span className="text-4xl">🏛️</span>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-sm font-bold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Fee Structure ──
function FeeStructureSection({ website, primary }: SectionProps) {
  const fees = website.feeStructure || []
  if (fees.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Fee Details</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Fee Structure</h2>
          </div>
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr style={{ background: primary }}>
                    <th className="text-left px-5 py-3 text-sm font-semibold text-white">Class</th>
                    <th className="text-right px-5 py-3 text-sm font-semibold text-white">Annual Fee</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f: any, i: number) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-5 py-3 text-sm text-slate-800 font-medium">{f.className}</td>
                      <td className="px-5 py-3 text-sm text-slate-800 font-semibold text-right">₹{f.fee}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {fees[0]?.details && (
              <p className="text-xs text-slate-500 mt-3 text-center">{fees[0].details}</p>
            )}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Transport Routes ──
function TransportRoutesSection({ website, primary }: SectionProps) {
  const routes = website.transportRoutes || []
  if (routes.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Transport</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Bus Routes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {routes.map((r: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-all">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${primary}15` }}>
                    <Bus size={18} style={{ color: primary }} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{r.routeName}</p>
                    {r.busNo && <p className="text-xs mt-0.5" style={{ color: primary }}>Bus: {r.busNo}</p>}
                    <p className="text-xs text-slate-600 mt-1">Stops: {r.stops}</p>
                    {r.timing && <p className="text-xs text-slate-400 mt-0.5">Timing: {r.timing}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}

// ── Alumni ──
function AlumniSection({ website, primary }: SectionProps) {
  const alumni = website.alumniList || []
  if (alumni.length === 0) return null

  return (
    <ScrollReveal>
      <section className="py-16 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold tracking-wider uppercase" style={{ color: primary }}>Our Pride</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-slate-900">Notable Alumni</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {alumni.map((a: any, i: number) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 text-center hover:shadow-lg transition-all">
                <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden flex items-center justify-center text-white text-lg font-bold" style={{ background: primary }}>
                  {a.photo ? <img src={a.photo} alt={a.name} className="w-full h-full object-cover" /> : a.name?.charAt(0)}
                </div>
                <p className="text-sm font-bold text-slate-900">{a.name}</p>
                <p className="text-xs" style={{ color: primary }}>Batch of {a.batch}</p>
                {a.achievement && <p className="text-xs text-slate-500 mt-1">{a.achievement}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollReveal>
  )
}