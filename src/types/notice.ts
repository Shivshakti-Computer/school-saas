// FILE: src/types/notice.ts

import type { NoticeStatus, NoticePriority, NoticeTargetRole } from '@/models/Notice'

// ── Form Data (for create/edit) ──
export interface NoticeFormData {
    title: string
    content: string
    status: NoticeStatus
    targetRole: NoticeTargetRole
    targetClasses: string[]
    priority: NoticePriority
    expiresAt?: string
    isPinned: boolean
    sendSms: boolean
    sendWhatsApp: boolean  // ✅ ADD THIS
    sendEmail: boolean
    sendPush: boolean
}

// ── List Item (for listing view) ──
export interface NoticeListItem {
    _id: string
    title: string
    content: string
    status: NoticeStatus
    priority: NoticePriority
    targetRole: NoticeTargetRole
    targetClasses: string[]
    isPinned: boolean
    publishedAt?: string
    expiresAt?: string
    createdByName: string
    createdByRole: string
    readCount: number
    notificationCount: number
    smsSent: boolean
    emailSent: boolean
    whatsappSent?: boolean  // ✅ ADD
    pushSent: boolean
    creditsUsed: number  // ✅ VERIFY THIS EXISTS
    attachments: Array<{
        name: string
        url: string
        type: string
        size: number
    }>
    createdAt: string
    isExpired?: boolean
}

// ── Detail View ──
export interface NoticeDetail extends NoticeListItem {
    createdBy: string
    updatedAt: string
    content: string // Full content
}

// ── Filters ──
export interface NoticeFilters {
    status?: NoticeStatus
    targetRole?: NoticeTargetRole
    priority?: NoticePriority
    search?: string
    isPinned?: boolean
    page?: number
    limit?: number
    sortBy?: 'publishedAt' | 'createdAt' | 'priority'
    sortOrder?: 'asc' | 'desc'
}

// ── Stats ──
export interface NoticeStats {
    total: number
    published: number
    draft: number
    archived: number
    pinned: number
    urgent: number
    unreadCount?: number // For specific user
}

// ── API Response Types ──
export interface NoticeListResponse {
    notices: NoticeListItem[]
    total: number
    page: number
    limit: number
    pages: number
    stats?: NoticeStats
}

export interface NoticeCreateResponse {
    notice: NoticeDetail
    sms?: {
        sent: number
        failed: number
        skipped: number
        creditsUsed: number
        creditError?: string
    }
    whatsapp?: {  // ✅ ADD THIS
        sent: number
        failed: number
        skipped: number
        creditsUsed: number
        creditError?: string
    }
    email?: {
        sent: number
        failed: number
        skipped: number
        creditsUsed: number
        creditError?: string
    }
    push?: {
        sent: boolean
    }
    warning?: string
}
