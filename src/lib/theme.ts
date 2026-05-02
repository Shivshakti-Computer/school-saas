// FILE: src/lib/theme.ts
// ═══════════════════════════════════════════════════════════
// Central Design Token Utility
// CSS variables se runtime gradients & colors generate karta hai
//
// Usage (any module):
//   import { t, grad, statMeta } from '@/lib/theme'
//   style={{ background: grad('primary', 135) }}
//   style={{ color: t('primary', 600) }}
//
// AppearanceTab se color change → CSS variables update →
// ye functions automatically naye colors return karenge
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────
// t() — CSS variable reference (string)
// Components mein inline style ya CSS mein use karo
// ─────────────────────────────────────────────────────────
export type ColorScale = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950

export type ThemeColor =
    | 'primary'
    | 'accent'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'violet'

// Static colors (non-themeable) — ye CSS variables change nahi hote
const STATIC_SCALES: Record<string, Record<number, string>> = {
    success: {
        50: '#ecfdf5', 100: '#d1fae5', 200: '#a7f3d0',
        400: '#34d399', 500: '#10b981', 600: '#059669',
        700: '#047857', 800: '#065f46',
    },
    warning: {
        50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a',
        400: '#fbbf24', 500: '#f59e0b', 600: '#d97706',
        700: '#b45309', 800: '#92400e',
    },
    danger: {
        50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca',
        400: '#f87171', 500: '#ef4444', 600: '#dc2626',
        700: '#b91c1c', 800: '#991b1b',
    },
    info: {
        50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe',
        400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb',
        700: '#1d4ed8', 800: '#1e40af',
    },
    violet: {
        50: '#f5f3ff', 100: '#ede9fe', 200: '#ddd6fe',
        400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed',
        700: '#6d28d9', 800: '#5b21b6',
    },
}

/**
 * CSS variable reference string return karta hai
 * @example t('primary', 500) → 'var(--primary-500)'
 * @example t('success', 600) → '#059669' (static)
 */
export function t(color: ThemeColor, shade: ColorScale): string {
    // Primary aur accent dynamic hain (theme se change hote hain)
    if (color === 'primary' || color === 'accent') {
        return `var(--${color}-${shade})`
    }
    // Baaki static hain
    return STATIC_SCALES[color]?.[shade] ?? `var(--${color}-${shade})`
}

/**
 * CSS variable reference for text/bg shorthand
 * @example tv('text-primary') → 'var(--text-primary)'
 * @example tv('bg-card') → 'var(--bg-card)'
 */
export function tv(variable: string): string {
    return `var(--${variable})`
}

// ─────────────────────────────────────────────────────────
// grad() — CSS gradient string
// CSS variables ko directly use karta hai
// ─────────────────────────────────────────────────────────

export type GradientDirection = 90 | 135 | 145 | 180

/**
 * Linear gradient string generate karta hai CSS variables se
 * @example grad('primary', 135) → 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
 * @example grad('success', 90, [400, 600]) → 'linear-gradient(90deg, #34d399, #059669)'
 */
export function grad(
    color: ThemeColor,
    direction: GradientDirection = 135,
    shades: [ColorScale, ColorScale] = [500, 600]
): string {
    const from = t(color, shades[0])
    const to = t(color, shades[1])
    return `linear-gradient(${direction}deg, ${from}, ${to})`
}

/**
 * Card background gradient — light tint
 * @example cardGrad('primary') → 'linear-gradient(145deg, #fff 0%, var(--primary-50) 100%)'
 */
export function cardGrad(color: ThemeColor): string {
    if (color === 'primary' || color === 'accent') {
        // Dynamic — CSS variables use karo
        return `linear-gradient(145deg, #ffffff 0%, var(--${color}-50) 60%, var(--${color}-100) 100%)`
    }
    // Static colors
    const s = STATIC_SCALES[color]
    if (!s) return 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)'

    const shade50 = s[50] ?? '#f9fafb'
    const shade100 = s[100] ?? '#f3f4f6'

    return `linear-gradient(145deg, #ffffff 0%, ${shade50} 60%, ${shade100} 100%)`
}

