// FILE: src/lib/razorpay.ts — School ka Razorpay use karo for fee payment
import Razorpay from 'razorpay'

// Get Razorpay instance for a school
// Decrypt school key and return instance
export async function getSchoolRazorpay(tenantId: string): Promise<Razorpay | null> {
    const { connectDB } = await import('./db')
    const { School } = await import('@/models/School')
    await connectDB()

    const school = await School.findById(tenantId)
        .select('paymentSettings')
        .lean() as any

    const settings = school?.paymentSettings
    if (!settings?.razorpayKeyId || !settings?.razorpayKeySecret) {
        // School ne key set nahi ki — main account use karo
        return new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        })
    }

    // Decrypt secret
    try {
        const { createDecipheriv } = await import('crypto')
        const key = Buffer.from(process.env.ENCRYPTION_KEY ?? 'default-32-char-key-here-12345678', 'utf8').slice(0, 32)
        const [ivHex, encHex] = settings.razorpayKeySecret.split(':')
        const iv = Buffer.from(ivHex, 'hex')
        const enc = Buffer.from(encHex, 'hex')
        const decipher = createDecipheriv('aes-256-cbc', key, iv)
        const secret = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')

        return new Razorpay({
            key_id: settings.razorpayKeyId,
            key_secret: secret,
        })
    } catch {
        // Decryption failed — fallback to main account
        return new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        })
    }
}