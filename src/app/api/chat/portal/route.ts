// src/app/api/chat/portal/route.ts
// UPDATE: Session cookie Python ko pass karo tool calling ke liye

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
    mapRoleForAI,
    getDefaultQuickReplies,
    getStaticFallback,
    callPythonAI,
} from '@/lib/chat-helpers'
import { SessionUserRole, PythonChatPayload } from '@/types/chat'

const AI_BACKEND_URL = process.env.AI_API_URL || 'http://127.0.0.1:7860'

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const userRole = (session.user.role as SessionUserRole) || 'guest'
        if (userRole === 'guest') {
            return NextResponse.json(
                { success: false, error: 'Portal access requires login' },
                { status: 403 }
            )
        }

        const userId = session.user.id || null
        const userName = session.user.name || null
        const tenantId = (session.user as any)?.tenantId || null
        const schoolName = (session.user as any)?.schoolName || null

        if (!tenantId) {
            return NextResponse.json(
                { success: false, error: 'No school associated' },
                { status: 400 }
            )
        }

        const body = await req.json()
        const { message, conversation_id } = body

        if (!message?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Message required' },
                { status: 400 }
            )
        }

        // ✅ Session cookie extract karo tool calling ke liye
        const sessionCookie = req.headers.get('cookie') || ''

        console.log(
            `\n[Portal Chat] Role: ${userRole} | ` +
            `Tenant: ${tenantId.slice(-6)} | ` +
            `Msg: "${message.slice(0, 50)}"`
        )

        // ── Python Backend Call ────────────────────────────
        const controller = new AbortController()
        setTimeout(() => controller.abort(), 35000)

        const backendRes = await fetch(
            `${AI_BACKEND_URL}/api/portal-chat`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversation_id: conversation_id || null,
                    tenant_id: tenantId,
                    user_role: userRole,
                    user_id: userId,
                    user_name: userName,
                    school_name: schoolName,
                    // ✅ Session cookie pass karo
                    session_cookie: sessionCookie,
                }),
                signal: controller.signal,
            }
        )

        if (!backendRes.ok) {
            throw new Error(`Backend error: ${backendRes.status}`)
        }

        const data = await backendRes.json()

        if (data.success) {
            return NextResponse.json({
                success: true,
                response: data.answer,
                quickReplies: data.quickReplies ?? getDefaultQuickReplies(userRole),
                canForward: data.canForward ?? false,
                conversation_id: data.conversation_id,
                source: data.metadata?.source || 'ai_portal',
                tool_used: data.metadata?.tool_used || false,
                tool_name: data.metadata?.tool_name || null,
            })
        }

        // Fallback
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
        console.error('[Portal Chat] ❌ Error:', error)
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        )
    }
}