// =============================================================
// FILE: src/lib/push.ts — Send push notifications
// =============================================================

import webpush from 'web-push'

webpush.setVapidDetails(
    'mailto:shivshakticomputeracademy25@gmail.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
)

export interface PushPayload {
    title: string
    body: string
    icon?: string
    badge?: string
    url?: string
    tag?: string
    requireInteraction?: boolean
}

export async function sendPushToUser(
    subscriptionJson: string,
    payload: PushPayload
): Promise<boolean> {
    try {
        const subscription = JSON.parse(subscriptionJson)
        await webpush.sendNotification(
            subscription,
            JSON.stringify({ ...payload, icon: payload.icon ?? '/icons/icon-192x192.png' })
        )
        return true
    } catch (err: any) {
        if (err.statusCode === 410) {
            // Subscription expired — should be removed from DB
            console.log('[Push] Subscription expired, remove from DB')
        }
        return false
    }
}

export async function sendPushToTenant(
    tenantId: string,
    roles: string[],
    payload: PushPayload
) {
    const { connectDB } = await import('./db')
    const { User } = await import('@/models/User')
    await connectDB()

    const users = await User.find({
        tenantId,
        role: { $in: roles },
        pushEnabled: true,
        pushSubscription: { $ne: null },
    }).select('pushSubscription').lean() as any[]

    let sent = 0
    await Promise.allSettled(
        users.map(async u => {
            const ok = await sendPushToUser(u.pushSubscription, payload)
            if (ok) sent++
        })
    )

    return { total: users.length, sent }
}

// PUSH_TEMPLATES
export const PUSH_TEMPLATES = {
    noticePosted: (schoolName: string, title: string) => ({
        title: `📢 ${schoolName}`,
        body: title,
        tag: 'notice',
        url: '/student/notices',
    }),

    feeDue: (studentName: string, amount: number, dueDate: string) => ({
        title: 'Fee Payment Reminder',
        body: `₹${amount.toLocaleString('en-IN')} due on ${dueDate}`,
        tag: 'fee',
        url: '/parent/fees',
        requireInteraction: true,
    }),

    attendanceMarked: (studentName: string, status: string) => ({
        title: `${studentName}'s Attendance`,
        body: status === 'absent'
            ? `${studentName} was marked absent today`
            : `${studentName} is present today`,
        tag: 'attendance',
        url: '/parent/attendance',
    }),

    resultPublished: (examName: string) => ({
        title: 'Results Published',
        body: `${examName} results are now available`,
        tag: 'result',
        url: '/student/results',
    }),
}