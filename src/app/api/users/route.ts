// FILE: src/app/api/users/route.ts
// UPDATED: Support 'staff' role in queries, backward compatible
// Legacy endpoint — new staff creation should use /api/staff

import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { checkCanAddTeacher } from '@/lib/limitGuard'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'superadmin'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const role = req.nextUrl.searchParams.get('role')

    const query: any = { tenantId: session.user.tenantId }

    if (role) {
        // Support querying multiple roles
        if (role === 'teacher') {
            // When asking for teachers, also include staff for backward compat
            query.role = { $in: ['teacher', 'staff'] }
        } else {
            query.role = role
        }
    }

    const users = await User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .lean()

    return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    // ─── CHECK TEACHER/STAFF LIMIT ───
    if (['teacher', 'staff'].includes(body.role)) {
        const limitCheck = await checkCanAddTeacher(session.user.tenantId)
        if (!limitCheck.allowed) {
            return NextResponse.json({
                error: limitCheck.message,
                limitReached: true,
                current: limitCheck.current,
                limit: limitCheck.limit,
                plan: limitCheck.plan,
            }, { status: 403 })
        }
    }

    // Check duplicate phone
    const existing = await User.findOne({
        tenantId: session.user.tenantId,
        phone: body.phone,
    })
    if (existing) {
        return NextResponse.json({ error: 'Phone already registered' }, { status: 409 })
    }

    const hashedPwd = await bcrypt.hash(body.password || body.phone, 10)

    const user = await User.create({
        tenantId: session.user.tenantId,
        ...body,
        password: hashedPwd,
        allowedModules: body.allowedModules || [],
        isActive: true,
    })

    const { password: _, ...safeUser } = user.toObject()
    return NextResponse.json({ user: safeUser }, { status: 201 })
}