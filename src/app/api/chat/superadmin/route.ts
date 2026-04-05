// src/app/api/chat/superadmin/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { callPythonAI, AI_API_URL } from '@/lib/chat-helpers'
import { SessionUserRole, PythonChatPayload, QuickReply } from '@/types/chat'

const SUPERADMIN_QUICK_REPLIES: QuickReply[] = [
    { text: '📈 Revenue Today', payload: 'revenue_today' },
    { text: '🏫 Active Schools', payload: 'active_schools' },
    { text: '👥 Total Users', payload: 'total_users' },
    { text: '💳 Subscriptions', payload: 'subscription_stats' },
    { text: '🔧 System Health', payload: 'system_health' },
]

export async function POST(req: NextRequest) {
    try {
        // ── Strict Superadmin Check ──────────────────────────
        const session = await getServerSession(authOptions)
        const userRole = (session?.user?.role as SessionUserRole) || 'guest'

        if (!session?.user || userRole !== 'superadmin') {
            return NextResponse.json(
                { success: false, error: 'Superadmin access only' },
                { status: 403 }
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

        console.log(
            `\n[Superadmin Chat] User: ${session.user.name} | ` +
            `Msg: "${message.slice(0, 50)}"`
        )

        // ── Python AI Call ───────────────────────────────────
        // Superadmin ke liye special endpoint try karo
        // Agar nahi hai to regular chat use karo
        let aiResult = null

        try {
            const controller = new AbortController()
            setTimeout(() => controller.abort(), 60000) // 60s for analytics

            const res = await fetch(`${AI_API_URL}/api/superadmin-chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    conversation_id: conversation_id || null,
                    superadmin_id: session.user.id,
                    superadmin_name: session.user.name,
                }),
                signal: controller.signal,
            })

            if (res.ok) {
                aiResult = await res.json()
            }
        } catch {
            // Superadmin endpoint nahi hai - regular chat fallback
            console.log('[Superadmin Chat] Falling back to regular chat endpoint')
        }

        // Regular chat fallback agar superadmin endpoint nahi
        if (!aiResult?.success) {
            const aiPayload: PythonChatPayload = {
                message,
                conversation_id: conversation_id || null,
                role: 'admin', // superadmin → admin map
                mode: 'portal',
                tenant_id: null, // Superadmin ka koi specific tenant nahi
                user_id: session.user.id,
                user_name: session.user.name,
            }
            aiResult = await callPythonAI(aiPayload, 60000)
        }

        if (aiResult?.success) {
            return NextResponse.json({
                success: true,
                response: aiResult.answer,
                quickReplies: aiResult.quickReplies ?? SUPERADMIN_QUICK_REPLIES,
                canForward: false,
                conversation_id: aiResult.conversation_id,
                source: 'ai_superadmin',
            })
        }

        // Final fallback
        return NextResponse.json({
            success: true,
            response: '⚡ **Superadmin Console**\n\nAI backend se connect nahi ho pa raha.\n\nDirect dashboard check karo ya thodi der baad try karo.',
            quickReplies: SUPERADMIN_QUICK_REPLIES,
            canForward: false,
            conversation_id: conversation_id || null,
            source: 'static_fallback',
        })

    } catch (error) {
        console.error('[Superadmin Chat] ❌ Error:', error)
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        )
    }
}