// =============================================================
// FILE: src/lib/messaging.ts
// Unified messaging — uses email.ts, sms.ts, whatsapp.ts
// Handles limits, usage tracking, bulk send
// =============================================================
import mongoose, { Schema } from 'mongoose'
import { sendEmail } from './email'
import { sendSMS } from './sms'
import { connectDB } from './db'
import { School } from '@/models/School'
import { getPlan, TRIAL_CONFIG } from './plans'
import type { PlanId } from './plans'
import { sendWhatsApp } from './whatsapp'

// ─── MessageUsage Model ───
const MessageUsageSchema = new Schema({
  tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
  month: { type: String, required: true },
  smsCount: { type: Number, default: 0 },
  emailCount: { type: Number, default: 0 },
  whatsappCount: { type: Number, default: 0 },
}, { timestamps: true })

MessageUsageSchema.index({ tenantId: 1, month: 1 }, { unique: true })

export const MessageUsage = mongoose.models.MessageUsage
  || mongoose.model('MessageUsage', MessageUsageSchema)

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export type MessageChannel = 'sms' | 'email' | 'whatsapp'

// ─── Check limit ───
export async function checkMessageLimit(
  tenantId: string,
  channel: MessageChannel
): Promise<{
  allowed: boolean
  used: number
  limit: number
  remaining: number
  plan: string
}> {
  await connectDB()

  const school = await School.findById(tenantId)
    .select('plan subscriptionId trialEndsAt')
    .lean() as any

  if (!school) return { allowed: false, used: 0, limit: 0, remaining: 0, plan: 'unknown' }

  const now = new Date()
  const isPaid = Boolean(school.subscriptionId)
  const isInTrial = !isPaid && new Date(school.trialEndsAt) > now
  const plan = getPlan(school.plan as PlanId)

  let channelLimit: number
  let usageField: string

  switch (channel) {
    case 'sms':
      channelLimit = isInTrial ? TRIAL_CONFIG.maxSmsPerMonth : plan.maxSmsPerMonth
      usageField = 'smsCount'
      break
    case 'email':
      channelLimit = isInTrial ? 500 : plan.maxEmailPerMonth
      usageField = 'emailCount'
      break
    case 'whatsapp':
      channelLimit = isInTrial ? 100 : plan.maxWhatsappPerMonth
      usageField = 'whatsappCount'
      break
  }

  if (channelLimit === -1) {
    return { allowed: true, used: 0, limit: -1, remaining: -1, plan: school.plan }
  }

  const month = getCurrentMonth()
  const usage = await MessageUsage.findOne({ tenantId, month }).lean() as any
  const used = usage?.[usageField] || 0

  return {
    allowed: used < channelLimit,
    used,
    limit: channelLimit,
    remaining: Math.max(0, channelLimit - used),
    plan: school.plan,
  }
}

export async function checkSMSLimit(tenantId: string) {
  return checkMessageLimit(tenantId, 'sms')
}

// ─── Increment usage ───
async function incrementUsage(
  tenantId: string,
  field: 'smsCount' | 'emailCount' | 'whatsappCount',
  count: number = 1
) {
  const month = getCurrentMonth()
  await MessageUsage.findOneAndUpdate(
    { tenantId, month },
    { $inc: { [field]: count } },
    { upsert: true }
  )
}

// ─── Send single message ───
interface SendOptions {
  tenantId: string
  channel: MessageChannel
  to: string
  subject?: string
  message: string
  html?: string
  templateName?: string
  templateParams?: Record<string, string>
  skipLimitCheck?: boolean
}

export async function sendMessage(params: SendOptions): Promise<{
  success: boolean
  channel: MessageChannel
  error?: string
  limitReached?: boolean
}> {
  try {
    if (!params.skipLimitCheck) {
      const limit = await checkMessageLimit(params.tenantId, params.channel)
      if (!limit.allowed) {
        return {
          success: false,
          channel: params.channel,
          error: `${params.channel.toUpperCase()} limit reached (${limit.used}/${limit.limit}). Upgrade your plan.`,
          limitReached: true,
        }
      }
    }

    let result: { success: boolean; error?: string }

    switch (params.channel) {
      case 'email':
        result = await sendEmail(
          params.to,
          params.subject || 'Skolify Notification',
          params.html || `<p>${params.message}</p>`
        )
        if (result.success) await incrementUsage(params.tenantId, 'emailCount')
        break

      case 'sms':
        result = await sendSMS(params.to, params.message)
        if (result.success) await incrementUsage(params.tenantId, 'smsCount')
        break

      case 'whatsapp':
        result = await sendWhatsApp(
          params.to,
          params.message,
          params.templateName,
          params.templateParams
        )
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

// ─── Bulk send ───
export async function sendBulkMessage(
  tenantId: string,
  channel: MessageChannel,
  recipients: string[],
  message: string,
  options: Partial<SendOptions> = {}
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

  const limit = await checkMessageLimit(tenantId, channel)
  if (!limit.allowed) {
    return {
      total: recipients.length, sent: 0, failed: recipients.length,
      errors: [`${channel.toUpperCase()} limit reached (${limit.used}/${limit.limit})`],
      limitReached: true,
    }
  }

  if (limit.remaining !== -1 && recipients.length > limit.remaining) {
    return {
      total: recipients.length, sent: 0, failed: recipients.length,
      errors: [`Not enough ${channel.toUpperCase()} quota. Need ${recipients.length}, have ${limit.remaining}`],
      limitReached: true,
    }
  }

  for (const to of recipients) {
    const result = await sendMessage({
      tenantId, channel, to, message,
      ...options,
      skipLimitCheck: true,
    })
    if (result.success) {
      sent++
    } else {
      errors.push(`${to}: ${result.error}`)
      if (result.limitReached) { limitReached = true; break }
    }
  }

  return { total: recipients.length, sent, failed: recipients.length - sent, errors, limitReached }
}

// ─── Message Templates (SMS/WhatsApp text) ───
export const MESSAGE_TEMPLATES = {
  otp: (otp: string, mins: number = 5) =>
    `Your Skolify login OTP is: ${otp}. Valid for ${mins} minutes. Do not share with anyone.`,

  feeReminder: (studentName: string, amount: string, dueDate: string) =>
    `Dear Parent, fee of Rs.${amount} for ${studentName} is due on ${dueDate}. Please pay on time. - Skolify`,

  absentAlert: (studentName: string, date: string) =>
    `Dear Parent, ${studentName} was marked absent on ${date}. Contact school if incorrect. - Skolify`,

  examSchedule: (examName: string, date: string) =>
    `Exam Alert: ${examName} is scheduled on ${date}. Please prepare. - Skolify`,

  resultPublished: (examName: string, className: string) =>
    `Results for ${examName} (${className}) published. Login to Skolify to view. - Skolify`,

  notice: (title: string) =>
    `New Notice: ${title}. Login to Skolify to read. - Skolify`,

  welcome: (schoolName: string, code: string) =>
    `Welcome to ${schoolName} on Skolify! School Code: ${code}. Login at skolify.in/login`,

  feeReceived: (studentName: string, amount: string, receiptNo: string) =>
    `Fee received: Rs.${amount} for ${studentName}. Receipt: ${receiptNo}. Thank you! - Skolify`,

  homeworkAssigned: (className: string, subject: string, dueDate: string) =>
    `New homework for ${className} - ${subject}. Due: ${dueDate}. Check Skolify app. - Skolify`,

  attendanceReport: (studentName: string, month: string, percentage: string) =>
    `${studentName}'s attendance for ${month}: ${percentage}%. - Skolify`,
}