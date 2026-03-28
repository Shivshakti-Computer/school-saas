/* ─────────────────────────────────────────────────────────────
   FILE: src/lib/websitePlans.ts
   Website features per plan — controls what admin can use
   ─────────────────────────────────────────────────────────── */

import type { PlanId } from './plans'

export interface WebsitePlanLimits {
  // Templates
  allowedTemplates: string[]

  // Pages
  maxSystemPages: number
  maxCustomPages: number

  // Gallery
  maxGalleryPhotos: number
  galleryLightbox: boolean
  galleryAlbums: boolean

  // Sections allowed
  allowedSections: string[]

  // Features
  animatedStats: boolean
  facultySection: boolean
  facultyPhotos: boolean
  principalMessage: boolean
  videoTour: boolean
  announcementTicker: boolean
  testimonials: boolean
  eventsNews: boolean
  liveNoticeBoard: boolean
  contactForm: boolean
  achievements: boolean
  downloads: boolean
  infrastructure: boolean
  feeStructure: boolean
  scrollAnimations: boolean
  announcementPopup: boolean
  customDomain: boolean
  academicCalendar: boolean
  transportRoutes: boolean
  alumniSection: boolean
  loginButton: boolean
  mandatoryDisclosure: boolean
  seoSettings: boolean
  socialLinks: boolean
  whatsappButton: boolean
  removeBranding: boolean
}

