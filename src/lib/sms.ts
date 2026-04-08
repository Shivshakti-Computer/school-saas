// FILE: src/lib/sms.ts
// SMS wrapper with automatic provider selection
// Future-proof: Easy to add new SMS providers

import { msg91SendSMS, msg91SendBulkSMS, type SMSResult, type BulkSMSResult } from './msg91'

// ══════════════════════════════════════════════
// Main SMS Function - Backward Compatible
// ══════════════════════════════════════════════

export async function sendSMS(
  phones: string | string[],
  message: string,
  templateId?: string
): Promise<{ success: boolean; error?: string; cost?: number }> {
  const phoneList = Array.isArray(phones) ? phones : [phones]

  // Single SMS
  if (phoneList.length === 1) {
    const result = await msg91SendSMS(phoneList[0], message, templateId)
    return {
      success: result.success,
      error: result.error,
      cost: result.cost,
    }
  }

  // Bulk SMS
  const recipients = phoneList.map(p => ({ phone: p }))
  const result = await msg91SendBulkSMS(recipients, message, templateId)
  
  return {
    success: result.success,
    error: result.error,
    cost: result.cost,
  }
}

// ══════════════════════════════════════════════
// SMS Templates - Ready for DLT
// ══════════════════════════════════════════════

export const SMS_TEMPLATES = {
  // ── OTP ──
  otp: (otp: string) => ({
    message: `Your Skolify OTP is ${otp}. Valid for 10 minutes. Do not share. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_OTP,
  }),

  // ── Fee Receipt ──
  feeReceipt: (studentName: string, amount: number, receiptNo: string) => ({
    message: `Dear Parent, fee of Rs.${amount} for ${studentName} received. Receipt: ${receiptNo}. Thank you! -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_FEE_RECEIPT,
  }),

  // ── Attendance Alert ──
  attendanceAlert: (studentName: string, date: string, schoolName: string) => ({
    message: `Dear Parent, ${studentName} was ABSENT on ${date} at ${schoolName}. Contact school if needed. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_ATTENDANCE,
  }),

  // ── Exam Result ──
  examResult: (studentName: string, examName: string) => ({
    message: `${studentName}'s ${examName} result is now available. Login to portal to view marks and grade card. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_EXAM_RESULT,
  }),

  // ── Fee Reminder ──
  feeReminder: (studentName: string, amount: number, dueDate: string) => ({
    message: `Dear Parent, fee of Rs.${amount} for ${studentName} is due on ${dueDate}. Pay online to avoid late fine. -Skolify`,
    templateId: process.env.MSG91_TEMPLATE_FEE_RECEIPT,
  }),

  // ── Admission Received ──
  admissionReceived: (studentName: string, schoolName: string) => ({
    message: `Dear Parent, admission application for ${studentName} received at ${schoolName}. We will contact you shortly. -Skolify`,
    templateId: undefined,
  }),

  // ── Admission Approved ──
  admissionApproved: (studentName: string, schoolName: string) => ({
    message: `Congratulations! ${studentName}'s admission at ${schoolName} is APPROVED. Visit school for further process. -Skolify`,
    templateId: undefined,
  }),

  // ── Notice ──
  notice: (schoolName: string, title: string) => ({
    message: `${schoolName}: New notice - "${title}". Login to school portal to read full details. -Skolify`,
    templateId: undefined,
  }),
}