// FILE: src/app/api/users/[id]/route.ts
// Single user operations: Get, Update, Delete
// Used for legacy teacher management + general user ops

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import { sanitizeBody, getClientInfo } from '@/lib/security'
import { logDataChange } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'superadmin'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const user = await User.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    }).select('-password').lean()

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'superadmin'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const clientInfo = getClientInfo(req)

    let body: any
    try {
        const raw = await req.json()
        body = sanitizeBody(raw)
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const user = await User.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent modifying own admin account (safety)
    if (user._id.toString() === session.user.id && body.role && body.role !== 'admin') {
        return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })
    }

    const previousData = { name: user.name, role: user.role, isActive: user.isActive }

    // Updatable fields
    const allowedFields = ['name', 'email', 'isActive', 'subjects', 'class', 'section', 'allowedModules']
    for (const field of allowedFields) {
        if (body[field] !== undefined) {
            (user as any)[field] = body[field]
        }
    }

    // Password change
    if (body.password) {
        user.password = await bcrypt.hash(body.password, 10)
    }

    await user.save()

    await logDataChange(
        'UPDATE', 'User', id,
        `Updated user: ${user.name}`,
        session, clientInfo.ip,
        previousData, body
    )

    const { password: _, ...safeUser } = user.toObject()
    return NextResponse.json({ user: safeUser })
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const clientInfo = getClientInfo(req)

    // Prevent self-delete
    if (id === session.user.id) {
        return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    const user = await User.findOne({
        _id: id,
        tenantId: session.user.tenantId,
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Soft delete — deactivate
    user.isActive = false
    await user.save()

    await logDataChange(
        'DELETE', 'User', id,
        `Deactivated user: ${user.name} (${user.role})`,
        session, clientInfo.ip
    )

    return NextResponse.json({ message: `User "${user.name}" deactivated` })
}