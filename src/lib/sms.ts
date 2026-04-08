// FILE: src/lib/sms.ts
// ═══════════════════════════════════════════════════════════
// Single source of truth for all SMS templates
// messaging.ts wala hata do — yahi use karo everywhere
// ═══════════════════════════════════════════════════════════

import { msg91SendSMS, msg91SendBulkSMS } from './msg91'

// ══════════════════════════════════════════════
// Main SMS Function
// ══════════════════════════════════════════════

export async function sendSMS(
  phones: string | string[],
  message: string,
  templateId?: string
): Promise<{ success: boolean; error?: string; cost?: number }> {
  const phoneList = Array.isArray(phones) ? phones : [phones]

  if (phoneList.length === 1) {
    const result = await msg91SendSMS(phoneList[0], message, templateId)
    return { success: result.success, error: result.error, cost: result.cost }
  }

  const recipients = phoneList.map(p => ({ phone: p }))
  const result = await msg91SendBulkSMS(recipients, message, templateId)
  return { success: result.success, error: result.error, cost: result.cost }
}

// ══════════════════════════════════════════════
// SMS Template Result Type
// ══════════════════════════════════════════════

export interface SMSTemplateResult {
  message: string
  templateId?: string
}

// ══════════════════════════════════════════════
// ALL SMS Templates — Single Source of Truth
// messaging.ts se import karo, wahan ka hatao
// ══════════════════════════════════════════════

export const SMS_TEMPLATES = {
  // ── OTP ──
  otp: (otp: string): SMSTemplateResult => ({
    message: `Your Skolify OTP is ${otp}. Valid for 10 minutes. Do not share. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_OTP,
  }),

  // ── Absent Alert ──
  absentAlert: (studentName: string, date: string, schoolName: string): SMSTemplateResult => ({
    message: `${studentName} was ABSENT on ${date} at ${schoolName}. Please contact school if needed. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_ATTENDANCE,
  }),

  // ── Fee Receipt ──
  feeReceipt: (studentName: string, amount: number, receiptNo: string): SMSTemplateResult => ({
    message: `Dear Parent, fee of Rs.${amount} for ${studentName} received. Receipt: ${receiptNo}. Thank you! -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_FEE_RECEIPT,
  }),

  // ── Fee Reminder ──
  feeReminder: (studentName: string, amount: number, dueDate: string): SMSTemplateResult => ({
    message: `Fee of Rs.${amount} for ${studentName} due on ${dueDate}. Pay online to avoid late fine. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_FEE_REMINDER,
  }),

  // ── Fee Paid ──
  feePaid: (studentName: string, amount: number, receiptNo: string): SMSTemplateResult => ({
    message: `Payment Rs.${amount} received for ${studentName}. Receipt: ${receiptNo}. Thank you! -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_FEE_RECEIPT,
  }),

  // ── Exam Result ──
  examResult: (studentName: string, examName: string): SMSTemplateResult => ({
    message: `${studentName}'s ${examName} result is now available. Login to portal to view. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_EXAM_RESULT,
  }),

  // ── Notice ──
  notice: (schoolName: string, title: string): SMSTemplateResult => ({
    message: `${schoolName}: New notice - "${title}". Login to portal for details. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_NOTICE,
  }),

  // ── Admission Received ──
  admissionReceived: (studentName: string, schoolName: string): SMSTemplateResult => ({
    message: `Dear Parent, admission application for ${studentName} received at ${schoolName}. We will contact you shortly. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_ADMISSION,
  }),

  // ── Admission Approved ──
  admissionApproved: (studentName: string, schoolName: string): SMSTemplateResult => ({
    message: `${studentName}'s admission at ${schoolName} is APPROVED. Visit school for further process. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_ADMISSION,
  }),

  // ── Credit Low (Internal alert) ──
  creditLow: (balance: number): SMSTemplateResult => ({
    message: `Skolify Alert: Your message credit balance is low (${balance} credits). Recharge now to continue messaging.`,
    templateId: undefined,
  }),

  // ── Trial Ending (Internal alert) ──
  trialEnding: (daysLeft: number): SMSTemplateResult => ({
    message: `Skolify: Your 60-day free trial ends in ${daysLeft} days. Subscribe now at skolify.in to continue.`,
    templateId: undefined,
  }),
}