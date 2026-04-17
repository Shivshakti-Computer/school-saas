// FILE: src/models/SchoolSettings.ts
// SERVER ONLY — mongoose model
// Types aur interfaces yahan define hain
// Default data → @/lib/academicDefaults se import

import mongoose, { Schema, Document, Model } from 'mongoose'

// ✅ Default data ab yahan se aayega
import {
  DEFAULT_CLASSES,
  DEFAULT_SECTIONS,
  DEFAULT_SUBJECTS,
  DEFAULT_GRADE_SCALE,
  getCurrentAcademicYear,
} from '@/lib/academicDefaults'

// ─────────────────────────────────────────────────────────
// Types & Interfaces — same as before
// ─────────────────────────────────────────────────────────

export type ClassGroup =
  | 'pre_primary'
  | 'primary'
  | 'middle'
  | 'secondary'
  | 'sr_secondary'

export interface IClassConfig {
  name: string
  group: ClassGroup
  stream?: string
  displayName: string
  order: number
  isActive: boolean
}

export interface ISectionConfig {
  name: string
  isActive: boolean
}

export type GradingSystem = 'marks' | 'grades' | 'cgpa'

export interface IGradeScale {
  grade: string
  minMarks: number
  maxMarks: number
  gradePoint: number
  description: string
}

export interface IAcademicConfig {
  classes: IClassConfig[]
  sections: ISectionConfig[]
  subjects: {
    classGroup: ClassGroup
    stream?: string
    subjectList: string[]
  }[]
  gradingSystem: GradingSystem
  passPercentage: number
  gradeScale: IGradeScale[]
  cgpaScale?: number
  attendanceThreshold: number
  workingDaysPerWeek: number
  schoolTimings: {
    start: string
    end: string
    lunchBreak?: {
      start: string
      end: string
    }
  }
  currentAcademicYear: string
  academicYearStartMonth: number
}

export interface INotificationSettings {
  sms: {
    onAbsent: boolean
    onLateFine: boolean
    onFeeReminder: boolean
    onFeeReceipt: boolean
    onExamResult: boolean
    onNewNotice: boolean
    onAdmission: boolean
    feeReminderDaysBefore: number
    homeworkAlert: boolean
  }
  email: {
    onAdmission: boolean
    onFeeReceipt: boolean
    onExamResult: boolean
    onNewNotice: boolean
    feeReminderDaysBefore: number
    homeworkAlert: boolean
  }
  whatsapp: {
    onAbsent: boolean
    onFeeReminder: boolean
    onFeeReceipt: boolean
    onExamResult: boolean
    homeworkAlert: boolean
  }
  quietHours: {
    enabled: boolean
    start: string
    end: string
  }
}

export interface IPaymentConfig {
  receiptPrefix: string
  showSchoolLogoOnReceipt: boolean
  receiptFooterText: string
  gstEnabled: boolean
  gstNumber: string
  gstPercentage: number
  lateFineEnabled: boolean
  lateFineType: 'flat' | 'percentage' | 'per_day'
  lateFineAmount: number
  lateFineGraceDays: number
  enableOnlinePayment: boolean
  paymentMethods: ('card' | 'upi' | 'netbanking' | 'wallet')[]
  razorpayConfigured: boolean
}

export interface IAppearanceSettings {
  schoolLogo?: string
  schoolLogoPublicId?: string
  favicon?: string
  portalTheme: {
    primaryColor: string
    accentColor: string
    darkMode: 'light' | 'dark' | 'system'
  }
  printHeader: {
    showLogo: boolean
    showSchoolName: boolean
    showAddress: boolean
    showPhone: boolean
    customTagline?: string
  }
}

