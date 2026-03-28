import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { GalleryAlbum } from '@/models'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const albums = await GalleryAlbum.find({
        tenantId: session.user.tenantId
    }).sort({ createdAt: -1 }).lean()

    return NextResponse.json(albums)
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const data = await req.json()

    const album = await GalleryAlbum.create({
        ...data,
        tenantId: session.user.tenantId,
        createdBy: session.user.id,
    })

    return NextResponse.json(album)
}