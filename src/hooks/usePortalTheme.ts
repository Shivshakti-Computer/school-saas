// FILE: src/hooks/usePortalTheme.ts
// ═══════════════════════════════════════════════════════════
// Portal theme management — localStorage + CSS variables
//
// Strategy:
// 1. Page load pe localStorage se theme read karo → instantly apply
// 2. Settings save hone pe → DOM update + localStorage update
// 3. No flash, no server round-trip
//
// CSS Variables jo update honge:
// --primary-50 through --primary-950
// --primary-rgb
// --accent-50 through --accent-600
// --accent-rgb
// ═══════════════════════════════════════════════════════════

'use client'

import { useEffect, useCallback } from 'react'

// ── Theme Storage Key ──
const THEME_KEY   = 'portal_theme'
const DARK_KEY    = 'portal_dark'

// ── Stored Theme Shape ──
export interface StoredTheme {
  primaryColor: string   // '#6366f1'
  accentColor:  string   // '#f97316'
  darkMode:     'light' | 'dark' | 'system'
  schoolId:     string   // tenantId — different schools ka mix nahi ho
}

// ── Default Theme ──
const DEFAULT_THEME: Omit<StoredTheme, 'schoolId'> = {
  primaryColor: '#6366f1',
  accentColor:  '#f97316',
  darkMode:     'light',
}

// ─────────────────────────────────────────────────────────
// HEX → RGB helper
// ─────────────────────────────────────────────────────────
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace('#', '')
  if (cleaned.length !== 6) return null
  const r = parseInt(cleaned.slice(0, 2), 16)
  const g = parseInt(cleaned.slice(2, 4), 16)
  const b = parseInt(cleaned.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return null
  return { r, g, b }
}

