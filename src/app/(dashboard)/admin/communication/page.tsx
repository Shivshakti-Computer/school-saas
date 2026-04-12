// FILE: src/app/(portal)/admin/communication/page.tsx
// FIXED:
//   Bug 1 → Credit balance decimal display
//   Bug 2 → Templates from shared config
//   Bug 3 → Recipient count from real API
//   Bug 4 → Academic year filter
// Design System: globals.css pattern lock applied
// ═══════════════════════════════════════════════════════════

'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import {
  PageHeader,
  Button,
  Card,
  Table,
  Tr,
  Td,
  Badge,
  Modal,
  Input,
  Select,
  Spinner,
  Alert,
  EmptyState,
  StatCard,
} from '@/components/ui'
import {
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  RefreshCw,
  Info,
} from 'lucide-react'
import { Portal } from '@/components/ui/Portal'
import {
  MESSAGE_TEMPLATES,
  getTemplateById,
  getTemplatesForChannel,
  getTemplateContent,
  getCharacterLimit,
  estimateSMSParts,
  type MessageTemplate,
} from '@/config/messageTemplates'
import { CREDIT_COSTS } from '@/config/pricing'
import { getAcademicYears, getCurrentAcademicYear } from '@/lib/academicYear'

// ══════════════════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════════════════

interface CommunicationItem {
  _id: string
  channel: 'sms' | 'email' | 'whatsapp'
  purpose: string
  title?: string
  message: string
  recipients: string
  recipientType?: 'parent' | 'student'
  academicYear?: string
  targetClass?: string
  targetSection?: string
  totalSent: number
  totalFailed: number
  totalSkipped: number
  creditsUsed: number
  sentAt: string
  sentByName?: string
}

interface Stats {
  totalSent: number
  totalFailed: number
  creditsUsed: number
  creditBalance: number
}

interface RecipientCount {
  totalStudents: number
  validContacts: number
  estimated: number
  loading: boolean
}

// ══════════════════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════════════════

const CLASSES = [
  'Nursery', 'LKG', 'UKG',
  '1', '2', '3', '4', '5',
  '6', '7', '8', '9', '10',
  '11', '12',
]
const SECTIONS = ['A', 'B', 'C', 'D', 'E']

