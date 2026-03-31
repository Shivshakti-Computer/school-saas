// =============================================================
// FILE: src/lib/whatsapp.ts
// WhatsApp provider NOT yet decided — placeholder with logging
// Options: WhatsApp Business API, Interakt, Wati, AiSensy, Twilio
// =============================================================

export async function sendWhatsApp(
  phone: string,
  message: string,
  templateName?: string,
  templateParams?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {

  // ─── PROVIDER NOT YET CONFIGURED ───
  if (!process.env.WHATSAPP_API_KEY) {
    console.log(`[WHATSAPP-PLACEHOLDER] To: ${phone}, Msg: ${message.slice(0, 80)}...`)
    return { success: true }
  }

  // ─── UNCOMMENT when provider decided ───
  // Example: Interakt / Wati / AiSensy
  /*
  try {
    const res = await fetch('https://api.provider.com/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone,
        template: templateName,
        params: templateParams,
        message,
      })
    })
    const data = await res.json()
    if (data.success) return { success: true }
    return { success: false, error: data.error || 'WhatsApp failed' }
  } catch (err: any) {
    console.error('WhatsApp failed:', err)
    return { success: false, error: err?.message || 'WhatsApp send failed' }
  }
  */

  console.log(`[WHATSAPP] To: ${phone}, Template: ${templateName || 'none'}, Msg: ${message.slice(0, 80)}...`)
  return { success: true }
}