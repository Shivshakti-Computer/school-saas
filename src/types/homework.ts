// FILE: src/types/homework.ts
// ═══════════════════════════════════════════════════════════
// Homework Module Types
// ═══════════════════════════════════════════════════════════

// ── Base Types ──
export type HomeworkStatus = 'active' | 'archived'
export type SubmissionStatus = 'pending' | 'submitted' | 'late' | 'graded'

export interface HomeworkAttachment {
    name: string
    url: string
    type: 'pdf' | 'image' | 'doc' | 'other'
    size: number
    uploadedAt?: string
}

export interface HomeworkGrade {
    marks?: number
    maxMarks?: number
    grade?: string
    feedback?: string
    gradedBy?: string
    gradedByName?: string
    gradedAt?: string
}

export interface HomeworkSubmission {
    studentId: string
    studentName: string
    studentClass: string
    studentSection?: string
    rollNumber?: string
    submittedAt?: string
    isLate: boolean
    attachments: HomeworkAttachment[]
    remarks?: string
    status: SubmissionStatus
    grade?: HomeworkGrade
}

// ── List Item (for tables/cards) ──
export interface HomeworkListItem {
    _id: string
    title: string
    description: string
    subject: string
    class: string
    section?: string
    assignedDate: string
    dueDate: string
    allowLateSubmission: boolean
    attachments: HomeworkAttachment[]
    totalStudents: number
    submittedCount: number
    pendingCount: number
    lateCount: number
    gradedCount: number
    createdByName: string
    status: HomeworkStatus
    isExpired?: boolean
    isOverdue?: boolean
    completionRate?: number
}

// ── Detail (full homework object) ──
export interface HomeworkDetail extends HomeworkListItem {
    targetStudents: string[]
    maxFileSizeMB: number
    allowedFileTypes: string[]
    notificationSent: boolean
    reminderSent: boolean
    createdBy: string
    createdByRole: string
    submissions: HomeworkSubmission[]
    academicYear: string
    createdAt: string
    updatedAt: string
}

// ── Form Data ──
export interface HomeworkFormData {
    title: string
    description: string
    subject: string
    class: string
    section?: string
    targetStudents: string[]
    dueDate: string
    allowLateSubmission: boolean
    attachments: HomeworkAttachment[]
    sendNotification?: boolean
    notificationChannels?: {
        sms: boolean
        whatsapp: boolean
        email: boolean
        push: boolean
    }
    // ✅ ADD: Optional fields — existing pages break nahi honge
    academicYear?: string
    notifTargetRole?: 'all' | 'student' | 'parent'
}

// ── Filters ──
export interface HomeworkFilters {
    status?: HomeworkStatus
    class?: string
    section?: string
    subject?: string
    search?: string
    dateFrom?: string
    dateTo?: string
    page: number
    limit: number
    sortBy: 'dueDate' | 'createdAt' | 'submittedCount'
    sortOrder: 'asc' | 'desc'
    academicYear?: string
}

// ── Stats ──
export interface HomeworkStats {
    total: number
    active: number
    overdue: number
    totalSubmitted: number
    totalPending: number
}

// ── Student Portal ──
export interface StudentHomework {
    _id: string
    title: string
    description: string
    subject: string
    class: string
    section?: string
    assignedDate: string
    dueDate: string
    allowLateSubmission: boolean
    attachments: HomeworkAttachment[]
    createdByName: string
    mySubmission: HomeworkSubmission | null
}

export interface StudentHomeworkStats {
    pending: number
    submitted: number
    graded: number
    overdue: number
}

// ── Parent Portal ──
export interface ParentHomework {
    _id: string
    title: string
    description: string
    subject: string
    class: string
    section?: string
    assignedDate: string
    dueDate: string
    attachments: HomeworkAttachment[]
    createdByName: string
    submission: HomeworkSubmission | null
}

export interface ParentHomeworkStats {
    pending: number
    submitted: number
    graded: number
    overdue: number
}

export interface ChildInfo {
    _id: string
    name: string
    class: string
    section?: string
}

// ── Submit Form ──
export interface SubmitHomeworkData {
    attachments: HomeworkAttachment[]
    remarks?: string
}

// ── Grade Form ──
export interface GradeSubmissionData {
    studentId: string
    marks?: number
    maxMarks?: number
    grade?: string
    feedback?: string
}