// FILE: src/lib/whatsapp.ts
// WhatsApp wrapper with template support
// Future-proof: Easy to add new WhatsApp providers

import { msg91SendWhatsApp, type WhatsAppResult } from './msg91'

// ══════════════════════════════════════════════
// Main WhatsApp Function - Backward Compatible
// ══════════════════════════════════════════════

export async function sendWhatsApp(
  phone: string,
  message: string,
  templateName?: string,
  templateParams?: Record<string, string>
): Promise<{ success: boolean; error?: string; cost?: number }> {
  const params = templateParams ? Object.values(templateParams) : undefined
  
  const result = await msg91SendWhatsApp(phone, message, templateName, params)
  
  return {
    success: result.success,
    error: result.error,
    cost: result.cost,
  }
}

// ══════════════════════════════════════════════
// WhatsApp Templates - Ready for MSG91 Approval
// ══════════════════════════════════════════════

export const WHATSAPP_TEMPLATES = {
  // ── Fee Reminder ──
  feeReminder: (studentName: string, amount: number, dueDate: string, schoolName: string) => ({
    templateId: process.env.MSG91_WA_TEMPLATE_FEE_REMINDER || 'fee_reminder',
    params: [studentName, amount.toString(), dueDate, schoolName],
    message: `Dear Parent,\n\nFee reminder for ${studentName}:\n\nAmount: ₹${amount}\nDue Date: ${dueDate}\n\nPay online to avoid late charges.\n\nRegards,\n${schoolName}`,
  }),

  // ── Attendance Alert ──
  attendanceAlert: (studentName: string, date: string, status: string, schoolName: string) => ({
    templateId: process.env.MSG91_WA_TEMPLATE_ATTENDANCE_ALERT || 'attendance_alert',
    params: [studentName, date, status, schoolName],
    message: `Dear Parent,\n\n${studentName} was marked ${status} on ${date}.\n\nIf this is incorrect, please contact the school.\n\nRegards,\n${schoolName}`,
  }),

  // ── Exam Result ──
  examResult: (studentName: string, examName: string, totalMarks: number, obtainedMarks: number, schoolName: string) => ({
    templateId: process.env.MSG91_WA_TEMPLATE_EXAM_RESULT || 'exam_result',
    params: [studentName, examName, obtainedMarks.toString(), totalMarks.toString(), schoolName],
    message: `Dear Parent,\n\n${examName} results for ${studentName}:\n\nObtained: ${obtainedMarks}/${totalMarks}\n\nDetailed report available in parent portal.\n\nRegards,\n${schoolName}`,
  }),

  // ── Fee Receipt ──
  feeReceipt: (studentName: string, amount: number, receiptNo: string, date: string, schoolName: string) => ({
    templateId: undefined,  // No template needed for receipts
    params: [studentName, amount.toString(), receiptNo, date, schoolName],
    message: `Dear Parent,\n\nPayment Confirmation:\n\nStudent: ${studentName}\nAmount: ₹${amount}\nReceipt: ${receiptNo}\nDate: ${date}\n\nThank you!\n\n${schoolName}`,
  }),
}