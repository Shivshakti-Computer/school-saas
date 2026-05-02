// FILE: src/lib/pdf-builder-enhanced.ts
// PREMIUM v10: Architectural Elegance — Art Deco Certificate Design
// ═══════════════════════════════════════════════════════════════════

import 'server-only'
import {
  PDFDocument,
  rgb,
  StandardFonts,
  PDFImage,
  PDFPage,
  degrees,
  PDFFont,
} from 'pdf-lib'
import { generateQRCodeBuffer, generateVerificationURL } from './qr-generator'

// ────────────────────────────────────────────────────────────
// Types (Unchanged from v9)
// ────────────────────────────────────────────────────────────

export const CertificateColors = {
  modernGold: [0.85, 0.65, 0.13] as [number, number, number],
  modernGoldLight: [0.96, 0.87, 0.70] as [number, number, number],
  modernGoldAccent: [0.80, 0.52, 0.25] as [number, number, number],
  classicBlue: [0.10, 0.15, 0.40] as [number, number, number],
  classicBlueLight: [0.20, 0.29, 0.57] as [number, number, number],
  classicBlueAccent: [0.59, 0.67, 0.85] as [number, number, number],
  elegantIndigo: [0.31, 0.27, 0.90] as [number, number, number],
  elegantIndigoLight: [0.59, 0.55, 0.95] as [number, number, number],
  elegantIndigoAccent: [0.88, 0.90, 1.00] as [number, number, number],
  black: [0, 0, 0] as [number, number, number],
  slate900: [0.09, 0.11, 0.16] as [number, number, number],
  slate800: [0.12, 0.16, 0.24] as [number, number, number],
  slate700: [0.20, 0.25, 0.34] as [number, number, number],
  slate600: [0.28, 0.33, 0.41] as [number, number, number],
  slate500: [0.39, 0.46, 0.55] as [number, number, number],
  slate400: [0.58, 0.64, 0.72] as [number, number, number],
  slate300: [0.80, 0.84, 0.88] as [number, number, number],
  slate200: [0.89, 0.91, 0.94] as [number, number, number],
  white: [1, 1, 1] as [number, number, number],
}

export interface AccreditationLogo {
  name: string
  logoUrl: string
  registrationNo?: string
  isActive?: boolean
}

export interface CertificateBranding {
  schoolName: string
  schoolLogo?: string
  schoolAddress?: string
  schoolPhone?: string
  schoolEmail?: string
  franchiseName?: string
  franchiseLogo?: string
  franchiseAddress?: string
  franchiseCity?: string
  franchiseState?: string
  showParentBranding: boolean
  showFranchiseBranding: boolean
}

export interface CertificateAccreditations {
  parentAffiliations?: AccreditationLogo[]
  parentRecognitions?: AccreditationLogo[]
  parentRegistrations?: AccreditationLogo[]
  parentPartnerships?: AccreditationLogo[]
  franchiseRegistrations?: AccreditationLogo[]
  franchisePartnerships?: AccreditationLogo[]
  franchiseAwards?: AccreditationLogo[]
  inheritParentAccreditations: boolean
  showFranchiseAccreditations: boolean
}

export interface CertificateContent {
  certificateType: string
  certificateNumber: string
  title: string
  recipientName: string
  content: string
  issuedDate?: string
}

export interface CertificateVerification {
  verificationCode: string
  verificationUrl?: string
  enableQRCode: boolean
  qrCodePosition: 'bottom-left' | 'bottom-right' | 'bottom-center'
  showVerificationURL: boolean
}

export interface CertificateCustomization {
  layout: 'classic' | 'modern' | 'elegant'
  signatureLabel?: string
  signatureName?: string
  signatureDesignation?: string
  signatureImage?: string
  enableDigitalSignature: boolean
  watermarkText?: string
  enableWatermark: boolean
  borderStyle?: 'single' | 'double' | 'decorative'
}

export interface BuildCertificatePdfOptions {
  branding: CertificateBranding
  accreditations: CertificateAccreditations
  content: CertificateContent
  verification: CertificateVerification
  customization: CertificateCustomization
}

// ────────────────────────────────────────────────────────────
// Theme System — Each layout gets a fully distinct personality
// ────────────────────────────────────────────────────────────

interface ThemePalette {
  // Core colors
  primary: [number, number, number]
  secondary: [number, number, number]
  gold: [number, number, number]
  goldLight: [number, number, number]
  accent: [number, number, number]
  // Paper
  paperBase: [number, number, number]
  paperWarm: [number, number, number]
  // Text
  textDark: [number, number, number]
  textMedium: [number, number, number]
  textLight: [number, number, number]
  textOnDark: [number, number, number]
  // Structural
  headerH: number
  footerH: number
}

function getTheme(layout: 'classic' | 'modern' | 'elegant'): ThemePalette {
  switch (layout) {
    // ── CLASSIC: Deep navy + warm gold — Traditional prestige
    case 'classic': return {
      primary: [0.04, 0.09, 0.32],
      secondary: [0.10, 0.20, 0.48],
      gold: [0.76, 0.58, 0.06],
      goldLight: [0.91, 0.79, 0.45],
      accent: [0.18, 0.28, 0.55],
      paperBase: [0.995, 0.990, 0.975],
      paperWarm: [0.985, 0.974, 0.945],
      textDark: [0.07, 0.09, 0.14],
      textMedium: [0.22, 0.27, 0.35],
      textLight: [0.42, 0.48, 0.57],
      textOnDark: [0.96, 0.94, 0.88],
      headerH: 90,
      footerH: 78,
    }

    // ── ELEGANT: Deep plum/violet + champagne — Sophisticated luxury
    case 'elegant': return {
      primary: [0.22, 0.08, 0.40],
      secondary: [0.35, 0.15, 0.58],
      gold: [0.82, 0.66, 0.22],
      goldLight: [0.93, 0.83, 0.58],
      accent: [0.55, 0.35, 0.80],
      paperBase: [0.998, 0.995, 0.990],
      paperWarm: [0.990, 0.982, 0.968],
      textDark: [0.10, 0.06, 0.16],
      textMedium: [0.28, 0.20, 0.38],
      textLight: [0.46, 0.38, 0.56],
      textOnDark: [0.97, 0.92, 0.99],
      headerH: 95,
      footerH: 82,
    }

    // ── MODERN: Rich teal/dark + bright gold — Contemporary prestige
    default: return {
      primary: [0.04, 0.18, 0.32],
      secondary: [0.06, 0.28, 0.46],
      gold: [0.86, 0.66, 0.12],
      goldLight: [0.94, 0.83, 0.52],
      accent: [0.08, 0.38, 0.54],
      paperBase: [0.992, 0.992, 0.995],
      paperWarm: [0.980, 0.982, 0.990],
      textDark: [0.06, 0.10, 0.16],
      textMedium: [0.20, 0.28, 0.38],
      textLight: [0.38, 0.46, 0.56],
      textOnDark: [0.93, 0.96, 0.99],
      headerH: 88,
      footerH: 76,
    }
  }
}

// ────────────────────────────────────────────────────────────
// Utility Helpers
// ────────────────────────────────────────────────────────────

async function loadImageFromUrl(
  pdfDoc: PDFDocument,
  url?: string,
): Promise<PDFImage | undefined> {
  if (!url || url.trim() === '') return undefined
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'CertificatePDF/1.0' },
    })
    if (!res.ok) return undefined
    const buf = await res.arrayBuffer()
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('png') || url.toLowerCase().endsWith('.png'))
      return await pdfDoc.embedPng(buf)
    if (
      ct.includes('jpeg') || ct.includes('jpg') ||
      url.toLowerCase().endsWith('.jpg') ||
      url.toLowerCase().endsWith('.jpeg')
    ) return await pdfDoc.embedJpg(buf)
    return undefined
  } catch {
    return undefined
  }
}

