/* =============================================================
   COPY EACH SECTION INTO ITS OWN FILE IN src/models/
   ============================================================= */


/* ─────────────────────────────────────────────
   FILE: src/models/Attendance.ts
───────────────────────────────────────────── */
import mongoose, { Schema, Document } from 'mongoose'

export interface IAttendance extends Document {
    tenantId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    date: string                    // "YYYY-MM-DD"
    subject?: string
    period?: number
    status: 'present' | 'absent' | 'late' | 'holiday' | 'half-day'
    markedBy: mongoose.Types.ObjectId
    smsSent: boolean
    remarks?: string
}

const AttendanceSchema = new Schema<IAttendance>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    date: { type: String, required: true },
    subject: { type: String },
    period: { type: Number },
    status: { type: String, enum: ['present', 'absent', 'late', 'holiday', 'half-day'], required: true },
    markedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    smsSent: { type: Boolean, default: false },
    remarks: { type: String },
}, { timestamps: true })

// Ek student ek din mein sirf ek record (per subject alag ho sakta hai)
AttendanceSchema.index({ tenantId: 1, studentId: 1, date: 1, subject: 1 }, { unique: true })
AttendanceSchema.index({ tenantId: 1, date: 1 })

export const Attendance = mongoose.models.Attendance ||
    mongoose.model<IAttendance>('Attendance', AttendanceSchema)