// FILE: src/app/api/franchises/route.ts
// Franchise management (Academy/Coaching only)
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard, apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Franchise } from '@/models/Franchise'
import { School } from '@/models/School'
import { Enrollment } from '@/models/Enrollment'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
    })
    if (guard instanceof NextResponse) return guard

    const { session } = guard
    await connectDB()

    // Check institution type
    const school = await School.findById(session.user.tenantId)
        .select('institutionType').lean() as any

    if (!school || school.institutionType === 'school') {
        return NextResponse.json(
            { error: 'Franchises are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    const { searchParams } = req.nextUrl
    const status = searchParams.get('status')
    const city = searchParams.get('city')

    const query: any = { tenantId: session.user.tenantId }
    if (status) query.status = status
    if (city) query.city = city

    const franchises = await Franchise.find(query)
        .populate('managerUserId', 'name phone')
        .populate('allowedCourses', 'name code')
        .sort({ createdAt: -1 })
        .lean()

    // Get current student count per franchise
    const withCounts = await Promise.all(
        franchises.map(async f => {
            const count = await Enrollment.countDocuments({
                tenantId: session.user.tenantId,
                franchiseId: f._id,
                status: 'active',
            })
            return { ...f, currentStudents: count }
        })
    )

    return NextResponse.json({ franchises: withCounts })
}

export async function POST(req: NextRequest) {
    const guard = await apiGuardWithBody(req, {
        allowedRoles: ['admin'],
    })
    if (guard instanceof NextResponse) return guard

    const { session, body } = guard
    await connectDB()

    // Check institution type
    const school = await School.findById(session.user.tenantId)
        .select('institutionType').lean() as any

    if (!school || school.institutionType === 'school') {
        return NextResponse.json(
            { error: 'Franchises are only for academies and coaching institutes' },
            { status: 403 }
        )
    }

    // Validation
    if (!body.franchiseCode || !body.franchiseName || !body.address ||
        !body.city || !body.state || !body.phone || !body.ownerName) {
        return NextResponse.json(
            { error: 'Required fields missing' },
            { status: 400 }
        )
    }

    // Check duplicate code
    const existing = await Franchise.findOne({
        tenantId: session.user.tenantId,
        franchiseCode: body.franchiseCode.toUpperCase(),
    })

    if (existing) {
        return NextResponse.json(
            { error: `Franchise code ${body.franchiseCode} already exists` },
            { status: 409 }
        )
    }

    const franchise = await Franchise.create({
        tenantId: session.user.tenantId,
        franchiseCode: body.franchiseCode.toUpperCase(),
        franchiseName: body.franchiseName,
        address: body.address,
        city: body.city,
        state: body.state,
        pincode: body.pincode,
        landmark: body.landmark,
        mapUrl: body.mapUrl,
        phone: body.phone,
        email: body.email,
        alternatePhone: body.alternatePhone,
        ownerName: body.ownerName,
        ownerPhone: body.ownerPhone,
        ownerEmail: body.ownerEmail,
        managerName: body.managerName,
        managerPhone: body.managerPhone,
        managerEmail: body.managerEmail,
        managerUserId: body.managerUserId,
        startDate: new Date(body.startDate),
        agreementEndDate: body.agreementEndDate ? new Date(body.agreementEndDate) : undefined,
        status: body.status || 'active',
        maxStudents: body.maxStudents,
        currentStudents: 0,
        allowedCourses: body.allowedCourses || [],
        hasOwnBatches: body.hasOwnBatches || false,
        hasOwnFees: body.hasOwnFees || false,
        logo: body.logo,
        description: body.description,
        facilities: body.facilities || [],
        photos: body.photos || [],
        royaltyPercentage: body.royaltyPercentage,
        securityDeposit: body.securityDeposit,
        createdBy: session.user.id,
    })

    return NextResponse.json(
        { franchise, message: 'Franchise created successfully' },
        { status: 201 }
    )
}