export const WEBSITE_PLAN_LIMITS: Record<PlanId, WebsitePlanLimits> = {
  // ═══════════════════════════════════════
  // STARTER — Basic website
  // ═══════════════════════════════════════
  starter: {
    allowedTemplates: ['modern'],
    maxSystemPages: 4,
    maxCustomPages: 0,
    maxGalleryPhotos: 10,
    galleryLightbox: false,
    galleryAlbums: false,
    allowedSections: [
      'hero', 'about', 'stats', 'facilities', 'contact', 'cta',
    ],
    animatedStats: false,
    facultySection: false,
    facultyPhotos: false,
    principalMessage: false,
    videoTour: false,
    announcementTicker: false,
    testimonials: false,
    eventsNews: false,
    liveNoticeBoard: false,
    contactForm: false,
    achievements: false,
    downloads: false,
    infrastructure: false,
    feeStructure: false,
    scrollAnimations: false,
    announcementPopup: false,
    customDomain: false,
    academicCalendar: false,
    transportRoutes: false,
    alumniSection: false,
    loginButton: false,
    mandatoryDisclosure: false,
    seoSettings: false,
    socialLinks: false,
    whatsappButton: false,
    removeBranding: false,
  },

  // ═══════════════════════════════════════
  // GROWTH — Professional website
  // ═══════════════════════════════════════
  growth: {
    allowedTemplates: ['modern', 'classic', 'elegant'],
    maxSystemPages: 7,
    maxCustomPages: 2,
    maxGalleryPhotos: 50,
    galleryLightbox: true,
    galleryAlbums: false,
    allowedSections: [
      'hero', 'about', 'stats', 'facilities', 'contact', 'cta',
      'faculty', 'testimonials', 'events', 'academics',
      'principalMessage', 'videoTour', 'announcementTicker',
      'custom',
    ],
    animatedStats: true,
    facultySection: true,
    facultyPhotos: false,
    principalMessage: true,
    videoTour: true,
    announcementTicker: true,
    testimonials: true,
    eventsNews: true,
    liveNoticeBoard: false,
    contactForm: true,
    achievements: false,
    downloads: false,
    infrastructure: false,
    feeStructure: false,
    scrollAnimations: false,
    announcementPopup: false,
    customDomain: false,
    academicCalendar: false,
    transportRoutes: false,
    alumniSection: false,
    loginButton: true,
    mandatoryDisclosure: false,
    seoSettings: true,
    socialLinks: true,
    whatsappButton: true,
    removeBranding: false,
  },

  // ═══════════════════════════════════════
  // PRO — Premium website
  // ═══════════════════════════════════════
  pro: {
    allowedTemplates: ['modern', 'classic', 'elegant'],
    maxSystemPages: 15,
    maxCustomPages: 5,
    maxGalleryPhotos: 200,
    galleryLightbox: true,
    galleryAlbums: true,
    allowedSections: [
      'hero', 'about', 'stats', 'facilities', 'contact', 'cta',
      'faculty', 'testimonials', 'events', 'academics',
      'principalMessage', 'videoTour', 'announcementTicker',
      'gallery', 'achievements', 'downloads', 'infrastructure',
      'feeStructure', 'liveNotices', 'custom',
    ],
    animatedStats: true,
    facultySection: true,
    facultyPhotos: true,
    principalMessage: true,
    videoTour: true,
    announcementTicker: true,
    testimonials: true,
    eventsNews: true,
    liveNoticeBoard: true,
    contactForm: true,
    achievements: true,
    downloads: true,
    infrastructure: true,
    feeStructure: true,
    scrollAnimations: true,
    announcementPopup: true,
    customDomain: true,
    academicCalendar: false,
    transportRoutes: false,
    alumniSection: false,
    loginButton: true,
    mandatoryDisclosure: false,
    seoSettings: true,
    socialLinks: true,
    whatsappButton: true,
    removeBranding: false,
  },

  // ═══════════════════════════════════════
  // ENTERPRISE — Everything unlimited
  // ═══════════════════════════════════════
  enterprise: {
    allowedTemplates: ['modern', 'classic', 'elegant'],
    maxSystemPages: 999,
    maxCustomPages: 999,
    maxGalleryPhotos: 9999,
    galleryLightbox: true,
    galleryAlbums: true,
    allowedSections: [
      'hero', 'about', 'stats', 'facilities', 'contact', 'cta',
      'faculty', 'testimonials', 'events', 'academics',
      'principalMessage', 'videoTour', 'announcementTicker',
      'gallery', 'achievements', 'downloads', 'infrastructure',
      'feeStructure', 'liveNotices', 'academicCalendar',
      'transportRoutes', 'alumni', 'mandatoryDisclosure',
      'custom',
    ],
    animatedStats: true,
    facultySection: true,
    facultyPhotos: true,
    principalMessage: true,
    videoTour: true,
    announcementTicker: true,
    testimonials: true,
    eventsNews: true,
    liveNoticeBoard: true,
    contactForm: true,
    achievements: true,
    downloads: true,
    infrastructure: true,
    feeStructure: true,
    scrollAnimations: true,
    announcementPopup: true,
    customDomain: true,
    academicCalendar: true,
    transportRoutes: true,
    alumniSection: true,
    loginButton: true,
    mandatoryDisclosure: true,
    seoSettings: true,
    socialLinks: true,
    whatsappButton: true,
    removeBranding: true,
  },
}

// ── Helper Functions ──

export function getWebsiteLimits(plan: string): WebsitePlanLimits {
  return WEBSITE_PLAN_LIMITS[plan as PlanId] || WEBSITE_PLAN_LIMITS.starter
}

export function canUseTemplate(plan: string, templateId: string): boolean {
  return getWebsiteLimits(plan).allowedTemplates.includes(templateId)
}

export function canUseSection(plan: string, sectionType: string): boolean {
  return getWebsiteLimits(plan).allowedSections.includes(sectionType)
}

export function canAddCustomPage(plan: string, currentCustomPages: number): boolean {
  return currentCustomPages < getWebsiteLimits(plan).maxCustomPages
}

export function canAddPhoto(plan: string, currentPhotos: number): boolean {
  return currentPhotos < getWebsiteLimits(plan).maxGalleryPhotos
}

export function isFeatureLocked(plan: string, feature: keyof WebsitePlanLimits): boolean {
  const limits = getWebsiteLimits(plan)
  return !limits[feature]
}

// Get required plan for a locked feature
export function getRequiredPlan(feature: keyof WebsitePlanLimits): string {
  const planOrder: PlanId[] = ['starter', 'growth', 'pro', 'enterprise']
  for (const plan of planOrder) {
    if (WEBSITE_PLAN_LIMITS[plan][feature]) return plan
  }
  return 'enterprise'
}