/**
 * Icon background gradient
 * @example iconGrad('primary') → 'linear-gradient(135deg, var(--primary-100), var(--primary-200))'
 */
export function iconGrad(color: ThemeColor): string {
    if (color === 'primary' || color === 'accent') {
        return `linear-gradient(135deg, var(--${color}-100), var(--${color}-200))`
    }
    const s = STATIC_SCALES[color]
    if (!s) return 'linear-gradient(135deg, #e5e7eb, #d1d5db)'

    const shade100 = s[100] ?? '#e5e7eb'
    const shade200 = s[200] ?? '#d1d5db'

    return `linear-gradient(135deg, ${shade100}, ${shade200})`
}
/**
 * Solid icon gradient (white icon ke liye)
 * @example solidIconGrad('primary') → 'linear-gradient(135deg, var(--primary-500), var(--primary-600))'
 */
export function solidIconGrad(color: ThemeColor): string {
    return grad(color, 135, [500, 600])
}

/**
 * Glow/shadow color for box-shadow
 * @example glow('primary', 0.25) → 'rgba(var(--primary-rgb), 0.25)'
 */
export function glow(color: ThemeColor, opacity: number = 0.2): string {
    if (color === 'primary') return `rgba(var(--primary-rgb), ${opacity})`
    if (color === 'accent') return `rgba(var(--accent-rgb), ${opacity})`

    const rgbMap: Record<string, string> = {
        success: '16,185,129',
        warning: '245,158,11',
        danger: '239,68,68',
        info: '59,130,246',
        violet: '139,92,246',
    }
    return `rgba(${rgbMap[color] ?? '99,102,241'}, ${opacity})`
}

/**
 * Hover box-shadow
 */
export function hoverShadow(color: ThemeColor): string {
    return `0 8px 32px ${glow(color, 0.25)}, 0 2px 8px ${glow(color, 0.15)}`
}

/**
 * Border color
 */
export function border(color: ThemeColor, shade: ColorScale = 200): string {
    return t(color, shade)
}

// ─────────────────────────────────────────────────────────
// statMeta() — StatCard ke liye complete config
// DashboardClient mein STAT_META replace karta hai
// ─────────────────────────────────────────────────────────

export interface StatMetaConfig {
    cardGradient: string
    iconGradient: string  // light — icon bg ke liye
    solidIconGrad: string  // dark — white icon ke liye
    iconColor: string  // icon color when iconGradient used
    valueColor: string
    accentLine: string  // top bar gradient
    glowColor: string
    hoverShadow: string
    shimmerColor: string
    hoverBorder: string
}

export function statMeta(color: ThemeColor): StatMetaConfig {
    return {
        cardGradient: cardGrad(color),
        iconGradient: iconGrad(color),
        solidIconGrad: solidIconGrad(color),
        iconColor: t(color, 600),
        valueColor: t(color, 800),
        accentLine: `linear-gradient(90deg, ${t(color, 400)}, ${t(color, 600)}, ${t(color, 400)})`,
        glowColor: glow(color, 0.15),
        hoverShadow: hoverShadow(color),
        shimmerColor: 'rgba(255,255,255,0.6)',
        hoverBorder: glow(color, 0.4),
    }
}

// ─────────────────────────────────────────────────────────
// Semantic Aliases — common patterns
// ─────────────────────────────────────────────────────────

/** Fee summary cards ke liye */
export const FEE_COLORS = {
    thisMonth: {
        bg: cardGrad('success'),
        border: t('success', 200),
        icon: solidIconGrad('success'),
        iconShadow: glow('success', 0.4),
        text: t('success', 700),
        label: t('success', 600),
    },
    total: {
        bg: cardGrad('primary'),
        border: t('primary', 200),
        icon: solidIconGrad('primary'),
        iconShadow: glow('primary', 0.4),
        text: t('primary', 700),
        label: t('primary', 500),
    },
    pending: {
        bg: cardGrad('danger'),
        border: t('danger', 200),
        icon: solidIconGrad('danger'),
        iconShadow: glow('danger', 0.4),
        text: t('danger', 700),
        label: t('danger', 600),
    },
} as const

