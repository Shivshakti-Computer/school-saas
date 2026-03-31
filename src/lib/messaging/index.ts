// FILE: src/lib/messaging/index.ts
// Unified messaging — choose channel, track usage, respect plan limits

import { sendEmail } from './email'
import { sendSMS } from './sms'
import { sendWhatsApp } from './whatsapp'
import { connectDB } from '../db'
import { School } from '@/models/School'
import { getPlan } from '../plans'       // ✅ FIXED: getPlan (not getPlanById)
import type { PlanId } from '../plans'

// ── SMS Usage Tracking Model ──
import mongoose, { Schema } from 'mongoose'

const MessageUsageSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  month: { type: String, required: true },  // '2025-01'
  smsCount: { type: Number, default: 0 },
  emailCount: { type: Number, default: 0 },
  whatsappCount: { type: Number, default: 0 },
}, { timestamps: true })

MessageUsageSchema.index({ tenantId: 1, month: 1 }, { unique: true })

export const MessageUsage = mongoose.models.MessageUsage
  || mongoose.model('MessageUsage', MessageUsageSchema)

// ── Get current month key ──
function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

// ── Check SMS Limit ──
export async function checkSMSLimit(tenantId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  remaining: number
  plan: string
}> {
  await connectDB()

  const school = await School.findById(tenantId).select('plan').lean() as any
  if (!school) return { allowed: false, used: 0, limit: 0, remaining: 0, plan: 'unknown' }

  const plan = getPlan(school.plan as PlanId)            // ✅ FIXED
  const smsLimit = plan.maxSmsPerMonth                   // ✅ FIXED: direct property

  // Unlimited check (-1 = unlimited)
  if (smsLimit === -1) {
    return { allowed: true, used: 0, limit: -1, remaining: -1, plan: school.plan }
  }

  const month = getCurrentMonth()
  const usage = await MessageUsage.findOne({ tenantId, month }).lean() as any

  const used = usage?.smsCount || 0
  const remaining = Math.max(0, smsLimit - used)

  return {
    allowed: used < smsLimit,
    used,
    limit: smsLimit,
    remaining,
    plan: school.plan,
  }
}

// ── Increment Usage Counter ──
async function incrementUsage(
  tenantId: string,
  channel: 'smsCount' | 'emailCount' | 'whatsappCount',
  count: number = 1
) {
  const month = getCurrentMonth()
  await MessageUsage.findOneAndUpdate(
    { tenantId, month },
    { $inc: { [channel]: count } },
    { upsert: true }
  )
}

// ── Unified Send Function ──

export type MessageChannel = 'sms' | 'email' | 'whatsapp'

interface MessageParams {
  tenantId: string
  channel: MessageChannel
  to: string           // phone or email
  subject?: string     // for email
  message: string      // body text
  html?: string        // for email HTML
  templateId?: string  // for SMS/WA template
  templateName?: string // for WA
  templateParams?: Record<string, string>
  skipLimitCheck?: boolean
}

export async function sendMessage(params: MessageParams): Promise<{
  success: boolean
  channel: MessageChannel
  error?: string
  limitReached?: boolean
}> {
  try {
    // ── SMS Limit Check ──
    if (params.channel === 'sms' && !params.skipLimitCheck) {
      const limit = await checkSMSLimit(params.tenantId)
      if (!limit.allowed) {
        return {
          success: false,
          channel: 'sms',
          error: `SMS limit reached (${limit.used}/${limit.limit}). Upgrade your plan.`,
          limitReached: true,
        }
      }
    }

    let result: { success: boolean; error?: string }

    switch (params.channel) {
      case 'email':
        result = await sendEmail({
          to: params.to,
          subject: params.subject || 'Skolify Notification',
          html: params.html || `<p>${params.message}</p>`,
          text: params.message,
        })
        if (result.success) await incrementUsage(params.tenantId, 'emailCount')
        break

      case 'sms':
        result = await sendSMS({
          phone: params.to,
          message: params.message,
          templateId: params.templateId,
        })
        if (result.success) await incrementUsage(params.tenantId, 'smsCount')
        break

      case 'whatsapp':
        result = await sendWhatsApp({
          phone: params.to,
          templateName: params.templateName || 'notification',
          templateParams: params.templateParams || { message: params.message },
        })
        if (result.success) await incrementUsage(params.tenantId, 'whatsappCount')
        break

      default:
        return { success: false, channel: params.channel, error: 'Unknown channel' }
    }

    return { success: result.success, channel: params.channel, error: result.error }
  } catch (err: any) {
    return { success: false, channel: params.channel, error: err.message }
  }
}

// ── Bulk Send (multiple recipients) ──
export async function sendBulkMessage(
  tenantId: string,
  channel: MessageChannel,
  recipients: string[],
  message: string,
  options: Partial<MessageParams> = {}
): Promise<{
  total: number
  sent: number
  failed: number
  errors: string[]
  limitReached: boolean
}> {
  const errors: string[] = []
  let sent = 0
  let limitReached = false

  // Pre-check SMS limit for bulk
  if (channel === 'sms') {
    const limit = await checkSMSLimit(tenantId)
    if (!limit.allowed) {
      return {
        total: recipients.length,
        sent: 0,
        failed: recipients.length,
        errors: [`SMS limit reached (${limit.used}/${limit.limit})`],
        limitReached: true,
      }
    }
    if (limit.remaining !== -1 && recipients.length > limit.remaining) {
      return {
        total: recipients.length,
        sent: 0,
        failed: recipients.length,
        errors: [`Not enough SMS quota. Need ${recipients.length}, have ${limit.remaining}`],
        limitReached: true,
      }
    }
  }

  for (const to of recipients) {
    const result = await sendMessage({
      tenantId,
      channel,
      to,
      message,
      ...options,
      skipLimitCheck: true,
    })

    if (result.success) {
      sent++
    } else {
      errors.push(`${to}: ${result.error}`)
      if (result.limitReached) {
        limitReached = true
        break
      }
    }
  }

  return {
    total: recipients.length,
    sent,
    failed: recipients.length - sent,
    errors,
    limitReached,
  }
}

// ── Pre-built Message Templates ──
export const MESSAGE_TEMPLATES = {
  otp: (otp: string, mins: number = 5) =>
    `Your Skolify login OTP is: ${otp}. Valid for ${mins} minutes. Do not share with anyone.`,

  feeReminder: (studentName: string, amount: string, dueDate: string) =>
    `Dear Parent, fee of Rs.${amount} for ${studentName} is due on ${dueDate}. Please pay on time. - Skolify`,

  absentAlert: (studentName: string, date: string) =>
    `Dear Parent, ${studentName} was marked absent on ${date}. Contact school if this is incorrect. - Skolify`,

  examSchedule: (examName: string, date: string) =>
    `Exam Alert: ${examName} is scheduled on ${date}. Please prepare accordingly. - Skolify`,

  resultPublished: (examName: string, className: string) =>
    `Results for ${examName} (${className}) have been published. Login to Skolify to view. - Skolify`,

  notice: (title: string) =>
    `New Notice: ${title}. Login to Skolify to read the full notice. - Skolify`,

  welcome: (schoolName: string, code: string) =>
    `Welcome to ${schoolName} on Skolify! Your School Code is: ${code}. Use it to login at skolify.in/login`,

  passwordReset: (otp: string) =>
    `Your password reset OTP is: ${otp}. Valid for 10 minutes. If you didn't request this, ignore. - Skolify`,
}