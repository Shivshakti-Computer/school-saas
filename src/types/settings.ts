// FILE: src/types/settings.ts
// ═══════════════════════════════════════════════════════════
// All TypeScript types for Settings module
// Import from models wale types bhi re-export kiye hain
// Taaki components mein ek jagah se import ho
// ═══════════════════════════════════════════════════════════

import type {
    IClassConfig,
    ISectionConfig,
    IGradeScale,
    IAcademicConfig,
    INotificationSettings,
    IPaymentConfig,
    IAppearanceSettings,
    IModuleSettings,
    ClassGroup,
    GradingSystem,
} from '@/models/SchoolSettings'

// ── Re-export model types ──
export type {
    IClassConfig,
    ISectionConfig,
    IGradeScale,
    IAcademicConfig,
    INotificationSettings,
    IPaymentConfig,
    IAppearanceSettings,
    IModuleSettings,
    ClassGroup,
    GradingSystem,
}

// ─────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────

export interface SettingsResponse {
    school: SchoolProfileData
    academic: IAcademicConfig
    notifications: INotificationSettings
    payment: IPaymentConfig
    appearance: IAppearanceSettings
    modules: IModuleSettings
    meta: SettingsMeta
}

export interface SchoolProfileData {
    id: string
    name: string
    subdomain: string
    email: string
    phone: string
    address: string
    logo?: string
    plan: string
    trialEndsAt: string
    creditBalance: number
    isActive: boolean
    onboardingComplete: boolean
    theme: {
        primary: string
        secondary: string
    }
    razorpayConfigured: boolean
    enabledModules?: string[]
}

export interface SettingsMeta {
    lastUpdatedBy?: string
    lastUpdatedAt?: string
    settingsId: string
}

// ─────────────────────────────────────────────────────────
// PATCH Request Body Types — per tab
// ─────────────────────────────────────────────────────────

export interface UpdateSchoolProfileBody {
    name?: string
    email?: string
    phone?: string
    address?: string
    logo?: string
    logoPublicId?: string
}

export interface UpdateAcademicBody {
    classes?: IClassConfig[]
    sections?: ISectionConfig[]
    subjects?: IAcademicConfig['subjects']
    gradingSystem?: GradingSystem
    passPercentage?: number
    gradeScale?: IGradeScale[]
    cgpaScale?: number
    attendanceThreshold?: number
    workingDaysPerWeek?: number
    schoolTimings?: {
        start: string
        end: string
        lunchBreak?: {
            start: string
            end: string
        }
    }
    currentAcademicYear?: string
    academicYearStartMonth?: number
}

export interface UpdateNotificationsBody {
    sms?: Partial<INotificationSettings['sms']>
    email?: Partial<INotificationSettings['email']>
    whatsapp?: Partial<INotificationSettings['whatsapp']>
    quietHours?: Partial<INotificationSettings['quietHours']>
}

export interface UpdatePaymentBody {
    receiptPrefix?: string
    showSchoolLogoOnReceipt?: boolean
    receiptFooterText?: string
    gstEnabled?: boolean
    gstNumber?: string
    gstPercentage?: number
    lateFineEnabled?: boolean
    lateFineType?: 'flat' | 'percentage' | 'per_day'
    lateFineAmount?: number
    lateFineGraceDays?: number
    enableOnlinePayment?: boolean
    paymentMethods?: ('card' | 'upi' | 'netbanking' | 'wallet')[]
    // Razorpay keys — encrypted save honge
    razorpayKeyId?: string
    razorpayKeySecret?: string
    clearRazorpayKeys?: boolean
}

export interface UpdateAppearanceBody {
    schoolLogo?: string
    schoolLogoPublicId?: string
    favicon?: string
    portalTheme?: {
        primaryColor?: string
        accentColor?: string
        darkMode?: 'light' | 'dark' | 'system'
    }
    printHeader?: {
        showLogo?: boolean
        showSchoolName?: boolean
        showAddress?: boolean
        showPhone?: boolean
        customTagline?: string
    }
}

export interface UpdateModulesBody {
    enableModules?: string[]
    disableModules?: string[]
    hiddenModules?: string[]
    fees?: Partial<IModuleSettings['fees']>
    attendance?: Partial<IModuleSettings['attendance']>
    exams?: Partial<IModuleSettings['exams']>
    // ✅ FIX 5: IModuleSettings['library'] ab finePerDay use karega (sync)
    library?: Partial<IModuleSettings['library']>
    homework?: Partial<IModuleSettings['homework']>
}

// ─────────────────────────────────────────────────────────
// Upload Types
// ─────────────────────────────────────────────────────────

export interface LogoUploadResponse {
    success: boolean
    url: string
    publicId: string
    error?: string
}

export interface UploadConstraints {
    maxSizeMB: number
    allowedTypes: string[]
    allowedMimeTypes: string[]
}

export const LOGO_UPLOAD_CONSTRAINTS: UploadConstraints = {
    maxSizeMB: 2,
    allowedTypes: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
    ],
}

// ─────────────────────────────────────────────────────────
// Audit Log Types
// ─────────────────────────────────────────────────────────

export interface AuditLogEntry {
    id: string
    action: string
    resource: string
    resourceId?: string
    description: string
    userName: string
    userRole: string
    ipAddress: string
    status: 'SUCCESS' | 'FAILURE'
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
    createdAt: string
    metadata?: Record<string, unknown>  // ✅ Better than Record<string, any>
}

export interface AuditLogResponse {
    logs: AuditLogEntry[]
    total: number
    page: number
    totalPages: number
    hasMore: boolean
}