export interface IModuleSettings {
  hiddenModules: string[]
  fees: {
    allowPartialPayment: boolean
    allowOnlinePayment: boolean
    showDueAmountOnPortal: boolean
  }
  attendance: {
    allowTeacherEdit: boolean
    editWindowHours: number
    sendSMSOnSubmit: boolean
  }
  exams: {
    showResultToStudent: boolean
    showResultToParent: boolean
    allowGraceMarks: boolean
    gracemarksLimit: number
  }
  library: {
    maxBooksPerStudent: number
    maxIssueDays: number
    finePerDay: number
  }
  // ✅ Homework module settings
  homework: {
    allowStudentSubmission: boolean
    submissionFileTypes: string[]
    maxFileSizeMB: number
  }
  // ✅ NEW — HR Module settings
  hr: {
    // Salary slip notifications (NotificationsTab se sync)
    sendSalarySlipEmail: boolean      // Email pe salary slip bhejo
    sendSalarySlipSMS: boolean        // SMS pe salary slip bhejo
    // Salary structure defaults
    pfEnabled: boolean                // PF deduction enable
    pfPercentage: number              // Default 12%
    esiEnabled: boolean               // ESI deduction enable
    esiPercentage: number             // Default 0.75%
    professionalTaxEnabled: boolean   // PT deduction
    // Leave policy
    casualLeavesPerYear: number       // Default 12
    sickLeavesPerYear: number         // Default 10
    earnedLeavesPerYear: number       // Default 15
    // Payroll settings (PaymentTab se sync)
    salaryDisbursementDay: number     // Month ka konsa din salary mile (1-28)
    payslipFooterText: string         // Payslip ke neeche text
  }

  // ✅ NEW — Default modules jo teacher create karte waqt auto-assign hon
  teacherDefaults: {
    defaultModules: string[]   // e.g. ['attendance', 'exams', 'homework', 'notices']
    autoAssignModules: boolean // true = creation par auto assign karo
  }
}

export interface ISchoolSettingsModel extends Model<ISchoolSettings> {
  getOrCreate(tenantId: string): Promise<ISchoolSettings>
}