function wrapText(
  text: string,
  maxW: number,
  font: PDFFont,
  size: number,
): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const test = cur ? `${cur} ${word}` : word
    if (font.widthOfTextAtSize(test, size) > maxW && cur) {
      lines.push(cur)
      cur = word
    } else {
      cur = test
    }
  }
  if (cur) lines.push(cur)
  return lines
}

function drawCentered(
  page: PDFPage,
  text: string,
  font: PDFFont,
  size: number,
  y: number,
  color: [number, number, number],
  pageW: number,
  opacity?: number,
) {
  const tw = font.widthOfTextAtSize(text, size)
  page.drawText(text, {
    x: (pageW - tw) / 2,
    y,
    font,
    size,
    color: rgb(...color),
    opacity: opacity ?? 1,
  })
}

function buildVerifyUrl(v: CertificateVerification): string {
  if (
    v.verificationUrl?.length &&
    !v.verificationUrl.includes('undefined') &&
    v.verificationUrl.startsWith('http')
  ) return v.verificationUrl

  const base = process.env.NEXT_PUBLIC_APP_DOMAIN
  if (base?.length && !base.includes('undefined'))
    return `${base}/verify/${v.verificationCode}`

  try {
    const g = generateVerificationURL(v.verificationCode)
    if (g && !g.includes('undefined')) return g
  } catch { }

  return `https://skolify.in/${v.verificationCode}`
}

// ────────────────────────────────────────────────────────────
// LAYER 1 — Paper Background (Theme-aware)
// ────────────────────────────────────────────────────────────

function drawPaperBackground(
  page: PDFPage,
  W: number,
  H: number,
  t: ThemePalette,
  layout: string,
) {
  // Base paper color
  page.drawRectangle({
    x: 0, y: 0, width: W, height: H,
    color: rgb(...t.paperBase),
  })

  if (layout === 'classic') {
    // ── Classic: Warm parchment with crosshatch texture ──
    // Diagonal micro-lines horizontal
    for (let i = 0; i < 60; i++) {
      page.drawLine({
        start: { x: 0, y: i * 10 },
        end: { x: W, y: i * 10 },
        thickness: 0.3,
        color: rgb(...t.gold),
        opacity: 0.03,
      })
    }
    // Diagonal texture lines
    for (let i = -20; i < 60; i++) {
      page.drawLine({
        start: { x: i * 28, y: 0 },
        end: { x: i * 28 + H * 0.5, y: H },
        thickness: 0.4,
        color: rgb(...t.primary),
        opacity: 0.015,
      })
    }
    // Center radial glow (warm cream center)
    for (let r = 1; r <= 8; r++) {
      const radius = r * 55
      page.drawCircle({
        x: W / 2, y: H / 2,
        size: radius,
        borderColor: rgb(...t.paperWarm),
        borderWidth: 20,
        opacity: 0.04,
      })
    }

  } else if (layout === 'elegant') {
    // ── Elegant: Silk-like sheen with diamond pattern ──
    page.drawRectangle({
      x: 0, y: 0, width: W, height: H,
      color: rgb(...t.paperWarm),
      opacity: 0.4,
    })
    // Diamond grid
    const GRID = 32
    for (let col = 0; col < W / GRID + 1; col++) {
      for (let row = 0; row < H / GRID + 1; row++) {
        const cx = col * GRID + (row % 2 === 0 ? 0 : GRID / 2)
        const cy = row * GRID
        // Tiny diamond
        page.drawLine({
          start: { x: cx, y: cy + 4 },
          end: { x: cx + 4, y: cy },
          thickness: 0.25,
          color: rgb(...t.gold),
          opacity: 0.06,
        })
        page.drawLine({
          start: { x: cx + 4, y: cy },
          end: { x: cx, y: cy - 4 },
          thickness: 0.25,
          color: rgb(...t.gold),
          opacity: 0.06,
        })
        page.drawLine({
          start: { x: cx, y: cy - 4 },
          end: { x: cx - 4, y: cy },
          thickness: 0.25,
          color: rgb(...t.gold),
          opacity: 0.06,
        })
        page.drawLine({
          start: { x: cx - 4, y: cy },
          end: { x: cx, y: cy + 4 },
          thickness: 0.25,
          color: rgb(...t.gold),
          opacity: 0.06,
        })
      }
    }

  } else {
    // ── Modern: Clean gradient wash with blueprint grid ──
    // Subtle vertical gradient (simulate with rects)
    for (let i = 0; i < 12; i++) {
      const frac = i / 12
      page.drawRectangle({
        x: 0,
        y: H * frac,
        width: W,
        height: H / 12 + 1,
        color: rgb(...t.primary),
        opacity: 0.012 * (1 - frac),
      })
    }
    // Thin grid lines
    for (let i = 0; i < W / 50; i++) {
      page.drawLine({
        start: { x: i * 50, y: 0 },
        end: { x: i * 50, y: H },
        thickness: 0.3,
        color: rgb(...t.accent),
        opacity: 0.04,
      })
    }
    for (let i = 0; i < H / 50; i++) {
      page.drawLine({
        start: { x: 0, y: i * 50 },
        end: { x: W, y: i * 50 },
        thickness: 0.3,
        color: rgb(...t.accent),
        opacity: 0.04,
      })
    }
  }
}

// ────────────────────────────────────────────────────────────
// LAYER 2 — Header Band (fully theme-distinct)
// ────────────────────────────────────────────────────────────

function drawHeaderBand(
  page: PDFPage,
  W: number,
  H: number,
  t: ThemePalette,
  layout: string,
) {
  const { headerH: BH } = t
  const bandY = H - BH

  if (layout === 'classic') {
    // Three-stripe header: primary | thin gold | lighter primary
    page.drawRectangle({
      x: 0, y: bandY,
      width: W, height: BH,
      color: rgb(...t.primary),
    })
    // Bottom gold separator
    page.drawRectangle({
      x: 0, y: bandY,
      width: W, height: 5,
      color: rgb(...t.gold),
    })
    // Top edge gold line
    page.drawRectangle({
      x: 0, y: H - 3,
      width: W, height: 3,
      color: rgb(...t.gold),
    })
    // Subtle inner highlight
    page.drawRectangle({
      x: 0, y: bandY + 5,
      width: W, height: 6,
      color: rgb(1, 1, 1),
      opacity: 0.05,
    })
    // Repeating chevron pattern
    for (let i = 0; i < 28; i++) {
      const x = i * 32
      const my = bandY + BH / 2
      page.drawLine({
        start: { x: x, y: my - 8 },
        end: { x: x + 16, y: my + 8 },
        thickness: 0.6,
        color: rgb(...t.gold),
        opacity: 0.12,
      })
      page.drawLine({
        start: { x: x + 16, y: my + 8 },
        end: { x: x + 32, y: my - 8 },
        thickness: 0.6,
        color: rgb(...t.gold),
        opacity: 0.12,
      })
    }

  } else if (layout === 'elegant') {
    // Dual-tone header with angled cut effect
    page.drawRectangle({
      x: 0, y: bandY,
      width: W, height: BH,
      color: rgb(...t.primary),
    })
    // Diagonal gradient illusion overlay
    for (let i = 0; i < BH; i++) {
      const prog = i / BH
      page.drawRectangle({
        x: 0,
        y: bandY + i,
        width: W,
        height: 1,
        color: rgb(...t.secondary),
        opacity: prog * 0.35,
      })
    }
    // Angled accent stripe
    page.drawLine({
      start: { x: 0, y: bandY + 8 },
      end: { x: W, y: bandY + 8 },
      thickness: 2,
      color: rgb(...t.gold),
    })
    page.drawLine({
      start: { x: 0, y: bandY + 14 },
      end: { x: W, y: bandY + 14 },
      thickness: 0.8,
      color: rgb(...t.goldLight),
      opacity: 0.6,
    })
    // Scallop bottom edge
    const scallops = 42
    for (let i = 0; i < scallops; i++) {
      const sx = (W / scallops) * i
      page.drawCircle({
        x: sx + W / scallops / 2,
        y: bandY + 2,
        size: W / scallops / 2,
        color: rgb(...t.paperBase),
      })
    }
    // Top 3px line
    page.drawRectangle({
      x: 0, y: H - 3,
      width: W, height: 3,
      color: rgb(...t.goldLight),
    })

  } else {
    // ── Modern: Split header with angular geometry ──
    page.drawRectangle({
      x: 0, y: bandY,
      width: W, height: BH,
      color: rgb(...t.primary),
    })
    // Bold accent stripe at bottom
    page.drawRectangle({
      x: 0, y: bandY,
      width: W, height: 6,
      color: rgb(...t.gold),
    })
    // Secondary stripe
    page.drawRectangle({
      x: 0, y: bandY + 6,
      width: W, height: 2,
      color: rgb(...t.accent),
      opacity: 0.8,
    })
    // Diagonal highlight slash
    page.drawLine({
      start: { x: W * 0.35, y: bandY },
      end: { x: W * 0.35 + BH * 1.2, y: H },
      thickness: BH * 0.6,
      color: rgb(1, 1, 1),
      opacity: 0.04,
    })
    // Top accent line
    page.drawRectangle({
      x: 0, y: H - 4,
      width: W, height: 4,
      color: rgb(...t.gold),
    })
    // Dot row
    const dotCount = 30
    for (let i = 0; i < dotCount; i++) {
      page.drawCircle({
        x: 30 + i * ((W - 60) / dotCount),
        y: bandY + BH * 0.5,
        size: 2.5,
        color: rgb(...t.gold),
        opacity: 0.2,
      })
    }
  }
}

