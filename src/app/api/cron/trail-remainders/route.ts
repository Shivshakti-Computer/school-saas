/* ─────────────────────────────────────────────────────────────
   FILE: src/app/api/cron/trial-reminders/route.ts
   GET → Vercel cron — runs daily
   Send email to schools whose trial ends in 3 days
   ─────────────────────────────────────────────────────────── */

import { connectDB } from "@/lib/db"
import { EMAIL_TEMPLATES, sendEmail } from "@/lib/email"
import { School } from "@/models"
import { NextRequest, NextResponse } from "next/server"


export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
 
  await connectDB()
 
  const today   = new Date()
  const in3Days = new Date(today)
  in3Days.setDate(in3Days.getDate() + 3)
 
  // Schools with trial ending in 3 days, no subscription
  const schools = await School.find({
    isActive:       true,
    subscriptionId: null,
    trialEndsAt: {
      $gte: today,
      $lte: in3Days,
    },
  }).lean()
 
  for (const school of schools) {
    if (!school.email) continue
 
    const daysLeft = Math.ceil(
      (school.trialEndsAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
 
    const upgradeUrl = `https://${school.subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN}/admin/subscription`
    const { subject, html } = EMAIL_TEMPLATES.trialReminder(school.name, daysLeft, upgradeUrl)
    await sendEmail(school.email, subject, html)
  }
 
  return NextResponse.json({ success: true, reminded: schools.length })
}