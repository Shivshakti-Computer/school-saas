// src/app/api/chat/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// ══════════════════════════════════════════════
// Config
// ══════════════════════════════════════════════

const AI_API_URL = process.env.AI_API_URL || 'http://127.0.0.1:8000'
const AI_TIMEOUT_MS = 35000 // Render free tier cold start ke liye

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

// Aapke User model (src/models/User.ts) ke roles exactly match
type SessionUserRole =
  | 'admin'
  | 'teacher'
  | 'staff'
  | 'student'
  | 'parent'
  | 'superadmin'
  | 'guest'

interface QuickReply {
  text: string
  action?: string
  payload?: string
}

interface AIResponse {
  success: boolean
  answer: string
  conversation_id: string
  sources?: Array<{
    url: string
    page_type: string
    score: number
  }>
  quickReplies?: QuickReply[]
  canForward?: boolean
  metadata?: {
    llm_used: boolean
    llm_provider: string
    model: string
    source: string
    context_chunks: number
    portal_mode?: boolean
    tenant_id?: string
  }
}

interface PythonChatPayload {
  message: string
  conversation_id: string | null
  role: SessionUserRole
  mode: 'public' | 'portal'
  tenant_id?: string | null
  user_id?: string | null
  user_name?: string | null
}

// ══════════════════════════════════════════════
// Role Mapper
// staff → teacher, superadmin → admin
// Python backend ke system prompt se match karta hai
// ══════════════════════════════════════════════

function mapRoleForAI(role: SessionUserRole): SessionUserRole {
  const roleMap: Partial<Record<SessionUserRole, SessionUserRole>> = {
    superadmin: 'admin',
    staff: 'teacher',
  }
  return roleMap[role] ?? role
}

// ══════════════════════════════════════════════
// Default Quick Replies
// Sirf tab use hoti hain jab AI response mein
// quickReplies nahi aati (rare case)
// ══════════════════════════════════════════════

function getDefaultQuickReplies(role: SessionUserRole): QuickReply[] {
  // Logged in portal users
  if (role !== 'guest') {
    const portalReplies: Partial<Record<SessionUserRole, QuickReply[]>> = {
      admin: [
        { text: '💳 Buy Credits', payload: 'buy_credits' },
        { text: '⬆️ Upgrade Plan', payload: 'admin_upgrade' },
        { text: '📞 Support', action: 'forward' },
      ],
      teacher: [
        { text: '✔ Attendance', payload: 'teacher_attendance' },
        { text: '📝 Enter Marks', payload: 'teacher_marks' },
        { text: '📞 Support', action: 'forward' },
      ],
      student: [
        { text: '✔ My Attendance', payload: 'student_attendance_check' },
        { text: '📊 My Results', payload: 'student_results' },
        { text: '💰 Fee Status', payload: 'fee_status_student' },
      ],
      parent: [
        { text: '✔ Attendance', payload: 'student_attendance_check' },
        { text: '💰 Pay Fees', payload: 'fee_status_student' },
        { text: '📊 Results', payload: 'student_results' },
      ],
      staff: [
        { text: '✔ Attendance', payload: 'teacher_attendance' },
        { text: '📞 Support', action: 'forward' },
      ],
      superadmin: [
        { text: '📊 Dashboard', payload: 'admin_dashboard' },
        { text: '📞 Support', action: 'forward' },
      ],
    }
    return portalReplies[role] ?? [
      { text: '📞 Support', action: 'forward' },
    ]
  }

  // Public website visitor
  return [
    { text: '💰 Plans', payload: 'admin_plans_overview' },
    { text: '🎁 Free Trial', payload: 'trial_info' },
    { text: '📦 Features', payload: 'features_overview' },
    { text: '📞 Talk to Us', action: 'forward' },
  ]
}

// ══════════════════════════════════════════════
// Static Fallback Response
// Sirf tab use hota hai jab:
// 1. AI server completely down ho
// 2. Network error ho
// ══════════════════════════════════════════════

function getStaticFallback(
  role: SessionUserRole,
  message: string
): { response: string; quickReplies: QuickReply[] } {
  const msg = message.toLowerCase()

  // Portal users ke liye (logged in)
  if (role !== 'guest') {
    return {
      response:
        "I'm having trouble connecting right now. 😅\n\n" +
        'Please try again in a moment, or contact our support team ' +
        'for immediate help.\n\n' +
        '📧 **support@skolify.in**',
      quickReplies: [
        { text: '🔄 Try Again', payload: 'retry' },
        { text: '📞 Contact Support', action: 'forward' },
      ],
    }
  }

  // Public visitors ke liye - thoda helpful fallback
  const isAboutPricing = ['price', 'plan', 'cost', 'kitna', '₹'].some(
    (kw) => msg.includes(kw)
  )
  const isAboutTrial = ['trial', 'free', 'demo'].some((kw) =>
    msg.includes(kw)
  )
  const isAboutFeatures = ['feature', 'module', 'kya'].some((kw) =>
    msg.includes(kw)
  )

  if (isAboutPricing) {
    return {
      response:
        'Our plans start from **₹499/month**!\n\n' +
        '• Starter: ₹499/mo (500 students)\n' +
        '• Growth: ₹999/mo (1,500 students) ⭐\n' +
        '• Pro: ₹1,999/mo (3,000 students)\n' +
        '• Enterprise: ₹3,999/mo (Unlimited)\n\n' +
        '✅ All plans include **60-day free trial**!',
      quickReplies: getDefaultQuickReplies('guest'),
    }
  }

  if (isAboutTrial) {
    return {
      response:
        '**60-Day Free Trial** — no credit card needed! 🎁\n\n' +
        'Start at **skolify.in/register** — setup in 15 minutes!',
      quickReplies: getDefaultQuickReplies('guest'),
    }
  }

  if (isAboutFeatures) {
    return {
      response:
        'Skolify has **22+ modules** for complete school management!\n\n' +
        'Attendance, Fees, Exams, Library, Transport and more.\n\n' +
        'Visit **skolify.in/features** for the full list!',
      quickReplies: getDefaultQuickReplies('guest'),
    }
  }

  // Generic fallback
  return {
    response:
      "I'm having a bit of trouble right now. 😅\n\n" +
      'You can:\n' +
      '• Visit **skolify.in** for information\n' +
      '• Email us at **support@skolify.in**\n' +
      '• Try asking again in a moment!',
    quickReplies: getDefaultQuickReplies('guest'),
  }
}

