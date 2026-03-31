// FILE: src/lib/security.ts
// Central security utilities for the entire application

import { NextRequest } from 'next/server'
import crypto from 'crypto'

/* ══════════════════════════════════════════════════════════
   1. INPUT SANITIZATION
   Prevents NoSQL Injection + XSS attacks
══════════════════════════════════════════════════════════ */

// Remove MongoDB operators from input
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    // Remove potential XSS
    return input
      .replace(/[<>]/g, '') // Remove < >
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .replace(/\$/g, '') // Remove $ (MongoDB operators)
      .trim()
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }

  if (input !== null && typeof input === 'object') {
    const sanitized: Record<string, any> = {}
    for (const [key, value] of Object.entries(input)) {
      // Block keys starting with $ (MongoDB injection)
      if (key.startsWith('$')) continue
      // Block keys with dots (MongoDB nested injection)
      if (key.includes('.')) continue
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }

  return input
}

// Deep sanitize request body
export function sanitizeBody<T = any>(body: any): T {
  return sanitizeInput(body) as T
}

/* ══════════════════════════════════════════════════════════
   2. RATE LIMITER (In-Memory for Vercel)
   Works per serverless instance — good for basic protection
   For production scale: use Upstash Redis
══════════════════════════════════════════════════════════ */

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number   // Max requests per window
  identifier?: string   // Custom identifier prefix
}

export function checkRateLimit(
  req: NextRequest,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetIn: number } {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'

  const prefix = config.identifier || 'global'
  const key = `${prefix}:${ip}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetTime) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }

  entry.count++

  if (entry.count > config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

// Pre-configured rate limiters
export const RATE_LIMITS = {
  // Login: 5 attempts per 15 minutes
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5, identifier: 'login' },
  // Registration: 3 per hour
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3, identifier: 'register' },
  // API general: 100 per minute
  api: { windowMs: 60 * 1000, maxRequests: 100, identifier: 'api' },
  // OTP send: 3 per 10 minutes
  otp: { windowMs: 10 * 60 * 1000, maxRequests: 3, identifier: 'otp' },
  // Password reset: 3 per hour
  passwordReset: { windowMs: 60 * 60 * 1000, maxRequests: 3, identifier: 'pwd-reset' },
  // File upload: 20 per minute
  upload: { windowMs: 60 * 1000, maxRequests: 20, identifier: 'upload' },
} as const

/* ══════════════════════════════════════════════════════════
   3. SECURITY HEADERS
══════════════════════════════════════════════════════════ */

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-DNS-Prefetch-Control': 'off',
    'X-Download-Options': 'noopen',
    'X-Permitted-Cross-Domain-Policies': 'none',
  }
}

/* ══════════════════════════════════════════════════════════
   4. PASSWORD STRENGTH VALIDATOR
══════════════════════════════════════════════════════════ */

export interface PasswordValidation {
  isValid: boolean
  score: number // 0-5
  errors: string[]
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = []
  let score = 0

  if (password.length >= 8) score++
  else errors.push('Must be at least 8 characters')

  if (password.length >= 12) score++

  if (/[a-z]/.test(password)) score++
  else errors.push('Must contain a lowercase letter')

  if (/[A-Z]/.test(password)) score++
  else errors.push('Must contain an uppercase letter')

  if (/[0-9]/.test(password)) score++
  else errors.push('Must contain a number')

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++
  else errors.push('Must contain a special character')

  // Common password check
  const commonPasswords = [
    'password', '123456', '12345678', 'qwerty', 'abc123',
    'password1', 'admin123', 'letmein', 'welcome', 'school123'
  ]
  if (commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common')
    score = 0
  }

  return {
    isValid: errors.length === 0 && password.length >= 8,
    score: Math.min(score, 5),
    errors,
  }
}

/* ══════════════════════════════════════════════════════════
   5. CSRF TOKEN GENERATION & VALIDATION
══════════════════════════════════════════════════════════ */

export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function generateOTP(length: number = 6): string {
  const digits = '0123456789'
  let otp = ''
  const bytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    otp += digits[bytes[i] % 10]
  }
  return otp
}

/* ══════════════════════════════════════════════════════════
   6. IP & CLIENT INFO EXTRACTION
══════════════════════════════════════════════════════════ */

export function getClientInfo(req: NextRequest) {
  return {
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('x-real-ip')
      || 'unknown',
    userAgent: req.headers.get('user-agent') || 'unknown',
    referer: req.headers.get('referer') || '',
    origin: req.headers.get('origin') || '',
  }
}

/* ══════════════════════════════════════════════════════════
   7. ENCRYPTION UTILITIES (for sensitive data)
══════════════════════════════════════════════════════════ */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || ''
const ALGORITHM = 'aes-256-gcm'

export function encrypt(text: string): string {
  try {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const authTag = cipher.getAuthTag().toString('hex')
    return `${iv.toString('hex')}:${authTag}:${encrypted}`
  } catch {
    return text
  }
}

export function decrypt(encryptedText: string): string {
  try {
    const [ivHex, authTagHex, encrypted] = encryptedText.split(':')
    if (!ivHex || !authTagHex || !encrypted) return encryptedText

    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch {
    return encryptedText
  }
}

/* ══════════════════════════════════════════════════════════
   8. API RESPONSE HELPERS (with security headers)
══════════════════════════════════════════════════════════ */

export function secureJsonResponse(data: any, status: number = 200) {
  const headers = getSecurityHeaders()
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
}

export function errorResponse(message: string, status: number = 400) {
  return secureJsonResponse({ error: message }, status)
}

export function rateLimitResponse(resetIn: number) {
  return secureJsonResponse(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(resetIn / 1000),
    },
    429
  )
}