/** Subscription card states */
export function subCardStyle(state: 'expired' | 'trial' | 'paid') {
    const map = {
        expired: {
            bg: cardGrad('danger'),
            border: t('danger', 200),
            iconBg: solidIconGrad('danger'),
            iconShadow: glow('danger', 0.4),
            titleColor: t('danger', 800),
            subColor: t('danger', 600),
            btnBg: grad('danger', 135),
            btnColor: '#fff',
            btnShadow: glow('danger', 0.35),
            label: 'Subscribe Now',
        },
        trial: {
            bg: cardGrad('warning'),
            border: t('warning', 200),
            iconBg: solidIconGrad('warning'),
            iconShadow: glow('warning', 0.4),
            titleColor: t('warning', 800),
            subColor: t('warning', 600),
            btnBg: grad('warning', 135),
            btnColor: '#fff',
            btnShadow: glow('warning', 0.35),
            label: 'Upgrade Plan',
        },
        paid: {
            bg: cardGrad('success'),
            border: t('success', 200),
            iconBg: solidIconGrad('success'),
            iconShadow: glow('success', 0.4),
            titleColor: t('success', 800),
            subColor: t('success', 600),
            btnBg: 'rgba(255,255,255,0.85)',
            btnColor: t('success', 800),
            btnShadow: 'transparent',
            label: 'Manage',
        },
    }
    return map[state]
}

/** Credit widget states */
export function creditWidgetStyle(isLow: boolean) {
    const color: ThemeColor = isLow ? 'danger' : 'primary'
    return {
        bg: cardGrad(color),
        border: t(color, 200),
        iconBg: solidIconGrad(color),
        iconShadow: glow(color, 0.4),
        numColor: t(color, 700),
        titleColor: t(color, 900),
        barGrad: grad(color, 90, [400, 600]),
        barGlow: glow(color, 0.4),
        btnBg: grad(color, 135),
        warnColor: t(color, 600),
    }
}

/** Bar chart colors */
export function barColor(pct: number): { gradient: string; glow: string } {
    if (pct >= 80) return {
        gradient: `linear-gradient(180deg, ${t('success', 400)} 0%, ${t('success', 600)} 100%)`,
        glow: glow('success', 0.45),
    }
    if (pct >= 60) return {
        gradient: `linear-gradient(180deg, ${t('warning', 400)} 0%, ${t('warning', 600)} 100%)`,
        glow: glow('warning', 0.45),
    }
    return {
        gradient: `linear-gradient(180deg, ${t('danger', 400)} 0%, ${t('danger', 600)} 100%)`,
        glow: glow('danger', 0.45),
    }
}

/** Quick action items config */
export function quickActionStyle(color: ThemeColor) {
    return {
        iconBg: solidIconGrad(color),
        hoverBg: color === 'primary' || color === 'accent'
            ? `var(--${color}-50)`
            : STATIC_SCALES[color]?.[50] ?? 'var(--bg-muted)',
    }
}

// ─────────────────────────────────────────────────────────
// Class distribution bar colors — cycling
// ─────────────────────────────────────────────────────────
const CLASS_BAR_COLORS: ThemeColor[] = [
    'primary', 'info', 'success', 'accent', 'violet', 'danger',
]

export function classBarGrad(index: number): string {
    const color = CLASS_BAR_COLORS[index % CLASS_BAR_COLORS.length]
    return grad(color, 90, [400, 600])
}

// ─────────────────────────────────────────────────────────
// Header gradient — aurora style using primary color
// ─────────────────────────────────────────────────────────
export function headerGradient(): string {
    // primary-700 → primary-500 → primary-400 aurora feel
    return `linear-gradient(135deg, var(--primary-700) 0%, var(--primary-500) 50%, var(--primary-400) 100%)`
}

export function headerGlowOrb(opacity: number = 0.12): string {
    return `radial-gradient(circle, ${glow('primary', opacity)} 0%, transparent 70%)`
}