// FILE: src/app/api/enquiry/route.ts
// Public enquiry form submission
// Resend se email — direct (no credits)
// ═══════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { Enquiry } from '@/models/Enquiry'
import { Resend } from 'resend'

// Rate limiting
const enquiryTracker = new Map<string, number[]>()

function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const windowMs = 60 * 60 * 1000
    const maxPerHour = 5
    const times = (enquiryTracker.get(ip) || []).filter(t => now - t < windowMs)
    if (times.length >= maxPerHour) return true
    times.push(now)
    enquiryTracker.set(ip, times)
    return false
}

export async function POST(req: NextRequest) {
    try {
        await connectDB()

        const ip =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

        if (isRateLimited(ip)) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            )
        }

        const body = await req.json()
        const { name, phone, subject, message } = body

        // Validation
        if (!name?.trim()) {
            return NextResponse.json({ error: 'Name required' }, { status: 400 })
        }
        if (!phone?.trim() || phone.trim().length < 10) {
            return NextResponse.json({ error: 'Valid phone number required' }, { status: 400 })
        }
        if (!subject?.trim()) {
            return NextResponse.json({ error: 'Subject required' }, { status: 400 })
        }
        if (!message?.trim() || message.trim().length < 10) {
            return NextResponse.json(
                { error: 'Message must be at least 10 characters' },
                { status: 400 }
            )
        }

        // Save to DB
        const enquiry = await Enquiry.create({
            name: name.trim(),
            email: body.email?.trim()?.toLowerCase() || '',
            phone: phone.trim(),
            schoolName: body.schoolName?.trim() || '',
            schoolLocation: body.schoolLocation?.trim() || '',
            subject: subject.trim(),
            message: message.trim(),
            interestedPlan: body.interestedPlan || 'not_sure',
            schoolSize: body.schoolSize || '',
            source: body.source || 'contact_form',
            status: 'new',
            emailSent: false,
            ipAddress: ip,
        })

        // ── Send email via Resend (direct — no credits) ──
        if (process.env.RESEND_API_KEY) {
            try {
                const resend = new Resend(process.env.RESEND_API_KEY)
                const adminEmail = process.env.SUPERADMIN_EMAIL || 'admin@skolify.in'

                await resend.emails.send({
                    from: 'Skolify Enquiry <noreply@skolify.in>',
                    to: adminEmail,
                    subject: `New Enquiry: ${subject.trim()}`,
                    html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #2563EB; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0;">
                <h2 style="margin: 0; font-size: 18px;">📬 New Enquiry — Skolify</h2>
              </div>
              <div style="background: #F8FAFC; padding: 24px; border: 1px solid #E2E8F0; border-top: none;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px; width: 140px;">Name</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${name.trim()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Phone</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${phone.trim()}</td>
                  </tr>
                  ${body.email ? `<tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Email</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${body.email}</td>
                  </tr>` : ''}
                  ${body.schoolName ? `<tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">School</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${body.schoolName}</td>
                  </tr>` : ''}
                  ${body.schoolLocation ? `<tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Location</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${body.schoolLocation}</td>
                  </tr>` : ''}
                  ${body.interestedPlan && body.interestedPlan !== 'not_sure' ? `<tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">Interested Plan</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #2563EB; text-transform: capitalize;">${body.interestedPlan}</td>
                  </tr>` : ''}
                  ${body.schoolSize ? `<tr>
                    <td style="padding: 8px 0; color: #64748B; font-size: 13px;">School Size</td>
                    <td style="padding: 8px 0; font-weight: 600; color: #0F172A;">${body.schoolSize}</td>
                  </tr>` : ''}
                </table>
                <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #E2E8F0;">
                  <p style="margin: 0 0 8px; color: #64748B; font-size: 13px;">Subject</p>
                  <p style="margin: 0; font-weight: 600; color: #0F172A;">${subject.trim()}</p>
                </div>
                <div style="margin-top: 12px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #E2E8F0;">
                  <p style="margin: 0 0 8px; color: #64748B; font-size: 13px;">Message</p>
                  <p style="margin: 0; color: #334155; line-height: 1.6;">${message.trim().replace(/\n/g, '<br>')}</p>
                </div>
              </div>
              <div style="padding: 16px 24px; background: #F1F5F9; border-radius: 0 0 8px 8px; border: 1px solid #E2E8F0; border-top: none;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}/superadmin/enquiries" 
                  style="display: inline-block; background: #2563EB; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">
                  View in Dashboard →
                </a>
                <p style="margin: 8px 0 0; font-size: 11px; color: #94A3B8;">
                  Enquiry ID: ${enquiry._id} · IP: ${ip}
                </p>
              </div>
            </div>
          `,
                })

                await Enquiry.findByIdAndUpdate(enquiry._id, {
                    emailSent: true,
                    emailSentAt: new Date(),
                })
            } catch (emailErr) {
                console.error('Enquiry email send error:', emailErr)
                // Don't fail — enquiry saved, email failed silently
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Enquiry submitted! We will contact you within 24 hours.',
            id: enquiry._id,
        })
    } catch (err: any) {
        console.error('Enquiry POST error:', err)
        return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
    }
}