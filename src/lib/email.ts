/* ─────────────────────────────────────────────────────────────
   FILE: src/lib/email.ts
   Resend email wrapper
   ─────────────────────────────────────────────────────────── */
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const FROM = `School Suite <noreply@${process.env.NEXT_PUBLIC_APP_DOMAIN}>`

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
        const { error } = await resend.emails.send({ from: FROM, to, subject, html })
        if (error) throw error
        return true
    } catch (err) {
        console.error('Email failed:', err)
        return false
    }
}

// Email templates
export const EMAIL_TEMPLATES = {
    welcome: (schoolName: string, adminName: string, loginUrl: string) => ({
        subject: `Welcome to School Suite — ${schoolName}`,
        html: `
      <h2>Welcome, ${adminName}!</h2>
      <p>Your school <strong>${schoolName}</strong> has been successfully registered on School Suite.</p>
      <p>Your 15-day free trial has started. <a href="${loginUrl}">Login here</a> to get started.</p>
      <p>If you need help, reply to this email.</p>
      <br><p>— Shivshakti Computer Academy</p>
    `,
    }),

    trialReminder: (schoolName: string, daysLeft: number, upgradeUrl: string) => ({
        subject: `Your free trial ends in ${daysLeft} days — ${schoolName}`,
        html: `
      <h2>Trial ending soon!</h2>
      <p>Your free trial for <strong>${schoolName}</strong> ends in <strong>${daysLeft} days</strong>.</p>
      <p>Subscribe now to continue using all features without interruption.</p>
      <a href="${upgradeUrl}" style="background:#534AB7;color:white;padding:10px 20px;border-radius:6px;text-decoration:none">
        Subscribe Now
      </a>
    `,
    }),

    paymentConfirm: (schoolName: string, amount: number, plan: string) => ({
        subject: `Payment confirmed — ${schoolName}`,
        html: `
      <h2>Payment Received!</h2>
      <p>Thank you! Payment of <strong>₹${amount}</strong> for <strong>${plan} plan</strong> has been received.</p>
      <p>Your subscription is now active.</p>
    `,
    }),
}