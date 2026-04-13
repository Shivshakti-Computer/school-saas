// src/models/Exam.ts
// UPGRADED: Composite marks + Admit card support
// BACKWARD COMPATIBLE: components array optional hai
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

// ── Grade Calculator ────────────────────────────────────────
export function calculateGrade(percentage: number): string {
    if (percentage >= 91) return 'A+'
    if (percentage >= 81) return 'A'
    if (percentage >= 71) return 'B+'
    if (percentage >= 61) return 'B'
    if (percentage >= 51) return 'C+'
    if (percentage >= 41) return 'C'
    if (percentage >= 33) return 'D'
    return 'F'
}

// Nursery/KG ke liye activity-based grade
export function calculateActivityGrade(percentage: number): string {
    if (percentage >= 90) return 'Outstanding'
    if (percentage >= 75) return 'Excellent'
    if (percentage >= 60) return 'Very Good'
    if (percentage >= 45) return 'Good'
    if (percentage >= 33) return 'Satisfactory'
    return 'Needs Improvement'
}

// Class group determine karna
export type ClassGroup =
    | 'nursery-kg'   // Nursery, LKG, UKG
    | 'primary'      // 1–5
    | 'middle'       // 6–8
    | 'secondary'    // 9–10
    | 'senior'       // 11–12

export function getClassGroup(cls: string): ClassGroup {
    const c = cls?.toLowerCase().trim()
    if (['nursery', 'lkg', 'ukg'].includes(c)) return 'nursery-kg'
    const n = parseInt(c)
    if (n >= 1 && n <= 5) return 'primary'
    if (n >= 6 && n <= 8) return 'middle'
    if (n >= 9 && n <= 10) return 'secondary'
    return 'senior'
}

// ── Subject Component ────────────────────────────────────────
// e.g. Theory=70, Assignment=15, Practical=10, Viva=5
export interface ISubjectComponent {
    name: string   // "Theory" | "Assignment" | "Practical" | "Viva" | "Internal" etc.
    maxMarks: number
}

// ── Subject Config ───────────────────────────────────────────
export interface ISubjectConfig {
    name: string         // "Mathematics"
    date: Date
    time: string         // "10:00 AM"
    duration: number         // minutes (theory exam)
    totalMaxMarks: number         // auto: sum of components OR single maxMarks
    minMarks: number         // overall passing marks
    // Composite marks support (optional — backward compatible)
    components: ISubjectComponent[]
    // Nursery/KG ke liye: marks nahi, grade only
    isGradeOnly: boolean
}

// ── Exam Document ────────────────────────────────────────────
export interface IExam extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    academicYear: string
    class: string
    section?: string
    subjects: ISubjectConfig[]
    status: 'upcoming' | 'ongoing' | 'completed'
    resultPublished: boolean
    // Admit card fields
    admitCardEnabled: boolean
    instructions: string[]
    examCenter: string
    createdBy: mongoose.Types.ObjectId
}

const SubjectComponentSchema = new Schema<ISubjectComponent>({
    name: { type: String, required: true },
    maxMarks: { type: Number, required: true },
}, { _id: false })

const SubjectConfigSchema = new Schema<ISubjectConfig>({
    name: { type: String, required: true },
    date: { type: Date, required: true },
    time: { type: String, default: '10:00 AM' },
    duration: { type: Number, default: 180 },
    totalMaxMarks: {
        type: Number,
        required: false,   // ← CHANGED (was: true)
        default: 0,
    },
    minMarks: { type: Number, required: true },
    components: { type: [SubjectComponentSchema], default: [] },
    isGradeOnly: { type: Boolean, default: false },
}, { _id: false })

const ExamSchema = new Schema<IExam>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    name: { type: String, required: true },
    academicYear: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String },
    subjects: [SubjectConfigSchema],
    status: {
        type: String,
        enum: ['upcoming', 'ongoing', 'completed'],
        default: 'upcoming',
    },
    resultPublished: { type: Boolean, default: false },
    admitCardEnabled: { type: Boolean, default: false },
    instructions: [{ type: String }],
    examCenter: { type: String, default: '' },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true })

ExamSchema.index({ tenantId: 1, class: 1, academicYear: 1 })
ExamSchema.index({ tenantId: 1, status: 1 })

export const Exam = mongoose.models.Exam
    || mongoose.model<IExam>('Exam', ExamSchema)


// ── Result Document ──────────────────────────────────────────
export interface ISubjectResult {
    subject: string
    // Composite marks (per component)
    components: Array<{
        name: string
        marksObtained: number
        maxMarks: number
    }>
    // Totals (auto-calculated)
    marksObtained: number   // sum of components
    maxMarks: number
    grade: string
    activityGrade: string   // nursery-kg ke liye
    isAbsent: boolean
    remarks?: string
}

export interface IResult extends Document {
    tenantId: mongoose.Types.ObjectId
    examId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    marks: ISubjectResult[]
    totalMarks: number
    totalObtained: number
    percentage: number
    grade: string
    rank?: number
    isPassed: boolean
    enteredBy: mongoose.Types.ObjectId
    // Cloudinary hataya — URL nahi store karenge
}

const SubjectResultSchema = new Schema<ISubjectResult>({
    subject: { type: String, required: true },
    components: [{
        name: { type: String },
        marksObtained: { type: Number, default: 0 },
        maxMarks: { type: Number, default: 0 },
        _id: false,
    }],
    marksObtained: { type: Number, required: true, default: 0 },
    maxMarks: { type: Number, required: true },
    grade: { type: String, required: true },
    activityGrade: { type: String, default: '' },
    isAbsent: { type: Boolean, default: false },
    remarks: { type: String },
}, { _id: false })

const ResultSchema = new Schema<IResult>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    examId: {
        type: Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    marks: [SubjectResultSchema],
    totalMarks: { type: Number, required: true },
    totalObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String, required: true },
    rank: { type: Number },
    isPassed: { type: Boolean, required: true },
    enteredBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true })

ResultSchema.index(
    { tenantId: 1, examId: 1, studentId: 1 },
    { unique: true }
)
ResultSchema.index({ tenantId: 1, studentId: 1 })
ResultSchema.index({ tenantId: 1, examId: 1, rank: 1 })

export const Result = mongoose.models.Result
    || mongoose.model<IResult>('Result', ResultSchema)