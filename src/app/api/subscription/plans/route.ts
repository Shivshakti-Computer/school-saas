// FILE: src/app/api/subscription/plans/route.ts
// UPDATED — New pricing model + credit packs
// ═══════════════════════════════════════════════════════════

import { NextResponse } from 'next/server'
import {
  PLANS,
  CREDIT_PACKS,
  ADDON_PRICING,
  TRIAL_CONFIG,
  VISIT_CARD,
} from '@/config/pricing'

export async function GET() {
  // ── Public facing plan data ──
  const plans = Object.values(PLANS).map(plan => ({
    id: plan.id,
    name: plan.name,
    tagline: plan.tagline,
    description: plan.description,
    monthlyPrice: plan.monthlyPrice,
    yearlyPrice: plan.yearlyPrice,
    yearlyMonthlyEquivalent: plan.yearlyMonthlyEquivalent,
    yearlySavings: plan.yearlySavings,
    color: plan.color,
    accentColor: plan.accentColor,
    highlighted: plan.highlighted,
    badge: plan.badge,
    // Limits
    maxStudents: plan.maxStudents,
    maxTeachers: plan.maxTeachers,
    maxClasses: plan.maxClasses,
    storageGB: plan.storageGB,
    // Credit info
    freeCreditsPerMonth: plan.freeCreditsPerMonth,
    creditRolloverMonths: plan.creditRolloverMonths,
    // Features
    features: plan.features,
    notIncluded: plan.notIncluded,
    modules: plan.modules,
    moduleCount: plan.modules.length,
  }))

  return NextResponse.json({
    plans,

    // Credit packs
    creditPacks: CREDIT_PACKS,

    // Add-on pricing
    addons: {
      extraStudents: Object.entries(ADDON_PRICING.extraStudents).map(
        ([id, pack]) => ({ id, ...pack })
      ),
      extraTeachers: Object.entries(ADDON_PRICING.extraTeachers).map(
        ([id, pack]) => ({ id, ...pack })
      ),
    },

    // Trial info
    trial: {
      durationDays: TRIAL_CONFIG.durationDays,
      freeCredits: TRIAL_CONFIG.freeCredits,
      maxStudents: TRIAL_CONFIG.maxStudents,
      maxTeachers: TRIAL_CONFIG.maxTeachers,
      modules: TRIAL_CONFIG.modules,
    },

    // Credit guide
    creditGuide: {
      title: '1 Credit = ₹1',
      items: [
        { action: '1 SMS bhejo', credits: 1, costRs: 1 },
        { action: '1 WhatsApp bhejo', credits: 1, costRs: 1 },
        { action: '10 Emails bhejo', credits: 1, costRs: 0.1 },
      ],
    },

    // Visit card data (for pricing page)
    visitCard: VISIT_CARD,
  })
}