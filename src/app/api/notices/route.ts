// ─────────────────────────────────────────────────────────────
// FILE: src/app/api/notices/route.ts  — FIXED VERSION
// Problem: Query mein $and nesting wrong tha
// ─────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { connectDB } from '@/lib/db'
import { Notice } from '@/models/Notice'
import { User } from '@/models/User'
import { sendSMS, SMS_TEMPLATES } from '@/lib/sms'
import { PUSH_TEMPLATES, sendPushToTenant } from '@/lib/push'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const role = session.user.role
    const now = new Date()

    // FIXED: Simple flat query — nested $and was causing issues
    const query: any = {
      tenantId: session.user.tenantId,
      isActive: true,
    }

    // Role filter — admin sees all, others see their role + all
    if (role !== 'admin') {
      query.$or = [
        { targetRole: 'all' },
        { targetRole: role },
      ]
    }

    const notices = await Notice.find(query)
      .sort({ priority: -1, publishedAt: -1 })
      .limit(50)
      .lean()

    // Filter expired notices in JS (simpler than MongoDB query)
    const activeNotices = notices.filter(n => {
      if (!n.expiresAt) return true
      return new Date(n.expiresAt) >= now
    })

    return NextResponse.json({ notices: activeNotices })

  } catch (err: any) {
    console.error('Notices GET error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !['admin', 'teacher'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    const body = await req.json()

    if (!body.title || !body.content) {
      return NextResponse.json(
        { error: 'title and content required' },
        { status: 400 }
      )
    }

    const notice = await Notice.create({
      tenantId: session.user.tenantId,
      title: body.title,
      content: body.content,
      targetRole: body.targetRole ?? 'all',
      targetClass: body.targetClass,
      priority: body.priority ?? 'normal',
      publishedAt: new Date(),
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
      createdBy: session.user.id,
      isActive: true,
      smsSent: false,
      pushSent: false,
      smsCount: 0,
    })

    // SMS blast agar requested ho
    if (body.sendSms) {
      try {
        const userQuery: any = {
          tenantId: session.user.tenantId,
          isActive: true,
        }
        if (body.targetRole !== 'all') {
          userQuery.role = body.targetRole
        }

        const users = await User.find(userQuery).select('phone').lean()
        const phones = users.map((u: any) => u.phone).filter(Boolean)

        if (phones.length > 0) {
          // Fast2SMS max 1000 per request — chunk karo
          for (let i = 0; i < phones.length; i += 1000) {
            const chunk = phones.slice(i, i + 1000)
            await sendSMS(chunk, SMS_TEMPLATES.notice(session.user.schoolName, body.title))
          }

          await Notice.findByIdAndUpdate(notice._id, {
            smsSent: true,
            smsCount: phones.length,
          })
        }
      } catch (smsErr) {
        // SMS fail hone pe notice to save ho — just log karo
        console.error('SMS error (notice saved):', smsErr)
      }
    }

    const saved = await Notice.findById(notice._id).lean()

    // After notice is saved:
    const pushPayload = PUSH_TEMPLATES.noticePosted(
      session.user.schoolName,
      body.title
    )
    await sendPushToTenant(
      session.user.tenantId,
      body.targetRole === 'all' ? ['student', 'parent', 'teacher'] : [body.targetRole],
      pushPayload
    ).catch(console.error)  // non-fatal


    return NextResponse.json({ notice: saved }, { status: 201 })

  } catch (err: any) {
    console.error('Notice POST error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
