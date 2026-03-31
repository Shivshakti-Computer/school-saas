// FILE: src/lib/twoFactor.ts
// 2FA business logic — OTP generation, verification, trusted devices
// ✅ All TypeScript errors fixed

import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { connectDB } from './db'
import { TwoFactorAuth } from '@/models/TwoFactorAuth'
import { generateOTP } from './security'

const OTP_EXPIRY_MINUTES = 5
const TRUSTED_DEVICE_DAYS = 30
const MAX_OTP_ATTEMPTS = 5

/* ══════════════════════════════════════════════════════════
   1. CHECK IF USER HAS 2FA ENABLED
══════════════════════════════════════════════════════════ */

export async function is2FAEnabled(userId: string): Promise<boolean> {
  await connectDB()
  const tfa = await TwoFactorAuth.findOne({ userId, isEnabled: true }).lean()
  return Boolean(tfa)
}

/* ══════════════════════════════════════════════════════════
   2. CHECK IF DEVICE IS TRUSTED (skip 2FA if trusted)
══════════════════════════════════════════════════════════ */

export async function isTrustedDevice(userId: string, deviceId: string): Promise<boolean> {
  await connectDB()
  const tfa = await TwoFactorAuth.findOne({ userId, isEnabled: true }).lean() as any
  if (!tfa) return false

  const now = new Date()
  const trusted = (tfa.trustedDevices || []).find(
    (d: any) => d.deviceId === deviceId && new Date(d.expiresAt) > now
  )
  return Boolean(trusted)
}

/* ══════════════════════════════════════════════════════════
   3. GENERATE & SEND OTP
══════════════════════════════════════════════════════════ */

export async function generateAndSendOTP(
  userId: string,
  tenantId: string,
  method: 'otp_phone' | 'otp_email' = 'otp_phone',
  destination: string
): Promise<{ success: boolean; message: string; expiresIn: number }> {
  await connectDB()

  const otp = generateOTP(6)
  const hashedOtp = await bcrypt.hash(otp, 8)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000)

  // Upsert 2FA record with OTP
  await TwoFactorAuth.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        tenantId,
        otpCode: hashedOtp,
        otpExpiresAt: expiresAt,
        otpAttempts: 0,
      },
    },
    { upsert: true, new: true }
  )

  // ── Send OTP ──
  try {
    if (method === 'otp_phone') {
      // In production: use MSG91
      // await sendSMS({ phone: destination, message: `Your Skolify OTP: ${otp}`, templateId: 'xxx' })
      console.log(`\n🔑 [2FA OTP] Phone: ${destination} → OTP: ${otp}\n`)
    } else if (method === 'otp_email') {
      // In production: use Resend
      // await sendEmail({ to: destination, subject: 'Skolify Login OTP', html: `<p>Your OTP: <b>${otp}</b></p>` })
      console.log(`\n🔑 [2FA OTP] Email: ${destination} → OTP: ${otp}\n`)
    }
  } catch (err) {
    console.error('OTP send error:', err)
    return { success: false, message: 'Failed to send OTP', expiresIn: 0 }
  }

  return {
    success: true,
    message: `OTP sent to ${method === 'otp_phone' ? 'phone' : 'email'}`,
    expiresIn: OTP_EXPIRY_MINUTES * 60,
  }
}

/* ══════════════════════════════════════════════════════════
   4. VERIFY OTP
══════════════════════════════════════════════════════════ */

export async function verifyOTP(
  userId: string,
  inputOtp: string
): Promise<{ verified: boolean; message: string }> {
  await connectDB()

  const tfa = await TwoFactorAuth.findOne({ userId })
  if (!tfa || !tfa.otpCode) {
    return { verified: false, message: 'No OTP found. Please request a new one.' }
  }

  // Check expiry
  if (tfa.otpExpiresAt && new Date() > new Date(tfa.otpExpiresAt)) {
    // ✅ FIXED: Use $set and $unset instead of setting undefined
    await TwoFactorAuth.findByIdAndUpdate(tfa._id, {
      $unset: { otpCode: 1, otpExpiresAt: 1 },
      $set: { otpAttempts: 0 },
    })
    return { verified: false, message: 'OTP has expired. Please request a new one.' }
  }

  // Check max attempts
  if (tfa.otpAttempts >= MAX_OTP_ATTEMPTS) {
    await TwoFactorAuth.findByIdAndUpdate(tfa._id, {
      $unset: { otpCode: 1, otpExpiresAt: 1 },
      $set: { otpAttempts: 0 },
    })
    return { verified: false, message: 'Too many failed attempts. Please request a new OTP.' }
  }

  // Verify OTP
  const isMatch = await bcrypt.compare(inputOtp, tfa.otpCode)

  if (!isMatch) {
    // ✅ FIXED: Use findByIdAndUpdate instead of direct mutation
    await TwoFactorAuth.findByIdAndUpdate(tfa._id, {
      $inc: { otpAttempts: 1 },
    })
    const attemptsLeft = MAX_OTP_ATTEMPTS - (tfa.otpAttempts + 1)
    return {
      verified: false,
      message: `Invalid OTP. ${attemptsLeft} attempts remaining.`,
    }
  }

  // ✅ OTP verified — clean up
  await TwoFactorAuth.findByIdAndUpdate(tfa._id, {
    $unset: { otpCode: 1, otpExpiresAt: 1 },
    $set: { otpAttempts: 0, lastVerifiedAt: new Date() },
  })

  return { verified: true, message: 'OTP verified successfully.' }
}

/* ══════════════════════════════════════════════════════════
   5. VERIFY BACKUP CODE
══════════════════════════════════════════════════════════ */

