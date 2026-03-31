// FILE: src/lib/messaging/sms.ts
// SMS service using MSG91

const MSG91_API_KEY = process.env.MSG91_API_KEY || ''
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'SKOLFY'
const MSG91_ROUTE = '4' // Transactional route
const MSG91_BASE_URL = 'https://control.msg91.com/api/v5'

interface SendSMSParams {
  phone: string      // 10-digit Indian number
  message: string
  templateId?: string // MSG91 DLT template ID
}

interface SendOTPParams {
  phone: string
  otp?: string       // If not provided, MSG91 generates one
  templateId?: string
  expiry?: number    // minutes
}

export async function sendSMS(params: SendSMSParams): Promise<{
  success: boolean
  requestId?: string
  error?: string
}> {
  try {
    // ── Dev mode ──
    if (!MSG91_API_KEY || MSG91_API_KEY === 'test') {
      console.log('📱 [SMS DEV MODE]')
      console.log(`   To: ${params.phone}`)
      console.log(`   Message: ${params.message}`)
      return { success: true, requestId: 'dev-mode' }
    }

    // Ensure 91 prefix
    const mobile = params.phone.startsWith('91')
      ? params.phone
      : `91${params.phone.replace(/^0+/, '')}`

    const response = await fetch(`${MSG91_BASE_URL}/flow/`, {
      method: 'POST',
      headers: {
        'authkey': MSG91_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        template_id: params.templateId,
        sender: MSG91_SENDER_ID,
        short_url: '0',
        mobiles: mobile,
        VAR1: params.message, // Template variable
      }),
    })

    const data = await response.json()

    if (data.type === 'success') {
      return { success: true, requestId: data.request_id }
    }

    return { success: false, error: data.message || 'SMS failed' }
  } catch (err: any) {
    console.error('SMS error:', err)
    return { success: false, error: err.message }
  }
}

// ── OTP via MSG91 ──
export async function sendOTP(params: SendOTPParams): Promise<{
  success: boolean
  type?: string
  error?: string
}> {
  try {
    // ── Dev mode ──
    if (!MSG91_API_KEY || MSG91_API_KEY === 'test') {
      console.log('🔑 [OTP DEV MODE]')
      console.log(`   To: ${params.phone}`)
      console.log(`   OTP: ${params.otp || 'auto-generated'}`)
      return { success: true, type: 'dev-mode' }
    }

    const mobile = params.phone.startsWith('91')
      ? params.phone
      : `91${params.phone.replace(/^0+/, '')}`

    const url = new URL(`${MSG91_BASE_URL}/otp`)
    url.searchParams.set('authkey', MSG91_API_KEY)
    url.searchParams.set('mobile', mobile)
    if (params.templateId) url.searchParams.set('template_id', params.templateId)
    if (params.otp) url.searchParams.set('otp', params.otp)
    if (params.expiry) url.searchParams.set('otp_expiry', params.expiry.toString())

    const response = await fetch(url.toString(), { method: 'POST' })
    const data = await response.json()

    if (data.type === 'success') {
      return { success: true, type: data.type }
    }

    return { success: false, error: data.message || 'OTP send failed' }
  } catch (err: any) {
    console.error('OTP error:', err)
    return { success: false, error: err.message }
  }
}

// ── Verify OTP via MSG91 ──
export async function verifyMSG91OTP(phone: string, otp: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    if (!MSG91_API_KEY || MSG91_API_KEY === 'test') {
      console.log('✅ [OTP VERIFY DEV MODE]', phone, otp)
      // In dev mode, accept '123456' as valid OTP
      return { success: otp === '123456' }
    }

    const mobile = phone.startsWith('91')
      ? phone
      : `91${phone.replace(/^0+/, '')}`

    const url = `${MSG91_BASE_URL}/otp/verify?authkey=${MSG91_API_KEY}&mobile=${mobile}&otp=${otp}`

    const response = await fetch(url, { method: 'POST' })
    const data = await response.json()

    return {
      success: data.type === 'success',
      error: data.type !== 'success' ? data.message : undefined,
    }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}