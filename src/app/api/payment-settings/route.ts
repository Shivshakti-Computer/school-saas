import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'


export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()
    const school = await School.findById(session.user.tenantId)
        .select('paymentSettings')
        .lean() as any

    // Mask the secret key
    const settings = school?.paymentSettings ?? {}
    return NextResponse.json({
        settings: {
            ...settings,
            razorpayKeySecret: settings.razorpayKeySecret ? '••••••••' : '',
            hasKey: Boolean(settings.razorpayKeyId),
            enableOnlinePayment: settings.enableOnlinePayment ?? false,
        }
    })
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    await connectDB()
    const { razorpayKeyId, razorpayKeySecret, enableOnlinePayment } = await req.json()

    const update: any = {
        'paymentSettings.enableOnlinePayment': enableOnlinePayment,
    }
    if (razorpayKeyId) update['paymentSettings.razorpayKeyId'] = razorpayKeyId
    if (razorpayKeySecret && !razorpayKeySecret.includes('•')) {
        // Simple encryption — in production use proper encryption (crypto module)
        const { createCipheriv, randomBytes } = await import('crypto')
        const key = Buffer.from(process.env.ENCRYPTION_KEY ?? 'default-32-char-key-here-12345678', 'utf8').slice(0, 32)
        const iv = randomBytes(16)
        const cipher = createCipheriv('aes-256-cbc', key, iv)
        const encrypted = Buffer.concat([cipher.update(razorpayKeySecret, 'utf8'), cipher.final()])
        update['paymentSettings.razorpayKeySecret'] = iv.toString('hex') + ':' + encrypted.toString('hex')
    }

    await School.findByIdAndUpdate(session.user.tenantId, { $set: update })
    return NextResponse.json({ success: true })
}