export async function verifyBackupCode(
  userId: string,
  inputCode: string
): Promise<{ verified: boolean; message: string; remainingCodes: number }> {
  await connectDB()

  const tfa = await TwoFactorAuth.findOne({ userId })
  if (!tfa) {
    return { verified: false, message: '2FA not found', remainingCodes: 0 }
  }

  const codeIndex = tfa.backupCodes.findIndex(
    (c) => !c.used && c.code === inputCode.trim().toUpperCase()
  )

  if (codeIndex === -1) {
    return { verified: false, message: 'Invalid backup code', remainingCodes: 0 }
  }

  // ✅ FIXED: Use positional operator for array update
  await TwoFactorAuth.findOneAndUpdate(
    { _id: tfa._id, 'backupCodes.code': inputCode.trim().toUpperCase() },
    {
      $set: {
        [`backupCodes.${codeIndex}.used`]: true,
        [`backupCodes.${codeIndex}.usedAt`]: new Date(),
        lastVerifiedAt: new Date(),
      },
    }
  )

  const remaining = tfa.backupCodes.filter((c, i) => !c.used && i !== codeIndex).length

  return { verified: true, message: 'Backup code accepted', remainingCodes: remaining }
}

/* ══════════════════════════════════════════════════════════
   6. ADD TRUSTED DEVICE
══════════════════════════════════════════════════════════ */

export async function addTrustedDevice(
  userId: string,
  deviceName: string
): Promise<string> {
  await connectDB()

  const deviceId = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + TRUSTED_DEVICE_DAYS * 24 * 60 * 60 * 1000)

  await TwoFactorAuth.findOneAndUpdate(
    { userId },
    {
      $push: {
        trustedDevices: {
          deviceId,
          deviceName: deviceName || 'Unknown Device',
          lastUsed: new Date(),
          expiresAt,
        },
      },
    }
  )

  return deviceId
}

/* ══════════════════════════════════════════════════════════
   7. ENABLE 2FA
══════════════════════════════════════════════════════════ */

export async function enable2FA(
  userId: string,
  tenantId: string,
  method: 'otp_phone' | 'otp_email' = 'otp_phone'
): Promise<{ backupCodes: string[] }> {
  await connectDB()

  // Generate 8 backup codes
  const backupCodes: string[] = []
  const hashedCodes: Array<{ code: string; used: boolean }> = []

  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    backupCodes.push(code)
    hashedCodes.push({ code, used: false })
  }

  await TwoFactorAuth.findOneAndUpdate(
    { userId },
    {
      $set: {
        userId,
        tenantId,
        isEnabled: true,
        method,
        backupCodes: hashedCodes,
        trustedDevices: [],
      },
    },
    { upsert: true, new: true }
  )

  return { backupCodes }
}

/* ══════════════════════════════════════════════════════════
   8. DISABLE 2FA
══════════════════════════════════════════════════════════ */

export async function disable2FA(userId: string): Promise<boolean> {
  await connectDB()

  await TwoFactorAuth.findOneAndUpdate(
    { userId },
    {
      $set: {
        isEnabled: false,
        otpAttempts: 0,
        backupCodes: [],
        trustedDevices: [],
      },
      $unset: {
        otpCode: 1,
        otpExpiresAt: 1,
      },
    }
  )

  return true
}

/* ══════════════════════════════════════════════════════════
   9. GET 2FA STATUS (for admin settings page)
══════════════════════════════════════════════════════════ */

export async function get2FAStatus(userId: string): Promise<{
  enabled: boolean
  method: string
  backupCodesRemaining: number
  trustedDevicesCount: number
  lastVerifiedAt: string | null
}> {
  await connectDB()

  const tfa = await TwoFactorAuth.findOne({ userId }).lean() as any

  if (!tfa) {
    return {
      enabled: false,
      method: 'otp_phone',
      backupCodesRemaining: 0,
      trustedDevicesCount: 0,
      lastVerifiedAt: null,
    }
  }

  const now = new Date()
  const activeDevices = (tfa.trustedDevices || []).filter(
    (d: any) => new Date(d.expiresAt) > now
  )
  const unusedCodes = (tfa.backupCodes || []).filter((c: any) => !c.used)

  return {
    enabled: tfa.isEnabled || false,
    method: tfa.method || 'otp_phone',
    backupCodesRemaining: unusedCodes.length,
    trustedDevicesCount: activeDevices.length,
    lastVerifiedAt: tfa.lastVerifiedAt
      ? new Date(tfa.lastVerifiedAt).toISOString()
      : null,
  }
}

/* ══════════════════════════════════════════════════════════
   10. REMOVE TRUSTED DEVICE
══════════════════════════════════════════════════════════ */

export async function removeTrustedDevice(
  userId: string,
  deviceId: string
): Promise<boolean> {
  await connectDB()

  const result = await TwoFactorAuth.findOneAndUpdate(
    { userId },
    {
      $pull: {
        trustedDevices: { deviceId },
      },
    }
  )

  return Boolean(result)
}

/* ══════════════════════════════════════════════════════════
   11. REGENERATE BACKUP CODES
══════════════════════════════════════════════════════════ */

export async function regenerateBackupCodes(
  userId: string
): Promise<{ backupCodes: string[] } | null> {
  await connectDB()

  const tfa = await TwoFactorAuth.findOne({ userId, isEnabled: true })
  if (!tfa) return null

  const backupCodes: string[] = []
  const hashedCodes: Array<{ code: string; used: boolean }> = []

  for (let i = 0; i < 8; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    backupCodes.push(code)
    hashedCodes.push({ code, used: false })
  }

  await TwoFactorAuth.findByIdAndUpdate(tfa._id, {
    $set: { backupCodes: hashedCodes },
  })

  return { backupCodes }
}