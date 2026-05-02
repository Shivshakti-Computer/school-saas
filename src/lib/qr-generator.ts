// FILE: src/lib/qr-generator.ts
// QR Code generation for certificate verification
// Supports: PNG buffer (PDF embedding) + Data URL (web preview)
// ═══════════════════════════════════════════════════════════

import 'server-only'
import QRCode from 'qrcode'

// ────────────────────────────────────────────────────────────
// Types & Interfaces
// ────────────────────────────────────────────────────────────

export interface QRCodeOptions {
    size?: number
    margin?: number
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
    color?: {
        dark: string
        light: string
    }
}

// ────────────────────────────────────────────────────────────
// Generate QR Code as Buffer (for PDF embedding)
// ────────────────────────────────────────────────────────────

/**
 * Generate QR code as PNG buffer for embedding in PDF
 * @param data - URL or text to encode
 * @param options - QR code customization options
 * @returns PNG buffer
 */
export async function generateQRCodeBuffer(
    data: string,
    options: QRCodeOptions = {}
): Promise<Buffer> {
    const {
        size = 256,
        margin = 2,
        errorCorrectionLevel = 'M',
        color = { dark: '#000000', light: '#ffffff' }
    } = options

    try {
        // Generate QR code as data URL
        const qrDataUrl = await QRCode.toDataURL(data, {
            width: size,
            margin,
            errorCorrectionLevel,
            color: {
                dark: color.dark,
                light: color.light
            },
            type: 'image/png',
        })

        // Convert data URL to Buffer
        // Data URL format: data:image/png;base64,iVBORw0KGgo...
        const base64Data = qrDataUrl.split(',')[1]
        return Buffer.from(base64Data, 'base64')
    } catch (error) {
        console.error('[QR Generator] Error generating QR code buffer:', error)
        throw new Error('Failed to generate QR code buffer')
    }
}

// ────────────────────────────────────────────────────────────
// Generate QR Code as Data URL (for web display/preview)
// ────────────────────────────────────────────────────────────

/**
 * Generate QR code as data URL for web display
 * @param data - URL or text to encode
 * @param options - QR code customization options
 * @returns Data URL string (e.g., data:image/png;base64,...)
 */
export async function generateQRCodeDataURL(
    data: string,
    options: QRCodeOptions = {}
): Promise<string> {
    const {
        size = 256,
        margin = 2,
        errorCorrectionLevel = 'M',
        color = { dark: '#000000', light: '#ffffff' }
    } = options

    try {
        return await QRCode.toDataURL(data, {
            width: size,
            margin,
            errorCorrectionLevel,
            color: {
                dark: color.dark,
                light: color.light
            },
        })
    } catch (error) {
        console.error('[QR Generator] Error generating QR code data URL:', error)
        throw new Error('Failed to generate QR code data URL')
    }
}

// ────────────────────────────────────────────────────────────
// Generate Verification URL
// ────────────────────────────────────────────────────────────

/**
 * Generate full verification URL for certificate
 * @param verificationCode - Certificate verification code (e.g., ABC-CERT-12345678)
 * @param baseUrl - Base URL of the application (from env or custom)
 * @returns Full verification URL
 */
export function generateVerificationURL(
    verificationCode: string,
    baseUrl?: string
): string {
    const base = baseUrl || process.env.NEXT_PUBLIC_APP_URL || ''

    // Remove trailing slash from base URL
    const cleanBase = base.replace(/\/$/, '')

    return `${cleanBase}/verify/${verificationCode}`
}

// ────────────────────────────────────────────────────────────
// Validate Verification Code Format
// ────────────────────────────────────────────────────────────

/**
 * Validate verification code format
 * Expected format: PREFIX-CERT-XXXXXXXX
 * @param code - Verification code to validate
 * @returns true if valid format
 */
export function isValidVerificationCode(code: string): boolean {
    // Regex: PREFIX (1-6 alphanumeric) + "-CERT-" + 8 alphanumeric
    const regex = /^[A-Z0-9]{1,6}-CERT-[A-Z0-9]{8}$/
    return regex.test(code)
}

// ────────────────────────────────────────────────────────────
// Generate QR Code with Branding (Advanced)
// ────────────────────────────────────────────────────────────

/**
 * Generate branded QR code with custom colors
 * @param data - Data to encode
 * @param brandColor - Primary brand color (hex)
 * @returns PNG buffer with branded QR code
 */
export async function generateBrandedQRCode(
    data: string,
    brandColor: string = '#6366F1'
): Promise<Buffer> {
    return generateQRCodeBuffer(data, {
        size: 300,
        margin: 3,
        errorCorrectionLevel: 'H',
        color: {
            dark: brandColor,
            light: '#ffffff'
        }
    })
}

// ────────────────────────────────────────────────────────────
// Batch Generate QR Codes (for bulk certificates)
// ────────────────────────────────────────────────────────────

/**
 * Generate multiple QR codes in batch
 * @param dataArray - Array of data to encode
 * @param options - QR code options
 * @returns Array of PNG buffers
 */
export async function batchGenerateQRCodes(
    dataArray: string[],
    options: QRCodeOptions = {}
): Promise<Buffer[]> {
    try {
        const promises = dataArray.map(data => generateQRCodeBuffer(data, options))
        return await Promise.all(promises)
    } catch (error) {
        console.error('[QR Generator] Batch generation failed:', error)
        throw new Error('Failed to generate QR codes in batch')
    }
}