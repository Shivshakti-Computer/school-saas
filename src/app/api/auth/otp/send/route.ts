// FILE: src/app/api/auth/otp/send/route.ts
// Send OTP — Registration phone/email verification

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { OTPVerification } from '@/models/OTPVerification'
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/security'
import { msg91SendOTP } from '@/lib/msg91'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'

const OTP_EXPIRY_MINUTES = 10
const MAX_RESEND_PER_HOUR = 3

export async function POST(req: NextRequest) {
    // Rate limit
    const rl = checkRateLimit(req, RATE_LIMITS.register)
    if (!rl.allowed) return rateLimitResponse(rl.resetIn)

    try {
        await connectDB()

        const body = await req.json()
        const { phone, email, channel } = body
        // channel: 'sms' | 'email'

        // ── Validate ──
        if (channel === 'sms') {
            if (!phone) {
                return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
            }
            const cleanPhone = phone.replace(/[^0-9]/g, '')
            if (cleanPhone.length !== 10) {
                return NextResponse.json({ error: 'Valid 10-digit phone required' }, { status: 400 })
            }
        } else if (channel === 'email') {
            if (!email) {
                return NextResponse.json({ error: 'Email required' }, { status: 400 })
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(email)) {
                return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
            }
        } else {
            return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
        }

        const identifier = channel === 'sms'
            ? phone.replace(/[^0-9]/g, '')
            : email.toLowerCase().trim()

        // ── Check resend limit (3 per hour) ──
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
        const recentCount = await OTPVerification.countDocuments({
            phone: identifier,
            purpose: 'registration',
            createdAt: { $gte: oneHourAgo },
        })

        if (recentCount >= MAX_RESEND_PER_HOUR) {
            return NextResponse.json(
                { error: 'Too many OTP requests. Please wait 1 hour before trying again.' },
                { status: 429 }
            )
        }

        // ── Generate OTP ──
        const otp = Math.floor(100000 + Math.random() * 900000).toString()
        const hashedOTP = await bcrypt.hash(otp, 10)
        const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

        // ── Delete old OTPs for this identifier ──
        await OTPVerification.deleteMany({
            phone: identifier,
            purpose: 'registration',
            verified: false,
        })

        // ── Save new OTP ──
        await OTPVerification.create({
            phone: identifier,
            hashedOTP,
            purpose: 'registration',
            attempts: 0,
            verified: false,
            token: '',
            expiresAt,
        })

        // ── Send OTP ──
        let sendResult: { success: boolean; error?: string }

        if (channel === 'sms') {
            sendResult = await msg91SendOTP(identifier, otp)
        } else {
            const { subject, html } = EMAIL_TEMPLATES.otpVerification(otp, 'registration')
            sendResult = await sendEmail(email.toLowerCase().trim(), subject, html)
        }

        if (!sendResult.success) {
            console.error('[OTP-SEND] Failed:', sendResult.error)
            // Dev mode mein success true aata hai toh production mein hi fail hoga
            return NextResponse.json(
                { error: 'Failed to send OTP. Please try again.' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            message: channel === 'sms'
                ? `OTP sent to ${identifier.slice(0, 2)}XXXXXXXX${identifier.slice(-2)}`
                : `OTP sent to ${email.slice(0, 3)}***${email.slice(email.indexOf('@'))}`,
            expiresIn: OTP_EXPIRY_MINUTES * 60,
        })

    } catch (err: any) {
        console.error('[OTP-SEND] Error:', err)
        return NextResponse.json(
            { error: 'Something went wrong. Please try again.' },
            { status: 500 }
        )
    }
}