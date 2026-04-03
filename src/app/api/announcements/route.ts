// FILE: src/app/api/announcements/route.ts
// PUBLIC — No auth required
// Returns published, non-expired announcements
// ═══════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Announcement } from '@/models/Announcement'

export async function GET(req: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const bannerOnly = searchParams.get('banner') === 'true'
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)

        const now = new Date()

        const filter: any = {
            status: 'published',
            // Expire check — ya to expiresAt nahi hai, ya future mein hai
            $or: [
                { expiresAt: { $exists: false } },
                { expiresAt: null },
                { expiresAt: { $gt: now } },
            ],
        }

        if (bannerOnly) {
            filter.isBanner = true
        }

        const announcements = await Announcement.find(filter)
            .sort({ isPinned: -1, publishedAt: -1 })
            .limit(limit)
            .select('-__v')
            .lean()

        return NextResponse.json({
            success: true,
            announcements,
            count: announcements.length,
        })
    } catch (err: any) {
        console.error('Announcements GET error:', err)
        return NextResponse.json(
            { error: 'Failed to fetch announcements' },
            { status: 500 }
        )
    }
}