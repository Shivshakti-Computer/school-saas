// FILE: src/app/api/feedback/route.ts
// POST — Public submit (no auth)
// GET  — Public approved reviews
// ═══════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Feedback } from '@/models/Feedback'

// ── Rate limiting (simple IP based) ──
const submissionTracker = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const windowMs = 60 * 60 * 1000 // 1 hour
    const maxPerHour = 3

    const times = (submissionTracker.get(ip) || [])
        .filter(t => now - t < windowMs)

    if (times.length >= maxPerHour) return true

    times.push(now)
    submissionTracker.set(ip, times)
    return false
}

// GET — Public approved reviews
export async function GET(req: NextRequest) {
    try {
        await connectDB()

        const { searchParams } = new URL(req.url)
        const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 50)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const skip = (page - 1) * limit

        const [reviews, total] = await Promise.all([
            Feedback.find({ status: 'approved', isPublic: true })
                .sort({ rating: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select(
                    'schoolName schoolLocation contactName rating title message wouldRecommend type createdAt'
                )
                .lean(),
            Feedback.countDocuments({ status: 'approved', isPublic: true }),
        ])

        // Average rating
        const ratingAgg = await Feedback.aggregate([
            { $match: { status: 'approved', isPublic: true } },
            { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
        ])

        return NextResponse.json({
            success: true,
            reviews,
            total,
            page,
            pages: Math.ceil(total / limit),
            averageRating: ratingAgg[0]?.avg
                ? Math.round(ratingAgg[0].avg * 10) / 10
                : 0,
            totalReviews: ratingAgg[0]?.count ?? 0,
        })
    } catch (err: any) {
        console.error('Feedback GET error:', err)
        return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }
}

// POST — Submit new feedback (public)
export async function POST(req: NextRequest) {
    try {
        await connectDB()

        // IP rate limiting
        const ip =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            'unknown'

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many submissions. Please try again later.' },
                { status: 429 }
            )
        }

        const body = await req.json()

        // Validation
        const { schoolName, contactName, rating, title, message } = body

        if (!schoolName?.trim()) {
            return NextResponse.json({ error: 'School name required' }, { status: 400 })
        }
        if (!contactName?.trim()) {
            return NextResponse.json({ error: 'Your name required' }, { status: 400 })
        }
        if (!rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Valid rating (1-5) required' }, { status: 400 })
        }
        if (!title?.trim() || title.trim().length < 5) {
            return NextResponse.json(
                { error: 'Title must be at least 5 characters' },
                { status: 400 }
            )
        }
        if (!message?.trim() || message.trim().length < 20) {
            return NextResponse.json(
                { error: 'Review must be at least 20 characters' },
                { status: 400 }
            )
        }

        const feedback = await Feedback.create({
            schoolName: schoolName.trim(),
            schoolLocation: body.schoolLocation?.trim() || '',
            contactName: contactName.trim(),
            contactEmail: body.contactEmail?.trim()?.toLowerCase() || '',
            contactPhone: body.contactPhone?.trim() || '',
            type: body.type || 'review',
            rating: parseInt(rating),
            title: title.trim(),
            message: message.trim(),
            wouldRecommend: body.wouldRecommend !== false,
            status: 'pending',
            isPublic: false,
            ipAddress: ip,
            submittedAt: new Date(),
        })

        return NextResponse.json({
            success: true,
            message: 'Review submitted! It will appear after moderation.',
            id: feedback._id,
        })
    } catch (err: any) {
        console.error('Feedback POST error:', err)
        return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
    }
}