export interface ISchoolSettings extends Document {
  tenantId: mongoose.Types.ObjectId
  academic: IAcademicConfig
  notifications: INotificationSettings
  payment: IPaymentConfig
  appearance: IAppearanceSettings
  modules: IModuleSettings
  lastUpdatedBy?: mongoose.Types.ObjectId
  lastUpdatedByName?: string
  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────────────────
// Schemas — same as before
// ─────────────────────────────────────────────────────────

const ClassConfigSchema = new Schema<IClassConfig>(
  {
    name: { type: String, required: true },
    group: {
      type: String,
      enum: ['pre_primary', 'primary', 'middle', 'secondary', 'sr_secondary'],
      required: true,
    },
    stream: { type: String },
    displayName: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
)

const SectionConfigSchema = new Schema<ISectionConfig>(
  {
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
)

const GradeScaleSchema = new Schema<IGradeScale>(
  {
    grade: { type: String, required: true },
    minMarks: { type: Number, required: true },
    maxMarks: { type: Number, required: true },
    gradePoint: { type: Number, default: 0 },
    description: { type: String, default: '' },
  },
  { _id: false }
)

const AcademicSchema = new Schema<IAcademicConfig>(
  {
    classes: { type: [ClassConfigSchema], default: [] },
    sections: { type: [SectionConfigSchema], default: [] },
    subjects: [
      {
        classGroup: { type: String },
        stream: { type: String },
        subjectList: [{ type: String }],
        _id: false,
      },
    ],
    gradingSystem: { type: String, enum: ['marks', 'grades', 'cgpa'], default: 'marks' },
    passPercentage: { type: Number, default: 33 },
    gradeScale: { type: [GradeScaleSchema], default: [] },
    cgpaScale: { type: Number, default: 10 },
    attendanceThreshold: { type: Number, default: 75 },
    workingDaysPerWeek: { type: Number, default: 6 },
    schoolTimings: {
      start: { type: String, default: '08:00' },
      end: { type: String, default: '14:00' },
      lunchBreak: {
        start: { type: String },
        end: { type: String },
      },
    },
    currentAcademicYear: { type: String, default: '' },
    academicYearStartMonth: { type: Number, default: 4 },
  },
  { _id: false }
)

const NotificationSchema = new Schema<INotificationSettings>(
  {
    sms: {
      onAbsent: { type: Boolean, default: true },
      onLateFine: { type: Boolean, default: false },
      onFeeReminder: { type: Boolean, default: true },
      onFeeReceipt: { type: Boolean, default: true },
      onExamResult: { type: Boolean, default: false },
      onNewNotice: { type: Boolean, default: false },
      onAdmission: { type: Boolean, default: true },
      feeReminderDaysBefore: { type: Number, default: 3 },
      homeworkAlert: { type: Boolean, default: false },
    },
    email: {
      onAdmission: { type: Boolean, default: true },
      onFeeReceipt: { type: Boolean, default: true },
      onExamResult: { type: Boolean, default: false },
      onNewNotice: { type: Boolean, default: false },
      feeReminderDaysBefore: { type: Number, default: 3 },
      homeworkAlert: { type: Boolean, default: false },
    },
    whatsapp: {
      onAbsent: { type: Boolean, default: false },
      onFeeReminder: { type: Boolean, default: false },
      onFeeReceipt: { type: Boolean, default: false },
      onExamResult: { type: Boolean, default: false },
      homeworkAlert: { type: Boolean, default: false },
    },
    quietHours: {
      enabled: { type: Boolean, default: true },
      start: { type: String, default: '21:00' },
      end: { type: String, default: '07:00' },
    },
  },
  { _id: false }
)

const PaymentConfigSchema = new Schema<IPaymentConfig>(
  {
    receiptPrefix: { type: String, default: 'RCP' },
    showSchoolLogoOnReceipt: { type: Boolean, default: true },
    receiptFooterText: { type: String, default: 'Thank you for your payment.' },
    gstEnabled: { type: Boolean, default: false },
    gstNumber: { type: String, default: '' },
    gstPercentage: { type: Number, default: 18 },
    lateFineEnabled: { type: Boolean, default: false },
    lateFineType: { type: String, enum: ['flat', 'percentage', 'per_day'], default: 'flat' },
    lateFineAmount: { type: Number, default: 0 },
    lateFineGraceDays: { type: Number, default: 5 },
    enableOnlinePayment: { type: Boolean, default: false },
    paymentMethods: { type: [String], default: ['upi', 'card', 'netbanking'] },
    razorpayConfigured: { type: Boolean, default: false },
  },
  { _id: false }
)

const AppearanceSchema = new Schema<IAppearanceSettings>(
  {
    schoolLogo: { type: String },
    schoolLogoPublicId: { type: String },
    favicon: { type: String },
    portalTheme: {
      primaryColor: { type: String, default: '#6366f1' },
      accentColor: { type: String, default: '#f97316' },
      darkMode: { type: String, enum: ['light', 'dark', 'system'], default: 'light' },
    },
    printHeader: {
      showLogo: { type: Boolean, default: true },
      showSchoolName: { type: Boolean, default: true },
      showAddress: { type: Boolean, default: true },
      showPhone: { type: Boolean, default: true },
      customTagline: { type: String, default: '' },
    },
  },
  { _id: false }
)

const ModuleSettingsSchema = new Schema<IModuleSettings>(
  {
    hiddenModules: { type: [String], default: [] },
    fees: {
      allowPartialPayment: { type: Boolean, default: false },
      allowOnlinePayment: { type: Boolean, default: false },
      showDueAmountOnPortal: { type: Boolean, default: true },
    },
    attendance: {
      allowTeacherEdit: { type: Boolean, default: true },
      editWindowHours: { type: Number, default: 24 },
      sendSMSOnSubmit: { type: Boolean, default: false },
    },
    exams: {
      showResultToStudent: { type: Boolean, default: true },
      showResultToParent: { type: Boolean, default: true },
      allowGraceMarks: { type: Boolean, default: false },
      gracemarksLimit: { type: Number, default: 5 },
    },
    library: {
      maxBooksPerStudent: { type: Number, default: 2 },
      maxIssueDays: { type: Number, default: 14 },
      finePerDay: { type: Number, default: 2 },
    },
    // ✅ Homework Schema
    homework: {
      allowStudentSubmission: { type: Boolean, default: true },
      submissionFileTypes: {
        type: [String],
        default: ['pdf', 'jpg', 'jpeg', 'png', 'docx'],
      },
      maxFileSizeMB: { type: Number, default: 10, min: 1, max: 50 },
    },
    hr: {
      sendSalarySlipEmail: { type: Boolean, default: false },
      sendSalarySlipSMS: { type: Boolean, default: false },
      pfEnabled: { type: Boolean, default: true },
      pfPercentage: { type: Number, default: 12 },
      esiEnabled: { type: Boolean, default: false },
      esiPercentage: { type: Number, default: 0.75 },
      professionalTaxEnabled: { type: Boolean, default: false },
      casualLeavesPerYear: { type: Number, default: 12 },
      sickLeavesPerYear: { type: Number, default: 10 },
      earnedLeavesPerYear: { type: Number, default: 15 },
      salaryDisbursementDay: { type: Number, default: 1 },
      payslipFooterText: { type: String, default: 'This is a computer generated payslip.' },
    },
    teacherDefaults: {
      defaultModules: {
        type: [String],
        default: ['attendance', 'exams', 'homework', 'notices'],
      },
      autoAssignModules: { type: Boolean, default: true },
    },
  },
  { _id: false }
)

const SchoolSettingsSchema = new Schema<ISchoolSettings, ISchoolSettingsModel>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'School',
      required: true,
      unique: true,
      index: true,
    },
    academic: AcademicSchema,
    notifications: NotificationSchema,
    payment: PaymentConfigSchema,
    appearance: AppearanceSchema,
    modules: ModuleSettingsSchema,
    lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    lastUpdatedByName: { type: String },
  },
  { timestamps: true }
)

