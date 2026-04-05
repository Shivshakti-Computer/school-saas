// src/app/api/chat/route.ts
// CHANGE: data.response → data.answer (Python backend answer bhejta hai)
// CHANGE: helpers use karo

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SessionUserRole, PythonChatPayload } from '@/types/chat'
import { 
  AI_TIMEOUT_MS, 
  AI_API_URL,
  mapRoleForAI,
  callPythonAI,
  getDefaultQuickReplies,
  getStaticFallback
  
} from '@/lib/chat-helpers'

export async function POST(req: NextRequest) {
  try {
    // ── Session ──────────────────────────────────────────
    const session   = await getServerSession(authOptions)
    const userRole  = (session?.user?.role as SessionUserRole) || 'guest'
    const userId    = session?.user?.id   || null
    const userName  = session?.user?.name || null
    const tenantId  = (session?.user as any)?.tenantId || null

    // ── Request Body ─────────────────────────────────────
    const body = await req.json()
    const { message, conversation_id, tenant_id: bodyTenantId } = body

    if (!message?.trim()) {
      return NextResponse.json(
        { success: false, error: 'Message required' },
        { status: 400 }
      )
    }

    // Session tenantId ko priority (security)
    const effectiveTenantId = tenantId || bodyTenantId || null
    const isPortalMode = !!(session && userRole !== 'guest' && effectiveTenantId)
    const mode = isPortalMode ? 'portal' : 'public'

    console.log(
      `\n[Chat] Mode: ${mode} | Role: ${userRole} | ` +
      `Tenant: ${effectiveTenantId?.slice(-6) || 'none'} | ` +
      `Msg: "${message.slice(0, 50)}"`
    )

    // ── Python AI Call ───────────────────────────────────
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

    // ── AI Success ───────────────────────────────────────
    if (aiResult?.success) {
      console.log(
        `[AI] ✅ Provider: ${aiResult.metadata?.llm_provider} | ` +
        `Chunks: ${aiResult.metadata?.context_chunks}`
      )

      return NextResponse.json({
        success: true,
        // ✅ FIX: Python "answer" field use karo
        response: aiResult.answer,
        quickReplies: aiResult.quickReplies ?? getDefaultQuickReplies(userRole),
        canForward: aiResult.canForward ?? false,
        conversation_id: aiResult.conversation_id,
        source: aiResult.metadata?.source || 'ai_groq',
        ...(process.env.NODE_ENV === 'development' && {
          _debug: { mode, role: userRole, tenant: effectiveTenantId },
        }),
      })
    }

    // ── Static Fallback ──────────────────────────────────
    console.log('[Chat] ⚠️ AI unavailable, static fallback')
    const fallback = getStaticFallback(userRole, message)

    return NextResponse.json({
      success: true,
      response: fallback.response,
      quickReplies: fallback.quickReplies,
      canForward: true,
      conversation_id: conversation_id || null,
      source: 'static_fallback',
    })

  } catch (error) {
    console.error('[Chat] ❌ Unhandled error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Server error',
        response: 'Something went wrong. Please try again or contact support@skolify.in',
      },
      { status: 500 }
    )
  }
}

// ── Health Check ──────────────────────────────────────────
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
        config: { ai_url: AI_API_URL, timeout_ms: AI_TIMEOUT_MS },
      })
    }
    return NextResponse.json({ status: 'backend_error' }, { status: 503 })
  } catch {
    return NextResponse.json(
      { status: 'backend_offline', ai_url: AI_API_URL },
      { status: 503 }
    )
  }
}