/* ============================================================
   FILE: src/lib/validators/attendance.ts
   UPDATED: Stream param added
   ============================================================ */

import { z } from 'zod'

export const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD')

export const monthStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM')

export const classSchema = z
  .string()
  .min(1, 'Class is required')
  .max(20)

export const sectionSchema = z
  .string()
  .min(1)
  .max(5)
  .toUpperCase()

export const attendanceStatusSchema = z.enum([
  'present',
  'absent',
  'late',
  'holiday',
  'half-day',
])

export const attendanceStatusUISchema = z.enum([
  'present',
  'absent',
  'late',
  'pending',
])

// ── GET /api/attendance ───────────────────────────────────────

export const attendanceGetSchema = z.object({
  date:    dateStringSchema.optional(),
  class:   classSchema,
  section: sectionSchema.optional(),
  stream:  z.string().optional(),  // ✅ Added
})

export type AttendanceGetInput = z.infer<typeof attendanceGetSchema>

// ── POST /api/attendance ──────────────────────────────────────

export const attendanceRecordSchema = z.object({
  studentId: z
    .string()
    .min(1, 'studentId required')
    .regex(/^[a-f\d]{24}$/i, 'Invalid studentId'),
  status: attendanceStatusSchema,
})

export const attendancePostSchema = z.object({
  date: dateStringSchema.refine(
    d => d <= new Date().toISOString().split('T')[0],
    'Cannot mark attendance for future dates'
  ),
  records:       z.array(attendanceRecordSchema).min(1, 'At least one record required'),
  subject:       z.string().trim().max(100).optional(),
  sendAbsentSms: z.boolean().optional().default(true),
})

export type AttendancePostInput    = z.infer<typeof attendancePostSchema>
export type AttendanceRecordInput  = z.infer<typeof attendanceRecordSchema>

// ── GET /api/attendance/report ────────────────────────────────

export const attendanceReportSchema = z.object({
  month:     monthStringSchema,
  studentId: z
    .string()
    .regex(/^[a-f\d]{24}$/i, 'Invalid studentId')
    .optional(),
  class:   classSchema.optional(),
  section: sectionSchema.optional(),
})

export type AttendanceReportInput = z.infer<typeof attendanceReportSchema>

// ── GET /api/attendance/summary ───────────────────────────────

export const attendanceSummarySchema = z.object({
  date:    dateStringSchema.optional(),
  class:   classSchema.optional(),
  section: sectionSchema.optional(),
})

export type AttendanceSummaryInput = z.infer<typeof attendanceSummarySchema>