// ─────────────────────────────────────────────────────────
// Static Method
// ─────────────────────────────────────────────────────────

SchoolSettingsSchema.statics.getOrCreate = async function (
  tenantId: string
): Promise<ISchoolSettings> {
  let settings = await this.findOne({ tenantId })

  if (!settings) {
    settings = await this.create({
      tenantId,
      academic: {
        classes: DEFAULT_CLASSES,       // ✅ academicDefaults se
        sections: DEFAULT_SECTIONS,      // ✅
        subjects: DEFAULT_SUBJECTS,      // ✅
        gradingSystem: 'marks',
        passPercentage: 33,
        gradeScale: DEFAULT_GRADE_SCALE,   // ✅
        attendanceThreshold: 75,
        workingDaysPerWeek: 6,
        schoolTimings: { start: '08:00', end: '14:00' },
        currentAcademicYear: getCurrentAcademicYear(), // ✅
        academicYearStartMonth: 4,
      },
    })
  }

  return settings
}

// ─────────────────────────────────────────────────────────
// Model Export
// ─────────────────────────────────────────────────────────

export const SchoolSettings =
  (mongoose.models.SchoolSettings as ISchoolSettingsModel) ||
  mongoose.model<ISchoolSettings, ISchoolSettingsModel>(
    'SchoolSettings',
    SchoolSettingsSchema
  )

// ─────────────────────────────────────────────────────────
// ✅ Re-export for backward compatibility
// Server files jo abhi bhi @/models/SchoolSettings se import
// karte hain — woh break nahi honge
// ─────────────────────────────────────────────────────────

export {
  DEFAULT_CLASSES,
  DEFAULT_SECTIONS,
  DEFAULT_SUBJECTS,
  DEFAULT_GRADE_SCALE,
  getCurrentAcademicYear,
} from '@/lib/academicDefaults'