// ────────────────────────────────────────────────────────────
// LAYER 3 — Footer Band (theme-distinct)
// ────────────────────────────────────────────────────────────

function drawFooterBand(
  page: PDFPage,
  W: number,
  t: ThemePalette,
  layout: string,
) {
  const { footerH: FH } = t

  if (layout === 'classic') {
    page.drawRectangle({ x: 0, y: 0, width: W, height: FH, color: rgb(...t.primary) })
    page.drawRectangle({ x: 0, y: FH - 5, width: W, height: 5, color: rgb(...t.gold) })
    page.drawRectangle({
      x: 0, y: FH - 7, width: W, height: 2,
      color: rgb(...t.goldLight), opacity: 0.5
    })
    // Chevron pattern (mirrored from header)
    for (let i = 0; i < 28; i++) {
      const x = i * 32
      const my = FH / 2
      page.drawLine({
        start: { x, y: my - 8 }, end: { x: x + 16, y: my + 8 },
        thickness: 0.6, color: rgb(...t.gold), opacity: 0.12
      })
      page.drawLine({
        start: { x: x + 16, y: my + 8 }, end: { x: x + 32, y: my - 8 },
        thickness: 0.6, color: rgb(...t.gold), opacity: 0.12
      })
    }

  } else if (layout === 'elegant') {
    page.drawRectangle({ x: 0, y: 0, width: W, height: FH, color: rgb(...t.primary) })
    // Gradient overlay
    for (let i = 0; i < FH; i++) {
      const prog = (FH - i) / FH
      page.drawRectangle({
        x: 0, y: i, width: W, height: 1,
        color: rgb(...t.secondary), opacity: prog * 0.3
      })
    }
    page.drawRectangle({ x: 0, y: FH - 8, width: W, height: 2, color: rgb(...t.gold) })
    page.drawRectangle({
      x: 0, y: FH - 14, width: W, height: 0.8,
      color: rgb(...t.goldLight), opacity: 0.5
    })
    // Scallop top edge
    const scallops = 42
    for (let i = 0; i < scallops; i++) {
      const sx = (W / scallops) * i
      page.drawCircle({
        x: sx + W / scallops / 2,
        y: FH - 2,
        size: W / scallops / 2,
        color: rgb(...t.paperBase),
      })
    }

  } else {
    page.drawRectangle({ x: 0, y: 0, width: W, height: FH, color: rgb(...t.primary) })
    page.drawRectangle({ x: 0, y: FH - 6, width: W, height: 6, color: rgb(...t.gold) })
    page.drawRectangle({
      x: 0, y: FH - 8, width: W, height: 2,
      color: rgb(...t.accent), opacity: 0.8
    })
    // Diagonal highlight (mirrored)
    page.drawLine({
      start: { x: W * 0.35, y: FH },
      end: { x: W * 0.35 + FH * 1.2, y: 0 },
      thickness: FH * 0.6,
      color: rgb(1, 1, 1),
      opacity: 0.04,
    })
    const dotCount = 30
    for (let i = 0; i < dotCount; i++) {
      page.drawCircle({
        x: 30 + i * ((W - 60) / dotCount),
        y: FH * 0.5,
        size: 2.5,
        color: rgb(...t.gold),
        opacity: 0.2,
      })
    }
  }
}

// ────────────────────────────────────────────────────────────
// LAYER 4 — Border Frame System (theme-distinct)
// ────────────────────────────────────────────────────────────

