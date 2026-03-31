// =============================================================
// FILE: src/lib/sms.ts
// SMS provider NOT yet decided — placeholder with logging
// When provider decided, just update sendSMS function body
// =============================================================

export async function sendSMS(
  phones: string | string[],
  message: string
): Promise<{ success: boolean; error?: string }> {
  const phoneList = Array.isArray(phones) ? phones.join(',') : phones

  // ─── PROVIDER NOT YET CONFIGURED ───
  // When SMS provider is decided, replace this block
  // Example providers: Fast2SMS, MSG91, Twilio, Textlocal

  if (!process.env.SMS_API_KEY) {
    console.log(`[SMS-PLACEHOLDER] To: ${phoneList}, Msg: ${message.slice(0, 80)}...`)
    // Return success in dev so app doesn't break
    // In production without key, this will silently skip
    return { success: true }
  }

  // ─── UNCOMMENT when provider decided ───
  // Example: Fast2SMS
  /*
  try {
    const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
      method: 'POST',
      headers: {
        'authorization': process.env.SMS_API_KEY!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        route: 'q',
        message,
        language: 'english',
        flash: 0,
        numbers: phoneList,
      })
    })
    const data = await res.json()
    if (data.return === true) return { success: true }
    return { success: false, error: data.message || 'SMS failed' }
  } catch (err: any) {
    console.error('SMS failed:', err)
    return { success: false, error: err?.message || 'SMS send failed' }
  }
  */

  // Placeholder — log and return success
  console.log(`[SMS] To: ${phoneList}, Msg: ${message.slice(0, 80)}...`)
  return { success: true }
}

// ─── SMS Templates ───
export const SMS_TEMPLATES = {
  admissionReceived: (studentName: string, schoolName: string) =>
    `Dear Parent, admission application for ${studentName} received at ${schoolName}. We will review and contact you shortly.`,

  admissionApproved: (studentName: string, schoolName: string) =>
    `Congratulations! ${studentName}'s admission at ${schoolName} is APPROVED. Please visit school for further process.`,

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