// ══════════════════════════════════════════════
// Python AI Call
// ══════════════════════════════════════════════

async function callPythonAI(
  payload: PythonChatPayload
): Promise<AIResponse | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS)

  try {
    const response = await fetch(`${AI_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      console.error(
        `[AI] HTTP ${response.status} | Mode: ${payload.mode}`
      )
      return null
    }

    return (await response.json()) as AIResponse
  } catch (error) {
    clearTimeout(timer)

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[AI] Timeout after', AI_TIMEOUT_MS, 'ms')
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('[AI] Server offline:', AI_API_URL)
      } else {
        console.error('[AI] Error:', error.message)
      }
    }
    return null
  }
}

// ══════════════════════════════════════════════
// Main Handler
// ══════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    // ── Auth & Session ──────────────────────
    const session = await getServerSession(authOptions)

    const userRole = (session?.user?.role as SessionUserRole) || 'guest'
    const userId = session?.user?.id || null
    const userName = session?.user?.name || null

    // Aapke User model mein tenantId hai (school_id nahi)
    const tenantId = (session?.user as any)?.tenantId || null

    // ── Request Body ────────────────────────
    const body = await req.json()
    const {
      message,
      conversation_id,
      // Future: portal widget se aa sakta hai
      // Security: session ka tenantId override karta hai
      tenant_id: bodyTenantId,
    } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message required' },
        { status: 400 }
      )
    }

    // Session tenantId ko priority do (security)
    const effectiveTenantId = tenantId || bodyTenantId || null

    // Portal mode: logged in + tenantId present
    const isPortalMode = !!(
      session &&
      userRole !== 'guest' &&
      effectiveTenantId
    )
    const mode: 'public' | 'portal' = isPortalMode ? 'portal' : 'public'

    console.log(
      `\n[Chat] Mode: ${mode} | Role: ${userRole} | ` +
        `Tenant: ${effectiveTenantId?.slice(-6) || 'none'} | ` +
        `Msg: "${message.slice(0, 50)}${message.length > 50 ? '...' : ''}"`
    )

    // ── Call Python AI ──────────────────────
    const aiPayload: PythonChatPayload = {
      message,
      conversation_id: conversation_id || null,
      role: mapRoleForAI(userRole),
      mode,
      tenant_id: effectiveTenantId,
      user_id: userId,
      user_name: userName,
    }

    const aiResult = await callPythonAI(aiPayload)

    // ── AI Success ──────────────────────────
    if (aiResult?.success) {
      console.log(
        `[AI] ✅ LLM: ${aiResult.metadata?.llm_used} | ` +
          `Provider: ${aiResult.metadata?.llm_provider} | ` +
          `Chunks: ${aiResult.metadata?.context_chunks}`
      )

      return NextResponse.json({
        success: true,
        response: aiResult.answer,
        // AI se quickReplies aati hain, fallback sirf rare case mein
        quickReplies:
          aiResult.quickReplies ?? getDefaultQuickReplies(userRole),
        canForward: aiResult.canForward ?? false,
        conversation_id: aiResult.conversation_id,
        source: aiResult.metadata?.source || 'ai_groq',
        aiMetadata: aiResult.metadata,
        // Dev mode mein debug info
        ...(process.env.NODE_ENV === 'development' && {
          _debug: {
            mode,
            role: userRole,
            mappedRole: mapRoleForAI(userRole),
            tenant: effectiveTenantId,
            isPortal: isPortalMode,
          },
        }),
      })
    }

    // ── Static Fallback (AI down/timeout) ───
    // qa-database nahi, static responses use karo
    console.log('[Chat] ⚠️  AI unavailable, using static fallback')

    const fallback = getStaticFallback(userRole, message)

    return NextResponse.json({
      success: true,
      response: fallback.response,
      quickReplies: fallback.quickReplies,
      canForward: true, // AI down hai to human se baat karne do
      conversation_id: conversation_id || null,
      source: 'static_fallback',
    })
  } catch (error) {
    console.error('[Chat] ❌ Unhandled error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        // Client ko graceful message
        response:
          'Something went wrong. Please try again or contact support@skolify.in',
      },
      { status: 500 }
    )
  }
}

// ══════════════════════════════════════════════
// Health Check
// ══════════════════════════════════════════════

export async function GET() {
  try {
    const res = await fetch(`${AI_API_URL}/api/health`, {
      signal: AbortSignal.timeout(5000),
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({
        status: 'ok',
        ai_backend: data,
        config: {
          ai_url: AI_API_URL,
          timeout_ms: AI_TIMEOUT_MS,
        },
      })
    }

    return NextResponse.json({ status: 'backend_error' }, { status: 503 })
  } catch {
    return NextResponse.json(
      {
        status: 'backend_offline',
        ai_url: AI_API_URL,
        message: 'Python AI server is not reachable',
      },
      { status: 503 }
    )
  }
}