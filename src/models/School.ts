// FILE: src/models/School.ts
// UPDATED: Added creditBalance + addonLimits fields
// BACKWARD COMPATIBLE — all existing fields intact
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'
import type { ModuleKey, Plan } from '@/lib/moduleRegistry'

export interface IPaymentSettings {
  razorpayKeyId?: string
  razorpayKeySecret?: string
  enableOnlinePayment?: boolean
  paymentMethods?: string[]
}

export type WebsiteSectionType =
  | 'hero' | 'about' | 'stats' | 'facilities' | 'academics' | 'faculty'
  | 'gallery' | 'testimonials' | 'events' | 'cta' | 'contact' | 'custom'
  | 'principalMessage' | 'videoTour' | 'announcementTicker'
  | 'achievements' | 'downloads' | 'infrastructure'
  | 'feeStructure' | 'liveNotices' | 'academicCalendar'
  | 'transportRoutes' | 'alumni' | 'mandatoryDisclosure'

export interface IWebsiteSection {
  id: string; type: WebsiteSectionType; title: string
  content: Record<string, any>; enabled: boolean; order: number
}

export interface IWebsitePage {
  id: string; title: string; slug: string
  sections: IWebsiteSection[]; enabled: boolean
  order: number; isSystem: boolean
}

export interface IWebsiteConfig {
  template: 'modern' | 'classic' | 'elegant'
  isPublished: boolean
  primaryColor: string
  secondaryColor: string
  logo?: string; favicon?: string
  seoTitle?: string; seoDescription?: string
  facebook?: string; instagram?: string; youtube?: string
  twitter?: string; whatsapp?: string
  pages: IWebsitePage[]
  tagline: string; about: string; address: string
  phone: string; email: string; mapUrl?: string
  admissionOpen: boolean; admissionLink?: string
  stats: Array<{ label: string; value: string }>
  facilities: string[]
  gallery: Array<{ url: string; caption?: string; album?: string }>
  faculty: Array<{ name: string; designation: string; subject?: string; photo?: string; qualification?: string }>
  testimonials: Array<{ name: string; role: string; quote: string; photo?: string }>
  events: Array<{ title: string; date: string; description: string; image?: string }>
  principalMessage?: { name: string; designation: string; photo?: string; message: string; signature?: string }
  videoTourUrl?: string; announcementText?: string
  announcementPopup?: { title: string; body: string; image?: string; enabled: boolean }
  achievements: Array<{ title: string; description: string; year?: string; image?: string; category?: string }>
  downloads: Array<{ title: string; url: string; category?: string }>
  infrastructureItems: Array<{ title: string; description: string; image?: string }>
  feeStructure: Array<{ className: string; fee: string; details?: string }>
  academicCalendar: Array<{ month: string; events: string }>
  transportRoutes: Array<{ routeName: string; stops: string; busNo?: string; timing?: string }>
  alumniList: Array<{ name: string; batch: string; achievement?: string; photo?: string }>
  mandatoryDisclosure?: { content: string }
  customDomain?: string; domainVerified?: boolean
}

// ── NEW: Add-on Limits Interface ──
export interface IAddonLimits {
  extraStudents: number     // Total extra students purchased
  extraTeachers: number     // Total extra teachers purchased
}

export interface IStorageAddon {
  extraStorageGB: number
  validUntil?: Date      // ← ADD: Monthly renewal tracking
  lastRenewedAt?: Date   // ← ADD: Last successful renewal
  autoRenew: boolean     // ← ADD: Auto-renewal enabled?

  // ── NEW: Cancellation & Grace ──
  canceledAt?: Date              // When school canceled
  gracePeriodEndsAt?: Date       // Files delete hone ki date (validUntil + 30 days)
  downloadLinkSentAt?: Date      // Download email sent date
  downloadCompleted?: boolean    // Did they download before cancel?
}

export interface ISchool extends Document {
  name: string
  subdomain: string
  address: string
  phone: string
  email: string
  logo?: string
  plan: Plan
  trialEndsAt: Date
  subscriptionId?: string
  modules: ModuleKey[]
  theme: { primary: string; secondary: string }
  paymentSettings?: IPaymentSettings
  website?: IWebsiteConfig
  isActive: boolean
  onboardingComplete: boolean
  // ── NEW FIELDS ──
  creditBalance: number         // Quick access balance (mirrored from MessageCredit)
  addonLimits: IAddonLimits    // Extra students/teachers purchased
  storageAddon: IStorageAddon
  storageUsedBytes: number
  // New field
  institutionType: 'school' | 'academy' | 'coaching'
  createdAt: Date
  updatedAt: Date
}

