/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/cron/fee-reminders/route.ts
   GET → Vercel cron job — runs daily at 9 AM
   Send SMS to parents whose fee is due in 3 days
   ─────────────────────────────────────────────────────────── */
import { Fee } from '@/models/Fee'
import  '@/models/Student'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms'
import { sendEmail, EMAIL_TEMPLATES } from '@/lib/email'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'

export async function GET(req: NextRequest) {
    // Secure with cron secret
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const today = new Date()
    const in3Days = new Date(today)
    in3Days.setDate(in3Days.getDate() + 3)

    // Find pending fees due in next 3 days (where reminder not sent)
    const dueFees = await Fee.find({
        status: 'pending',
        dueDate: {
            $gte: today,
            $lte: in3Days,
        },
        reminderSentAt: null,  // not yet reminded
    }).populate('studentId').lean()

    let smsSent = 0

    for (const fee of dueFees) {
        const student = fee.studentId as any
        if (!student?.parentPhone) continue

        const dueDate = new Date(fee.dueDate).toLocaleDateString('en-IN')

        await sendSMS(
            student.parentPhone,
            SMS_TEMPLATES.feeReminder(student.admissionNo, fee.finalAmount, dueDate)
        )

        await Fee.findByIdAndUpdate(fee._id, { reminderSentAt: new Date() })
        smsSent++
    }

    return NextResponse.json({ success: true, remindersSent: smsSent })
}