function drawBorderFrame(
  page: PDFPage,
  W: number,
  H: number,
  t: ThemePalette,
  layout: string,
) {
  const { headerH: HH, footerH: FH } = t
  const PAD_X = 18
  const PAD_Y_TOP = HH + 10
  const PAD_Y_BOT = FH + 8

  const fx = PAD_X
  const fy = PAD_Y_BOT
  const fw = W - PAD_X * 2
  const fh = H - PAD_Y_BOT - PAD_Y_TOP

  if (layout === 'classic') {
    // ── Classic: Double rectangular border with ornamental corners ──
    // Outer border — gold
    page.drawRectangle({
      x: fx, y: fy, width: fw, height: fh,
      borderColor: rgb(...t.gold),
      borderWidth: 2.5,
      opacity: 0,
    })
    // Inner border — primary
    page.drawRectangle({
      x: fx + 9, y: fy + 9, width: fw - 18, height: fh - 18,
      borderColor: rgb(...t.primary),
      borderWidth: 0.8,
      opacity: 0,
    })
    // Third thin gold line
    page.drawRectangle({
      x: fx + 14, y: fy + 14, width: fw - 28, height: fh - 28,
      borderColor: rgb(...t.gold),
      borderWidth: 0.4,
      opacity: 0,
    })
    // Corner ornaments — small squares filled gold
    const CL = 18
    const corners = [
      { x: fx, y: fy + fh - CL },  // top-left
      { x: fx + fw - CL, y: fy + fh - CL },  // top-right
      { x: fx, y: fy },  // bottom-left
      { x: fx + fw - CL, y: fy },  // bottom-right
    ]
    corners.forEach(c => {
      page.drawRectangle({
        x: c.x, y: c.y, width: CL, height: CL,
        color: rgb(...t.gold),
        opacity: 0.8,
      })
      page.drawRectangle({
        x: c.x + 3, y: c.y + 3, width: CL - 6, height: CL - 6,
        color: rgb(...t.paperBase),
      })
      // Center dot
      page.drawCircle({
        x: c.x + CL / 2, y: c.y + CL / 2,
        size: 3,
        color: rgb(...t.gold),
      })
    })

  } else if (layout === 'elegant') {
    // ── Elegant: Oval/rounded suggestion with leaf corners ──
    // Main border — fine gold
    page.drawRectangle({
      x: fx, y: fy, width: fw, height: fh,
      borderColor: rgb(...t.gold),
      borderWidth: 1.5,
      opacity: 0,
    })
    // Outer accent line
    page.drawRectangle({
      x: fx - 6, y: fy - 6, width: fw + 12, height: fh + 12,
      borderColor: rgb(...t.goldLight),
      borderWidth: 0.6,
      opacity: 0,
    })
    // Thin inner line
    page.drawRectangle({
      x: fx + 8, y: fy + 8, width: fw - 16, height: fh - 16,
      borderColor: rgb(...t.accent),
      borderWidth: 0.4,
      opacity: 0,
    })
    // Corner floral ornament (4-petal using circles)
    const leafCorners = [
      { cx: fx, cy: fy + fh },
      { cx: fx + fw, cy: fy + fh },
      { cx: fx, cy: fy },
      { cx: fx + fw, cy: fy },
    ]
    leafCorners.forEach(c => {
      // 4 petals
      [[0, 10], [0, -10], [10, 0], [-10, 0]].forEach(([dx, dy]) => {
        page.drawCircle({
          x: c.cx + dx, y: c.cy + dy,
          size: 7,
          color: rgb(...t.gold),
          opacity: 0.4,
        })
      })
      // Center jewel
      page.drawCircle({
        x: c.cx, y: c.cy,
        size: 6,
        color: rgb(...t.primary),
        borderColor: rgb(...t.gold),
        borderWidth: 1.5,
      })
      page.drawCircle({
        x: c.cx, y: c.cy,
        size: 3,
        color: rgb(...t.goldLight),
      })
    })

  } else {
    // ── Modern: Single bold line + geometric corner cuts ──
    // Outer hairline
    page.drawRectangle({
      x: fx - 4, y: fy - 4, width: fw + 8, height: fh + 8,
      borderColor: rgb(...t.gold),
      borderWidth: 0.5,
      opacity: 0,
    })
    // Main border
    page.drawRectangle({
      x: fx, y: fy, width: fw, height: fh,
      borderColor: rgb(...t.gold),
      borderWidth: 2,
      opacity: 0,
    })
    // Inner accent
    page.drawRectangle({
      x: fx + 7, y: fy + 7, width: fw - 14, height: fh - 14,
      borderColor: rgb(...t.accent),
      borderWidth: 0.5,
      opacity: 0,
    })
    // Geometric corner brackets (L-shaped cuts)
    const CUT = 24
    const bCorners = [
      { x: fx, y: fy + fh, dx: 1, dy: -1 },  // TL
      { x: fx + fw, y: fy + fh, dx: -1, dy: -1 },  // TR
      { x: fx, y: fy, dx: 1, dy: 1 },  // BL
      { x: fx + fw, y: fy, dx: -1, dy: 1 },  // BR
    ]
    bCorners.forEach(({ x, y, dx, dy }) => {
      // Bold L
      page.drawLine({
        start: { x, y },
        end: { x: x + dx * CUT, y },
        thickness: 4, color: rgb(...t.gold),
      })
      page.drawLine({
        start: { x, y },
        end: { x, y: y + dy * CUT },
        thickness: 4, color: rgb(...t.gold),
      })
      // Inner thin L
      page.drawLine({
        start: { x: x + dx * 6, y: y + dy * 6 },
        end: { x: x + dx * CUT, y: y + dy * 6 },
        thickness: 1, color: rgb(...t.goldLight), opacity: 0.7,
      })
      page.drawLine({
        start: { x: x + dx * 6, y: y + dy * 6 },
        end: { x: x + dx * 6, y: y + dy * CUT },
        thickness: 1, color: rgb(...t.goldLight), opacity: 0.7,
      })
    })
  }
}

// ────────────────────────────────────────────────────────────
// LAYER 5 — Divider Elements (theme-distinct)
// ────────────────────────────────────────────────────────────

function drawDivider(
  page: PDFPage,
  cx: number,
  y: number,
  halfW: number,
  t: ThemePalette,
  layout: string,
  variant: 'heavy' | 'light' = 'heavy',
) {
  const lineW = variant === 'heavy' ? halfW : halfW * 0.65
  const gap = variant === 'heavy' ? 32 : 22

  if (layout === 'classic') {
    page.drawLine({
      start: { x: cx - lineW, y: y + 2 }, end: { x: cx - gap, y: y + 2 },
      thickness: 1.5, color: rgb(...t.gold)
    })
    page.drawLine({
      start: { x: cx + gap, y: y + 2 }, end: { x: cx + lineW, y: y + 2 },
      thickness: 1.5, color: rgb(...t.gold)
    })
    page.drawLine({
      start: { x: cx - lineW, y: y - 2 }, end: { x: cx - gap, y: y - 2 },
      thickness: 0.6, color: rgb(...t.primary), opacity: 0.5
    })
    page.drawLine({
      start: { x: cx + gap, y: y - 2 }, end: { x: cx + lineW, y: y - 2 },
      thickness: 0.6, color: rgb(...t.primary), opacity: 0.5
    })

    // ── FIX: D defined here in correct scope ──
    const D = 10
    const diamondPts: [number, number][] = [[0, D], [D, 0], [0, -D], [-D, 0], [0, D]]
    for (let i = 0; i < diamondPts.length - 1; i++) {
      const a = diamondPts[i]!
      const b = diamondPts[i + 1]!
      page.drawLine({
        start: { x: cx + a[0], y: y + a[1] },
        end: { x: cx + b[0], y: y + b[1] },
        thickness: 1.5, color: rgb(...t.gold)
      })
    }

    page.drawCircle({ x: cx, y, size: 4, color: rgb(...t.primary) })
    page.drawCircle({ x: cx, y, size: 2, color: rgb(...t.gold) })

      // Side accent squares
      ;[-1, 1].forEach(dir => {
        page.drawRectangle({
          x: cx + dir * (lineW - 5) - 3,
          y: y - 3,
          width: 6, height: 6,
          color: rgb(...t.gold), opacity: 0.7,
        })
      })

  } else if (layout === 'elegant') {
    // Single fine line + floral center
    page.drawLine({
      start: { x: cx - lineW, y },
      end: { x: cx - gap, y },
      thickness: 0.8, color: rgb(...t.gold),
    })
    page.drawLine({
      start: { x: cx + gap, y },
      end: { x: cx + lineW, y },
      thickness: 0.8, color: rgb(...t.gold),
    })
      // Outer feathering
      ;[lineW * 0.7, lineW * 0.4].forEach(ox => {
        page.drawLine({
          start: { x: cx - ox, y: y + 4 },
          end: { x: cx - ox - 18, y: y + 4 },
          thickness: 0.4, color: rgb(...t.goldLight), opacity: 0.5,
        })
        page.drawLine({
          start: { x: cx + ox, y: y + 4 },
          end: { x: cx + ox + 18, y: y + 4 },
          thickness: 0.4, color: rgb(...t.goldLight), opacity: 0.5,
        })
      })
    // Floral (4 petals) - FIX: explicit tuple types
    const petalOffsets: [number, number][] = [[0, 9], [0, -9], [9, 0], [-9, 0]]
    petalOffsets.forEach(([pdx, pdy]) => {
      page.drawCircle({
        x: cx + pdx, y: y + pdy, size: 5,
        color: rgb(...t.gold), opacity: 0.4
      })
    })
    page.drawCircle({
      x: cx, y, size: 6,
      borderColor: rgb(...t.gold), borderWidth: 1.2, opacity: 0
    })
    page.drawCircle({ x: cx, y, size: 3.5, color: rgb(...t.primary) })
    page.drawCircle({ x: cx, y, size: 1.5, color: rgb(...t.goldLight) })

  } else {
    // Modern: Bold single line + geometric crosshair
    page.drawLine({
      start: { x: cx - lineW, y },
      end: { x: cx - gap, y },
      thickness: 2, color: rgb(...t.gold),
    })
    page.drawLine({
      start: { x: cx + gap, y },
      end: { x: cx + lineW, y },
      thickness: 2, color: rgb(...t.gold),
    })
    // Thin outer line
    page.drawLine({
      start: { x: cx - lineW, y: y - 4 },
      end: { x: cx - gap - 5, y: y - 4 },
      thickness: 0.5, color: rgb(...t.goldLight), opacity: 0.6,
    })
    page.drawLine({
      start: { x: cx + gap + 5, y: y - 4 },
      end: { x: cx + lineW, y: y - 4 },
      thickness: 0.5, color: rgb(...t.goldLight), opacity: 0.6,
    })
    // Crosshair center
    page.drawLine({
      start: { x: cx - gap, y }, end: { x: cx + gap, y },
      thickness: 0.5, color: rgb(...t.gold), opacity: 0.3
    })
    page.drawLine({
      start: { x: cx, y: y - gap }, end: { x: cx, y: y + gap },
      thickness: 0.5, color: rgb(...t.gold), opacity: 0.3
    })
    page.drawCircle({
      x: cx, y, size: 10,
      borderColor: rgb(...t.gold), borderWidth: 2, opacity: 0
    })
    page.drawCircle({ x: cx, y, size: 6, color: rgb(...t.primary) })
    page.drawCircle({ x: cx, y, size: 3, color: rgb(...t.gold) })
    page.drawCircle({ x: cx, y, size: 1.5, color: rgb(...t.paperBase) })
  }
}

