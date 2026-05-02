// FILE: src/lib/validators/certificate.ts
// UPDATED: Add franchiseId to issue schemas
// ═══════════════════════════════════════════════════════════

import { z } from 'zod'

// ── Certificate Types ──
const certificateTypes = [
    'merit', 'participation', 'achievement', 'appreciation', 'custom',
    'character', 'sports',
    'completion', 'internship', 'skill', 'test_topper',
] as const

const recipientTypes = ['student', 'staff'] as const
const layouts = ['classic', 'modern', 'elegant'] as const

// ── Field Schema ──
const fieldSchema = z.object({
    name: z.string()
        .min(1, 'Field name required')
        .max(50, 'Field name too long')
        .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Invalid field name format'),
    type: z.enum(['text', 'date', 'number']),
    required: z.boolean().default(false),
    placeholder: z.string().max(100).optional(),
})

// ── Create Template Schema ──
export const createTemplateSchema = z.object({
    name: z.string()
        .min(3, 'Name must be at least 3 characters')
        .max(200, 'Name too long'),

    type: z.enum(certificateTypes),

    category: z.string()
        .max(100)
        .optional(),

    template: z.string()
        .min(20, 'Template content must be at least 20 characters')
        .max(3000, 'Template too long'),

    layout: z.enum(layouts).default('modern'),

    applicableTo: z.enum([...recipientTypes, 'both'] as const)
        .default('student'),

    fields: z.array(fieldSchema)
        .max(10, 'Maximum 10 fields allowed')
        .default([]),

    showAccreditations: z.boolean().default(true),

    signatureLabel: z.string()
        .max(50)
        .default('Principal'),

    borderStyle: z.string().max(50).optional(),
})

// ── Update Template Schema ──
export const updateTemplateSchema = createTemplateSchema.partial()

// ── Issue Certificate Schema ──
// ✅ UPDATED: Add franchiseId
export const issueCertificateSchema = z.object({
    templateId: z.string().min(1, 'Template ID required'),

    recipientType: z.enum(recipientTypes),

    recipientId: z.string().min(1, 'Recipient ID required'),

    title: z.string()
        .min(3, 'Title must be at least 3 characters')
        .max(200, 'Title too long'),

    // ✅ NEW: Franchise ID (optional)
    franchiseId: z.string().optional(),

    courseId: z.string().optional(),
    courseName: z.string().max(200).optional(),
    batchId: z.string().optional(),
    class: z.string().max(20).optional(),
    section: z.string().max(20).optional(),
    academicYear: z.string().max(20).optional(),

    customData: z.record(z.string(), z.string()).default({}),
})

// ── Bulk Issue Schema ──
// ✅ UPDATED: Add franchiseId
export const bulkIssueCertificateSchema = z.object({
    templateId: z.string().min(1, 'Template ID required'),

    recipientType: z.enum(recipientTypes),

    recipientIds: z.array(z.string()).optional(),
    class: z.string().optional(),
    section: z.string().optional(),

    titleTemplate: z.string()
        .min(3, 'Title template required')
        .max(200, 'Title template too long'),

    // ✅ NEW: Franchise ID (optional)
    franchiseId: z.string().optional(),

    commonData: z.record(z.string(), z.string()).default({}),
})

// ── Save PDF Schema ──
export const savePdfSchema = z.object({
    issuedCertId: z.string().min(1, 'Issued certificate ID required'),
})

// ── Revoke Certificate Schema ──
export const revokeCertificateSchema = z.object({
    reason: z.string()
        .min(3, 'Reason must be at least 3 characters')
        .max(500, 'Reason too long'),
})

// ── Filter Schema ──
export const certificateFilterSchema = z.object({
    type: z.enum(['templates', 'issued']).default('templates'),

    recipientType: z.enum(recipientTypes)
        .nullish()
        .transform(v => v ?? undefined),

    recipientId: z.string()
        .nullish()
        .transform(v => v ?? undefined),

    certificateType: z.enum(certificateTypes)
        .nullish()
        .transform(v => v ?? undefined),

    status: z.enum(['issued', 'revoked'])
        .nullish()
        .transform(v => v ?? undefined),

    search: z.string()
        .nullish()
        .transform(v => v ?? undefined),

    // ✅ NEW: Franchise filter
    franchiseId: z.string()
        .nullish()
        .transform(v => v ?? undefined),

    page: z.preprocess(
        (val) => {
            if (val === null || val === undefined || val === '') return 1
            const num = Number(val)
            return isNaN(num) || num <= 0 ? 1 : num
        },
        z.number().int().positive()
    ),

    limit: z.preprocess(
        (val) => {
            if (val === null || val === undefined || val === '') return 20
            const num = Number(val)
            return isNaN(num) || num <= 0 ? 20 : Math.min(num, 100)
        },
        z.number().int().positive().max(100)
    ),

    sortBy: z.enum(['createdAt', 'issuedDate', 'recipientName'])
        .nullish()
        .transform(v => v ?? 'createdAt'),

    sortOrder: z.enum(['asc', 'desc'])
        .nullish()
        .transform(v => v ?? 'desc'),

    prefix: z.string()
        .max(6, 'Prefix must be 6 characters or less')
        .regex(/^[A-Z0-9]+$/, 'Prefix must be alphanumeric')
        .optional(),
})

// ── Verification Schema ──
export const verifyCertificateSchema = z.object({
    code: z.string()
        .min(10, 'Invalid verification code')
        .max(20, 'Invalid verification code')
        .regex(/^[A-Z0-9]{1,6}-CERT-[A-Z0-9]{8}$/, 'Invalid code format. Expected: PREFIX-CERT-XXXXXXXX'),
})

// ── Type Exports ──
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>
export type IssueCertificateInput = z.infer<typeof issueCertificateSchema>
export type BulkIssueCertificateInput = z.infer<typeof bulkIssueCertificateSchema>
export type SavePdfInput = z.infer<typeof savePdfSchema>
export type RevokeCertificateInput = z.infer<typeof revokeCertificateSchema>
export type CertificateFilterInput = z.infer<typeof certificateFilterSchema>
export type VerifyCertificateInput = z.infer<typeof verifyCertificateSchema>