// ─────────────────────────────────────────────────────────
// Color Scale Generator
// Ek base color se 50–950 scale generate karo
// Simple approach: lighten/darken using mix with white/black
// ─────────────────────────────────────────────────────────
function generateColorScale(
  hex: string
): Record<string, string> {
  const rgb = hexToRgb(hex)
  if (!rgb) return {}

  const { r, g, b } = rgb

  // Mix with white (lighten) or black (darken)
  const mix = (
    base: number,
    target: number,
    ratio: number
  ): number => Math.round(base + (target - base) * ratio)

  const lighten = (ratio: number) => ({
    r: mix(r, 255, ratio),
    g: mix(g, 255, ratio),
    b: mix(b, 255, ratio),
  })

  const darken = (ratio: number) => ({
    r: mix(r, 0, ratio),
    g: mix(g, 0, ratio),
    b: mix(b, 0, ratio),
  })

  const toHex = ({ r, g, b }: { r: number; g: number; b: number }) =>
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`

  return {
    '50':  toHex(lighten(0.93)),
    '100': toHex(lighten(0.85)),
    '200': toHex(lighten(0.70)),
    '300': toHex(lighten(0.52)),
    '400': toHex(lighten(0.30)),
    '500': hex,                    // base color
    '600': toHex(darken(0.12)),
    '700': toHex(darken(0.25)),
    '800': toHex(darken(0.40)),
    '900': toHex(darken(0.55)),
    '950': toHex(darken(0.68)),
  }
}

// ─────────────────────────────────────────────────────────
// Apply Theme to DOM
// CSS variables root pe set karo
// ─────────────────────────────────────────────────────────
export function applyThemeToDom(
  primaryColor: string,
  accentColor:  string,
  darkMode:     'light' | 'dark' | 'system'
): void {
  if (typeof document === 'undefined') return

  const root = document.documentElement

  // ── Primary Color Scale ──
  const primaryScale = generateColorScale(primaryColor)
  Object.entries(primaryScale).forEach(([shade, color]) => {
    root.style.setProperty(`--primary-${shade}`, color)
  })

  // Primary RGB (for rgba() usage)
  const primaryRgb = hexToRgb(primaryColor)
  if (primaryRgb) {
    root.style.setProperty(
      '--primary-rgb',
      `${primaryRgb.r}, ${primaryRgb.g}, ${primaryRgb.b}`
    )
  }

  // Border focus color sync
  root.style.setProperty('--border-focus', primaryColor)

  // ── Accent Color Scale ──
  const accentScale = generateColorScale(accentColor)
  root.style.setProperty('--accent-50',  accentScale['50']  || '')
  root.style.setProperty('--accent-100', accentScale['100'] || '')
  root.style.setProperty('--accent-300', accentScale['300'] || '')
  root.style.setProperty('--accent-400', accentScale['400'] || '')
  root.style.setProperty('--accent-500', accentScale['500'] || accentColor)
  root.style.setProperty('--accent-600', accentScale['600'] || '')

  const accentRgb = hexToRgb(accentColor)
  if (accentRgb) {
    root.style.setProperty(
      '--accent-rgb',
      `${accentRgb.r}, ${accentRgb.g}, ${accentRgb.b}`
    )
  }

  // ── Dark Mode ──
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches

  if (darkMode === 'dark' || (darkMode === 'system' && prefersDark)) {
    root.classList.add('dark')
    root.removeAttribute('data-theme')
    root.setAttribute('data-theme', 'dark')
  } else {
    root.classList.remove('dark')
    root.removeAttribute('data-theme')
  }
}

// ─────────────────────────────────────────────────────────
// Save Theme to localStorage
// ─────────────────────────────────────────────────────────
export function saveThemeToStorage(theme: StoredTheme): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(theme))
  } catch {
    // localStorage unavailable (private mode etc)
  }
}

// ─────────────────────────────────────────────────────────
// Load Theme from localStorage
// ─────────────────────────────────────────────────────────
export function loadThemeFromStorage(schoolId: string): StoredTheme | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (!stored) return null
    const parsed: StoredTheme = JSON.parse(stored)
    // Different school ka theme nahi use karein
    if (parsed.schoolId !== schoolId) return null
    return parsed
  } catch {
    return null
  }
}

// ─────────────────────────────────────────────────────────
// usePortalTheme Hook
// ─────────────────────────────────────────────────────────
interface UsePortalThemeOptions {
  schoolId:     string
  primaryColor?: string
  accentColor?:  string
  darkMode?:     'light' | 'dark' | 'system'
}

export function usePortalTheme({
  schoolId,
  primaryColor: propPrimary,
  accentColor:  propAccent,
  darkMode:     propDarkMode,
}: UsePortalThemeOptions) {

  // Page load pe theme apply karo
  useEffect(() => {
    if (!schoolId) return

    // localStorage se load karo pehle (instant)
    const stored = loadThemeFromStorage(schoolId)

    const primary  = stored?.primaryColor || propPrimary || DEFAULT_THEME.primaryColor
    const accent   = stored?.accentColor  || propAccent  || DEFAULT_THEME.accentColor
    const darkMode = stored?.darkMode     || propDarkMode || DEFAULT_THEME.darkMode

    applyThemeToDom(primary, accent, darkMode)

  }, [schoolId]) // eslint-disable-line react-hooks/exhaustive-deps
  // Only run on mount — props se sirf initial value leni hai

  // System dark mode change listener
  useEffect(() => {
    const stored = loadThemeFromStorage(schoolId)
    if (stored?.darkMode !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      applyThemeToDom(
        stored.primaryColor,
        stored.accentColor,
        'system'
      )
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [schoolId])
}

// ─────────────────────────────────────────────────────────
// applyAndSaveTheme — Settings save hone pe call karo
// Turant DOM update + localStorage save
// ─────────────────────────────────────────────────────────
export function applyAndSaveTheme(
  schoolId:     string,
  primaryColor: string,
  accentColor:  string,
  darkMode:     'light' | 'dark' | 'system'
): void {
  // 1. Turant DOM pe apply karo
  applyThemeToDom(primaryColor, accentColor, darkMode)

  // 2. localStorage mein save karo (persistence)
  saveThemeToStorage({
    schoolId,
    primaryColor,
    accentColor,
    darkMode,
  })
}