// ────────────────────────────────────────────────────────────
// LAYER 6 — Certification Seal (theme-distinct)
// ────────────────────────────────────────────────────────────

function drawSeal(
  page: PDFPage,
  cx: number,
  cy: number,
  t: ThemePalette,
  layout: string,
  font: PDFFont,
) {
  if (layout === 'classic') {
    // ── Classic: Starburst wax seal ──
    const R = 36
    // Starburst rays (alternating long/short)
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI * 2) / 24
      const r1 = R + 2
      const r2 = i % 2 === 0 ? R + 18 : R + 11
      page.drawLine({
        start: { x: cx + Math.cos(a) * r1, y: cy + Math.sin(a) * r1 },
        end: { x: cx + Math.cos(a) * r2, y: cy + Math.sin(a) * r2 },
        thickness: i % 2 === 0 ? 3.5 : 1.8,
        color: rgb(...t.gold),
        opacity: i % 2 === 0 ? 1 : 0.65,
      })
    }
    // White backing circle
    page.drawCircle({ x: cx, y: cy, size: R + 3, color: rgb(1, 1, 1) })
    // Concentric rings
    page.drawCircle({
      x: cx, y: cy, size: R,
      borderColor: rgb(...t.gold), borderWidth: 3.5, opacity: 0
    })
    page.drawCircle({
      x: cx, y: cy, size: R - 7,
      color: rgb(...t.primary)
    })
    page.drawCircle({
      x: cx, y: cy, size: R - 13,
      borderColor: rgb(...t.goldLight), borderWidth: 1.2, opacity: 0
    })
    page.drawCircle({
      x: cx, y: cy, size: R - 20,
      color: rgb(1, 1, 1), opacity: 0.12
    })
    // Text
    const t1 = 'CERTIFIED'; const t2 = 'OFFICIAL'
    const s = 6.5
    page.drawText(t1, {
      x: cx - font.widthOfTextAtSize(t1, s) / 2,
      y: cy + 6, font, size: s, color: rgb(...t.gold),
    })
    page.drawText(t2, {
      x: cx - font.widthOfTextAtSize(t2, s) / 2,
      y: cy - 10, font, size: s, color: rgb(0.9, 0.9, 0.9),
    })

  } else if (layout === 'elegant') {
    // ── Elegant: Multi-ring mandala seal ──
    const R = 38
    // Outer petal ring (12 petals)
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI * 2) / 12
      page.drawCircle({
        x: cx + Math.cos(a) * (R + 8),
        y: cy + Math.sin(a) * (R + 8),
        size: 7,
        color: rgb(...t.gold),
        opacity: 0.55,
      })
    }
    // Mid ray ring (24 fine rays)
    for (let i = 0; i < 24; i++) {
      const a = (i * Math.PI * 2) / 24
      page.drawLine({
        start: { x: cx + Math.cos(a) * (R - 2), y: cy + Math.sin(a) * (R - 2) },
        end: { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R },
        thickness: 2, color: rgb(...t.gold), opacity: 0.7,
      })
    }
    page.drawCircle({ x: cx, y: cy, size: R + 2, color: rgb(1, 1, 1) })
    page.drawCircle({
      x: cx, y: cy, size: R,
      borderColor: rgb(...t.gold), borderWidth: 2.5, opacity: 0
    })
    page.drawCircle({
      x: cx, y: cy, size: R - 8,
      color: rgb(...t.primary)
    })
    page.drawCircle({
      x: cx, y: cy, size: R - 14,
      borderColor: rgb(...t.goldLight), borderWidth: 1, opacity: 0
    })
    // Inner mandala (6 petals)
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI * 2) / 6
      page.drawCircle({
        x: cx + Math.cos(a) * 12, y: cy + Math.sin(a) * 12,
        size: 5, color: rgb(...t.gold), opacity: 0.5,
      })
    }
    page.drawCircle({
      x: cx, y: cy, size: 7,
      color: rgb(1, 1, 1), opacity: 0.25
    })
    // Text
    const tE = 'VERIFIED'
    const sE = 6.5
    page.drawText(tE, {
      x: cx - font.widthOfTextAtSize(tE, sE) / 2,
      y: cy - sE / 2, font, size: sE, color: rgb(...t.goldLight),
    })

  } else {
    // ── Modern: Hexagonal badge ──
    const R = 36
    // Outer hexagon (6 sides)
    const hexPts = (r: number) =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i * Math.PI) / 3 - Math.PI / 6
        return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }
      })

    const drawHex = (r: number, thick: number, col: [number, number, number], op = 1) => {
      const pts = hexPts(r)
      for (let i = 0; i < 6; i++) {
        const next = pts[(i + 1) % 6]
        page.drawLine({
          start: pts[i], end: next,
          thickness: thick, color: rgb(...col), opacity: op,
        })
      }
    }

    drawHex(R + 12, 1, t.goldLight, 0.4)
    drawHex(R + 4, 3.5, t.gold)

    // Solid hexagon fill (white bg)
    const outerPts = hexPts(R + 4)
    page.drawRectangle({
      x: cx - R, y: cy - R, width: R * 2, height: R * 2,
      color: rgb(1, 1, 1),
    })
    // Inner hexagons
    drawHex(R - 1, 2, t.primary)
    const innerPts = hexPts(R - 1)
    // Fill inner hex
    page.drawCircle({ x: cx, y: cy, size: R - 1, color: rgb(...t.primary) })
    drawHex(R - 9, 1, t.gold, 0.6)

    // Tick marks between outer rings
    for (let i = 0; i < 18; i++) {
      const a = (i * Math.PI * 2) / 18
      page.drawLine({
        start: { x: cx + Math.cos(a) * (R + 5), y: cy + Math.sin(a) * (R + 5) },
        end: { x: cx + Math.cos(a) * (R + 10), y: cy + Math.sin(a) * (R + 10) },
        thickness: 1.5, color: rgb(...t.gold), opacity: 0.6,
      })
    }

    // Text
    const tM1 = 'VERIFIED'; const tM2 = 'AUTHENTIC'
    const sM = 6.5
    page.drawText(tM1, {
      x: cx - font.widthOfTextAtSize(tM1, sM) / 2,
      y: cy + 6, font, size: sM, color: rgb(...t.gold),
    })
    page.drawText(tM2, {
      x: cx - font.widthOfTextAtSize(tM2, sM) / 2,
      y: cy - 10, font, size: sM, color: rgb(0.85, 0.90, 0.95),
    })
  }
}

