// FILE: src/app/api/auth/otp/verify/route.ts
// Verify OTP — returns token for registration

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { OTPVerification } from '@/models/OTPVerification'
import { checkRateLimit, RATE_LIMITS, rateLimitResponse } from '@/lib/security'

const MAX_ATTEMPTS = 5

export async function POST(req: NextRequest) {
    const rl = checkRateLimit(req, RATE_LIMITS.register)
    if (!rl.allowed) return rateLimitResponse(rl.resetIn)

    try {
        await connectDB()

        const body = await req.json()
        const { identifier, otp, purpose = 'registration' } = body

        if (!identifier || !otp) {
            return NextResponse.json(
                { error: 'Identifier and OTP required' },
                { status: 400 }
            )
        }

        // ── Find OTP record ──
        const record = await OTPVerification.findOne({
            phone: identifier,
            purpose,
            verified: false,
        }).sort({ createdAt: -1 })

        if (!record) {
            return NextResponse.json(
                { error: 'OTP not found or already used. Please request a new OTP.' },
                { status: 400 }
            )
        }

        // ── Check expiry ──
        if (new Date() > record.expiresAt) {
            await OTPVerification.findByIdAndDelete(record._id)
            return NextResponse.json(
                { error: 'OTP has expired. Please request a new one.' },
                { status: 400 }
            )
        }

        // ── Check max attempts ──
        if (record.attempts >= MAX_ATTEMPTS) {
            await OTPVerification.findByIdAndDelete(record._id)
            return NextResponse.json(
                { error: 'Too many failed attempts. Please request a new OTP.' },
                { status: 400 }
            )
        }

        // ── Verify OTP ──
        const isMatch = await bcrypt.compare(otp.toString(), record.hashedOTP)

        if (!isMatch) {
            await OTPVerification.findByIdAndUpdate(record._id, {
                $inc: { attempts: 1 },
            })
            const attemptsLeft = MAX_ATTEMPTS - (record.attempts + 1)
            return NextResponse.json(
                {
                    error: `Invalid OTP. ${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} remaining.`,
                    attemptsLeft,
                },
                { status: 400 }
            )
        }

        // ── OTP Correct — Generate verification token ──
        const verificationToken = crypto.randomBytes(32).toString('hex')
        const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000) // 15 min to complete registration

        await OTPVerification.findByIdAndUpdate(record._id, {
            $set: {
                verified: true,
                token: verificationToken,
                expiresAt: tokenExpiry,
            },
        })

        return NextResponse.json({
            success: true,
            verificationToken,
            message: 'Phone verified successfully.',
        })

    } catch (err: any) {
        console.error('[OTP-VERIFY] Error:', err)
        return NextResponse.json(
            { error: 'Verification failed. Please try again.' },
            { status: 500 }
        )
    }
}