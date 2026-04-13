// FILE: src/lib/validators/notice.ts
// UPDATE createNoticeSchema

import { z } from 'zod'

// ── Create Notice Schema ──
export const createNoticeSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title too long'),
  
  content: z.string()
    .min(10, 'Content must be at least 10 characters')
    .max(5000, 'Content too long'),
  
  status: z.enum(['draft', 'published', 'archived'])
    .default('published'),
  
  targetRole: z.enum(['all', 'student', 'teacher', 'parent', 'staff'])
    .default('all'),
  
  targetClasses: z.array(z.string()).default([]),
  
  priority: z.enum(['low', 'normal', 'high', 'urgent'])
    .default('normal'),
  
  expiresAt: z.coerce.date()
    .min(new Date(), 'Expiry date must be in the future')
    .optional()
    .or(z.literal('')),
  
  isPinned: z.boolean().default(false),
  
  sendSms: z.boolean().default(false),
  sendWhatsApp: z.boolean().default(false),  // ✅ ADD THIS
  sendEmail: z.boolean().default(false),
  sendPush: z.boolean().default(false),
  
  attachments: z.array(z.object({
    name: z.string(),
    url: z.string().url(),
    type: z.enum(['pdf', 'image', 'doc', 'other']),
    size: z.number().positive(),
  })).optional().default([]),
})

// ── Update Notice Schema ──
export const updateNoticeSchema = createNoticeSchema.partial()

// ── Publish Notice Schema ──
export const publishNoticeSchema = z.object({
  sendSms: z.boolean().default(false),
  sendWhatsApp: z.boolean().default(false),  // ✅ ADD THIS
  sendEmail: z.boolean().default(false),
  sendPush: z.boolean().default(true),
})

// ── Filter Schema ──
export const noticeFilterSchema = z.object({
  status: z.enum(['draft', 'published', 'archived']).optional(),
  targetRole: z.enum(['all', 'student', 'teacher', 'parent', 'staff']).optional(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  search: z.string().optional(),
  isPinned: z.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['publishedAt', 'createdAt', 'priority']).default('publishedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
})

// ── Type exports ──
export type CreateNoticeInput = z.infer<typeof createNoticeSchema>
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>
export type PublishNoticeInput = z.infer<typeof publishNoticeSchema>
export type NoticeFilterInput = z.infer<typeof noticeFilterSchema>