// ────────────────────────────────────────────────────────────
// LAYER 7 — Recipient Name Block (Premium Highlight)
// ────────────────────────────────────────────────────────────

function drawRecipientBlock(
  page: PDFPage,
  name: string,
  y: number,
  W: number,
  t: ThemePalette,
  layout: string,
  boldItal: PDFFont,
  bold: PDFFont,
) {
  const fontSize = name.length > 22 ? 30 : 36
  const nameW = boldItal.widthOfTextAtSize(name, fontSize)
  const cx = W / 2
  const padX = 52
  const boxW = Math.min(nameW + padX * 2, W - 100)
  const boxH = 58
  const boxX = cx - boxW / 2
  const boxY = y - 14

  if (layout === 'classic') {
    // Warm cream box with side pillar bars
    page.drawRectangle({
      x: boxX - 2, y: boxY - 2, width: boxW + 4, height: boxH + 4,
      color: rgb(...t.gold), opacity: 0.25,
    })
    page.drawRectangle({
      x: boxX, y: boxY, width: boxW, height: boxH,
      color: rgb(...t.paperWarm),
    })
    page.drawRectangle({
      x: boxX, y: boxY, width: boxW, height: boxH,
      borderColor: rgb(...t.gold), borderWidth: 1.5, opacity: 0,
    })
    // Left pillar
    for (let i = 0; i < 3; i++) {
      page.drawRectangle({
        x: boxX - 8 - i * 4, y: boxY + 4,
        width: 4, height: boxH - 8,
        color: rgb(...t.gold), opacity: 0.9 - i * 0.25,
      })
    }
    // Right pillar
    for (let i = 0; i < 3; i++) {
      page.drawRectangle({
        x: boxX + boxW + 4 + i * 4, y: boxY + 4,
        width: 4, height: boxH - 8,
        color: rgb(...t.gold), opacity: 0.9 - i * 0.25,
      })
    }
    // Corner flourish squares
    ;[
      [boxX, boxY], [boxX + boxW - 8, boxY],
      [boxX, boxY + boxH - 8], [boxX + boxW - 8, boxY + boxH - 8],
    ].forEach(([bx, by]) => {
      page.drawRectangle({
        x: bx, y: by, width: 8, height: 8,
        color: rgb(...t.gold)
      })
    })

  } else if (layout === 'elegant') {
    // Soft glow box with feathered edges
    for (let i = 5; i >= 0; i--) {
      page.drawRectangle({
        x: boxX - i * 3, y: boxY - i * 3,
        width: boxW + i * 6, height: boxH + i * 6,
        color: rgb(...t.gold), opacity: 0.012 + i * 0.004,
      })
    }
    page.drawRectangle({
      x: boxX, y: boxY, width: boxW, height: boxH,
      color: rgb(1, 1, 1), opacity: 0.88,
    })
    page.drawRectangle({
      x: boxX, y: boxY, width: boxW, height: boxH,
      borderColor: rgb(...t.gold), borderWidth: 1, opacity: 0,
    })
    // Thin accent top
    page.drawRectangle({
      x: boxX + 12, y: boxY + boxH - 2,
      width: boxW - 24, height: 2,
      color: rgb(...t.gold),
    })
    // Thin accent bottom
    page.drawRectangle({
      x: boxX + 12, y: boxY,
      width: boxW - 24, height: 2,
      color: rgb(...t.gold),
    })
      // Corner dot jewels
      ;[
        [boxX, boxY], [boxX + boxW, boxY],
        [boxX, boxY + boxH], [boxX + boxW, boxY + boxH],
      ].forEach(([bx, by]) => {
        page.drawCircle({
          x: bx, y: by, size: 5,
          color: rgb(...t.primary), borderColor: rgb(...t.gold), borderWidth: 1.5
        })
      })

  } else {
    // Modern: Bold left accent bar + clean white box
    // Shadow
    page.drawRectangle({
      x: boxX + 4, y: boxY - 4, width: boxW, height: boxH,
      color: rgb(...t.primary), opacity: 0.12,
    })
    page.drawRectangle({
      x: boxX, y: boxY, width: boxW, height: boxH,
      color: rgb(1, 1, 1),
    })
    // Bold left bar (5px)
    page.drawRectangle({
      x: boxX, y: boxY, width: 6, height: boxH,
      color: rgb(...t.gold),
    })
    // Top + bottom fine lines
    page.drawRectangle({
      x: boxX + 6, y: boxY + boxH - 1.5,
      width: boxW - 6, height: 1.5,
      color: rgb(...t.gold), opacity: 0.6,
    })
    page.drawRectangle({
      x: boxX + 6, y: boxY,
      width: boxW - 6, height: 1.5,
      color: rgb(...t.gold), opacity: 0.6,
    })
    // Right accent triangle
    page.drawLine({
      start: { x: boxX + boxW - 20, y: boxY + boxH },
      end: { x: boxX + boxW, y: boxY + boxH },
      thickness: 1, color: rgb(...t.gold),
    })
    page.drawLine({
      start: { x: boxX + boxW, y: boxY + boxH },
      end: { x: boxX + boxW, y: boxY + boxH - 20 },
      thickness: 1, color: rgb(...t.gold),
    })
  }

  // Name text (centered)
  page.drawText(name, {
    x: cx - boldItal.widthOfTextAtSize(name, fontSize) / 2,
    y: y + 4,
    font: boldItal,
    size: fontSize,
    color: rgb(...t.textDark),
  })

  // Underline accent
  const ulY = boxY - 3
  page.drawLine({
    start: { x: cx - nameW / 2 - 10, y: ulY },
    end: { x: cx + nameW / 2 + 10, y: ulY },
    thickness: 2.5, color: rgb(...t.gold),
  })
  page.drawLine({
    start: { x: cx - nameW / 2 - 5, y: ulY - 5 },
    end: { x: cx + nameW / 2 + 5, y: ulY - 5 },
    thickness: 0.8, color: rgb(...t.primary), opacity: 0.4,
  })

  return boxY - 14  // next Y position
}

// ────────────────────────────────────────────────────────────
// LAYER 8 — Watermark
// ────────────────────────────────────────────────────────────

function drawWatermark(
  page: PDFPage,
  text: string,
  font: PDFFont,
  W: number,
  H: number,
) {
  const size = 72
  const t = text.toUpperCase()
  const tw = font.widthOfTextAtSize(t, size)
  page.drawText(t, {
    x: W / 2 - tw / 2,
    y: H / 2 - size / 3,
    font, size,
    color: rgb(0.88, 0.88, 0.88),
    rotate: degrees(45),
    opacity: 0.028,
  })
}

// ────────────────────────────────────────────────────────────
// MAIN BUILDER
// ────────────────────────────────────────────────────────────

