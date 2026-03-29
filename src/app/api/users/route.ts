/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/users/route.ts
   GET  → list users (teachers/staff) for admin
   POST → add teacher/staff
   ─────────────────────────────────────────────────────────── */
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const role = req.nextUrl.searchParams.get('role')

    const query: any = { tenantId: session.user.tenantId }
    if (role) query.role = role

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
        isActive: true,
    })

    const { password: _, ...safeUser } = user.toObject()
    return NextResponse.json({ user: safeUser }, { status: 201 })
}