// ── Bug 1 fix: Proper decimal formatting ─────────────────
function formatCredits(value: number): string {
  if (Number.isInteger(value)) {
    return value.toLocaleString('en-IN')
  }
  return value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// Estimate credits for given count + channel
function estimateCredits(
  count: number,
  channel: 'sms' | 'email' | 'whatsapp'
): number {
  const cost = CREDIT_COSTS[channel]
  return Math.ceil(count * cost * 100) / 100
}

// ══════════════════════════════════════════════════════════
// Initial Form State
// ══════════════════════════════════════════════════════════

const INITIAL_FORM = {
  channel: 'sms' as 'sms' | 'email' | 'whatsapp',
  purpose: 'custom',
  templateId: 'custom',
  title: '',
  message: '',
  recipients: 'all' as 'all' | 'class' | 'section',
  recipientType: 'parent' as 'parent' | 'student',
  targetClass: '',
  targetSection: '',
  subject: '',
  academicYear: getCurrentAcademicYear(),
  // Template extra fields
  dueDate: '',
  amount: '',
  examName: '',
}

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════

export default function CommunicationPage() {
  const { data: session } = useSession()

  // ── Data State ────────────────────────────────────────
  const [history, setHistory] = useState<CommunicationItem[]>([])
  const [stats, setStats] = useState<Stats>({
    totalSent: 0,
    totalFailed: 0,
    creditsUsed: 0,
    creditBalance: 0,
  })
  const [academicYears, setAcademicYears] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // ── UI State ──────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false)
  const [alert, setAlert] = useState<{
    type: 'success' | 'error'
    msg: string
  } | null>(null)
  const [sending, setSending] = useState(false)

  // ── Form State ────────────────────────────────────────
  const [form, setForm] = useState(INITIAL_FORM)

  // ── Bug 3 fix: Real recipient count ──────────────────
  const [recipientCount, setRecipientCount] = useState<RecipientCount>({
    totalStudents: 0,
    validContacts: 0,
    estimated: 0,
    loading: false,
  })

  // ── Derived: estimated cost ───────────────────────────
  const estimatedCost = estimateCredits(
    recipientCount.estimated || 0,
    form.channel
  )

  // ── Available templates for current channel ───────────
  const availableTemplates = getTemplatesForChannel(form.channel)

  // ══════════════════════════════════════════════════════
  // Fetch Main Data
  // ══════════════════════════════════════════════════════

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/communication')
      const data = await res.json()

      if (data.history) {
        setHistory(Array.isArray(data.history) ? data.history : [])
      }

      if (data.stats) {
        setStats({
          totalSent: data.stats.totalSent || 0,
          totalFailed: data.stats.totalFailed || 0,
          creditsUsed: data.stats.creditsUsed || 0,
          creditBalance: data.stats.creditBalance || 0,
        })
      }

      // ✅ FIX: Sirf API se aaye years use karo
      // getAcademicYears() fallback HATAO
      // Agar API se years aaye → use karo
      // Agar nahi aaye → empty array (current year default form mein hai)
      if (data.academicYears?.length > 0) {
        setAcademicYears(data.academicYears)
      }
      // ❌ else { setAcademicYears(getAcademicYears()) } ← YE HATAO

      setLoading(false)
    } catch (err) {
      console.error('[COMM-PAGE] Failed to fetch:', err)
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ══════════════════════════════════════════════════════
  // Bug 3 fix: Fetch Real Recipient Count
  // ══════════════════════════════════════════════════════

  const fetchRecipientCount = useCallback(async () => {
    // Only fetch when modal is open
    if (!modalOpen) return

    setRecipientCount(prev => ({ ...prev, loading: true }))

    try {
      const params = new URLSearchParams({
        recipients: form.recipients,
        academicYear: form.academicYear,
        recipientType: form.recipientType,
      })

      if (form.recipients === 'class' && form.targetClass) {
        params.set('class', form.targetClass)
      }
      if (
        form.recipients === 'section' &&
        form.targetClass &&
        form.targetSection
      ) {
        params.set('class', form.targetClass)
        params.set('section', form.targetSection)
      }

      const res = await fetch(
        `/api/communication/count?${params.toString()}`
      )
      const data = await res.json()

      if (data.success) {
        setRecipientCount({
          totalStudents: data.totalStudents || 0,
          validContacts: data.validContacts || 0,
          estimated: data.estimated || 0,
          loading: false,
        })
      } else {
        setRecipientCount(prev => ({ ...prev, loading: false }))
      }
    } catch {
      setRecipientCount(prev => ({ ...prev, loading: false }))
    }
  }, [
    modalOpen,
    form.recipients,
    form.targetClass,
    form.targetSection,
    form.academicYear,
    form.recipientType,
  ])

  // Fetch count when relevant fields change
  useEffect(() => {
    fetchRecipientCount()
  }, [fetchRecipientCount])

  // ══════════════════════════════════════════════════════
  // Bug 2 fix: Template Change Handler
  // ══════════════════════════════════════════════════════

  const handleTemplateChange = (templateId: string) => {
    const template = getTemplateById(templateId)

    if (!template || templateId === 'custom') {
      setForm(prev => ({
        ...prev,
        templateId: 'custom',
        message: '',
        subject: '',
        purpose: 'custom',
      }))
      return
    }

    // Get content for current channel
    const content = getTemplateContent(templateId, form.channel)

    // Map template category to purpose
    const purposeMap: Record<string, string> = {
      fee: 'fee_reminder',
      attendance: 'attendance_absent',
      exam: 'exam_result',
      general: 'custom',
      custom: 'custom',
    }

    setForm(prev => ({
      ...prev,
      templateId,
      message: content,
      subject: template.subject || '',
      purpose: purposeMap[template.category] || 'custom',
    }))
  }

  // When channel changes — update template content for new channel
  const handleChannelChange = (
    channel: 'sms' | 'email' | 'whatsapp'
  ) => {
    const currentTemplate = getTemplateById(form.templateId)

    // If custom or no template — just clear message
    if (!currentTemplate || form.templateId === 'custom') {
      setForm(prev => ({ ...prev, channel, message: '' }))
      return
    }

    // Check if current template supports new channel
    if (!currentTemplate.channels.includes(channel)) {
      // Template not available for this channel — reset to custom
      setForm(prev => ({
        ...prev,
        channel,
        templateId: 'custom',
        message: '',
        subject: '',
      }))
      return
    }

    // Update message for new channel
    const newContent = getTemplateContent(form.templateId, channel)
    setForm(prev => ({
      ...prev,
      channel,
      message: newContent,
    }))
  }

  // ══════════════════════════════════════════════════════
  // Send Handler
  // ══════════════════════════════════════════════════════

  const handleSend = async () => {
    // ── Validation ──
    if (!form.message.trim()) {
      setAlert({ type: 'error', msg: 'Message content is required' })
      return
    }

    if (form.channel === 'email' && !form.subject.trim()) {
      setAlert({ type: 'error', msg: 'Email subject is required' })
      return
    }

    if (form.recipients === 'class' && !form.targetClass) {
      setAlert({ type: 'error', msg: 'Please select a class' })
      return
    }

    if (
      form.recipients === 'section' &&
      (!form.targetClass || !form.targetSection)
    ) {
      setAlert({
        type: 'error',
        msg: 'Please select class and section',
      })
      return
    }

    if (!form.academicYear) {
      setAlert({ type: 'error', msg: 'Please select academic year' })
      return
    }

    // ── Credit check ──
    if (
      recipientCount.estimated > 0 &&
      stats.creditBalance < estimatedCost
    ) {
      setAlert({
        type: 'error',
        msg: `Insufficient credits. Required: ~${formatCredits(estimatedCost)}, Available: ${formatCredits(stats.creditBalance)}. Please purchase credits.`,
      })
      return
    }

    setSending(true)
    setAlert(null)

    try {
      const res = await fetch('/api/communication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: form.channel,
          purpose: form.purpose,
          templateId: form.templateId,
          message: form.message,
          subject: form.subject,
          recipients: form.recipients,
          recipientType: form.recipientType,
          targetClass: form.targetClass,
          targetSection: form.targetSection,
          academicYear: form.academicYear,
          // Template extra vars
          dueDate: form.dueDate,
          amount: form.amount,
          examName: form.examName,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 402) {
          setAlert({
            type: 'error',
            msg: `Insufficient credits. Required: ${data.required}, Available: ${formatCredits(data.balance)}. Please purchase credits.`,
          })
        } else {
          throw new Error(data.error || 'Failed to send message')
        }
      } else {
        setAlert({
          type: 'success',
          msg: `✅ Message sent! Delivered: ${data.sent}, Failed: ${data.failed}, Credits used: ${formatCredits(data.creditsUsed)}`,
        })
        setModalOpen(false)
        setForm(INITIAL_FORM)
        setRecipientCount({
          totalStudents: 0,
          validContacts: 0,
          estimated: 0,
          loading: false,
        })
        fetchData()
      }
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message })
    } finally {
      setSending(false)
    }
  }

  // ══════════════════════════════════════════════════════
  // Loading State
  // ══════════════════════════════════════════════════════

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  // ══════════════════════════════════════════════════════
  // Character limit info for current channel
  // ══════════════════════════════════════════════════════

  const charLimit = getCharacterLimit(form.channel)
  const charCount = form.message.length
  const isOverLimit = form.channel === 'sms' && charCount > charLimit
  const smsParts =
    form.channel === 'sms' ? estimateSMSParts(form.message) : 1

  // ══════════════════════════════════════════════════════
  // Current template info
  // ══════════════════════════════════════════════════════

  const currentTemplate = getTemplateById(form.templateId)

  // ══════════════════════════════════════════════════════
  // Render
  // ══════════════════════════════════════════════════════

  return (
    <div className="portal-content-enter">

      {/* ── Page Header ── */}
      <PageHeader
        title="Communication"
        subtitle="Send bulk SMS, WhatsApp & Email to parents and students"
        action={
          <Button onClick={() => setModalOpen(true)}>
            <Send size={15} />
            New Message
          </Button>
        }
      />

      {/* ── Global Alert ── */}
      {alert && (
        <div className="mb-5">
          <Alert
            type={alert.type}
            message={alert.msg}
            onClose={() => setAlert(null)}
          />
        </div>
      )}

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Sent"
          value={stats.totalSent.toLocaleString('en-IN')}
          icon={<CheckCircle size={20} />}
          color="success"
        />
        <StatCard
          label="Failed"
          value={stats.totalFailed.toLocaleString('en-IN')}
          icon={<XCircle size={20} />}
          color="danger"
        />
        {/* Bug 1 fix: formatCredits for decimal */}
        <StatCard
          label="Credits Used"
          value={formatCredits(stats.creditsUsed)}
          icon={<TrendingUp size={20} />}
          color="warning"
        />
        <StatCard
          label="Credit Balance"
          value={formatCredits(stats.creditBalance)}
          icon={<MessageSquare size={20} />}
          color="primary"
          trend={
            stats.creditBalance < 100
              ? '⚠️ Low balance'
              : stats.creditBalance < 500
                ? '💡 Running low'
                : undefined
          }
        />
      </div>

      {/* ── History Table ── */}
      {history.length === 0 ? (
        <EmptyState
          icon={<MessageSquare size={24} />}
          title="No messages sent yet"
          description="Send bulk SMS, WhatsApp, or emails to parents and students"
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Send size={14} />
              Send First Message
            </Button>
          }
        />
      ) : (
        <Card padding={false}>
          <Table
            headers={[
              'Date',
              'Channel',
              'Purpose',
              'Year',
              'Recipients',
              'Sent',
              'Failed',
              'Credits',
            ]}
          >
            {history.map(msg => (
              <Tr key={msg._id}>
                <Td className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                  {new Date(msg.sentAt).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Td>
                <Td>
                  <Badge
                    variant={
                      msg.channel === 'sms'
                        ? 'info'
                        : msg.channel === 'whatsapp'
                          ? 'success'
                          : 'primary'
                    }
                  >
                    {msg.channel.toUpperCase()}
                  </Badge>
                </Td>
                <Td className="capitalize text-sm">
                  {msg.purpose.replace(/_/g, ' ')}
                </Td>
                {/* Bug 4 fix: show academic year in history */}
                <Td className="text-xs text-[var(--text-muted)]">
                  {msg.academicYear || '—'}
                </Td>
                <Td className="text-sm">
                  <span className="capitalize">{msg.recipients}</span>
                  {msg.targetClass && (
                    <span className="text-[var(--text-muted)]">
                      {' '}Class {msg.targetClass}
                    </span>
                  )}
                  {msg.targetSection && (
                    <span className="text-[var(--text-muted)]">
                      -{msg.targetSection}
                    </span>
                  )}
                </Td>
                <Td>
                  <span className="font-semibold text-[var(--success)]">
                    {msg.totalSent}
                  </span>
                </Td>
                <Td>
                  <span
                    className={
                      msg.totalFailed > 0
                        ? 'font-semibold text-[var(--danger)]'
                        : 'text-[var(--text-muted)]'
                    }
                  >
                    {msg.totalFailed}
                  </span>
                </Td>
                {/* Bug 1 fix: formatCredits */}
                <Td className="text-sm tabular-nums">
                  {formatCredits(msg.creditsUsed)}
                </Td>
              </Tr>
            ))}
          </Table>
        </Card>
      )}

      {/* ════════════════════════════════════════════════
          Send Message Modal
      ════════════════════════════════════════════════ */}
      <Portal>
        <Modal
          open={modalOpen}
          onClose={() => {
            setModalOpen(false)
            setForm(INITIAL_FORM)
            setAlert(null)
          }}
          title="Send Bulk Message"
          size="lg"
        >
          <div className="space-y-4">

            {/* ── Row 1: Channel + Academic Year ── */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Channel"
                value={form.channel}
                onChange={e =>
                  handleChannelChange(
                    e.target.value as 'sms' | 'email' | 'whatsapp'
                  )
                }
                options={[
                  { value: 'sms', label: '📱 SMS' },
                  { value: 'whatsapp', label: '💬 WhatsApp' },
                  { value: 'email', label: '📧 Email' },
                ]}
              />
              {/* Bug 4 fix: Academic Year dropdown */}
              <Select
                label="Academic Year"
                value={form.academicYear}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    academicYear: e.target.value,
                  }))
                }
                options={
                  academicYears.length > 0
                    ? academicYears.map(y => ({
                      value: y,
                      label: y,
                    }))
                    : getAcademicYears().map(y => ({
                      value: y,
                      label: y,
                    }))
                }
              />
            </div>

            {/* ── Row 2: Recipients + Send To ── */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Recipients"
                value={form.recipients}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    recipients: e.target.value as
                      'all' | 'class' | 'section',
                    targetClass: '',
                    targetSection: '',
                  }))
                }
                options={[
                  { value: 'all', label: 'All Students' },
                  { value: 'class', label: 'Specific Class' },
                  { value: 'section', label: 'Specific Section' },
                ]}
              />
              <Select
                label="Send To"
                value={form.recipientType}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    recipientType: e.target.value as
                      'parent' | 'student',
                  }))
                }
                options={[
                  {
                    value: 'parent',
                    label: '👨‍👩‍👧 Parents',
                  },
                  {
                    value: 'student',
                    label: '👨‍🎓 Students',
                  },
                ]}
              />
            </div>

            {/* ── Class / Section Selectors ── */}
            {(form.recipients === 'class' ||
              form.recipients === 'section') && (
                <div
                  className={
                    form.recipients === 'section'
                      ? 'grid grid-cols-2 gap-3'
                      : ''
                  }
                >
                  <Select
                    label="Select Class"
                    value={form.targetClass}
                    onChange={e =>
                      setForm(prev => ({
                        ...prev,
                        targetClass: e.target.value,
                        targetSection: '',
                      }))
                    }
                    options={[
                      { value: '', label: 'Choose class' },
                      ...CLASSES.map(c => ({
                        value: c,
                        label: `Class ${c}`,
                      })),
                    ]}
                  />
                  {form.recipients === 'section' && (
                    <Select
                      label="Select Section"
                      value={form.targetSection}
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          targetSection: e.target.value,
                        }))
                      }
                      options={[
                        { value: '', label: 'Choose section' },
                        ...SECTIONS.map(s => ({
                          value: s,
                          label: `Section ${s}`,
                        })),
                      ]}
                    />
                  )}
                </div>
              )}

            {/* ── Bug 3 fix: Real Recipient Count Display ── */}
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] bg-[var(--bg-muted)] border border-[var(--border)]">
              <Users
                size={14}
                className="text-[var(--text-muted)] flex-shrink-0"
              />
              {recipientCount.loading ? (
                <span className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                  <Spinner size="sm" />
                  Counting recipients...
                </span>
              ) : (
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  <span className="text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {recipientCount.totalStudents.toLocaleString('en-IN')}
                    </span>
                    {' '}students found
                  </span>
                  <span className="text-[var(--border-strong)]">•</span>
                  <span className="text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--primary-600)]">
                      {recipientCount.validContacts.toLocaleString('en-IN')}
                    </span>
                    {' '}valid contacts
                  </span>
                  {recipientCount.totalStudents !==
                    recipientCount.validContacts && (
                      <span className="text-[var(--warning-dark)]">
                        ⚠️{' '}
                        {recipientCount.totalStudents -
                          recipientCount.validContacts}{' '}
                        contact missing
                      </span>
                    )}
                </div>
              )}
              <button
                onClick={fetchRecipientCount}
                className="ml-auto text-[var(--text-muted)] hover:text-[var(--primary-500)] transition-colors"
                title="Refresh count"
                type="button"
              >
                <RefreshCw size={12} />
              </button>
            </div>

            {/* ── Bug 2 fix: Template Selection ── */}
            <Select
              label="Message Template"
              value={form.templateId}
              onChange={e => handleTemplateChange(e.target.value)}
              options={[
                { value: 'custom', label: '✏️ Custom Message' },
                ...availableTemplates
                  .filter(t => t.id !== 'custom')
                  .map(t => ({
                    value: t.id,
                    label:
                      t.category === 'fee'
                        ? `💰 ${t.name}`
                        : t.category === 'attendance'
                          ? `📅 ${t.name}`
                          : t.category === 'exam'
                            ? `📊 ${t.name}`
                            : `📢 ${t.name}`,
                  })),
              ]}
            />

            {/* ── Template Variable Inputs ── */}
            {form.templateId === 'fee_reminder' && (
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Fee Amount (₹)"
                  value={form.amount}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  placeholder="e.g. 5000"
                  type="number"
                />
                <Input
                  label="Due Date"
                  value={form.dueDate}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      dueDate: e.target.value,
                    }))
                  }
                  placeholder="e.g. 31 Jan 2025"
                />
              </div>
            )}

            {form.templateId === 'exam_result' && (
              <Input
                label="Exam Name"
                value={form.examName}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    examName: e.target.value,
                  }))
                }
                placeholder="e.g. Half Yearly 2024-25"
              />
            )}

            {/* ── Email Subject ── */}
            {form.channel === 'email' && (
              <Input
                label="Email Subject"
                value={form.subject}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    subject: e.target.value,
                  }))
                }
                placeholder="Enter email subject"
              />
            )}

            {/* ── Message Content ── */}
            <div>
              <label className="input-label">
                Message Content
              </label>
              <textarea
                value={form.message}
                onChange={e =>
                  setForm(prev => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
                className={[
                  'w-full h-32 px-3 py-2 text-sm font-body',
                  'rounded-[var(--radius-md)] border-[1.5px]',
                  'transition-all bg-[var(--bg-card)]',
                  'text-[var(--text-primary)]',
                  'focus:outline-none',
                  'resize-none',
                  isOverLimit
                    ? 'border-[var(--danger)] focus:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]'
                    : 'border-[var(--border)] focus:border-[var(--primary-500)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.1)]',
                ].join(' ')}
                placeholder={
                  form.templateId === 'custom'
                    ? 'Type your message... Use [STUDENT_NAME], [SCHOOL_NAME] as variables'
                    : 'Template loaded — edit if needed'
                }
              />

              {/* Character count + SMS parts */}
              <div className="flex items-center justify-between mt-1.5 flex-wrap gap-2">
                <div className="flex items-center gap-3 text-xs">
                  <span
                    className={
                      isOverLimit
                        ? 'text-[var(--danger)] font-semibold'
                        : 'text-[var(--text-muted)]'
                    }
                  >
                    {charCount} / {charLimit} chars
                  </span>
                  {form.channel === 'sms' && smsParts > 1 && (
                    <span className="text-[var(--warning)] flex items-center gap-1">
                      <Info size={10} />
                      {smsParts} SMS parts
                    </span>
                  )}
                </div>

                {/* Bug 3 fix: Real estimated cost */}
                <div className="text-xs font-semibold">
                  {recipientCount.loading ? (
                    <span className="text-[var(--text-muted)]">
                      Calculating...
                    </span>
                  ) : recipientCount.estimated > 0 ? (
                    <span className="text-[var(--warning)]">
                      Est. cost:{' '}
                      <span className="font-bold">
                        ~{formatCredits(estimatedCost)} credits
                      </span>{' '}
                      <span className="text-[var(--text-muted)] font-normal">
                        ({recipientCount.estimated} recipients ×{' '}
                        {CREDIT_COSTS[form.channel]} CR)
                      </span>
                    </span>
                  ) : (
                    <span className="text-[var(--text-muted)]">
                      Select recipients to see estimate
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Template Variables Helper ── */}
            {currentTemplate &&
              form.templateId !== 'custom' &&
              currentTemplate.variables.length > 0 && (
                <div className="p-3 rounded-[var(--radius-sm)] text-xs bg-[var(--info-light)] border border-[rgba(59,130,246,0.2)]">
                  <p className="font-semibold text-[var(--info-dark)] mb-1.5">
                    Available Variables:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {currentTemplate.variables.map(v => (
                      <span
                        key={v.key}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/60 text-[var(--info-dark)] border border-[rgba(59,130,246,0.2)] font-mono text-[10px]"
                        title={`Example: ${v.example}`}
                      >
                        [{v.key}]
                        <span className="text-[var(--text-muted)] font-sans">
                          = {v.example}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* ── Credit Warning ── */}
            {recipientCount.estimated > 0 &&
              stats.creditBalance < estimatedCost && (
                <div className="p-3 rounded-[var(--radius-sm)] text-xs bg-[var(--danger-light)] border border-[rgba(239,68,68,0.2)]">
                  <p className="font-semibold text-[var(--danger-dark)] mb-0.5">
                    ⚠️ Insufficient Credits
                  </p>
                  <p className="text-[var(--danger-dark)]">
                    Required:{' '}
                    <strong>~{formatCredits(estimatedCost)}</strong>,
                    Available:{' '}
                    <strong>
                      {formatCredits(stats.creditBalance)}
                    </strong>
                    .{' '}
                    <a
                      href="/admin/subscription"
                      className="underline"
                    >
                      Purchase credits →
                    </a>
                  </p>
                </div>
              )}

            {/* ── Send Button ── */}
            <Button
              className="w-full"
              onClick={handleSend}
              loading={sending}
              disabled={
                sending ||
                !form.message.trim() ||
                isOverLimit ||
                recipientCount.validContacts === 0
              }
            >
              <Send size={14} />
              {sending
                ? 'Sending...'
                : recipientCount.validContacts > 0
                  ? `Send to ${recipientCount.validContacts.toLocaleString('en-IN')} recipients`
                  : 'Send Message'}
            </Button>

          </div>
        </Modal>
      </Portal>

    </div>
  )
}