// All sub-schemas same as before — copy them exactly
const WebsiteSectionSchema = new Schema({
  id: String, type: String, title: String,
  content: Schema.Types.Mixed,
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { _id: false })

const WebsitePageSchema = new Schema({
  id: String, title: String, slug: String,
  sections: [WebsiteSectionSchema],
  enabled: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  isSystem: { type: Boolean, default: false },
}, { _id: false })

const WebsiteSchema = new Schema({
  template: { type: String, enum: ['modern', 'classic', 'elegant'], default: 'modern' },
  isPublished: { type: Boolean, default: false },
  primaryColor: { type: String, default: '#4F46E5' },
  secondaryColor: { type: String, default: '#10B981' },
  logo: String, favicon: String, seoTitle: String, seoDescription: String,
  facebook: String, instagram: String, youtube: String, twitter: String, whatsapp: String,
  pages: [WebsitePageSchema],
  tagline: { type: String, default: 'Excellence in Education' },
  about: { type: String, default: '' },
  address: { type: String, default: '' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  mapUrl: String,
  admissionOpen: { type: Boolean, default: false },
  admissionLink: String,
  stats: [{ label: String, value: String }],
  facilities: [String],
  gallery: [{ url: String, caption: String, album: String }],
  faculty: [{ name: String, designation: String, subject: String, photo: String, qualification: String }],
  testimonials: [{ name: String, role: String, quote: String, photo: String }],
  events: [{ title: String, date: String, description: String, image: String }],
  principalMessage: { name: String, designation: String, photo: String, message: String, signature: String },
  videoTourUrl: String,
  announcementText: String,
  announcementPopup: { title: String, body: String, image: String, enabled: { type: Boolean, default: false } },
  achievements: [{ title: String, description: String, year: String, image: String, category: String }],
  downloads: [{ title: String, url: String, category: String }],
  infrastructureItems: [{ title: String, description: String, image: String }],
  feeStructure: [{ className: String, fee: String, details: String }],
  academicCalendar: [{ month: String, events: String }],
  transportRoutes: [{ routeName: String, stops: String, busNo: String, timing: String }],
  alumniList: [{ name: String, batch: String, achievement: String, photo: String }],
  mandatoryDisclosure: { content: String },
  customDomain: String,
  domainVerified: { type: Boolean, default: false },
}, { _id: false })

const SchoolSchema = new Schema<ISchool>({
  name: { type: String, required: true },
  subdomain: { type: String, required: true, unique: true, lowercase: true },
  address: { type: String, default: '' },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  logo: { type: String },
  plan: { type: String, enum: ['starter', 'growth', 'pro', 'enterprise'], default: 'starter' },
  trialEndsAt: { type: Date, required: true },
  subscriptionId: { type: String },
  modules: { type: [String], default: ['students', 'attendance', 'notices'] },
  theme: {
    primary: { type: String, default: '#534AB7' },
    secondary: { type: String, default: '#1D9E75' },
  },
  paymentSettings: {
    razorpayKeyId: { type: String },
    razorpayKeySecret: { type: String },
    enableOnlinePayment: { type: Boolean, default: false },
    paymentMethods: { type: [String], default: [] },
  },
  website: WebsiteSchema,
  isActive: { type: Boolean, default: true },
  onboardingComplete: { type: Boolean, default: false },

  // ── NEW FIELDS (backward compatible — has defaults) ──
  creditBalance: { type: Number, default: 0 },
  addonLimits: {
    extraStudents: { type: Number, default: 0 },
    extraTeachers: { type: Number, default: 0 },
  },
  // Schema update
  storageAddon: {
    extraStorageGB: { type: Number, default: 0 },
    validUntil: { type: Date },
    lastRenewedAt: { type: Date },
    autoRenew: { type: Boolean, default: true },
    canceledAt: { type: Date },
    gracePeriodEndsAt: { type: Date },
    downloadLinkSentAt: { type: Date },
    downloadCompleted: { type: Boolean, default: false },
  },
  storageUsedBytes: { type: Number, default: 0 },
  institutionType: {
    type: String,
    enum: ['school', 'academy', 'coaching'],
    default: 'school',
    required: true,
  },
}, { timestamps: true })

export const School =
  mongoose.models.School ||
  mongoose.model<ISchool>('School', SchoolSchema)