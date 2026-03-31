// =============================================================
// FILE: src/lib/email.ts
// UPDATED: Added new templates, kept Resend wrapper same
// =============================================================
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = `Skolify <noreply@${process.env.NEXT_PUBLIC_APP_DOMAIN}>`

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html })
    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('Email failed:', err)
    return { success: false, error: err?.message || 'Email send failed' }
  }
}

// ─── Email Templates ───
export const EMAIL_TEMPLATES = {
  welcome: (schoolName: string, adminName: string, loginUrl: string) => ({
    subject: `Welcome to Skolify — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px">
        <h2 style="color:#4F46E5">Welcome, ${adminName}!</h2>
        <p>Your school <strong>${schoolName}</strong> has been registered on Skolify.</p>
        <p>Your <strong>60-day free trial</strong> has started with ALL features unlocked.</p>
        <a href="${loginUrl}" style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Login Now →
        </a>
        <p style="color:#64748B;font-size:13px">Trial includes: Fee management, Exams, Timetable, Library, HR & more — try everything!</p>
        <br><p style="color:#94A3B8;font-size:12px">— Skolify by Shivshakti Computer Academy</p>
      </div>
    `,
  }),

  trialReminder: (schoolName: string, daysLeft: number, upgradeUrl: string) => ({
    subject: `Your free trial ends in ${daysLeft} days — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px">
        <h2 style="color:#D97706">⏰ Trial ending soon!</h2>
        <p>Your free trial for <strong>${schoolName}</strong> ends in <strong>${daysLeft} days</strong>.</p>
        <p>Subscribe now to continue using all features without interruption.</p>
        <a href="${upgradeUrl}" style="display:inline-block;background:#4F46E5;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Subscribe Now — Starting ₹499/mo
        </a>
        <p style="color:#64748B;font-size:13px">After trial, you'll lose access to premium modules. Your data will be safe.</p>
      </div>
    `,
  }),

  paymentConfirm: (schoolName: string, amount: number, plan: string) => ({
    subject: `Payment confirmed — ₹${amount.toLocaleString('en-IN')} — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px">
        <h2 style="color:#059669">✅ Payment Received!</h2>
        <p>Thank you! Payment of <strong>₹${amount.toLocaleString('en-IN')}</strong> for <strong>${plan} Plan</strong> has been received.</p>
        <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:4px 0"><strong>Plan:</strong> ${plan}</p>
          <p style="margin:4px 0"><strong>Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
          <p style="margin:4px 0"><strong>Status:</strong> Active</p>
        </div>
        <p>Login to your dashboard to access all features.</p>
        <p style="color:#94A3B8;font-size:12px">— Skolify</p>
      </div>
    `,
  }),

  subscriptionCancelled: (schoolName: string, plan: string, endDate: string) => ({
    subject: `Subscription cancellation scheduled — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px">
        <h2 style="color:#DC2626">Cancellation Scheduled</h2>
        <p>Your <strong>${plan} Plan</strong> for <strong>${schoolName}</strong> has been scheduled for cancellation.</p>
        <p>Your access will continue until <strong>${endDate}</strong>.</p>
        <p>Changed your mind? Login and click "Undo Cancel" anytime before the end date.</p>
        <p style="color:#94A3B8;font-size:12px">— Skolify</p>
      </div>
    `,
  }),

  refundProcessed: (schoolName: string, amount: number) => ({
    subject: `Refund of ₹${amount.toLocaleString('en-IN')} processed — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px">
        <h2 style="color:#059669">Refund Processed</h2>
        <p>Your refund of <strong>₹${amount.toLocaleString('en-IN')}</strong> has been initiated.</p>
        <p>It will reflect in your account within <strong>5-7 business days</strong>.</p>
        <p style="color:#94A3B8;font-size:12px">— Skolify</p>
      </div>
    `,
  }),

  feeReceipt: (studentName: string, amount: string, receiptNo: string, schoolName: string) => ({
    subject: `Fee Receipt #${receiptNo} — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px">
        <h2>Fee Receipt</h2>
        <p>Fee of <strong>₹${amount}</strong> for <strong>${studentName}</strong> has been received.</p>
        <p>Receipt No: <strong>${receiptNo}</strong></p>
        <p style="color:#94A3B8;font-size:12px">— ${schoolName} via Skolify</p>
      </div>
    `,
  }),
}