export async function buildCertificatePdfEnhanced(
  options: BuildCertificatePdfOptions,
): Promise<Buffer> {
  const { branding, accreditations, content, verification, customization } = options

  const pdfDoc = await PDFDocument.create()
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  const boldItal = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique)
  const reg = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const italic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique)

  // A4 Landscape
  const W = 841.89
  const H = 595.28
  const page = pdfDoc.addPage([W, H])
  const CX = W / 2

  // ── Theme ─────────────────────────────────────────────────
  const t = getTheme(customization.layout)
  const layout = customization.layout

  // ── LAYOUT ZONES ──────────────────────────────────────────
  const { headerH: HH, footerH: FH } = t
  // Inner content area
  const INNER_TOP = H - HH - 40
  const INNER_BOT = FH + 24
  const PAD_X = 52   // horizontal margin inside borders

  // ── STEP 1: Paper Background ──────────────────────────────
  drawPaperBackground(page, W, H, t, layout)

  // ── STEP 2: Header & Footer Bands ─────────────────────────
  drawHeaderBand(page, W, H, t, layout)
  drawFooterBand(page, W, t, layout)

  // ── STEP 3: Border Frame ──────────────────────────────────
  drawBorderFrame(page, W, H, t, layout)

  // ── STEP 4: Watermark ─────────────────────────────────────
  if (customization.enableWatermark && customization.watermarkText?.trim()) {
    drawWatermark(page, customization.watermarkText, bold, W, H)
  }

  // ── STEP 5: Load all images ───────────────────────────────
  const schoolLogo = branding.showParentBranding
    ? await loadImageFromUrl(pdfDoc, branding.schoolLogo) : undefined
  const franchiseLogo = branding.showFranchiseBranding
    ? await loadImageFromUrl(pdfDoc, branding.franchiseLogo) : undefined
  const signatureImg = customization.enableDigitalSignature
    ? await loadImageFromUrl(pdfDoc, customization.signatureImage) : undefined

  // Accreditation logos
  const accredImgs: PDFImage[] = []
  if (accreditations.inheritParentAccreditations) {
    const all = [
      ...(accreditations.parentAffiliations || []),
      ...(accreditations.parentRecognitions || []),
      ...(accreditations.parentRegistrations || []),
      ...(accreditations.parentPartnerships || []),
    ].filter(a => a.isActive !== false)
    for (const a of all.slice(0, 4)) {
      const img = await loadImageFromUrl(pdfDoc, a.logoUrl)
      if (img) accredImgs.push(img)
    }
  }
  if (accreditations.showFranchiseAccreditations) {
    const fl = [
      ...(accreditations.franchiseRegistrations || []),
      ...(accreditations.franchisePartnerships || []),
      ...(accreditations.franchiseAwards || []),
    ].filter(a => a.isActive !== false)
    for (const a of fl.slice(0, 5 - accredImgs.length)) {
      const img = await loadImageFromUrl(pdfDoc, a.logoUrl)
      if (img) accredImgs.push(img)
    }
  }

  // QR Code
  let qrImg: PDFImage | undefined
  if (verification.enableQRCode) {
    const qrUrl = buildVerifyUrl(verification)
    console.log('[PDF] QR URL:', qrUrl)
    try {
      const qrBuf = await generateQRCodeBuffer(qrUrl, {
        size: 220, margin: 1,
        errorCorrectionLevel: 'M',
        color: { dark: '#000000', light: '#ffffff' },
      })
      qrImg = await pdfDoc.embedPng(qrBuf)
    } catch (err) {
      console.error('[PDF] QR generation failed:', err)
    }
  }

  // ── STEP 6: HEADER BAND CONTENT ───────────────────────────
  const BAND_CY = H - HH / 2

  // ── Logo(s) LEFT ──────────────────────────────────────────
  let logoX = 44

  if (schoolLogo && branding.showParentBranding) {
    const MAX = 64
    const d = schoolLogo.scale(1)
    const sc = Math.min(MAX / d.width, MAX / d.height)
    const lw = d.width * sc
    const lh = d.height * sc
    // Backing panel
    page.drawRectangle({
      x: logoX - 4, y: BAND_CY - lh / 2 - 4,
      width: lw + 8, height: lh + 8,
      color: rgb(1, 1, 1),
      borderColor: rgb(...t.gold),
      borderWidth: 1.5,
    })
    page.drawImage(schoolLogo, {
      x: logoX, y: BAND_CY - lh / 2,
      width: lw, height: lh,
    })
    logoX += lw + 22
  }

  if (franchiseLogo && branding.showFranchiseBranding) {
    const MAX = 54
    const d = franchiseLogo.scale(1)
    const sc = Math.min(MAX / d.width, MAX / d.height)
    const lw = d.width * sc
    const lh = d.height * sc
    page.drawRectangle({
      x: logoX - 4, y: BAND_CY - lh / 2 - 4,
      width: lw + 8, height: lh + 8,
      color: rgb(1, 1, 1),
      borderColor: rgb(...t.gold),
      borderWidth: 1.5,
    })
    page.drawImage(franchiseLogo, {
      x: logoX, y: BAND_CY - lh / 2,
      width: lw, height: lh,
    })
  }

  // ── Seal RIGHT ────────────────────────────────────────────
  const SEAL_CX = W - 68
  drawSeal(page, SEAL_CX, BAND_CY, t, layout, bold)

  // ── Accreditation logos (between logos and seal) ──────────
  if (accredImgs.length > 0) {
    const A_SZ = 44
    const A_GAP = 54
    let ax = SEAL_CX - 70 - A_SZ

    for (const img of [...accredImgs].reverse().slice(0, 4)) {
      if (ax < 240) break
      page.drawRectangle({
        x: ax - 3, y: BAND_CY - A_SZ / 2 - 3,
        width: A_SZ + 6, height: A_SZ + 6,
        color: rgb(1, 1, 1),
        borderColor: rgb(...t.gold),
        borderWidth: 1,
      })
      const d = img.scale(1)
      const sc = Math.min(A_SZ / d.width, A_SZ / d.height)
      const iw = d.width * sc
      const ih = d.height * sc
      page.drawImage(img, {
        x: ax + (A_SZ - iw) / 2,
        y: BAND_CY - ih / 2,
        width: iw, height: ih,
      })
      ax -= A_GAP
    }
  }

  // ── STEP 7: SCHOOL NAME SECTION ───────────────────────────
  let y = INNER_TOP

  const hasMultiBranding =
    branding.showParentBranding &&
    branding.showFranchiseBranding &&
    Boolean(branding.franchiseName)

  if (hasMultiBranding && branding.franchiseName) {
    // Primary school name
    drawCentered(page, branding.schoolName.toUpperCase(), bold, 20, y,
      t.textDark, W)
    y -= 21

    // Franchise sub-line
    const franchiseLine = branding.franchiseName +
      (branding.franchiseCity ? `  •  ${branding.franchiseCity}` : '') +
      (branding.franchiseState ? `, ${branding.franchiseState}` : '')
    drawCentered(page, franchiseLine, reg, 10, y, t.textMedium, W)
    y -= 22

  } else {
    drawCentered(page, branding.schoolName.toUpperCase(), bold, 22, y,
      t.textDark, W)
    y -= 28
  }

  // Contact info row
  const cp: string[] = []
  if (branding.showParentBranding) {
    if (branding.schoolAddress) cp.push(branding.schoolAddress)
    if (branding.schoolPhone) cp.push(`Tel: ${branding.schoolPhone}`)
    if (branding.schoolEmail) cp.push(branding.schoolEmail)
  }
  if (cp.length > 0) {
    drawCentered(page, cp.join('   •   '), reg, 8, y, t.textLight, W)
    y -= 20
  }

  // ── Top Divider ───────────────────────────────────────────
  drawDivider(page, CX, y, 260, t, layout, 'heavy')
  y -= 40

  // ── STEP 8: CERTIFICATE TITLE BLOCK ──────────────────────
  // "CERTIFICATE" headline
  drawCentered(page, 'CERTIFICATE', bold, 27, y, t.primary, W)
  y -= 30

  // Certificate type (e.g. "OF ACHIEVEMENT")
  const typeText = `OF  ${content.certificateType.toUpperCase()}`
  const typeW = reg.widthOfTextAtSize(typeText, 12)
  // Decorative line pair
  const lGap = 24
  page.drawLine({
    start: { x: CX - typeW / 2 - lGap - 30, y: y + 6 },
    end: { x: CX - typeW / 2 - lGap, y: y + 6 },
    thickness: 1.2, color: rgb(...t.gold),
  })
  page.drawLine({
    start: { x: CX + typeW / 2 + lGap, y: y + 6 },
    end: { x: CX + typeW / 2 + lGap + 30, y: y + 6 },
    thickness: 1.2, color: rgb(...t.gold),
  })
  page.drawCircle({ x: CX - typeW / 2 - lGap, y: y + 6, size: 3, color: rgb(...t.gold) })
  page.drawCircle({ x: CX + typeW / 2 + lGap, y: y + 6, size: 3, color: rgb(...t.gold) })
  drawCentered(page, typeText, reg, 12, y, t.gold, W)
  y -= 32

  // ── "This is to certify that" ─────────────────────────────
  drawCentered(page, 'This is to certify that', italic, 10, y, t.textLight, W)
  y -= 28

  // ── STEP 9: RECIPIENT NAME ────────────────────────────────
  const nextY = drawRecipientBlock(page, content.recipientName, y, W, t, layout, boldItal, bold)
  y = nextY - 8

  // ── STEP 10: BODY CONTENT ─────────────────────────────────
  // ── FIX: Lower thresholds — content band ke upar sirf footer strip chahiye
  // Footer strip height ~100px + bottom band FH
  const CONTENT_FLOOR = FH + 105  // minimum Y where content can render

  // Title lines
  if (content.title?.trim()) {
    const titleLines = wrapText(content.title, W - PAD_X * 2 - 40, reg, 13)
    for (const line of titleLines) {
      if (y < CONTENT_FLOOR) break
      drawCentered(page, line, reg, 13, y, t.textMedium, W)
      y -= 19
    }
    y -= 6
  }

  // Body paragraphs
  if (content.content?.trim()) {
    const paragraphs = content.content.split('\n').filter(l => l.trim())
    for (const para of paragraphs) {
      for (const wl of wrapText(para.trim(), W - PAD_X * 2 - 20, reg, 10.5)) {
        if (y < CONTENT_FLOOR) break
        drawCentered(page, wl, reg, 10.5, y, t.textLight, W)
        y -= 15
      }
      if (y < CONTENT_FLOOR) break
    }
  }

  // ── Bottom content divider ────────────────────────────────
  // FIX: Fixed position, content ke neeche nahi — always at same spot
  const bottomDivY = FH + 100
  drawDivider(page, CX, bottomDivY, 220, t, layout, 'light')

  // ── STEP 11: FOOTER CONTENT STRIP ────────────────────────
  const STRIP_CY = FH + 52

  // ── DATE (LEFT) ───────────────────────────────────────────
  const COL_L = PAD_X + 18
  const dateValue = content.issuedDate ||
    new Date().toLocaleDateString('en-IN', {
      day: '2-digit', month: 'long', year: 'numeric',
    })

  page.drawText('Date of Issue', {
    x: COL_L, y: STRIP_CY + 20,
    font: bold, size: 8,
    color: rgb(...t.textMedium),
  })
  page.drawLine({
    start: { x: COL_L, y: STRIP_CY + 16 },
    end: { x: COL_L + 120, y: STRIP_CY + 16 },
    thickness: 1.2, color: rgb(...t.gold),
  })
  page.drawText(dateValue, {
    x: COL_L, y: STRIP_CY + 3,
    font: reg, size: 10.5,
    color: rgb(...t.textDark),
  })

  // ── SIGNATURE (RIGHT) ─────────────────────────────────────
  const COL_R = W - PAD_X - 98
  const SIG_W = 155
  const SIG_LY = STRIP_CY + 14

  if (signatureImg) {
    const SIG_IW = 120; const SIG_IH = 40
    page.drawImage(signatureImg, {
      x: COL_R - SIG_IW / 2, y: SIG_LY + 6,
      width: SIG_IW, height: SIG_IH,
    })
  }

  page.drawLine({
    start: { x: COL_R - SIG_W / 2, y: SIG_LY },
    end: { x: COL_R + SIG_W / 2, y: SIG_LY },
    thickness: 1.8, color: rgb(...t.textMedium),
  })
    ;[-1, 1].forEach(dir => {
      for (let i = 0; i < 3; i++) {
        page.drawCircle({
          x: COL_R + dir * (SIG_W / 2 + 2 + i * 4),
          y: SIG_LY, size: 1.8 - i * 0.4,
          color: rgb(...t.gold), opacity: 0.8 - i * 0.2,
        })
      }
    })

  if (customization.signatureName) {
    const snW = bold.widthOfTextAtSize(customization.signatureName, 10)
    page.drawText(customization.signatureName, {
      x: COL_R - snW / 2, y: SIG_LY - 16,
      font: bold, size: 10,
      color: rgb(...t.textDark),
    })
  }

  const desig = customization.signatureDesignation ||
    customization.signatureLabel || 'Principal'
  const desigW = reg.widthOfTextAtSize(desig, 9)
  page.drawText(desig, {
    x: COL_R - desigW / 2, y: SIG_LY - 29,
    font: reg, size: 9,
    color: rgb(...t.textMedium),
  })

  // ── QR CODE ───────────────────────────────────────────────
  if (verification.enableQRCode && qrImg) {
    const QR_SZ = 48

    let qrCX: number
    switch (verification.qrCodePosition) {
      case 'bottom-left': qrCX = 300; break
      case 'bottom-right': qrCX = W - 300; break
      default: qrCX = CX
    }

    const qrX = qrCX - QR_SZ / 2
    // FIX: QR Y — bottom of QR must be above footer band (FH)
    // Top of QR = STRIP_CY + 2, which is FH + 54 — safely above FH
    const qrY = FH + 22

    const scanTxt = 'Scan to Verify'
    const scanW = reg.widthOfTextAtSize(scanTxt, 7)
    page.drawText(scanTxt, {
      x: qrX + (QR_SZ - scanW) / 2,
      y: qrY + QR_SZ + 6,
      font: reg, size: 7,
      color: rgb(...t.textLight),
    })

    page.drawRectangle({
      x: qrX - 4, y: qrY - 4,
      width: QR_SZ + 8, height: QR_SZ + 8,
      color: rgb(1, 1, 1),
      borderColor: rgb(...t.gold),
      borderWidth: 2,
    })
    page.drawImage(qrImg, { x: qrX, y: qrY, width: QR_SZ, height: QR_SZ })
  }

  // ── STEP 12: FOOTER BAND TEXT ─────────────────────────────
  const F_CY = FH / 2

  // Certificate number — centered
  const cnTxt = `Certificate No: ${content.certificateNumber}`
  const cnW = bold.widthOfTextAtSize(cnTxt, 8.5)
  page.drawText(cnTxt, {
    x: (W - cnW) / 2, y: F_CY + 12,
    font: bold, size: 8.5,
    color: rgb(...t.textOnDark),
  })

  // Verification code
  const vcTxt = `Verification Code: ${verification.verificationCode}`
  const vcW = reg.widthOfTextAtSize(vcTxt, 7.5)
  page.drawText(vcTxt, {
    x: (W - vcW) / 2, y: F_CY,
    font: reg, size: 7.5,
    color: rgb(0.88, 0.88, 0.88),
  })

  // Verify URL
  if (verification.showVerificationURL) {
    const vUrl = buildVerifyUrl(verification)
    const urlTxt = `Verify at: ${vUrl}`
    const urlW = italic.widthOfTextAtSize(urlTxt, 6.5)
    page.drawText(urlTxt, {
      x: (W - urlW) / 2, y: F_CY - 11,
      font: italic, size: 6.5,
      color: rgb(0.78, 0.78, 0.78),
    })
  }

  // Powered-by badge (subtle, left side of footer)
  const pwrTxt = 'skolify.in'
  page.drawText(pwrTxt, {
    x: 24, y: F_CY - 4,
    font: reg, size: 7,
    color: rgb(0.7, 0.7, 0.7),
    opacity: 0.6,
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}