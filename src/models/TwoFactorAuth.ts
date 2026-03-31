// FILE: src/models/TwoFactorAuth.ts
// Stores 2FA settings and OTP for school admins

import mongoose, { Schema, Document } from 'mongoose'

export interface ITwoFactorAuth extends Document {
  userId: mongoose.Types.ObjectId
  tenantId: mongoose.Types.ObjectId
  isEnabled: boolean
  method: 'otp_phone' | 'otp_email' | 'authenticator'
  // OTP based
  otpCode?: string
  otpExpiresAt?: Date
  otpAttempts: number
  maxOtpAttempts: number
  // Authenticator based (future)
  authenticatorSecret?: string
  // Backup codes
  backupCodes: Array<{
    code: string
    used: boolean
    usedAt?: Date
  }>
  // Trusted devices
  trustedDevices: Array<{
    deviceId: string
    deviceName: string
    lastUsed: Date
    expiresAt: Date
  }>
  lastVerifiedAt?: Date
  createdAt: Date
  updatedAt: Date
}

const TwoFactorAuthSchema = new Schema<ITwoFactorAuth>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  isEnabled: { type: Boolean, default: false },
  method: {
    type: String,
    enum: ['otp_phone', 'otp_email', 'authenticator'],
    default: 'otp_phone',
  },
  otpCode: { type: String },
  otpExpiresAt: { type: Date },
  otpAttempts: { type: Number, default: 0 },
  maxOtpAttempts: { type: Number, default: 5 },
  authenticatorSecret: { type: String },
  backupCodes: [{
    code: { type: String, required: true },
    used: { type: Boolean, default: false },
    usedAt: { type: Date },
  }],
  trustedDevices: [{
    deviceId: { type: String, required: true },
    deviceName: { type: String, default: 'Unknown Device' },
    lastUsed: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  }],
  lastVerifiedAt: { type: Date },
}, { timestamps: true })

export const TwoFactorAuth = mongoose.models.TwoFactorAuth
  || mongoose.model<ITwoFactorAuth>('TwoFactorAuth', TwoFactorAuthSchema)