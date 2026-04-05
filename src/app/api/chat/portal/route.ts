// src/app/api/chat/portal/route.ts

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

export async function POST(req: NextRequest) {
    try {
        // ── Auth Check ───────────────────────────────────────
        const session = await getServerSession(authOptions)

        if (!session?.user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized - Login required' },
                { status: 401 }
            )
        }

        const userRole = (session.user.role as SessionUserRole) || 'guest'

        // Guest portal access nahi kar sakta
        if (userRole === 'guest') {
            return NextResponse.json(
                { success: false, error: 'Portal access requires login' },
                { status: 403 }
            )
        }

        const userId = session.user.id || null
        const userName = session.user.name || null

        // ✅ Session se tenantId lo - body se override nahi hoga (security)
        const sessionTenantId = (session.user as any)?.tenantId || null

        if (!sessionTenantId) {
            return NextResponse.json(
                { success: false, error: 'No school associated with account' },
                { status: 400 }
            )
        }

        // ── Request Body ─────────────────────────────────────
        const body = await req.json()
        const { message, conversation_id } = body

        if (!message?.trim()) {
            return NextResponse.json(
                { success: false, error: 'Message required' },
                { status: 400 }
            )
        }

        console.log(
            `\n[Portal Chat] Role: ${userRole} | ` +
            `Tenant: ${sessionTenantId.slice(-6)} | ` +
            `Msg: "${message.slice(0, 50)}"`
        )

        // ── Python AI Call ───────────────────────────────────
        const aiPayload: PythonChatPayload = {
            message,
            conversation_id: conversation_id || null,
            role: mapRoleForAI(userRole),
            mode: 'portal',
            // ✅ Always session ka tenantId use karo
            tenant_id: sessionTenantId,
            user_id: userId,
            user_name: userName,
        }

        const aiResult = await callPythonAI(aiPayload)

        if (aiResult?.success) {
            return NextResponse.json({
                success: true,
                response: aiResult.answer,
                quickReplies: aiResult.quickReplies ?? getDefaultQuickReplies(userRole),
                canForward: aiResult.canForward ?? false,
                conversation_id: aiResult.conversation_id,
                source: aiResult.metadata?.source || 'ai_portal',
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