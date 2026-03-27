// FILE: src/models/Exam.ts

import mongoose, { Schema, Document } from 'mongoose'

/* ─── Exam (schedule) ─── */
export interface IExam extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string              // "Half Yearly Exam 2025"
    academicYear: string              // "2025-26"
    class: string
    section?: string
    subjects: Array<{
        name: string               // "Mathematics"
        date: Date
        time: string               // "10:00 AM"
        duration: number               // minutes
        maxMarks: number
        minMarks: number               // passing marks
    }>
    status: 'upcoming' | 'ongoing' | 'completed'
    resultPublished: boolean
    createdBy: mongoose.Types.ObjectId
}

const ExamSchema = new Schema<IExam>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    academicYear: { type: String, required: true },
    class: { type: String, required: true },
    section: { type: String },
    subjects: [{
        name: { type: String, required: true },
        date: { type: Date, required: true },
        time: { type: String, required: true },
        duration: { type: Number, required: true },
        maxMarks: { type: Number, required: true },
        minMarks: { type: Number, required: true },
    }],
    status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'upcoming' },
    resultPublished: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

ExamSchema.index({ tenantId: 1, class: 1, academicYear: 1 })

export const Exam = mongoose.models.Exam ||
    mongoose.model<IExam>('Exam', ExamSchema)


/* ─── Result (per student per exam) ─── */
export interface IResult extends Document {
    tenantId: mongoose.Types.ObjectId
    examId: mongoose.Types.ObjectId
    studentId: mongoose.Types.ObjectId
    marks: Array<{
        subject: string
        marksObtained: number
        maxMarks: number
        grade: string    // A+, A, B, C, D, F
        isAbsent: boolean
        remarks?: string
    }>
    totalMarks: number
    totalObtained: number
    percentage: number
    grade: string
    rank?: number
    isPassed: boolean
    enteredBy: mongoose.Types.ObjectId
    reportCardUrl?: string
}

// Grade calculation helper
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

const ResultSchema = new Schema<IResult>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    marks: [{
        subject: { type: String, required: true },
        marksObtained: { type: Number, required: true },
        maxMarks: { type: Number, required: true },
        grade: { type: String, required: true },
        isAbsent: { type: Boolean, default: false },
        remarks: { type: String },
    }],
    totalMarks: { type: Number, required: true },
    totalObtained: { type: Number, required: true },
    percentage: { type: Number, required: true },
    grade: { type: String, required: true },
    rank: { type: Number },
    isPassed: { type: Boolean, required: true },
    enteredBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reportCardUrl: { type: String },
}, { timestamps: true })

ResultSchema.index({ tenantId: 1, examId: 1, studentId: 1 }, { unique: true })
ResultSchema.index({ tenantId: 1, studentId: 1 })

export const Result = mongoose.models.Result ||
    mongoose.model<IResult>('Result', ResultSchema)