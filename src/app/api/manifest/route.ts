// =============================================================
// FILE: src/app/api/manifest/route.ts
// Dynamic manifest — har school ka apna app name + color
//
// Kaise kaam karta hai:
// 1. Browser /api/manifest request karta hai
// 2. Hum Host header se subdomain nikalte hain
// 3. DB se school ka naam + theme color lete hain
// 4. Fresh JSON return karte hain
// =============================================================
 
import { NextRequest, NextResponse } from 'next/server'
import { connectDB }  from '@/lib/db'
import { School }     from '@/models/School'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
 
export async function GET(req: NextRequest) {
  try {
    await connectDB()
 
    // ── Subdomain nikalo ──────────────────────────────────
    // 2 jagah se aa sakta hai:
    // 1. Host header se (production: stmarys.vidyaflow.in)
    // 2. Query param se (dev fallback: /api/manifest?s=stmarys)
    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vidyaflow.in'
    const host      = req.headers.get('host') ?? ''
    const qSubdomain = req.nextUrl.searchParams.get('s')
 
    let subdomain = qSubdomain ?? ''
 
    if (!subdomain && host) {
      // "stmarys.vidyaflow.in" → "stmarys"
      const parts = host.split('.')
      if (parts.length >= 3) {
        subdomain = parts[0]   // first part is subdomain
      } else if (host.includes('localhost')) {
        // "demo.localhost:3000" → "demo"
        subdomain = host.split('.')[0]
      }
    }
 
    // ── School DB se fetch karo ───────────────────────────
    let schoolName  = 'School Portal'
    let themeColor  = '#4F46E5'
    let logoUrl     = ''
 
    if (subdomain && subdomain !== 'www' && subdomain !== appDomain) {
      const school = await School.findOne({
        subdomain,
        isActive: true,
      })
        .select('name website logo')
        .lean() as any
 
      if (school) {
        schoolName = school.name
        themeColor = school.website?.primaryColor ?? '#4F46E5'
        logoUrl    = school.logo ?? ''
      }
    }
 
    // ── Role-based start_url ──────────────────────────────
    // Session se role nikalo (logged in user ke liye)
    // Agar session nahi hai (pehli baar install) to /login
    let startUrl   = '/login'
    let appSuffix  = 'Portal'
 
    try {
      const session = await getServerSession(authOptions)
      if (session?.user) {
        const role = session.user.role
        const roleMap: Record<string, { url: string; label: string }> = {
          admin:   { url: '/admin',   label: 'Admin Panel' },
          teacher: { url: '/teacher', label: 'Teacher App' },
          student: { url: '/student', label: 'Student Portal' },
          parent:  { url: '/parent',  label: 'Parent App' },
        }
        startUrl  = roleMap[role]?.url   ?? '/login'
        appSuffix = roleMap[role]?.label ?? 'Portal'
      }
    } catch {
      // Session error — use defaults
    }
 
    // ── Icons ─────────────────────────────────────────────
    // School ka logo use karo agar hai, warna default icons
    const icons = logoUrl
      ? [
          { src: logoUrl,                    sizes: 'any',    type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-192x192.png',  sizes: '192x192',type: 'image/png', purpose: 'maskable' },
          { src: '/icons/icon-512x512.png',  sizes: '512x512',type: 'image/png', purpose: 'maskable' },
        ]
      : [
          { src: '/icons/icon-192x192.png',  sizes: '192x192',type: 'image/png', purpose: 'any maskable' },
          { src: '/icons/icon-512x512.png',  sizes: '512x512',type: 'image/png', purpose: 'any maskable' },
        ]
 
    // ── Manifest object ───────────────────────────────────
    const manifest = {
      name:             `${schoolName} — ${appSuffix}`,
      short_name:       schoolName.length > 14
        ? schoolName.slice(0, 12) + '…'
        : schoolName,
      description:      `${schoolName} school management portal`,
      start_url:        startUrl,
      scope:            '/',
      display:          'standalone',
      background_color: '#0A0F1E',
      theme_color:      themeColor,
      orientation:      'portrait-primary',
      lang:             'en-IN',
      icons,
      categories:       ['education', 'productivity'],
      // shortcuts — home screen long-press pe quick actions
      shortcuts: [
        {
          name:       'Attendance',
          url:        startUrl.includes('admin')   ? '/admin/attendance'  :
                      startUrl.includes('teacher') ? '/teacher/attendance':
                      startUrl.includes('student') ? '/student/attendance':
                      '/parent/attendance',
          icons:      [{ src: '/icons/shortcut-attendance.png', sizes: '96x96' }],
        },
      ],
    }
 
    return NextResponse.json(manifest, {
      headers: {
        'Content-Type':  'application/manifest+json',
        // Short cache — school name change hone pe reflect ho
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    })
 
  } catch (err: any) {
    console.error('Manifest error:', err)
    // Fallback manifest
    return NextResponse.json({
      name:        'School Suite',
      short_name:  'School',
      start_url:   '/login',
      display:     'standalone',
      theme_color: '#4F46E5',
      icons: [
        { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    }, {
      headers: { 'Content-Type': 'application/manifest+json' },
    })
  }
}