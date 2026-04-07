// FILE: src/models/OTPVerification.ts
// Temporary OTP store for registration phone verification
// Auto-delete after expiry (TTL index)

import mongoose, { Schema, Document } from 'mongoose'

export interface IOTPVerification extends Document {
  phone: string          // Jis phone pe OTP gaya
  hashedOTP: string      // bcrypt hashed OTP
  purpose: 'registration' | 'password_reset' | 'login'
  attempts: number       // Kitni baar galat daala
  verified: boolean      // Verify ho gaya?
  token: string          // Frontend ko denge verify ke baad
  expiresAt: Date
  createdAt: Date
}

const OTPVerificationSchema = new Schema<IOTPVerification>({
  phone: {
    type: String,
    required: true,
    index: true,
  },
  hashedOTP: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['registration', 'password_reset', 'login'],
    default: 'registration',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  // Verify hone ke baad register API ko proof denge
  token: {
    type: String,
    default: '',
  },
  expiresAt: {
    type: Date,
    required: true,
  },
}, { timestamps: true })

// Auto-delete after expiry — MongoDB TTL index
OTPVerificationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0 }
)

// Phone + purpose combo index
OTPVerificationSchema.index({ phone: 1, purpose: 1 })

export const OTPVerification =
  mongoose.models.OTPVerification ||
  mongoose.model<IOTPVerification>('OTPVerification', OTPVerificationSchema)