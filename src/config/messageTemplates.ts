// FILE: src/config/messageTemplates.ts
// Email content ab plain text — HTML nahi
// Resend plain text + simple HTML wrapper bhejega
// ═══════════════════════════════════════════════════════════

export interface TemplateVariable {
  key:     string
  label:   string
  example: string
}

export interface MessageTemplate {
  id:       string
  name:     string
  category: 'fee' | 'attendance' | 'exam' | 'general' | 'custom'
  channels: Array<'sms' | 'whatsapp' | 'email'>
  content: {
    sms:      string
    whatsapp: string
    email:    string   // ← plain text ab
  }
  subject?:  string
  variables: TemplateVariable[]
  characterCount: {
    sms:      number
    whatsapp: number
    email:    number
  }
}

// ══════════════════════════════════════════════════════════
// TEMPLATE DEFINITIONS — Plain text email content
// ══════════════════════════════════════════════════════════

export const MESSAGE_TEMPLATES: MessageTemplate[] = [

  // ── Fee Reminder ────────────────────────────────────────
  {
    id:       'fee_reminder',
    name:     'Fee Reminder',
    category: 'fee',
    channels: ['sms', 'whatsapp', 'email'],
    content: {
      sms: 'Dear Parent, fee of Rs.[AMOUNT] for [STUDENT_NAME] (Class [CLASS]) is due on [DUE_DATE]. Pay online to avoid late charges. -[SCHOOL_NAME]',

      whatsapp: `Dear Parent,

Fee Reminder for *[STUDENT_NAME]* (Class [CLASS]):

💰 Amount: ₹[AMOUNT]
📅 Due Date: [DUE_DATE]

Please pay online to avoid late charges.

Regards,
[SCHOOL_NAME]`,

      // ← Plain text — admin edit kar sake
      email: `Dear Parent,

This is a reminder that fee for [STUDENT_NAME] (Class [CLASS]) is due.

Amount: Rs.[AMOUNT]
Due Date: [DUE_DATE]

Please pay online to avoid late charges.

Regards,
[SCHOOL_NAME]`,
    },
    subject: 'Fee Reminder — [STUDENT_NAME] | [SCHOOL_NAME]',
    variables: [
      { key: 'STUDENT_NAME', label: 'Student Name', example: 'Rahul Kumar' },
      { key: 'CLASS',        label: 'Class',         example: '10-A' },
      { key: 'AMOUNT',       label: 'Fee Amount',    example: '5000' },
      { key: 'DUE_DATE',     label: 'Due Date',      example: '31 Jan 2025' },
      { key: 'SCHOOL_NAME',  label: 'School Name',   example: 'DPS School' },
    ],
    characterCount: { sms: 155, whatsapp: 160, email: 300 },
  },

  // ── Attendance Alert ─────────────────────────────────────
  {
    id:       'attendance_absent',
    name:     'Attendance Alert',
    category: 'attendance',
    channels: ['sms', 'whatsapp', 'email'],
    content: {
      sms: '[STUDENT_NAME] was marked ABSENT on [DATE] at [SCHOOL_NAME]. If incorrect, contact school immediately. -[SCHOOL_NAME]',

      whatsapp: `Dear Parent,

⚠️ Attendance Alert

[STUDENT_NAME] was marked ABSENT on [DATE].

If this is incorrect, please contact the school office immediately.

Regards,
[SCHOOL_NAME]`,

      email: `Dear Parent,

[STUDENT_NAME] was marked ABSENT on [DATE].

If this is incorrect, please contact the school office immediately. Regular attendance is important for your child's progress.

Regards,
[SCHOOL_NAME]`,
    },
    subject: 'Attendance Alert — [STUDENT_NAME] Absent | [SCHOOL_NAME]',
    variables: [
      { key: 'STUDENT_NAME', label: 'Student Name', example: 'Rahul Kumar' },
      { key: 'DATE',         label: 'Absent Date',  example: '15 Jan 2025' },
      { key: 'SCHOOL_NAME',  label: 'School Name',  example: 'DPS School' },
    ],
    characterCount: { sms: 135, whatsapp: 155, email: 280 },
  },

  // ── Exam Result ──────────────────────────────────────────
  {
    id:       'exam_result',
    name:     'Exam Result',
    category: 'exam',
    channels: ['sms', 'whatsapp', 'email'],
    content: {
      sms: "[STUDENT_NAME]'s [EXAM_NAME] result is now available. Login to parent portal to view. -[SCHOOL_NAME]",

      whatsapp: `Dear Parent,

📊 Exam Result Available

[STUDENT_NAME]'s [EXAM_NAME] result has been published.

Login to the parent portal to view the detailed report card.

Regards,
[SCHOOL_NAME]`,

      email: `Dear Parent,

[STUDENT_NAME]'s [EXAM_NAME] result is now available.

Please login to the parent portal to view the detailed report card including marks, grades, and teacher remarks.

Regards,
[SCHOOL_NAME]`,
    },
    subject: 'Result Available — [EXAM_NAME] | [STUDENT_NAME] | [SCHOOL_NAME]',
    variables: [
      { key: 'STUDENT_NAME', label: 'Student Name', example: 'Rahul Kumar' },
      { key: 'EXAM_NAME',    label: 'Exam Name',    example: 'Half Yearly 2024-25' },
      { key: 'SCHOOL_NAME',  label: 'School Name',  example: 'DPS School' },
    ],
    characterCount: { sms: 110, whatsapp: 170, email: 260 },
  },

  // ── General Notice ───────────────────────────────────────
  {
    id:       'general_notice',
    name:     'General Notice',
    category: 'general',
    channels: ['sms', 'whatsapp', 'email'],
    content: {
      sms: '[SCHOOL_NAME]: [MESSAGE] For details, login to parent portal.',

      whatsapp: `[SCHOOL_NAME]

📢 Important Notice

[MESSAGE]

For more details, please login to the parent portal.

Regards,
[SCHOOL_NAME]`,

      email: `Dear Parent,

[MESSAGE]

For more details, please login to the parent portal.

Regards,
[SCHOOL_NAME]`,
    },
    subject: 'Important Notice — [SCHOOL_NAME]',
    variables: [
      { key: 'SCHOOL_NAME', label: 'School Name',    example: 'DPS School' },
      { key: 'MESSAGE',     label: 'Notice Content', example: 'School will remain closed tomorrow.' },
    ],
    characterCount: { sms: 100, whatsapp: 160, email: 500 },
  },

  // ── Custom ───────────────────────────────────────────────
  {
    id:       'custom',
    name:     'Custom Message',
    category: 'custom',
    channels: ['sms', 'whatsapp', 'email'],
    content: {
      sms:      '',
      whatsapp: '',
      email:    '',
    },
    subject: '',
    variables: [
      { key: 'STUDENT_NAME', label: 'Student Name', example: 'Rahul Kumar' },
      { key: 'SCHOOL_NAME',  label: 'School Name',  example: 'DPS School' },
      { key: 'CLASS',        label: 'Class',         example: '10-A' },
      { key: 'DATE',         label: "Today's Date",  example: '15 Jan 2025' },
    ],
    characterCount: { sms: 160, whatsapp: 1000, email: 10000 },
  },
]

// ══════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════

export function getTemplateById(
  id: string
): MessageTemplate | undefined {
  return MESSAGE_TEMPLATES.find(t => t.id === id)
}

export function getTemplatesForChannel(
  channel: 'sms' | 'whatsapp' | 'email'
): MessageTemplate[] {
  return MESSAGE_TEMPLATES.filter(t =>
    t.channels.includes(channel)
  )
}

export function getTemplateContent(
  templateId: string,
  channel: 'sms' | 'whatsapp' | 'email'
): string {
  const template = getTemplateById(templateId)
  if (!template) return ''
  return template.content[channel] || ''
}

export function replaceTemplateVariables(
  content: string,
  values: Record<string, string>
): string {
  let result = content
  Object.entries(values).forEach(([key, value]) => {
    result = result.replace(
      new RegExp(`\\[${key}\\]`, 'g'),
      value
    )
  })
  return result
}

export function getCharacterLimit(
  channel: 'sms' | 'whatsapp' | 'email'
): number {
  const limits = {
    sms:      160,
    whatsapp: 1000,
    email:    10000,
  }
  return limits[channel]
}

export function estimateSMSParts(content: string): number {
  if (content.length <= 160) return 1
  return Math.ceil(content.length / 153)
}