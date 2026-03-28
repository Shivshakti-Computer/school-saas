import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Alumni } from '@/models'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const alumni = await Alumni.find({
        tenantId: session.user.tenantId
    }).sort({ batch: -1, name: 1 }).lean()

    return NextResponse.json(alumni)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const data = await req.json()

    const alumni = await Alumni.create({
        ...data,
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
    })

    return NextResponse.json(alumni)
}