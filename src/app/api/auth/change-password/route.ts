// -------------------------------------------------------------
// FILE: src/app/api/auth/change-password/route.ts
// PUT → koi bhi user apna password change kare
// -------------------------------------------------------------
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { User } from '@/models/User'
import bcrypt from 'bcryptjs'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function PUT(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        await connectDB()
        const { currentPassword, newPassword } = await req.json()

        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: 'Both passwords required' }, { status: 400 })
        }
        if (newPassword.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
        }

        const user = await User.findById(session.user.id)
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

        const match = await bcrypt.compare(currentPassword, user.password)
        if (!match) return NextResponse.json({ error: 'Current password is wrong' }, { status: 400 })

        await User.findByIdAndUpdate(user._id, {
            password: await bcrypt.hash(newPassword, 10),
        })

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
