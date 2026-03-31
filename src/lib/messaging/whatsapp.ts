// FILE: src/lib/messaging/whatsapp.ts
// WhatsApp via MSG91

const MSG91_API_KEY = process.env.MSG91_API_KEY || ''
const MSG91_WA_URL = 'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/'

interface WhatsAppParams {
  phone: string
  templateName: string
  templateParams: Record<string, string>  // {name: "John", otp: "123456"}
  integratedNumber?: string                // MSG91 WhatsApp number
}

export async function sendWhatsApp(params: WhatsAppParams): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // ── Dev mode ──
    if (!MSG91_API_KEY || MSG91_API_KEY === 'test') {
      console.log('💬 [WHATSAPP DEV MODE]')
      console.log(`   To: ${params.phone}`)
      console.log(`   Template: ${params.templateName}`)
      console.log(`   Params:`, params.templateParams)
      return { success: true }
    }

    const mobile = params.phone.startsWith('91')
      ? params.phone
      : `91${params.phone.replace(/^0+/, '')}`

    const response = await fetch(MSG91_WA_URL, {
      method: 'POST',
      headers: {
        'authkey': MSG91_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        integrated_number: params.integratedNumber || process.env.MSG91_WA_NUMBER,
        content_type: 'template',
        payload: {
          messaging_product: 'whatsapp',
          type: 'template',
          template: {
            name: params.templateName,
            language: { code: 'en', policy: 'deterministic' },
            namespace: process.env.MSG91_WA_NAMESPACE,
            to_and_components: [
              {
                to: [mobile],
                components: {
                  body: Object.entries(params.templateParams).map(
                    ([_, value], index) => ({
                      type: 'text',
                      value,
                      index,
                    })
                  ),
                },
              },
            ],
          },
        },
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return { success: true }
    }

    return { success: false, error: data.message || 'WhatsApp send failed' }
  } catch (err: any) {
    console.error('WhatsApp error:', err)
    return { success: false, error: err.message }
  }
}