export interface AuditLogFilters {
    page?: number
    limit?: number
    action?: string
    resource?: string
    riskLevel?: string
    status?: string
    dateFrom?: string
    dateTo?: string
    search?: string
}

// ─────────────────────────────────────────────────────────
// Data Export Types
// ─────────────────────────────────────────────────────────

export type ExportFormat = 'json' | 'csv'

export type ExportDataType =
    | 'students'
    | 'staff'
    | 'fees'
    | 'attendance'
    | 'results'
    | 'notices'

export interface ExportRequestBody {
    dataType: ExportDataType
    format: ExportFormat
    filters?: {
        academicYear?: string
        class?: string
        section?: string
        dateFrom?: string
        dateTo?: string
        status?: string
    }
}

export interface ExportResponse {
    success: boolean
    downloadUrl?: string
    filename?: string
    recordCount?: number
    error?: string
}

// ─────────────────────────────────────────────────────────
// Settings Tab Navigation
// ─────────────────────────────────────────────────────────

export type SettingsTab =
    | 'school'
    | 'academic'
    | 'notifications'
    | 'payment'
    | 'appearance'
    | 'modules'
    | 'data'

export interface SettingsTabConfig {
    id: SettingsTab
    label: string
    icon: string
    description: string
    requiredPlan?: 'starter' | 'growth' | 'pro' | 'enterprise'
}

export const SETTINGS_TABS: SettingsTabConfig[] = [
    {
        id: 'school',
        label: 'School Profile',
        icon: 'Building2',
        description: 'School name, contact, address',
    },
    {
        id: 'academic',
        label: 'Academic',
        icon: 'GraduationCap',
        description: 'Classes, sections, subjects, grading',
    },
    {
        id: 'notifications',
        label: 'Notifications',
        icon: 'Bell',
        description: 'Auto SMS, email & WhatsApp triggers',
    },
    {
        id: 'payment',
        label: 'Payment & Fees',
        icon: 'CreditCard',
        description: 'Razorpay, receipts, GST, late fine',
        requiredPlan: 'growth',
    },
    {
        id: 'appearance',
        label: 'Appearance',
        icon: 'Palette',
        description: 'Logo, theme colors, print settings',
    },
    {
        id: 'modules',
        label: 'Modules',
        icon: 'LayoutGrid',
        description: 'Enable/disable features',
    },
    {
        id: 'data',
        label: 'Data & Audit',
        icon: 'Database',
        description: 'Export data, audit logs',
    },
]

// ─────────────────────────────────────────────────────────
// Form State Types — Client side
// ─────────────────────────────────────────────────────────

export interface FormState<T> {
    data: T
    isDirty: boolean
    isSaving: boolean
    error: string | null
    successMsg: string | null
}

export interface SaveResult {
    success: boolean
    message: string
    error?: string
}

// ─────────────────────────────────────────────────────────
// Class Helper Types — UI ke liye
// ─────────────────────────────────────────────────────────

export interface ClassGroupInfo {
    key: ClassGroup
    label: string
    range: string
    color: string
}

export const CLASS_GROUPS: ClassGroupInfo[] = [
    {
        key: 'pre_primary',
        label: 'Pre-Primary',
        range: 'Nursery, LKG, UKG',
        color: '#10b981',
    },
    {
        key: 'primary',
        label: 'Primary',
        range: 'Class 1 – 5',
        color: '#3b82f6',
    },
    {
        key: 'middle',
        label: 'Middle',
        range: 'Class 6 – 8',
        color: '#8b5cf6',
    },
    {
        key: 'secondary',
        label: 'Secondary',
        range: 'Class 9 – 10',
        color: '#f59e0b',
    },
    {
        key: 'sr_secondary',
        label: 'Sr. Secondary',
        range: 'Class 11 – 12 (Streams)',
        color: '#ef4444',
    },
]

export const STREAMS = ['Science', 'Commerce', 'Arts'] as const
export type Stream = typeof STREAMS[number]

// ─────────────────────────────────────────────────────────
// Validation Helpers
// ─────────────────────────────────────────────────────────

export function isValidTime(time: string): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(time)
}

export function isValidGSTNumber(gst: string): boolean {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst)
}

export function isValidHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)
}

export function isValidReceiptPrefix(prefix: string): boolean {
    return /^[A-Z0-9]{2,6}$/.test(prefix.toUpperCase())
}

// ─────────────────────────────────────────────────────────
// Indian States
// ─────────────────────────────────────────────────────────

export const INDIAN_STATES = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam',
    'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh',
    'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur',
    'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan',
    'Sikkim', 'Tamil Nadu', 'Telangana',
    'Tripura', 'Uttar Pradesh', 'Uttarakhand',
    'West Bengal',
    // UTs
    'Andaman and Nicobar Islands', 'Chandigarh',
    'Dadra and Nagar Haveli', 'Daman and Diu',
    'Delhi', 'Jammu and Kashmir',
    'Ladakh', 'Lakshadweep',
    'Puducherry',
] as const

export type IndianState = typeof INDIAN_STATES[number]

// ─────────────────────────────────────────────────────────
// Academic Year Helper
// ─────────────────────────────────────────────────────────

export function getAcademicYearOptions(): { value: string; label: string }[] {
    const currentYear = new Date().getFullYear()
    const years: { value: string; label: string }[] = []

    for (let y = currentYear - 2; y <= currentYear + 1; y++) {
        const value = `${y}-${String(y + 1).slice(-2)}`
        years.push({
            value,
            label: `${value} (Apr ${y} – Mar ${y + 1})`,
        })
    }

    return years.reverse()
}