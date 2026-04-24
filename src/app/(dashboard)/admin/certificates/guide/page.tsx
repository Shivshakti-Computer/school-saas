// FILE: src/app/(dashboard)/admin/certificates/guide/page.tsx
// PRODUCTION READY — Complete certificate module guide
// ═══════════════════════════════════════════════════════════

'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Award,
  FileText,
  LayoutTemplate,
  QrCode,
  ShieldCheck,
  Database,
  HelpCircle,
  ChevronRight,
  Copy,
  Check,
  ArrowLeft,
  BookOpen,
  Users,
  GraduationCap,
  Star,
  Medal,
  Trophy,
  Scroll,  // ← ADD THIS (replaces Certificate)
} from 'lucide-react'
import { PageHeader, Button, Card, Badge } from '@/components/ui'
import { useSession } from 'next-auth/react'

// ── Section Types ──────────────────────────────────────────

type SectionId =
  | 'overview'
  | 'types'
  | 'variables'
  | 'layouts'
  | 'verification'
  | 'accreditations'
  | 'storage'
  | 'faq'

interface Section {
  id: SectionId
  title: string
  icon: React.ReactNode
}

// ── Sections Config ─────────────────────────────────────────

const SECTIONS: Section[] = [
  { id: 'overview', title: 'How It Works', icon: <BookOpen size={16} /> },
  { id: 'types', title: 'Certificate Types', icon: <Award size={16} /> },
  { id: 'variables', title: 'Dynamic Variables', icon: <FileText size={16} /> },
  { id: 'layouts', title: 'Layouts & Design', icon: <LayoutTemplate size={16} /> },
  { id: 'verification', title: 'Verification System', icon: <QrCode size={16} /> },
  { id: 'accreditations', title: 'Accreditations', icon: <ShieldCheck size={16} /> },
  { id: 'storage', title: 'Storage & PDF', icon: <Database size={16} /> },
  { id: 'faq', title: 'FAQ', icon: <HelpCircle size={16} /> },
]

// ── Code Block Component ───────────────────────────────────

