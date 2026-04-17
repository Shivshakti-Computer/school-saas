// FILE: src/lib/validators/homework.ts
// ═══════════════════════════════════════════════════════════
// Homework Validators — Zod Schemas
// ═══════════════════════════════════════════════════════════

import { z } from 'zod'

// ── Create Homework Schema ──
export const createHomeworkSchema = z.object({
    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title too long'),

    description: z.string()
        .min(10, 'Description must be at least 10 characters')
        .max(2000, 'Description too long'),

    subject: z.string()
        .min(2, 'Subject is required'),

    class: z.string()
        .min(1, 'Class is required'),

    section: z.string().optional(),

    targetStudents: z.array(z.string()).default([]),

    dueDate: z.coerce.date()
        .min(new Date(), 'Due date must be in the future'),

    allowLateSubmission: z.boolean().default(true),

    attachments: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.enum(['pdf', 'image', 'doc', 'other']),
        size: z.number().positive(),
    })).optional().default([]),

    maxFileSizeMB: z.number().min(1).max(50).default(10),

    allowedFileTypes: z.array(z.string()).default([
        'pdf', 'jpg', 'jpeg', 'png', 'docx'
    ]),

    sendNotification: z.boolean().default(true),
    notificationChannels: z.object({
        sms: z.boolean().default(false),
        whatsapp: z.boolean().default(false),
        email: z.boolean().default(false),
        push: z.boolean().default(true),
    }).optional(),
})

// ── Update Homework Schema ──
export const updateHomeworkSchema = z.object({
    title: z.string().min(3).max(200).optional(),
    description: z.string().min(10).max(2000).optional(),
    dueDate: z.coerce.date().optional(),
    allowLateSubmission: z.boolean().optional(),
    status: z.enum(['active', 'archived']).optional(),
})

// ── Submit Homework Schema ──
export const submitHomeworkSchema = z.object({
    remarks: z.string().max(500).optional(),
    attachments: z.array(z.object({
        name: z.string(),
        url: z.string().url(),
        type: z.enum(['pdf', 'image', 'doc', 'other']),
        size: z.number().positive(),
    })).min(1, 'At least one file is required'),
})

// ── Grade Submission Schema ──
export const gradeSubmissionSchema = z.object({
    studentId: z.string().min(1, 'Student ID is required'),
    marks: z.number().min(0).optional(),
    maxMarks: z.number().min(1).optional(),
    grade: z.string().max(10).optional(),
    feedback: z.string().max(1000).optional(),
}).refine(
    data => {
        if (data.marks !== undefined && data.maxMarks !== undefined) {
            return data.marks <= data.maxMarks
        }
        return true
    },
    { message: 'Marks cannot exceed max marks' }
)

// ── Filter Schema ──
export const homeworkFilterSchema = z.object({
    status: z.enum(['active', 'archived']).optional(),
    class: z.string().optional(),
    section: z.string().optional(),
    subject: z.string().optional(),
    search: z.string().optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    sortBy: z.enum(['dueDate', 'createdAt', 'submittedCount']).default('dueDate'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

// ── Type exports ──
export type CreateHomeworkInput = z.infer<typeof createHomeworkSchema>
export type UpdateHomeworkInput = z.infer<typeof updateHomeworkSchema>
export type SubmitHomeworkInput = z.infer<typeof submitHomeworkSchema>
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>
export type HomeworkFilterInput = z.infer<typeof homeworkFilterSchema>