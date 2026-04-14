// FILE: src/app/api/settings/payment/route.ts
// ═══════════════════════════════════════════════════════════
// PATCH /api/settings/payment
// Receipt config, GST, late fine, Razorpay keys
//
// SECURITY:
// - Razorpay secret AES-256-CBC encrypted save hoga
// - Keys response mein KABHI nahi aayengi
// - Sirf 'configured: true/false' return hoga
// ═══════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server'
import { createCipheriv, randomBytes } from 'crypto'
import { apiGuardWithBody } from '@/lib/apiGuard'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { SchoolSettings } from '@/models/SchoolSettings'
import { logAudit } from '@/lib/audit'
import { isValidGSTNumber, isValidReceiptPrefix } from '@/types/settings'
import type { UpdatePaymentBody } from '@/types/settings'

// ── Encrypt Razorpay secret — same as razorpay.ts ──
function encryptSecret(secret: string): string {
  const key = Buffer.from(
    process.env.ENCRYPTION_KEY ?? 'default-32-char-key-here-12345678',
    'utf8'
  ).slice(0, 32)
  const iv = randomBytes(16)
  const cipher = createCipheriv('aes-256-cbc', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(secret, 'utf8'),
    cipher.final(),
  ])
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`
}

function validatePayment(body: UpdatePaymentBody): string | null {
  if (body.receiptPrefix !== undefined) {
    const prefix = body.receiptPrefix.trim().toUpperCase()
    if (!isValidReceiptPrefix(prefix)) {
      return 'Receipt prefix must be 2-6 uppercase letters/numbers (e.g., RCP, FEE)'
    }
  }

  if (body.gstEnabled && body.gstNumber) {
    if (!isValidGSTNumber(body.gstNumber)) {
      return 'Invalid GST number format'
    }
  }

  if (body.gstPercentage !== undefined) {
    if (![0, 5, 12, 18, 28].includes(body.gstPercentage)) {
      return 'GST percentage must be 0, 5, 12, 18, or 28'
    }
  }

  if (body.lateFineAmount !== undefined) {
    if (body.lateFineAmount < 0) return 'Late fine amount cannot be negative'
    if (body.lateFineType === 'percentage' && body.lateFineAmount > 100) {
      return 'Late fine percentage cannot exceed 100%'
    }
  }

  if (body.lateFineGraceDays !== undefined) {
    if (body.lateFineGraceDays < 0 || body.lateFineGraceDays > 30) {
      return 'Grace days must be between 0 and 30'
    }
  }

  if (body.receiptFooterText !== undefined) {
    if (body.receiptFooterText.length > 200) {
      return 'Receipt footer text too long (max 200 chars)'
    }
  }

  // Razorpay key format validation
  if (body.razorpayKeyId !== undefined && body.razorpayKeyId.trim()) {
    if (!body.razorpayKeyId.startsWith('rzp_')) {
      return 'Invalid Razorpay Key ID format (must start with rzp_)'
    }
  }

  return null
}

export async function PATCH(req: NextRequest) {
  const guard = await apiGuardWithBody<UpdatePaymentBody>(req, {
    allowedRoles: ['admin'],
    rateLimit: 'mutation',
    auditAction: 'SETTINGS_CHANGE',
    auditResource: 'School',
  })
  if (guard instanceof NextResponse) return guard

  const { session, body, clientInfo } = guard
  const tenantId = session.user.tenantId

  const validationError = validatePayment(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  try {
    await connectDB()

    // ── Handle Razorpay keys separately — School model mein ──
    let razorpayConfigured = false

    if (body.clearRazorpayKeys) {
      // Keys clear karo
      await School.findByIdAndUpdate(tenantId, {
        $set: {
          'paymentSettings.razorpayKeyId':     '',
          'paymentSettings.razorpayKeySecret': '',
          'paymentSettings.enableOnlinePayment': false,
        },
      })
      razorpayConfigured = false

    } else if (body.razorpayKeyId && body.razorpayKeySecret) {
      // Both keys provided — encrypt & save
      const encryptedSecret = encryptSecret(body.razorpayKeySecret.trim())

      await School.findByIdAndUpdate(tenantId, {
        $set: {
          'paymentSettings.razorpayKeyId':     body.razorpayKeyId.trim(),
          'paymentSettings.razorpayKeySecret': encryptedSecret,
          'paymentSettings.enableOnlinePayment':
            body.enableOnlinePayment ?? true,
        },
      })
      razorpayConfigured = true

    } else if (body.razorpayKeyId && !body.razorpayKeySecret) {
      // Sirf key ID update (secret wahi rakho)
      await School.findByIdAndUpdate(tenantId, {
        $set: {
          'paymentSettings.razorpayKeyId': body.razorpayKeyId.trim(),
        },
      })
      // Check if secret still exists
      const school = await School.findById(tenantId)
        .select('paymentSettings')
        .lean() as any
      razorpayConfigured = Boolean(
        school?.paymentSettings?.razorpayKeyId &&
        school?.paymentSettings?.razorpayKeySecret
      )
    } else {
      // Razorpay keys nahi change ki — current status check karo
      const school = await School.findById(tenantId)
        .select('paymentSettings')
        .lean() as any
      razorpayConfigured = Boolean(
        school?.paymentSettings?.razorpayKeyId &&
        school?.paymentSettings?.razorpayKeySecret
      )
    }

    // ── Payment methods update in School model ──
    if (body.paymentMethods !== undefined) {
      await School.findByIdAndUpdate(tenantId, {
        $set: { 'paymentSettings.paymentMethods': body.paymentMethods },
      })
    }

    if (body.enableOnlinePayment !== undefined && !body.razorpayKeySecret) {
      await School.findByIdAndUpdate(tenantId, {
        $set: {
          'paymentSettings.enableOnlinePayment': body.enableOnlinePayment,
        },
      })
    }

    // ── SchoolSettings mein payment config update ──
    const setFields: Record<string, any> = {
      lastUpdatedBy:     session.user.id,
      lastUpdatedByName: session.user.name,
      // Sync razorpay status
      'payment.razorpayConfigured': razorpayConfigured,
    }

    const paymentFields = [
      'receiptPrefix',
      'showSchoolLogoOnReceipt',
      'receiptFooterText',
      'gstEnabled',
      'gstNumber',
      'gstPercentage',
      'lateFineEnabled',
      'lateFineType',
      'lateFineAmount',
      'lateFineGraceDays',
      'enableOnlinePayment',
      'paymentMethods',
    ] as const

    paymentFields.forEach((field) => {
      if (body[field] !== undefined) {
        setFields[`payment.${field}`] = body[field]
      }
    })

    // Receipt prefix uppercase enforce
    if (setFields['payment.receiptPrefix']) {
      setFields['payment.receiptPrefix'] =
        setFields['payment.receiptPrefix'].toUpperCase()
    }

    await SchoolSettings.findOneAndUpdate(
      { tenantId },
      { $set: setFields },
      { upsert: true }
    )

    // ── Audit — Razorpay keys log karo but values nahi ──
    const auditData: Record<string, any> = { ...body }
    // Keys mask karo audit mein
    if (auditData.razorpayKeyId)     auditData.razorpayKeyId = '****' + body.razorpayKeyId!.slice(-4)
    if (auditData.razorpayKeySecret) auditData.razorpayKeySecret = '[ENCRYPTED]'

    await logAudit({
      tenantId,
      userId:      session.user.id,
      userName:    session.user.name || 'Admin',
      userRole:    session.user.role,
      action:      'SETTINGS_CHANGE',
      resource:    'School',
      resourceId:  tenantId,
      description: body.razorpayKeyId
        ? 'Payment settings updated (Razorpay keys configured)'
        : 'Payment settings updated',
      newData:   auditData,
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent,
    })

    return NextResponse.json({
      success:            true,
      message:            'Payment settings updated successfully',
      razorpayConfigured,
    })

  } catch (error: any) {
    console.error('[PATCH /api/settings/payment]', error)
    return NextResponse.json(
      { error: 'Failed to update payment settings' },
      { status: 500 }
    )
  }
}