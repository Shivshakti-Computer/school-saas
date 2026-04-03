// FILE: src/app/api/superadmin/announcements/route.ts
// Superadmin only — Create & List announcements
// ═══════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Announcement } from '@/models/Announcement'

async function guardSuperadmin() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'superadmin') return null
  return session
}

// GET — List all
export async function GET(req: NextRequest) {
  if (!await guardSuperadmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

  const filter: any = {}
  if (status) filter.status = status

  const announcements = await Announcement.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return NextResponse.json({ success: true, announcements })
}

// POST — Create new
export async function POST(req: NextRequest) {
  if (!await guardSuperadmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  await connectDB()

  const body = await req.json()
  const { title, summary, content, type, status, isPinned, isBanner, bannerText, bannerColor, expiresAt, tags } = body

  if (!title?.trim() || !summary?.trim() || !content?.trim()) {
    return NextResponse.json(
      { error: 'Title, summary, and content are required' },
      { status: 400 }
    )
  }

  const announcement = await Announcement.create({
    title: title.trim(),
    summary: summary.trim(),
    content: content.trim(),
    type: type || 'general',
    status: status || 'draft',
    isPinned: isPinned || false,
    isBanner: isBanner || false,
    bannerText: bannerText?.trim() || '',
    bannerColor: bannerColor || '#2563EB',
    publishedAt: status === 'published' ? new Date() : undefined,
    expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    tags: Array.isArray(tags) ? tags : [],
  })

  return NextResponse.json({ success: true, announcement })
}