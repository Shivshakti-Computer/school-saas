// FILE: src/lib/email.ts
// Main email export - now uses multi-provider system

export {
  sendEmail,
  sendEmailWithFallback,
  sendBulkEmail,
} from './email-providers'

export { EMAIL_TEMPLATES } from './email-templates'

export type { EmailProvider, EmailResult, EmailOptions } from './email-providers'