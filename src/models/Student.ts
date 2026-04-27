import mongoose, { Schema, Document } from 'mongoose'

export interface IStudent extends Document {
    tenantId: mongoose.Types.ObjectId
    userId: mongoose.Types.ObjectId
    admissionNo: string
    rollNo: string
    academicYear: string
    admissionDate: Date
    admissionClass: string
    class: string
    section: string
    stream?: string

    // ── Academy/Coaching fields (optional) ──
    enrollments?: mongoose.Types.ObjectId[]
    currentBatch?: mongoose.Types.ObjectId
    currentCourse?: mongoose.Types.ObjectId

    dateOfBirth: Date
    gender: 'male' | 'female' | 'other'
    bloodGroup?: string
    nationality: string
    religion?: string
    category: 'general' | 'obc' | 'sc' | 'st' | 'other'
    photo?: string
    fatherName: string
    fatherOccupation?: string
    fatherPhone?: string
    motherName?: string
    motherOccupation?: string
    motherPhone?: string
    parentPhone: string
    parentEmail?: string
    address: string
    city?: string
    state?: string
    pincode?: string
    emergencyContact?: string
    emergencyName?: string
    documents: Array<{
        name: string
        url: string
        uploadedAt: Date
    }>
    previousSchool?: string
    previousClass?: string
    tcNumber?: string
    sessionHistory: Array<{
        academicYear: string
        class: string
        section: string
        rollNo: string
        promotedAt?: Date
        result?: 'promoted' | 'detained' | 'transferred'
    }>
    status: 'active' | 'inactive' | 'transferred' | 'graduated'
    leftDate?: Date
    leftReason?: string
}

const StudentSchema = new Schema<IStudent>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },

    // ── Admission Info ──
    admissionNo: { type: String, required: true },

    // ✅ FIX: Make school-specific fields optional
    rollNo: {
        type: String,
        required: false,  // ← CHANGE: true → false
        default: '',      // ← ADD: empty string for academy/coaching
    },

    academicYear: { type: String, required: true },
    admissionDate: { type: Date, required: true },

    admissionClass: {
        type: String,
        required: false,  // ← CHANGE: true → false
        default: '',      // ← ADD: empty for academy/coaching
    },

    // ── Current Academic ──
    class: {
        type: String,
        required: false,  // ← CHANGE: true → false
        default: '',      // ← ADD: empty for academy/coaching
    },

    section: {
        type: String,
        required: false,  // ← CHANGE: true → false
        default: '',      // ← ADD: empty for academy/coaching
    },

    stream: {
        type: String,
        default: '',
    },

    // ── Personal ──
    dateOfBirth: { type: Date, required: true },
    gender: {
        type: String,
        enum: ['male', 'female', 'other'],
        required: true,
    },
    bloodGroup: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', ''],
    },
    nationality: { type: String, default: 'Indian' },
    religion: { type: String },
    category: {
        type: String,
        enum: ['general', 'obc', 'sc', 'st', 'other'],
        default: 'general',
    },
    photo: { type: String },

    // ── Family ──
    fatherName: { type: String, required: true },
    fatherOccupation: { type: String },
    fatherPhone: { type: String },
    motherName: { type: String },
    motherOccupation: { type: String },
    motherPhone: { type: String },
    parentPhone: { type: String, required: true },
    parentEmail: { type: String },

    // ── Academy/Coaching fields ──
    enrollments: [{
        type: Schema.Types.ObjectId,
        ref: 'Enrollment',
    }],
    currentBatch: {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
    },
    currentCourse: {
        type: Schema.Types.ObjectId,
        ref: 'Course',
    },

    // ── Address ──
    address: { type: String, required: true },
    city: { type: String },
    state: { type: String },
    pincode: { type: String },

    // ── Emergency ──
    emergencyContact: { type: String },
    emergencyName: { type: String },

    // ── Documents ──
    documents: [{
        name: String,
        url: String,
        uploadedAt: Date,
    }],

    // ── Previous School ──
    previousSchool: { type: String },
    previousClass: { type: String },
    tcNumber: { type: String },

    // ── Session History ──
    sessionHistory: [{
        academicYear: String,
        class: String,
        section: String,
        rollNo: String,
        promotedAt: Date,
        result: {
            type: String,
            enum: ['promoted', 'detained', 'transferred'],
        },
    }],

    // ── Status ──
    status: {
        type: String,
        enum: ['active', 'inactive', 'transferred', 'graduated'],
        default: 'active',
    },
    leftDate: { type: Date },
    leftReason: { type: String },

}, { timestamps: true })

// ═══════════════════════════════════════════════════════════
// Pre-save Hook — Normalize fields
// ═══════════════════════════════════════════════════════════

const VALID_STREAMS = ['science', 'commerce', 'arts', 'vocational']
const VALID_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-']

StudentSchema.pre('save', function () {
    // Stream normalize
    if (this.stream) {
        const normalized = this.stream.toLowerCase().trim()
        this.stream = VALID_STREAMS.includes(normalized) ? normalized : ''
    }

    // Gender normalize
    if (this.gender) {
        this.gender = this.gender.toLowerCase().trim() as 'male' | 'female' | 'other'
    }

    // Category normalize
    if (this.category) {
        this.category = this.category.toLowerCase().trim() as IStudent['category']
    }

    // Blood group normalize — "a+" → "A+", "ab+" → "AB+"
    if (this.bloodGroup) {
        const bg = this.bloodGroup.toUpperCase().trim()
        this.bloodGroup = VALID_BLOOD_GROUPS.includes(bg) ? bg : ''
    }
})

// Pre insertMany/bulkWrite ke liye
StudentSchema.pre('insertMany', function (next, docs) {
    if (Array.isArray(docs)) {
        docs.forEach((doc: any) => {
            if (doc.stream) {
                const normalized = doc.stream.toLowerCase().trim()
                doc.stream = VALID_STREAMS.includes(normalized) ? normalized : ''
            }
            if (doc.gender) {
                doc.gender = doc.gender.toLowerCase().trim()
            }
            if (doc.category) {
                doc.category = doc.category.toLowerCase().trim()
            }
            if (doc.bloodGroup) {
                const bg = doc.bloodGroup.toUpperCase().trim()
                doc.bloodGroup = VALID_BLOOD_GROUPS.includes(bg) ? bg : ''
            }
        })
    }
    next()
})

// ── Indexes ──
StudentSchema.index({ tenantId: 1, class: 1, section: 1 })
StudentSchema.index({ tenantId: 1, admissionNo: 1 }, { unique: true })
StudentSchema.index({ tenantId: 1, academicYear: 1, class: 1, section: 1, rollNo: 1 })
StudentSchema.index({ tenantId: 1, status: 1 })

// ✅ NEW: Index for academy/coaching queries
StudentSchema.index({ tenantId: 1, currentBatch: 1 })
StudentSchema.index({ tenantId: 1, currentCourse: 1 })

export const Student = mongoose.models.Student
    || mongoose.model<IStudent>('Student', StudentSchema)