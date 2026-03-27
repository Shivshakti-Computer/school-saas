// =============================================================
// FILE: src/app/api/manifest/route.ts — Dynamic PWA manifest
// Per-school, per-role manifest
// =============================================================
 
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { School }    from '@/models/School'
 
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const subdomain = searchParams.get('s')   // school subdomain
  const role      = searchParams.get('r') ?? 'admin'
 
  await connectDB()
 
  let schoolName = 'School'
  let themeColor = '#4F46E5'
 
  if (subdomain) {
    const school = await School.findOne({ subdomain }).select('name website').lean() as any
    if (school) {
      schoolName = school.name
      themeColor = school.website?.primaryColor ?? '#4F46E5'
    }
  }
 
  const roleLabels: Record<string, string> = {
    admin:   'Admin Panel',
    teacher: 'Teacher App',
    student: 'Student Portal',
    parent:  'Parent App',
  }
 
  const roleStarts: Record<string, string> = {
    admin:   '/admin',
    teacher: '/teacher',
    student: '/student',
    parent:  '/parent',
  }
 
  const manifest = {
    name:             `${schoolName} — ${roleLabels[role] ?? 'Portal'}`,
    short_name:       schoolName.slice(0, 12),
    description:      `${schoolName} school management portal`,
    start_url:        roleStarts[role] ?? '/',
    display:          'standalone',
    background_color: '#0A0F1E',
    theme_color:      themeColor,
    orientation:      'portrait-primary',
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
    screenshots: [],
    categories:  ['education', 'productivity'],
    lang:        'en-IN',
  }
 
  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
 