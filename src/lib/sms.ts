// FILE: src/lib/sms.ts
// UPDATED: Now uses MSG91 via messaging.ts
// Old sendSMS function kept — backward compatible
// ═══════════════════════════════════════════════════════════

import { msg91SendSMS } from "./msg91";


// ── Backward compatible wrapper ──
export async function sendSMS(
  phones: string | string[],
  message: string,
  templateId?: string
): Promise<{ success: boolean; error?: string }> {
  const phoneList = Array.isArray(phones) ? phones : [phones]

  if (phoneList.length === 1) {
    return msg91SendSMS(phoneList[0], message, templateId)
  }

  // Bulk — send to all, return overall success
  const results = await Promise.allSettled(
    phoneList.map(p => msg91SendSMS(p, message, templateId))
  )

  const failed = results.filter(
    r => r.status === 'rejected' || (r.status === 'fulfilled' && !r.value.success)
  )

  return {
    success: failed.length === 0,
    error: failed.length > 0 ? `${failed.length} messages failed` : undefined,
  }
}

// ── SMS Templates (kept same — backward compatible) ──
export const SMS_TEMPLATES = {
  admissionReceived: (studentName: string, schoolName: string) =>
    `Dear Parent, admission application for ${studentName} received at ${schoolName}. We will contact you shortly.`,

  admissionApproved: (studentName: string, schoolName: string) =>
    `Congratulations! ${studentName}'s admission at ${schoolName} is APPROVED. Visit school for further process.`,

  feeReminder: (studentName: string, amount: number, dueDate: string) =>
    `Dear Parent, fee of Rs.${amount} for ${studentName} is due on ${dueDate}. Pay online to avoid late fine.`,

  feePaid: (studentName: string, amount: number, receiptNo: string) =>
    `Payment of Rs.${amount} received for ${studentName}. Receipt No: ${receiptNo}. Thank you.`,

  absentAlert: (studentName: string, date: string, schoolName: string) =>
    `Dear Parent, ${studentName} was ABSENT on ${date} at ${schoolName}. Please contact school if needed.`,

  examResult: (studentName: string, examName: string) =>
    `${studentName}'s ${examName} result is now available. Login to portal to view marks and grade card.`,

  notice: (schoolName: string, title: string) =>
    `${schoolName}: New notice - "${title}". Login to school portal to read full details.`,
}