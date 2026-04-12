// FILE: src/app/api/communication/count/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { apiGuard } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { Student } from '@/models/Student'

export async function GET(req: NextRequest) {
    const guard = await apiGuard(req, {
        allowedRoles: ['admin', 'staff'],
        requiredModules: ['communication'],
        rateLimit: 'api',
    })

    if (guard instanceof NextResponse) return guard

    await connectDB()

    const { tenantId } = guard.session.user
    const { searchParams } = req.nextUrl

    const recipients = searchParams.get('recipients') as
        'all' | 'class' | 'section' | null
    const targetClass = searchParams.get('class')
    const targetSection = searchParams.get('section')
    const academicYear = searchParams.get('academicYear')
    const recipientType = searchParams.get('recipientType') as
        'parent' | 'student' | null

    // ── Base query ───────────────────────────────────────────
    const query: Record<string, any> = {
        tenantId,
        status: 'active',
    }

    if (academicYear) {
        query.academicYear = academicYear
    }

    if (recipients === 'class' && targetClass) {
        query.class = targetClass
    } else if (
        recipients === 'section' &&
        targetClass &&
        targetSection
    ) {
        query.class = targetClass
        query.section = targetSection
    }

    // ── Total students ───────────────────────────────────────
    const totalStudents = await Student.countDocuments(query)

    // ── Valid contacts count ─────────────────────────────────
    let validContacts = 0

    if (recipientType === 'parent') {
        // ✅ Fix: $nin se empty string + null dono handle
        const contactQuery = {
            ...query,
            parentPhone: {
                $exists: true,
                $nin: ['', null],       // ← ek hi property, array mein dono
            },
        }
        validContacts = await Student.countDocuments(contactQuery)

    } else if (recipientType === 'student') {
        // Student phone User model mein hota hai — populate expensive hai
        // Approximate: total students hi valid maano
        // (exact count chahiye to User join karna padega)
        validContacts = totalStudents

    } else {
        // Default — parent
        const contactQuery = {
            ...query,
            parentPhone: {
                $exists: true,
                $nin: ['', null],
            },
        }
        validContacts = await Student.countDocuments(contactQuery)
    }

    return NextResponse.json({
        success: true,
        totalStudents,
        validContacts,
        estimated: validContacts,
    })
}