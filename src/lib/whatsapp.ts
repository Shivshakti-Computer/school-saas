// FILE: src/lib/whatsapp.ts
// UPDATED: Now uses MSG91
// Backward compatible
// ═══════════════════════════════════════════════════════════

import { msg91SendWhatsApp } from "./msg91";


export async function sendWhatsApp(
  phone: string,
  message: string,
  templateName?: string,
  templateParams?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  const params = templateParams ? Object.values(templateParams) : undefined
  return msg91SendWhatsApp(phone, message, templateName, params)
}