import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Course } from '@/models/LMS'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { searchParams } = req.nextUrl
    const cls = searchParams.get('class')

    const filter: any = { tenantId: session.user.tenantId }
    if (cls) filter.class = cls
    if (session.user.role === 'teacher') filter.teacherId = session.user.id

    const courses = await Course.find(filter)
        .populate('teacherId', 'name')
        .sort({ createdAt: -1 })
        .lean()

    return NextResponse.json({ courses })
}

export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    const course = await Course.create({
        tenantId: session.user.tenantId,
        title: body.title,
        description: body.description,
        class: body.class,
        subject: body.subject,
        teacherId: session.user.id,
        lessons: body.lessons || [],
        isPublished: false,
    })

    return NextResponse.json({ course }, { status: 201 })
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const { id, action, lesson, ...data } = await req.json()

    if (action === 'addLesson' && lesson) {
        const course = await Course.findOne({ _id: id, tenantId: session.user.tenantId })
        if (!course) return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        const order = (course.lessons?.length || 0) + 1
        await Course.findByIdAndUpdate(id, {
            $push: { lessons: { ...lesson, order } }
        })
        return NextResponse.json({ success: true })
    }

    if (action === 'publish') {
        await Course.findOneAndUpdate(
            { _id: id, tenantId: session.user.tenantId },
            { isPublished: true }
        )
        return NextResponse.json({ success: true })
    }

    const course = await Course.findOneAndUpdate(
        { _id: id, tenantId: session.user.tenantId },
        data,
        { new: true }
    )

    return NextResponse.json({ course })
}