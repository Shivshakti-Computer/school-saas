// FILE: src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  findAnswer,
  ALL_QA,
  FALLBACK_ANSWER,
  type UserRole,
} from '@/lib/chatbot/qa-database'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user?.role as UserRole) || 'guest'
    const { message } = await req.json()

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message required' },
        { status: 400 }
      )
    }

    const msg = message.toLowerCase().trim()

    // ── Step 1: Exact ID match ──
    const exactById = ALL_QA.find(
      qa =>
        qa.id === msg &&
        (qa.roles.includes(userRole) || qa.roles.includes('guest'))
    )
    if (exactById) {
      return NextResponse.json({
        success: true,
        response: exactById.answer,
        quickReplies: exactById.quickReplies ?? [],
        canForward: exactById.canForward ?? false,
        matchedId: exactById.id,
      })
    }

    // ── Step 1.5: Priority topic checks ──
    const priorityMap: Array<{ keywords: string[]; targetId: string }> = [
      {
        keywords: [
          'rollover', 'carry forward', 'credit expire', 'credits expire',
          'credits safe', 'rollover policy', 'rollover benefit',
          'credit transfer', 'unused credits rollover',
        ],
        targetId: 'credit_rollover_detail',
      },
      {
        keywords: ['cancel', 'refund', 'stop subscription', 'cancel plan'],
        targetId: 'admin_cancel_policy',
      },
      {
        keywords: ['what is skolify', 'about skolify', 'tell me about'],
        targetId: 'what_is_skolify',
      },
      {
        keywords: ['why skolify', 'why choose', 'different from', 'better than'],
        targetId: 'how_different',
      },
      {
        keywords: ['annual', 'yearly plan', 'year discount', '2 months free'],
        targetId: 'annual_billing',
      },
      {
        keywords: ['multiple branch', 'multi branch', 'two schools', 'chain school'],
        targetId: 'multi_branch',
      },
    ]

    for (const { keywords, targetId } of priorityMap) {
      if (keywords.some(kw => msg.includes(kw))) {
        const qa = ALL_QA.find(q => q.id === targetId)
        if (qa && (qa.roles.includes(userRole) || userRole === 'guest')) {
          return NextResponse.json({
            success: true,
            response: qa.answer,
            quickReplies: qa.quickReplies ?? [],
            canForward: qa.canForward ?? false,
            matchedId: qa.id,
          })
        }
      }
    }

    // ── Step 2: Pattern match with scoring ──
    let matched = null
    let highestScore = 0

    for (const qa of ALL_QA) {
      const roleAllowed =
        qa.roles.includes(userRole) ||
        (userRole === 'guest' && qa.roles.includes('guest'))
      if (!roleAllowed) continue

      let score = 0
      for (const pattern of qa.patterns) {
        if (msg === pattern) {
          score += 10
        } else if (msg.includes(pattern)) {
          score += pattern.split(' ').length * 2
        } else if (pattern.includes(msg) && msg.length > 3) {
          score += 1
        }
      }

      if (score > highestScore) {
        highestScore = score
        matched = qa
      }
    }

    if (matched && highestScore > 0) {
      return NextResponse.json({
        success: true,
        response: matched.answer,
        quickReplies: matched.quickReplies ?? [],
        canForward: matched.canForward ?? false,
        matchedId: matched.id,
      })
    }

    // ── Step 3: Keyword map (fuzzy) ──
    const keywordMap: Record<string, string> = {
      // Pricing
      'price': 'admin_plans_overview',
      'pricing': 'admin_plans_overview',
      'cost': 'admin_plans_overview',
      'plan': 'admin_plans_overview',
      'plans': 'admin_plans_overview',
      'monthly': 'admin_plans_overview',
      'subscription': 'admin_plans_overview',
      'rupees': 'admin_plans_overview',
      'how much': 'admin_plans_overview',
      'affordable': 'admin_plans_overview',
      'annual': 'annual_billing',
      'yearly': 'annual_billing',
      // Credits
      'credit': 'credit_system_overview',
      'sms': 'credit_system_overview',
      'whatsapp': 'credit_system_overview',
      'messaging': 'credit_system_overview',
      'notification': 'credit_system_overview',
      // Rollover
      'rollover': 'credit_rollover_detail',
      'carry forward': 'credit_rollover_detail',
      'credit expire': 'credit_rollover_detail',
      'credits safe': 'credit_rollover_detail',
      // Trial
      'trial': 'trial_info',
      'free': 'trial_info',
      'demo': 'trial_info',
      'try': 'trial_info',
      // Features
      'feature': 'features_overview',
      'module': 'features_overview',
      'what can': 'features_overview',
      // Setup
      'setup': 'admin_first_steps',
      'start': 'admin_first_steps',
      'getting started': 'admin_first_steps',
      'how to': 'admin_first_steps',
      // Attendance
      'attendance': 'teacher_attendance',
      'present': 'teacher_attendance',
      'absent': 'teacher_attendance',
      // Fees
      'fee': 'fee_status_student',
      'fees': 'fee_status_student',
      'payment': 'fee_status_student',
      // Results
      'result': 'student_results',
      'marks': 'teacher_marks',
      'grade': 'student_results',
      'exam': 'teacher_marks',
      // Support
      'support': 'support_contact',
      'help': 'support_contact',
      'contact': 'support_contact',
      'problem': 'support_contact',
      'issue': 'support_contact',
      'not working': 'support_contact',
      // Security
      'security': 'security_privacy',
      'safe': 'security_privacy',
      'data': 'security_privacy',
      'privacy': 'security_privacy',
      // Website
      'website': 'website_builder',
      'web': 'website_builder',
      'site': 'website_builder',
      // App
      'app': 'mobile_app',
      'mobile': 'mobile_app',
      'android': 'mobile_app',
      'ios': 'mobile_app',
      'pwa': 'mobile_app',
      // Upgrade
      'upgrade': 'admin_upgrade',
      'change plan': 'admin_upgrade',
      'downgrade': 'admin_downgrade',
      // Import
      'import': 'bulk_import',
      'excel': 'bulk_import',
      'csv': 'bulk_import',
      'bulk': 'bulk_import',
      // Cancel
      'cancel': 'admin_cancel_policy',
      'refund': 'admin_cancel_policy',
      // About
      'what is': 'what_is_skolify',
      'about': 'what_is_skolify',
      'skolify': 'what_is_skolify',
      // Certificate
      'certificate': 'certificates',
      'tc': 'certificates',
      'bonafide': 'certificates',
      // Multi-branch
      'branch': 'multi_branch',
      // Payment methods
      'upi': 'payment_methods',
      'gpay': 'payment_methods',
      'paytm': 'payment_methods',
      'card': 'payment_methods',
      // School size
      'small school': 'skolify_for_school_size',
      'large school': 'skolify_for_school_size',
      // Login
      'login': 'student_login',
      'password': 'student_login',
      'forgot': 'student_login',
    }

    for (const [keyword, targetId] of Object.entries(keywordMap)) {
      if (msg.includes(keyword)) {
        const target = ALL_QA.find(qa => qa.id === targetId)
        if (target && (target.roles.includes(userRole) || userRole === 'guest')) {
          return NextResponse.json({
            success: true,
            response: target.answer,
            quickReplies: target.quickReplies ?? [],
            canForward: target.canForward ?? false,
            matchedId: target.id,
          })
        }
      }
    }

    // ── Step 4: Fallback ──
    return NextResponse.json({
      success: true,
      response: FALLBACK_ANSWER.answer,
      quickReplies: FALLBACK_ANSWER.quickReplies ?? [],
      canForward: FALLBACK_ANSWER.canForward ?? false,
      matchedId: 'fallback',
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}