// FILE: src/lib/email.ts
// MIGRATED: Resend → MSG91 Email API
// Drop-in replacement — sendEmail signature same hai
// ═══════════════════════════════════════════════════════════

import { msg91SendEmail, msg91SendBulkEmail } from './msg91'

// ── Main send function — same signature as before ──
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: {
    fromName?: string
    replyTo?: string
  }
): Promise<{ success: boolean; error?: string }> {
  const result = await msg91SendEmail(to, subject, html, {
    fromName: options?.fromName ?? 'Skolify',
    replyTo: options?.replyTo,
  })

  return {
    success: result.success,
    error: result.error,
  }
}

// ── Bulk email ──
export async function sendBulkEmail(
  recipients: Array<{ email: string; name?: string }>,
  subject: string,
  html: string
): Promise<{ success: boolean; error?: string }> {
  const result = await msg91SendBulkEmail(recipients, subject, html)
  return { success: result.success, error: result.error }
}

// ─── Email Templates — SAME AS BEFORE (no change) ───
export const EMAIL_TEMPLATES = {
  welcome: (schoolName: string, adminName: string, loginUrl: string) => ({
    subject: `Welcome to Skolify — ${schoolName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 20px;background:#f8fafc">
        <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
          <div style="text-align:center;margin-bottom:24px">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:14px;margin-bottom:12px">
              <span style="color:white;font-weight:900;font-size:18px">SF</span>
            </div>
            <h1 style="margin:0;color:#1e293b;font-size:22px">Welcome to Skolify! 🎉</h1>
          </div>
          <p style="color:#475569;margin:0 0 8px">Hi <strong>${adminName}</strong>,</p>
          <p style="color:#475569;margin:0 0 20px">
            Your school <strong style="color:#1e293b">${schoolName}</strong> has been registered successfully.
            Your <strong>60-day free trial</strong> has started with ALL features unlocked.
          </p>
          <div style="background:#f1f5f9;border-radius:12px;padding:16px;margin:20px 0">
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">What's included in trial:</p>
            <ul style="margin:0;padding-left:20px;color:#475569;font-size:14px;line-height:2">
              <li>Fee management & online payments</li>
              <li>Exam scheduling & report cards</li>
              <li>Library, HR & Transport</li>
              <li>500 free messaging credits</li>
              <li>All roles: Admin, Teacher, Student, Parent</li>
            </ul>
          </div>
          <div style="text-align:center;margin:24px 0">
            <a href="${loginUrl}"
              style="display:inline-block;background:linear-gradient(135deg,#2563eb,#4f46e5);color:white;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px">
              Login to Dashboard →
            </a>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0">
            — Skolify by Shivshakti Computer Academy
          </p>
        </div>
      </div>
    `,
  }),

  otpVerification: (otp: string, purpose: string = 'registration') => ({
    subject: `${otp} — Skolify Verification Code`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 20px;background:#f8fafc">
        <div style="background:white;border-radius:16px;padding:32px;border:1px solid #e2e8f0">
          <div style="text-align:center;margin-bottom:24px">
            <div style="display:inline-flex;align-items:center;justify-content:center;width:56px;height:56px;background:linear-gradient(135deg,#2563eb,#4f46e5);border-radius:14px;margin-bottom:12px">
              <span style="color:white;font-weight:900;font-size:18px">SF</span>
            </div>
            <h2 style="margin:0;color:#1e293b;font-size:20px">Verification Code</h2>
            <p style="color:#64748b;font-size:14px;margin:8px 0 0">Skolify ${purpose === 'registration' ? 'Registration' : 'Login'}</p>
          </div>
          <div style="background:linear-gradient(135deg,#eff6ff,#eef2ff);border:2px solid #bfdbfe;border-radius:16px;padding:24px;text-align:center;margin:20px 0">
            <p style="margin:0 0 8px;color:#3b82f6;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Your OTP</p>
            <div style="font-size:42px;font-weight:900;letter-spacing:12px;color:#1e293b;font-family:monospace">${otp}</div>
          </div>
          <div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin:16px 0">
            <p style="margin:0;color:#92400e;font-size:13px">
              ⏰ Valid for <strong>10 minutes</strong> only. Do not share with anyone.
            </p>
          </div>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:16px 0 0">
            If you didn't request this, ignore this email.<br>— Skolify
          </p>
        </div>
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