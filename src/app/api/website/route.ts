// -------------------------------------------------------------
// FILE: src/app/api/website/route.ts
// GET → school website config fetch karo
// PUT → website config save karo
// -------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'

export async function GET(req: NextRequest) {
    try {
        // Public bhi access kar sakta hai (school website ke liye)
        const hostname = req.headers.get('host') ?? ''
        const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'shivshakticloud.in'
        const subdomain = hostname.replace(`.${appDomain}`, '').replace('www.', '')

        await connectDB()

        let school: any = null

        // Agar admin hai to session se fetch karo
        const session = await getServerSession(authOptions)
        if (session?.user?.role === 'admin') {
            school = await School.findById(session.user.tenantId).lean()
        } else if (subdomain && subdomain !== appDomain && subdomain !== hostname) {
            school = await School.findOne({ subdomain, isActive: true }).lean()
        }

        if (!school) return NextResponse.json({ error: 'School not found' }, { status: 404 })

        return NextResponse.json({
            website: school.website ?? null,
            school: {
                name: school.name,
                address: school.address,
                phone: school.phone,
                email: school.email,
                logo: school.logo,
                theme: school.theme,
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user || session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const { website } = await req.json()

        await School.findByIdAndUpdate(session.user.tenantId, {
            $set: { website },
        })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}