function CodeBlock({ code, label }: { code: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="relative rounded-[var(--radius-md)] overflow-hidden"
      style={{
        background: 'var(--bg-subtle)',
        border: '1px solid var(--border)',
      }}
    >
      {label && (
        <div
          className="px-3 py-1.5 text-xs font-medium"
          style={{
            background: 'var(--bg-muted)',
            color: 'var(--text-muted)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {label}
        </div>
      )}
      <div className="flex items-center justify-between px-3 py-2">
        <code
          className="text-sm font-mono"
          style={{ color: 'var(--text-primary)' }}
        >
          {code}
        </code>
        <button
          onClick={handleCopy}
          className="p-1.5 rounded hover:bg-[var(--bg-muted)] transition-colors"
          style={{ color: 'var(--text-muted)' }}
          title="Copy to clipboard"
        >
          {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────

export default function CertificateGuidePage() {
  const { data: session } = useSession()
  const institutionType =
    (session?.user?.institutionType as 'school' | 'academy' | 'coaching') || 'school'

  const [activeSection, setActiveSection] = useState<SectionId>('overview')

  // Scroll to section
  const scrollToSection = (id: SectionId) => {
    setActiveSection(id)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="portal-content-enter">
      <PageHeader
        title="Certificate Guide"
        subtitle="Complete guide to creating, issuing, and verifying certificates"
        action={
          <Link href="/admin/certificates">
            <Button variant="secondary">
              <ArrowLeft size={15} />
              Back to Certificates
            </Button>
          </Link>
        }
      />

      <div className="flex gap-6">
        {/* ── Sidebar Navigation ─────────────────────────────── */}
        <aside
          className="hidden lg:block w-64 flex-shrink-0"
          style={{ position: 'sticky', top: '80px', height: 'calc(100vh - 100px)' }}
        >
          <nav
            className="rounded-[var(--radius-lg)] overflow-hidden"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
            }}
          >
            {SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                style={{
                  background:
                    activeSection === section.id
                      ? 'var(--primary-50)'
                      : 'transparent',
                  color:
                    activeSection === section.id
                      ? 'var(--primary-700)'
                      : 'var(--text-secondary)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    color:
                      activeSection === section.id
                        ? 'var(--primary-600)'
                        : 'var(--text-muted)',
                  }}
                >
                  {section.icon}
                </span>
                <span className="text-sm font-medium">{section.title}</span>
                {activeSection === section.id && (
                  <ChevronRight size={14} className="ml-auto" />
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* ── Main Content ───────────────────────────────────── */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* ── Overview ─────────────────────────────────────── */}
          <section id="overview" className="scroll-mt-24">
            <Card>
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                How Certificates Work
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="p-4 rounded-[var(--radius-md)]"
                  style={{ background: 'var(--bg-subtle)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      background: 'var(--primary-50)',
                      color: 'var(--primary-600)',
                    }}
                  >
                    <LayoutTemplate size={20} />
                  </div>
                  <h3
                    className="text-sm font-semibold mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    1. Create Template
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Design certificate templates with dynamic variables. Choose from multiple layouts and customize signature labels.
                  </p>
                </div>

                <div
                  className="p-4 rounded-[var(--radius-md)]"
                  style={{ background: 'var(--bg-subtle)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      background: 'var(--success-light)',
                      color: 'var(--success)',
                    }}
                  >
                    <Award size={20} />
                  </div>
                  <h3
                    className="text-sm font-semibold mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    2. Issue Certificates
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Issue to individual recipients or bulk issue to entire classes/batches. Each certificate gets a unique number and verification code.
                  </p>
                </div>

                <div
                  className="p-4 rounded-[var(--radius-md)]"
                  style={{ background: 'var(--bg-subtle)' }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                    style={{
                      background: 'var(--info-light)',
                      color: 'var(--info)',
                    }}
                  >
                    <QrCode size={20} />
                  </div>
                  <h3
                    className="text-sm font-semibold mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    3. Verify & Share
                  </h3>
                  <p
                    className="text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Certificates include QR codes for instant verification. Anyone can verify authenticity using the public verification URL.
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* ── Certificate Types ────────────────────────────── */}
          <section id="types" className="scroll-mt-24">
            <Card>
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Certificate Types
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                Certificate types are filtered based on your institution type. Choose the appropriate type for each template.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Common Types */}
                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Common to All Institutions
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: 'merit', icon: <Star size={12} />, desc: 'Academic excellence' },
                      { type: 'participation', icon: <Users size={12} />, desc: 'Event participation' },
                      { type: 'achievement', icon: <Trophy size={12} />, desc: 'Special achievements' },
                      { type: 'appreciation', icon: <Medal size={12} />, desc: 'Recognition award' },
                      { type: 'custom', icon: <Scroll size={12} />, desc: 'Custom purpose' },
                    ].map(item => (
                      <div
                        key={item.type}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-full"
                        style={{
                          background: 'var(--bg-subtle)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <span style={{ color: 'var(--primary-500)' }}>{item.icon}</span>
                        <span
                          className="text-xs font-medium capitalize"
                          style={{ color: 'var(--text-secondary)' }}
                        >
                          {item.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Institution-Specific */}
                {institutionType === 'school' && (
                  <div>
                    <h3
                      className="text-sm font-semibold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      School-Specific Types
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { type: 'character', desc: 'Conduct certificate' },
                        { type: 'sports', desc: 'Sports achievement' },
                      ].map(item => (
                        <Badge key={item.type} variant="primary">
                          {item.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(institutionType === 'academy' || institutionType === 'coaching') && (
                  <div>
                    <h3
                      className="text-sm font-semibold mb-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {institutionType === 'academy' ? 'Academy' : 'Coaching'}-Specific Types
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { type: 'completion', desc: 'Course completion' },
                        { type: 'internship', desc: 'Internship certificate' },
                        { type: 'skill', desc: 'Skill certification' },
                        { type: 'test_topper', desc: 'Test topper award' },
                      ].map(item => (
                        <Badge key={item.type} variant="info">
                          {item.type}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </section>

          {/* ── Dynamic Variables ───────────────────────────── */}
          <section id="variables" className="scroll-mt-24">
            <Card>
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Dynamic Variables
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                Use variables in your template content to auto-fill recipient-specific data. Variables use the{' '}
                <code className="font-mono bg-[var(--bg-muted)] px-1 rounded">
                  {'{{variableName}}'}
                </code>{' '}
                syntax.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Auto-Filled Variables
                  </h3>
                  <div className="space-y-2">
                    {[
                      { var: '{{recipientName}}', desc: 'Full name of the recipient' },
                      { var: '{{class}}', desc: 'Student class (schools)' },
                      { var: '{{section}}', desc: 'Student section (schools)' },
                      { var: '{{academicYear}}', desc: 'Academic year' },
                      { var: '{{courseName}}', desc: 'Course name (academy/coaching)' },
                    ].map(item => (
                      <div key={item.var} className="flex items-start gap-2">
                        <CodeBlock code={item.var} />
                        <p
                          className="text-xs self-center"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Custom Variables
                  </h3>
                  <p
                    className="text-xs mb-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Define custom fields in the template and use them as variables:
                  </p>
                  <div className="space-y-2">
                    <CodeBlock code="{{grade}}" label="Example: Grade field" />
                    <CodeBlock code="{{rank}}" label="Example: Rank field" />
                    <CodeBlock code="{{percentage}}" label="Example: Percentage field" />
                  </div>
                </div>
              </div>

              <div
                className="p-3 rounded-[var(--radius-md)]"
                style={{
                  background: 'var(--info-light)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--info-dark)' }}
                >
                  💡 Tip: You can add up to 10 custom fields per template. Required fields must be filled when issuing certificates.
                </p>
              </div>
            </Card>
          </section>

          {/* ── Layouts ─────────────────────────────────────── */}
          <section id="layouts" className="scroll-mt-24">
            <Card>
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Certificate Layouts
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                Choose from three professional layouts. Each layout has distinct styling for borders, colors, and typography.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'modern',
                    name: 'Modern',
                    desc: 'Clean design with gold accents and minimal borders',
                    color: 'Gold',
                  },
                  {
                    id: 'classic',
                    name: 'Classic',
                    desc: 'Traditional formal style with gray borders',
                    color: 'Slate Gray',
                  },
                  {
                    id: 'elegant',
                    name: 'Elegant',
                    desc: 'Indigo theme with decorative double borders',
                    color: 'Indigo',
                  },
                ].map(layout => (
                  <div
                    key={layout.id}
                    className="p-4 rounded-[var(--radius-md)]"
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      className="h-20 rounded mb-3 flex items-center justify-center"
                      style={{
                        background: 'var(--bg-card)',
                        border: `2px solid var(--${layout.id === 'modern' ? 'warning' : layout.id === 'classic' ? 'text-muted' : 'primary-500'})`,
                      }}
                    >
                      <Award size={24} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <h3
                      className="text-sm font-semibold mb-1 capitalize"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {layout.name}
                    </h3>
                    <p
                      className="text-xs mb-2"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {layout.desc}
                    </p>
                    <Badge variant="primary">{layout.color} Accent</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* ── Verification System ─────────────────────────── */}
          <section id="verification" className="scroll-mt-24">
            <Card>
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Verification System
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    How Verification Works
                  </h3>
                  <ul
                    className="space-y-2 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5" style={{ color: 'var(--success)' }} />
                      <span>Each certificate gets a unique 8-character verification code</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5" style={{ color: 'var(--success)' }} />
                      <span>PDF includes QR code linking to public verification URL</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5" style={{ color: 'var(--success)' }} />
                      <span>Anyone can verify by scanning QR or visiting the URL</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={14} className="mt-0.5" style={{ color: 'var(--success)' }} />
                      <span>Verification shows certificate validity, recipient, and issue date</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Verification URL Format
                  </h3>
                  <CodeBlock code="https://skolify.in/verify/CERT-AB12CD34" />
                  <p
                    className="text-xs mt-2"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Replace <code className="font-mono">CERT-AB12CD34</code> with the actual verification code from the certificate.
                  </p>
                </div>
              </div>

              <div
                className="mt-4 p-3 rounded-[var(--radius-md)]"
                style={{
                  background: 'var(--warning-light)',
                  border: '1px solid rgba(245,158,11,0.2)',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--warning-dark)' }}
                >
                  ⚠️ Revoked certificates will show as invalid on the verification page with the revocation reason.
                </p>
              </div>
            </Card>
          </section>

          {/* ── Accreditations ──────────────────────────────── */}
          <section id="accreditations" className="scroll-mt-24">
            <Card>
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Institution Accreditations
              </h2>
              <p
                className="text-sm mb-4"
                style={{ color: 'var(--text-secondary)' }}
              >
                Display your institution's accreditations on certificates to enhance credibility. This includes affiliations, registrations, and recognitions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    What Gets Displayed
                  </h3>
                  <ul
                    className="space-y-1.5 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <li>• Affiliations (e.g., CBSE, ICSE, State Board)</li>
                    <li>• Registrations (e.g., ISO 9001:2015, MSME)</li>
                    <li>• Recognitions (e.g., Best School Award)</li>
                  </ul>
                </div>

                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Configuration
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    Accreditations are configured in{' '}
                    <strong style={{ color: 'var(--text-primary)' }}>
                      Settings → School Profile
                    </strong>
                    . Each certificate template has a toggle to show/hide accreditations.
                  </p>
                </div>
              </div>

              <div
                className="mt-4 p-3 rounded-[var(--radius-md)]"
                style={{
                  background: 'var(--success-light)',
                  border: '1px solid rgba(16,185,129,0.2)',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--success-dark)' }}
                >
                  ✅ Accreditations appear in the certificate footer and on the public verification page.
                </p>
              </div>
            </Card>
          </section>

          {/* ── Storage & PDF ───────────────────────────────── */}
          <section id="storage" className="scroll-mt-24">
            <Card>
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Storage & PDF Generation
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    On-Demand PDF (Default)
                  </h3>
                  <ul
                    className="space-y-1.5 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <li>• PDFs generated when downloaded</li>
                    <li>• No storage usage</li>
                    <li>• Always up-to-date with latest data</li>
                    <li>• Recommended for most use cases</li>
                  </ul>
                </div>

                <div>
                  <h3
                    className="text-sm font-semibold mb-2"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    Save to Storage (Optional)
                  </h3>
                  <ul
                    className="space-y-1.5 text-sm"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    <li>• PDF saved permanently to cloud storage</li>
                    <li>• Uses storage quota from your plan</li>
                    <li>• Creates permanent PDF URL</li>
                    <li>• Useful for archival purposes</li>
                  </ul>
                </div>
              </div>

              <div
                className="mt-4 p-3 rounded-[var(--radius-md)]"
                style={{
                  background: 'var(--info-light)',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}
              >
                <p
                  className="text-sm"
                  style={{ color: 'var(--info-dark)' }}
                >
                  💡 Storage limits depend on your plan. You can purchase storage add-ons if needed. Check your usage in Settings → Subscription.
                </p>
              </div>
            </Card>
          </section>

          {/* ── FAQ ──────────────────────────────────────────── */}
          <section id="faq" className="scroll-mt-24">
            <Card>
              <h2
                className="text-lg font-bold mb-4"
                style={{ color: 'var(--text-primary)' }}
              >
                Frequently Asked Questions
              </h2>

              <div className="space-y-4">
                {[
                  {
                    q: 'Can I issue certificates to staff members?',
                    a: 'Yes. When creating a template, set "Applicable To" as "Staff" or "Both". You can then issue certificates to staff members just like students.',
                  },
                  {
                    q: 'What happens if I revoke a certificate?',
                    a: 'Revoked certificates will show as invalid on the verification page with the revocation reason. The PDF will still be downloadable but marked as revoked.',
                  },
                  {
                    q: 'Can I bulk issue certificates?',
                    a: 'Yes. Use the "Bulk Issue" button on any template to issue certificates to an entire class, section, or custom selection of recipients.',
                  },
                  {
                    q: 'How many custom fields can I add?',
                    a: 'You can add up to 10 custom fields per template. Each field can be marked as required or optional.',
                  },
                  {
                    q: 'Is the verification URL public?',
                    a: 'Yes. The verification URL is publicly accessible so anyone with the code can verify the certificate. No login is required.',
                  },
                  {
                    q: 'Can I change the signature label?',
                    a: 'Yes. Each template has a "Signature Label" field where you can set custom labels like "Principal", "Director", "Center Head", etc.',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-[var(--radius-md)]"
                    style={{
                      background: 'var(--bg-subtle)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <h3
                      className="text-sm font-semibold mb-1.5"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {item.q}
                    </h3>
                    <p
                      className="text-sm"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </section>

          {/* ── CTA ──────────────────────────────────────────── */}
          <div
            className="p-6 rounded-[var(--radius-xl)] text-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary-50) 0%, var(--bg-card) 100%)',
              border: '1px solid var(--primary-200)',
            }}
          >
            <h3
              className="text-lg font-bold mb-2"
              style={{ color: 'var(--text-primary)' }}
            >
              Ready to Create Certificates?
            </h3>
            <p
              className="text-sm mb-4"
              style={{ color: 'var(--text-secondary)' }}
            >
              Start by creating your first certificate template and issue certificates to students or staff.
            </p>
            <Link href="/admin/certificates">
              <Button>
                <Award size={15} />
                Go to Certificates
              </Button>
            </Link>
          </div>
        </main>
      </div>
    </div>
  )
}