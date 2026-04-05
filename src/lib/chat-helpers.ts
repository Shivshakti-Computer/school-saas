// src/lib/chat-helpers.ts
// Shared logic jo route.ts mein thi - ab reuse hogi

import { SessionUserRole, QuickReply, AIResponse, PythonChatPayload } from '@/types/chat'

const AI_API_URL = process.env.AI_API_URL || 'http://127.0.0.1:7860'
const AI_TIMEOUT_MS = 35000

// ── Role Mapper ───────────────────────────────────────────
// staff → teacher, superadmin → admin (Python backend match)
export function mapRoleForAI(role: SessionUserRole): SessionUserRole {
  const roleMap: Partial<Record<SessionUserRole, SessionUserRole>> = {
    superadmin: 'admin',
    staff: 'teacher',
  }
  return roleMap[role] ?? role
}

// ── Default Quick Replies ─────────────────────────────────
export function getDefaultQuickReplies(role: SessionUserRole): QuickReply[] {
  if (role !== 'guest') {
    const portalReplies: Partial<Record<SessionUserRole, QuickReply[]>> = {
      admin: [
        { text: '💳 Buy Credits',  payload: 'buy_credits' },
        { text: '⬆️ Upgrade Plan', payload: 'admin_upgrade' },
        { text: '📞 Support',      action: 'forward' },
      ],
      teacher: [
        { text: '✔ Attendance',   payload: 'teacher_attendance' },
        { text: '📝 Enter Marks', payload: 'teacher_marks' },
        { text: '📞 Support',     action: 'forward' },
      ],
      student: [
        { text: '✔ My Attendance', payload: 'student_attendance_check' },
        { text: '📊 My Results',   payload: 'student_results' },
        { text: '💰 Fee Status',   payload: 'fee_status_student' },
      ],
      parent: [
        { text: '✔ Attendance',  payload: 'student_attendance_check' },
        { text: '💰 Pay Fees',   payload: 'fee_status_student' },
        { text: '📊 Results',    payload: 'student_results' },
      ],
      staff: [
        { text: '✔ Attendance', payload: 'teacher_attendance' },
        { text: '📞 Support',   action: 'forward' },
      ],
      superadmin: [
        { text: '📊 Dashboard', payload: 'admin_dashboard' },
        { text: '📞 Support',   action: 'forward' },
      ],
    }
    return portalReplies[role] ?? [{ text: '📞 Support', action: 'forward' }]
  }

  return [
    { text: '💰 Plans',      payload: 'admin_plans_overview' },
    { text: '🎁 Free Trial', payload: 'trial_info' },
    { text: '📦 Features',   payload: 'features_overview' },
    { text: '📞 Talk to Us', action: 'forward' },
  ]
}

// ── Static Fallback ───────────────────────────────────────
export function getStaticFallback(
  role: SessionUserRole,
  message: string
): { response: string; quickReplies: QuickReply[] } {
  const msg = message.toLowerCase()

  if (role !== 'guest') {
    return {
      response:
        "I'm having trouble connecting right now. 😅\n\n" +
        'Please try again in a moment, or contact support.\n\n' +
        '📧 **support@skolify.in**',
      quickReplies: [
        { text: '🔄 Try Again',        payload: 'retry' },
        { text: '📞 Contact Support',  action: 'forward' },
      ],
    }
  }

  const isAboutPricing  = ['price', 'plan', 'cost', 'kitna', '₹'].some(kw => msg.includes(kw))
  const isAboutTrial    = ['trial', 'free', 'demo'].some(kw => msg.includes(kw))
  const isAboutFeatures = ['feature', 'module', 'kya'].some(kw => msg.includes(kw))

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

// ── Python AI Caller ──────────────────────────────────────
export async function callPythonAI(
  payload: PythonChatPayload,
  timeoutMs: number = AI_TIMEOUT_MS
): Promise<AIResponse | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(`${AI_API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timer)

    if (!response.ok) {
      console.error(`[AI] HTTP ${response.status} | Mode: ${payload.mode}`)
      return null
    }

    return (await response.json()) as AIResponse

  } catch (error) {
    clearTimeout(timer)
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('[AI] Timeout after', timeoutMs, 'ms')
      } else if (error.message.includes('ECONNREFUSED')) {
        console.error('[AI] Server offline:', AI_API_URL)
      } else {
        console.error('[AI] Error:', error.message)
      }
    }
    return null
  }
}

// ── AI API URL getter ─────────────────────────────────────
export { AI_API_URL, AI_TIMEOUT_MS }