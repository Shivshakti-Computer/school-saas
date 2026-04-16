'use client'

import { useState } from 'react'
import {
  BookOpen, CheckSquare, Settings, Users, DollarSign,
  Calendar, AlertTriangle, Shield, FileText, Download,
  ChevronRight, ExternalLink, ArrowLeft, Search,
  BookMarked, MessageSquare, Clock, Target, Zap,
  Info, XCircle, CheckCircle, TrendingUp, Briefcase,
  Phone, Mail, Award, Archive, FileCheck, Database,
  BarChart2,
} from 'lucide-react'
import { Card, Button, Badge } from '@/components/ui'
import Link from 'next/link'

// ── Table of Contents ──
const TOC_SECTIONS = [
  {
    id: 'overview',
    title: 'Overview',
    icon: BookOpen,
    subsections: ['What is HR & Payroll', 'Key Features', 'Who Should Use'],
  },
  {
    id: 'setup',
    title: '1. Initial Setup',
    icon: Settings,
    subsections: [
      'Configure Module Settings',
      'Salary Slip Notifications',
      'Statutory Deductions',
      'Leave Policy',
      'Payroll Settings',
    ],
  },
  {
    id: 'add-staff',
    title: '2. Adding Staff Records',
    icon: Users,
    subsections: [
      'When to Add',
      'Personal Details',
      'Professional Details',
      'Salary Structure',
      'Bank & Emergency',
    ],
  },
  {
    id: 'salary',
    title: '3. Processing Monthly Salary',
    icon: DollarSign,
    subsections: [
      'When to Process',
      'Step-by-Step',
      'Review Salary Slips',
      'Email & SMS Samples',
    ],
  },
  {
    id: 'leaves',
    title: '4. Leave Management',
    icon: Calendar,
    subsections: [
      'Viewing Balances',
      'Deducting Leave',
      'Crediting Leave',
      'Leave Types',
      'Best Practices',
    ],
  },
  {
    id: 'workflows',
    title: '5. Common Workflows',
    icon: Target,
    subsections: [
      'New Staff Onboarding',
      'Staff Resignation',
      'Salary Increment',
      'Promotion',
    ],
  },
  {
    id: 'reports',
    title: '6. Reports & Analytics',
    icon: FileText,
    subsections: ['Dashboard Stats', 'Salary Summary', 'Leave Reports'],
  },
  {
    id: 'troubleshooting',
    title: '7. Troubleshooting',
    icon: AlertTriangle,
    subsections: [
      'Salary Not Generating',
      'Notifications Not Sent',
      'Wrong Calculations',
      'Common Errors',
    ],
  },
  {
    id: 'best-practices',
    title: '8. Best Practices',
    icon: Zap,
    subsections: ["DO's", "DON'Ts", 'Month-End Checklist'],
  },
  {
    id: 'compliance',
    title: '9. Compliance & Legal',
    icon: Shield,
    subsections: [
      'Required Documents',
      'Statutory Deadlines',
      'Audit Trail',
    ],
  },
]

export default function HRGuideClient() {
  const [activeSection, setActiveSection] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  // Scroll to section
  const scrollToSection = (id: string) => {
    setActiveSection(id)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[var(--bg-card)] border-b border-[var(--border)] shadow-sm">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link href="/admin/hr">
                <Button variant="ghost" size="sm">
                  <ArrowLeft size={15} />
                  Back to HR
                </Button>
              </Link>
              <div className="h-6 w-px bg-[var(--border)]" />
              <div className="flex items-center gap-2">
                <BookMarked size={20} className="text-[var(--primary-500)]" />
                <h1 className="text-lg font-bold text-[var(--text-primary)]">
                  HR & Payroll Management Guide
                </h1>
              </div>
            </div>

            {/* Search */}
            <div className="portal-search min-w-[280px]">
              <Search size={14} className="search-icon" />
              <input
                placeholder="Search guide..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">

          {/* ── Sidebar TOC ── */}
          <aside className="lg:sticky lg:top-24 h-fit">
            <Card className="p-4">
              <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
                Table of Contents
              </p>
              <nav className="space-y-1">
                {TOC_SECTIONS.map((section) => {
                  const Icon = section.icon
                  const isActive = activeSection === section.id
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`
                        w-full text-left px-3 py-2 rounded-[var(--radius-md)]
                        flex items-center gap-2 text-sm font-medium
                        transition-all duration-150
                        ${isActive
                          ? 'bg-[var(--primary-50)] text-[var(--primary-600)]'
                          : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]'
                        }
                      `}
                    >
                      <Icon size={14} />
                      <span className="flex-1 truncate">{section.title}</span>
                      {isActive && (
                        <ChevronRight size={13} className="flex-shrink-0" />
                      )}
                    </button>
                  )
                })}
              </nav>

              {/* Quick Actions */}
              <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-2">
                <Link href="/admin/hr">
                  <Button variant="primary" size="sm" className="w-full">
                    <Users size={13} />
                    Open HR Module
                  </Button>
                </Link>
                <Link href="/admin/settings?tab=modules">
                  <Button variant="ghost" size="sm" className="w-full">
                    <Settings size={13} />
                    HR Settings
                  </Button>
                </Link>
              </div>
            </Card>
          </aside>

          {/* ── Main Content ── */}
          <main className="space-y-8 portal-content-enter">

            {/* Overview Section */}
            <GuideSection id="overview" title="Overview" icon={BookOpen}>
              <div className="prose prose-sm max-w-none">
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  HR & Payroll module is a complete solution to manage staff records, 
                  process monthly salary, track leaves, and send automated payslips 
                  via Email/SMS. This guide will help you set up and use the module effectively.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 not-prose my-6">
                  <FeatureCard
                    icon={Users}
                    title="Staff Management"
                    description="Complete employee records with salary structure"
                  />
                  <FeatureCard
                    icon={DollarSign}
                    title="Automated Payroll"
                    description="One-click salary generation with PF/ESI"
                  />
                  <FeatureCard
                    icon={Calendar}
                    title="Leave Tracking"
                    description="CL, SL, EL management with real-time balance"
                  />
                </div>

                <InfoBox type="info">
                  <strong>Who Should Use:</strong> School Admin, Accountant, HR Manager
                </InfoBox>
              </div>
            </GuideSection>

            {/* Setup Section */}
            <GuideSection id="setup" title="1. Initial Setup" icon={Settings}>
              <StepCard number={1} title="Navigate to Settings">
                <p>
                  Go to <strong>Admin Dashboard → Settings (⚙️) → Modules Tab</strong>
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  Scroll to "HR & Payroll Settings" section
                </p>
              </StepCard>

              <StepCard number={2} title="Configure Salary Slip Notifications">
                <ConfigTable
                  items={[
                    {
                      setting: 'Send via Email',
                      default: 'OFF',
                      recommended: 'ON',
                      note: 'Detailed payslip PDF sent to staff email',
                    },
                    {
                      setting: 'Send via SMS',
                      default: 'OFF',
                      recommended: 'ON',
                      note: 'Summary notification (uses message credits)',
                    },
                  ]}
                />
                <InfoBox type="success">
                  <strong>Tip:</strong> Email is recommended as it's detailed and costs less credits
                </InfoBox>
              </StepCard>

              <StepCard number={3} title="Configure Statutory Deductions">
                <div className="space-y-4">
                  <DeductionCard
                    title="Provident Fund (PF)"
                    defaultValue="12% of Basic Salary"
                    applicable="All staff (Government mandate)"
                    note="Employee contributes 12%, Employer matches 12%. System deducts employee's 12% only."
                  />
                  <DeductionCard
                    title="Employee State Insurance (ESI)"
                    defaultValue="0.75% of Gross Salary"
                    applicable="Only if Gross Salary ≤ ₹21,000/month"
                    note="Employee: 0.75%, Employer: 3.25%"
                  />
                  <DeductionCard
                    title="Professional Tax"
                    defaultValue="State-specific"
                    applicable="Maharashtra = ₹200/month if gross >₹10k"
                    note="Enable only if required in your state"
                  />
                </div>
              </StepCard>

              <StepCard number={4} title="Set Leave Policy">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--bg-muted)]">
                    <tr>
                      <th className="px-4 py-2 text-left">Leave Type</th>
                      <th className="px-4 py-2 text-left">Default</th>
                      <th className="px-4 py-2 text-left">Recommended</th>
                      <th className="px-4 py-2 text-left">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)]">
                    <tr>
                      <td className="px-4 py-3">Casual Leave (CL)</td>
                      <td className="px-4 py-3">12 days</td>
                      <td className="px-4 py-3">12-15 days</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Short personal work</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Sick Leave (SL)</td>
                      <td className="px-4 py-3">10 days</td>
                      <td className="px-4 py-3">10-12 days</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Medical reasons</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Earned Leave (EL)</td>
                      <td className="px-4 py-3">15 days</td>
                      <td className="px-4 py-3">15-20 days</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">Vacation, accrues yearly</td>
                    </tr>
                  </tbody>
                </table>
              </StepCard>

              <StepCard number={5} title="Payroll Configuration">
                <ConfigTable
                  items={[
                    {
                      setting: 'Salary Disbursement Day',
                      default: '1',
                      recommended: '1, 5, 7, or last working day',
                      note: 'Month ka konsa din salary process ho',
                    },
                    {
                      setting: 'Payslip Footer Text',
                      default: 'This is a computer generated payslip.',
                      recommended: 'Add contact email for queries',
                      note: 'Appears at bottom of email payslip',
                    },
                  ]}
                />
              </StepCard>

              <div className="flex items-center gap-3 p-4 bg-[var(--success-light)] border border-[rgba(16,185,129,0.15)] rounded-[var(--radius-md)]">
                <CheckSquare size={16} className="text-[var(--success)] flex-shrink-0" />
                <p className="text-sm text-[var(--success-dark)]">
                  <strong>Setup Complete!</strong> Click "Save Changes" and proceed to add staff records.
                </p>
              </div>
            </GuideSection>

            {/* Add Staff Section */}
            <GuideSection id="add-staff" title="2. Adding Staff Records" icon={Users}>
              <InfoBox type="info">
                <strong>When to Add:</strong> New staff joins, converting existing teacher 
                to full HR record, or want to track salary/leaves for support staff
              </InfoBox>

              <StepCard number={1} title="Navigate to HR Module">
                <p>
                  <strong>Admin Dashboard → HR & Payroll → Click "Add Staff"</strong>
                </p>
              </StepCard>

              <StepCard number={2} title="Fill Required Information">
                <div className="space-y-6">
                  {/* Personal Details */}
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                      Personal Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <FormField label="Link Account" required>
                        Select teacher from dropdown (if teaching staff)
                      </FormField>
                      <FormField label="Employee ID" required>
                        Unique code: EMP-001, TCH-PGT-001
                      </FormField>
                      <FormField label="First Name" required>
                        As per documents
                      </FormField>
                      <FormField label="Last Name">
                        Family name
                      </FormField>
                      <FormField label="Gender" required>
                        Male / Female / Other
                      </FormField>
                      <FormField label="Phone" required>
                        10-digit mobile for SMS/WhatsApp
                      </FormField>
                    </div>
                  </div>

                  {/* Professional Details */}
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                      Professional Details
                    </h4>
                    <div className="space-y-2 text-sm">
                      <FormField label="Category" required>
                        Teaching / Non-Teaching / Administration / Support
                      </FormField>
                      <FormField label="Designation" required>
                        Subject Teacher, PGT Physics, Accountant, etc.
                      </FormField>
                      <FormField label="Department" required>
                        Science, Maths, Administration, Accounts
                      </FormField>
                      <FormField label="Qualification" required>
                        B.Ed, M.Sc, MBA, 12th Pass
                      </FormField>
                      <FormField label="Experience">
                        Years (affects leave accrual in some policies)
                      </FormField>
                      <FormField label="Joining Date" required>
                        Date of appointment
                      </FormField>
                      <FormField label="Basic Salary" required>
                        Monthly basic (₹25,000) - gross auto-calculates
                      </FormField>
                    </div>
                  </div>

                  {/* Salary Breakdown */}
                  <SalaryBreakdownExample />

                  {/* Bank Details */}
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                      Bank & ID Details (Optional but Recommended)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <FormField label="Bank Name">
                        State Bank of India, HDFC, ICICI, etc.
                      </FormField>
                      <FormField label="Account Number">
                        12345678901234 (validates format)
                      </FormField>
                      <FormField label="IFSC Code">
                        SBIN0001234 (validates format)
                      </FormField>
                      <FormField label="PAN Number">
                        ABCDE1234F (validates format)
                      </FormField>
                    </div>
                  </div>

                  {/* Emergency */}
                  <div>
                    <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3">
                      Emergency Contact (Mandatory)
                    </h4>
                    <div className="space-y-2 text-sm">
                      <FormField label="Name" required>
                        Spouse/Parent name
                      </FormField>
                      <FormField label="Relation">
                        Wife/Husband/Father/Mother
                      </FormField>
                      <FormField label="Phone" required>
                        Emergency contact number
                      </FormField>
                    </div>
                  </div>
                </div>
              </StepCard>

              <StepCard number={3} title="What Happens After Adding">
                <div className="space-y-2">
                  <CheckItem>Gross & Net salary auto-calculated based on settings</CheckItem>
                  <CheckItem>Leave balance initialized (12 CL, 10 SL, 15 EL)</CheckItem>
                  <CheckItem>Record appears in Staff Directory</CheckItem>
                  <CheckItem>Staff appears in next month's salary generation</CheckItem>
                </div>
              </StepCard>

              <InfoBox type="warning">
                <strong>Important:</strong> Keep Employee IDs systematic for easy tracking. 
                Example format: <code>TCH-PGT-001</code>, <code>ADM-001</code>, <code>SUP-001</code>
              </InfoBox>
            </GuideSection>

            {/* Salary Processing Section */}
            <GuideSection id="salary" title="3. Processing Monthly Salary" icon={DollarSign}>
              <InfoBox type="warning">
                <strong>When:</strong> Every month on your salary disbursement day 
                (2-3 days before actual payment for verification)
              </InfoBox>

              <StepCard number={1} title="Navigate to Salary Tab">
                <p>
                  <strong>HR & Payroll → Salary & Payroll Tab</strong>
                </p>
              </StepCard>

              <StepCard number={2} title="Configure & Generate">
                <ConfigTable
                  items={[
                    {
                      setting: 'Select Month',
                      default: 'Current month',
                      recommended: 'Month to process (e.g., January 2025)',
                      note: 'YYYY-MM format',
                    },
                    {
                      setting: 'Working Days',
                      default: '26',
                      recommended: '26 (full), 24 (short), 22 (festival month)',
                      note: 'Used for LOP calculation (future)',
                    },
                    {
                      setting: 'Send Notifications',
                      default: 'Unchecked',
                      recommended: 'Check after reviewing slips',
                      note: 'Sends email/SMS to all staff',
                    },
                  ]}
                />
                <div className="mt-4 space-y-3">
                  <InfoBox type="info">
                    <strong>Pro Tip:</strong> Generate WITHOUT notifications first → Review slips → 
                    Regenerate WITH notifications if everything is correct
                  </InfoBox>
                </div>
              </StepCard>

              <StepCard number={3} title="Review Salary Slips">
                <p className="mb-4">After clicking "Generate Payroll", review the table:</p>
                <SalarySlipPreview />
                
                <div className="mt-4 p-4 bg-[var(--primary-50)] border border-[var(--primary-200)] rounded-[var(--radius-md)]">
                  <h5 className="font-semibold text-sm text-[var(--primary-700)] mb-2">
                    Verify These Points:
                  </h5>
                  <div className="space-y-1 text-xs">
                    <CheckItem>Total staff count matches active staff</CheckItem>
                    <CheckItem>Total payout matches your budget</CheckItem>
                    <CheckItem>PF deduction = 12% of basic (or your configured %)</CheckItem>
                    <CheckItem>Net salary calculations are correct</CheckItem>
                    <CheckItem>No missing staff in the list</CheckItem>
                  </div>
                </div>
              </StepCard>

              <StepCard number={4} title="Email & SMS Samples">
                <p className="mb-4">
                  If notifications are enabled, staff will receive:
                </p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <EmailSample />
                  <SMSSample />
                </div>
              </StepCard>

              <InfoBox type="success">
                <strong>Success!</strong> After salary generation, you can:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Download salary summary (screenshot/export)</li>
                  <li>Process bank transfers externally (NEFT file)</li>
                  <li>File payslips for compliance</li>
                  <li>Deposit PF/ESI to government portals</li>
                </ul>
              </InfoBox>
            </GuideSection>

            {/* Leave Management Section */}
            <GuideSection id="leaves" title="4. Leave Management" icon={Calendar}>
              <LeaveManagementContent />
            </GuideSection>

            {/* Workflows Section */}
            <GuideSection id="workflows" title="5. Common Workflows" icon={Target}>
              <WorkflowsContent />
            </GuideSection>

            {/* Reports Section */}
            <GuideSection id="reports" title="6. Reports & Analytics" icon={FileText}>
              <ReportsContent />
            </GuideSection>

            {/* Troubleshooting Section */}
            <GuideSection id="troubleshooting" title="7. Troubleshooting" icon={AlertTriangle}>
              <TroubleshootingContent />
            </GuideSection>

            {/* Best Practices Section */}
            <GuideSection id="best-practices" title="8. Best Practices" icon={Zap}>
              <BestPracticesContent />
            </GuideSection>

            {/* Compliance Section */}
            <GuideSection id="compliance" title="9. Compliance & Legal" icon={Shield}>
              <ComplianceContent />
            </GuideSection>

            {/* Footer CTA */}
            <Card className="p-8 text-center bg-gradient-to-br from-[var(--primary-50)] to-[var(--bg-card)]">
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
                Ready to Start?
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
                Follow this guide step-by-step to set up your HR & Payroll system. 
                Need help? Contact support anytime.
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link href="/admin/hr">
                  <Button variant="primary">
                    <Users size={15} />
                    Open HR Module
                  </Button>
                </Link>
                <Link href="/admin/settings?tab=modules">
                  <Button variant="secondary">
                    <Settings size={15} />
                    Configure Settings
                  </Button>
                </Link>
              </div>
            </Card>

          </main>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════════

function GuideSection({
  id,
  title,
  icon: Icon,
  children,
}: {
  id: string
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-[var(--primary-100)]">
        <div className="w-10 h-10 rounded-[var(--radius-lg)] bg-[var(--primary-50)] flex items-center justify-center">
          <Icon size={20} className="text-[var(--primary-500)]" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </section>
  )
}

function StepCard({
  number,
  title,
  children,
}: {
  number: number
  title: string
  children: React.ReactNode
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <div className="w-8 h-8 rounded-full bg-[var(--primary-500)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
          {number}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">
            {title}
          </h3>
          <div className="space-y-4 text-sm text-[var(--text-secondary)]">
            {children}
          </div>
        </div>
      </div>
    </Card>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <div className="p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius-lg)]">
      <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary-50)] flex items-center justify-center mb-3">
        <Icon size={18} className="text-[var(--primary-500)]" />
      </div>
      <h4 className="font-semibold text-sm text-[var(--text-primary)] mb-1">
        {title}
      </h4>
      <p className="text-xs text-[var(--text-muted)]">
        {description}
      </p>
    </div>
  )
}

function InfoBox({
  type,
  children,
}: {
  type: 'info' | 'success' | 'warning' | 'danger'
  children: React.ReactNode
}) {
  const styles = {
    info: 'bg-[var(--info-light)] border-[rgba(59,130,246,0.2)] text-[var(--info-dark)]',
    success: 'bg-[var(--success-light)] border-[rgba(16,185,129,0.2)] text-[var(--success-dark)]',
    warning: 'bg-[var(--warning-light)] border-[rgba(245,158,11,0.2)] text-[var(--warning-dark)]',
    danger: 'bg-[var(--danger-light)] border-[rgba(239,68,68,0.2)] text-[var(--danger-dark)]',
  }

  return (
    <div className={`p-4 rounded-[var(--radius-md)] border text-sm ${styles[type]}`}>
      {children}
    </div>
  )
}

function ConfigTable({
  items,
}: {
  items: Array<{
    setting: string
    default: string
    recommended: string
    note: string
  }>
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[var(--bg-muted)]">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-semibold">Setting</th>
            <th className="px-4 py-2 text-left text-xs font-semibold">Default</th>
            <th className="px-4 py-2 text-left text-xs font-semibold">Recommended</th>
            <th className="px-4 py-2 text-left text-xs font-semibold">Note</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item, i) => (
            <tr key={i}>
              <td className="px-4 py-3 font-medium">{item.setting}</td>
              <td className="px-4 py-3 text-[var(--text-muted)]">{item.default}</td>
              <td className="px-4 py-3">{item.recommended}</td>
              <td className="px-4 py-3 text-xs text-[var(--text-muted)]">{item.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function DeductionCard({
  title,
  defaultValue,
  applicable,
  note,
}: {
  title: string
  defaultValue: string
  applicable: string
  note: string
}) {
  return (
    <div className="p-4 bg-[var(--bg-muted)] rounded-[var(--radius-md)] border border-[var(--border)]">
      <h5 className="font-semibold text-sm text-[var(--text-primary)] mb-2">
        {title}
      </h5>
      <div className="space-y-1 text-xs">
        <p>
          <span className="text-[var(--text-muted)]">Default:</span>{' '}
          <strong>{defaultValue}</strong>
        </p>
        <p>
          <span className="text-[var(--text-muted)]">Applicable:</span> {applicable}
        </p>
        <p className="text-[var(--text-muted)] italic">{note}</p>
      </div>
    </div>
  )
}

function FormField({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="font-medium text-[var(--text-primary)] min-w-[140px]">
        {label}
        {required && <span className="text-[var(--danger)]"> *</span>}:
      </span>
      <span className="text-[var(--text-muted)]">{children}</span>
    </div>
  )
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <CheckSquare size={16} className="text-[var(--success)] flex-shrink-0 mt-0.5" />
      <span className="text-sm text-[var(--text-secondary)]">{children}</span>
    </div>
  )
}

function SalaryBreakdownExample() {
  return (
    <div className="p-4 bg-[var(--primary-50)] border border-[var(--primary-200)] rounded-[var(--radius-md)]">
      <h5 className="font-semibold text-sm text-[var(--primary-700)] mb-3">
        Auto-Calculated Salary Breakdown
      </h5>
      <div className="font-mono text-xs space-y-1">
        <div className="flex justify-between">
          <span>Basic Salary (You enter):</span>
          <strong>₹25,000</strong>
        </div>
        <div className="text-[var(--text-muted)] ml-4 space-y-0.5">
          <div className="flex justify-between">
            <span>+ HRA (20%):</span>
            <span>₹5,000</span>
          </div>
          <div className="flex justify-between">
            <span>+ DA (15%):</span>
            <span>₹3,750</span>
          </div>
        </div>
        <div className="flex justify-between pt-1 border-t border-[var(--primary-300)]">
          <span>Gross Salary:</span>
          <strong className="text-[var(--success-dark)]">₹33,750</strong>
        </div>
        <div className="text-[var(--text-muted)] ml-4 space-y-0.5 pt-1">
          <div className="flex justify-between">
            <span>- PF (12% of Basic):</span>
            <span className="text-[var(--danger)]">₹3,000</span>
          </div>
        </div>
        <div className="flex justify-between pt-1 border-t border-[var(--primary-300)] font-bold">
          <span>NET SALARY:</span>
          <strong className="text-[var(--success)]">₹30,750</strong>
        </div>
      </div>
    </div>
  )
}

function SalarySlipPreview() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border border-[var(--border)]">
        <thead className="bg-[var(--bg-muted)]">
          <tr>
            <th className="px-3 py-2 text-left">Emp ID</th>
            <th className="px-3 py-2 text-left">Name</th>
            <th className="px-3 py-2 text-right">Basic</th>
            <th className="px-3 py-2 text-right">HRA</th>
            <th className="px-3 py-2 text-right">Gross</th>
            <th className="px-3 py-2 text-right">PF</th>
            <th className="px-3 py-2 text-right font-bold">Net Pay</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          <tr>
            <td className="px-3 py-2 font-mono">EMP-001</td>
            <td className="px-3 py-2">Ramesh Sharma</td>
            <td className="px-3 py-2 text-right">₹25,000</td>
            <td className="px-3 py-2 text-right">₹5,000</td>
            <td className="px-3 py-2 text-right">₹33,750</td>
            <td className="px-3 py-2 text-right text-[var(--danger)]">-₹3,000</td>
            <td className="px-3 py-2 text-right font-bold text-[var(--success)]">₹30,750</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function EmailSample() {
  return (
    <div className="p-4 bg-[var(--bg-muted)] rounded-[var(--radius-md)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-3">
        <Mail size={14} className="text-[var(--primary-500)]" />
        <h5 className="font-semibold text-xs">Email Sample</h5>
      </div>
      <div className="text-xs font-mono space-y-1 text-[var(--text-muted)]">
        <p><strong>Subject:</strong> Salary Slip — January 2025</p>
        <div className="pt-2 border-t border-[var(--border)] mt-2 space-y-2">
          <p>Dear Ramesh Sharma,</p>
          <p>
            Your salary of <strong>₹30,750</strong> for January 2025 
            has been processed.
          </p>
          <p>PF Deduction: ₹3,000<br/>Net Pay: ₹30,750</p>
          <p className="text-[10px] italic">[Detailed payslip HTML attached]</p>
        </div>
      </div>
    </div>
  )
}

function SMSSample() {
  return (
    <div className="p-4 bg-[var(--bg-muted)] rounded-[var(--radius-md)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={14} className="text-[var(--success)]" />
        <h5 className="font-semibold text-xs">SMS Sample</h5>
      </div>
      <div className="text-xs font-mono text-[var(--text-muted)]">
        <p>
          Dear Ramesh Sharma, your salary of Rs.30,750 for January 2025 
          has been processed. PF: Rs.3,000. Net Pay: Rs.30,750. -ABC School
        </p>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
// DETAILED SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════

function LeaveManagementContent() {
  return (
    <div className="space-y-6">
      <InfoBox type="info">
        Leave Management helps you track and manage staff leave balances in real-time.
      </InfoBox>

      <StepCard number={1} title="Viewing Leave Balances">
        <p>Navigate to: <strong>HR & Payroll → Leave Management Tab</strong></p>
        <p className="mt-3">You'll see a table with:</p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Employee ID and Name</li>
          <li>Department</li>
          <li>Casual, Sick, Earned leave balances</li>
          <li>Maternity/Paternity leave</li>
          <li>Unpaid leave count</li>
          <li>"Manage" button for each staff</li>
        </ul>

        <div className="mt-4 p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)]">
          <p className="text-xs font-semibold mb-2">Color Coding:</p>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--success)]"></div>
              <span>Green: &gt;50% balance remaining</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--warning)]"></div>
              <span>Yellow: 25-50% balance</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[var(--danger)]"></div>
              <span>Red: &lt;25% balance (low)</span>
            </div>
          </div>
        </div>
      </StepCard>

      <StepCard number={2} title="Deducting Leave">
        <p><strong>Example:</strong> Teacher took 2 days casual leave</p>
        <div className="mt-3 space-y-2">
          <p>1. Find staff row → Click <strong>"Manage"</strong></p>
          <p>2. Modal opens showing current balances</p>
          <p>3. Select: <strong>"Deduct Leave"</strong> (red button)</p>
          <p>4. Leave Type: <strong>Casual Leave</strong></p>
          <p>5. Days: <strong>2</strong> (or 0.5 for half-day)</p>
          <p>6. Reason: "Family function" (optional)</p>
          <p>7. Click <strong>"Deduct Leave"</strong></p>
        </div>

        <div className="mt-4">
          <strong className="text-xs">Result:</strong>
          <div className="space-y-1 mt-2">
            <CheckItem>Balance updates: 12 → 10</CheckItem>
            <CheckItem>Audit log created</CheckItem>
            <CheckItem>Staff can see updated balance in portal (future)</CheckItem>
          </div>
        </div>

        <InfoBox type="warning">
          <strong>Note:</strong> Cannot deduct more than available balance. 
          System will show error: "Insufficient Casual Leave balance"
        </InfoBox>
      </StepCard>

      <StepCard number={3} title="Crediting Leave">
        <p><strong>Example:</strong> Reward teacher with 2 extra earned leaves</p>
        <div className="mt-3 space-y-2">
          <p>1. Click <strong>"Manage"</strong> on staff</p>
          <p>2. Select: <strong>"Credit Leave"</strong> (green button)</p>
          <p>3. Leave Type: <strong>Earned Leave</strong></p>
          <p>4. Days: <strong>2</strong></p>
          <p>5. Reason: "Performance bonus / Carried forward from last year"</p>
          <p>6. Click <strong>"Credit Leave"</strong></p>
        </div>

        <InfoBox type="success">
          Balance can exceed policy limit when credited. 
          Example: Policy = 15 EL, After credit = 17 EL ✅
        </InfoBox>
      </StepCard>

      <StepCard number={4} title="Leave Types Explained">
        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-muted)]">
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Full Name</th>
              <th className="px-4 py-2 text-left">Purpose</th>
              <th className="px-4 py-2 text-left">Carry Forward</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            <tr>
              <td className="px-4 py-3 font-bold">CL</td>
              <td className="px-4 py-3">Casual Leave</td>
              <td className="px-4 py-3">Short personal work, festivals</td>
              <td className="px-4 py-3">No (lapse yearly)</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold">SL</td>
              <td className="px-4 py-3">Sick Leave</td>
              <td className="px-4 py-3">Medical (certificate if &gt;3 days)</td>
              <td className="px-4 py-3">No</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold">EL</td>
              <td className="px-4 py-3">Earned Leave</td>
              <td className="px-4 py-3">Vacation, planned breaks</td>
              <td className="px-4 py-3">Yes (up to 45 days)</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold">ML</td>
              <td className="px-4 py-3">Maternity Leave</td>
              <td className="px-4 py-3">Female staff (180 days paid)</td>
              <td className="px-4 py-3">No</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold">PL</td>
              <td className="px-4 py-3">Paternity Leave</td>
              <td className="px-4 py-3">Male staff (15 days paid)</td>
              <td className="px-4 py-3">No</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-bold">LWP</td>
              <td className="px-4 py-3">Leave Without Pay</td>
              <td className="px-4 py-3">When paid leaves exhausted</td>
              <td className="px-4 py-3">N/A</td>
            </tr>
          </tbody>
        </table>
      </StepCard>

      <StepCard number={5} title="Leave Policy Best Practices">
        <div className="space-y-3">
          <div>
            <strong className="text-sm">Casual Leave:</strong>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
              <li>Max 3 consecutive days without prior approval</li>
              <li>Can be taken on short notice</li>
              <li>Cannot be combined with other leave types</li>
            </ul>
          </div>
          <div>
            <strong className="text-sm">Sick Leave:</strong>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
              <li>Medical certificate mandatory if &gt;3 days</li>
              <li>Cannot be used for planned vacations</li>
              <li>May require fitness certificate to rejoin</li>
            </ul>
          </div>
          <div>
            <strong className="text-sm">Earned Leave:</strong>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
              <li>Apply 15 days in advance for approval</li>
              <li>Encashable on resignation (as per policy)</li>
              <li>Can be combined for long vacations</li>
            </ul>
          </div>
          <div>
            <strong className="text-sm">Leave Without Pay:</strong>
            <ul className="list-disc list-inside mt-1 text-sm space-y-1">
              <li>Salary deduction = (Monthly Salary / 26) × LWP days</li>
              <li>Requires management approval</li>
              <li>Affects service continuity</li>
            </ul>
          </div>
        </div>
      </StepCard>
    </div>
  )
}

function WorkflowsContent() {
  return (
    <div className="space-y-6">
      <InfoBox type="info">
        Common workflows that you'll encounter while managing HR & Payroll.
      </InfoBox>

      {/* Workflow 1 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--success-light)] flex items-center justify-center">
            <Users size={18} className="text-[var(--success)]" />
          </div>
          <h3 className="text-base font-bold">Workflow 1: New Staff Onboarding</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-24 font-semibold text-[var(--text-muted)]">Day 1:</div>
            <div className="space-y-1">
              <p>✓ Create user account (Teachers module if teaching staff)</p>
              <p>✓ Add HR record (HR module)</p>
              <p>✓ Leave balance initialized (12 CL / 10 SL / 15 EL)</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-24 font-semibold text-[var(--text-muted)]">Month End:</div>
            <div className="space-y-1">
              <p>✓ Staff appears in salary generation automatically</p>
              <p>✓ Pro-rata salary if joined mid-month (manual calculation)</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-24 font-semibold text-[var(--text-muted)]">Month 1+:</div>
            <div>
              <p>✓ Full salary from next month onwards</p>
            </div>
          </div>
        </div>

        <InfoBox type="success">
          <strong>Tip:</strong> For mid-month joiners, note joining date in admin notes. 
          System will show full month salary - manually adjust if needed.
        </InfoBox>
      </Card>

      {/* Workflow 2 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--danger-light)] flex items-center justify-center">
            <XCircle size={18} className="text-[var(--danger)]" />
          </div>
          <h3 className="text-base font-bold">Workflow 2: Staff Resignation</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-32 font-semibold text-[var(--text-muted)]">Notice Period:</div>
            <div className="space-y-1">
              <p>✓ Continue normal salary (1-3 months as per appointment letter)</p>
              <p>✓ Deduct any pending dues (advance, uniform, library books)</p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-32 font-semibold text-[var(--text-muted)]">Last Day:</div>
            <div className="space-y-1">
              <p>✓ Update Status: Active → Resigned</p>
              <p>✓ Set Relieving Date in staff record</p>
              <p>✓ Generate Full & Final Settlement:</p>
              <div className="ml-4 space-y-1">
                <p>• Salary till last working day</p>
                <p>• Encashed EL (if policy allows)</p>
                <p>• Deduct: Notice period shortfall (if any)</p>
                <p>• PF settlement (employer share - external process)</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-32 font-semibold text-[var(--text-muted)]">Post Exit:</div>
            <div className="space-y-1">
              <p>✓ Disable user account (Settings → Users)</p>
              <p>✓ Archive documents (download and store offline)</p>
              <p>✓ Issue relieving letter & experience certificate</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Workflow 3 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--warning-light)] flex items-center justify-center">
            <TrendingUp size={18} className="text-[var(--warning)]" />
          </div>
          <h3 className="text-base font-bold">Workflow 3: Salary Increment</h3>
        </div>

        <div className="space-y-3 text-sm">
          <p><strong>Scenario:</strong> Annual increment of 10%</p>
          
          <div className="space-y-2 mt-3">
            <p><strong>Steps:</strong></p>
            <div className="space-y-1 ml-4">
              <p>1. Go to Staff Directory</p>
              <p>2. Click on staff name (future: will have edit button)</p>
              <p>3. Update Basic Salary: ₹25,000 → ₹27,500 (10% increase)</p>
              <p>4. Save record</p>
            </div>
          </div>

          <div className="mt-3 p-3 bg-[var(--success-light)] rounded-[var(--radius-md)]">
            <p className="font-semibold text-sm text-[var(--success-dark)] mb-2">Auto-Calculations:</p>
            <div className="space-y-1 text-xs font-mono">
              <p>Old Basic: ₹25,000 → New Basic: ₹27,500</p>
              <p>Old HRA: ₹5,000 → New HRA: ₹5,500 (20%)</p>
              <p>Old DA: ₹3,750 → New DA: ₹4,125 (15%)</p>
              <p>Old Gross: ₹33,750 → New Gross: ₹37,125</p>
              <p>Old PF: ₹3,000 → New PF: ₹3,300 (12%)</p>
              <p className="font-bold pt-1 border-t border-[var(--success)]">Old Net: ₹30,750 → New Net: ₹33,825</p>
            </div>
          </div>

          <InfoBox type="info">
            <strong>Effect:</strong> Next month's salary will auto-calculate with new basic. 
            No need to regenerate old months.
          </InfoBox>
        </div>
      </Card>

      {/* Workflow 4 */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--primary-50)] flex items-center justify-center">
            <Award size={18} className="text-[var(--primary-500)]" />
          </div>
          <h3 className="text-base font-bold">Workflow 4: Promotion</h3>
        </div>

        <div className="space-y-3 text-sm">
          <p><strong>Scenario:</strong> TGT promoted to PGT</p>
          
          <div className="space-y-2 mt-3">
            <p><strong>Steps:</strong></p>
            <div className="space-y-1 ml-4">
              <p>1. Go to staff record</p>
              <p>2. Update Designation: "TGT Mathematics" → "PGT Mathematics"</p>
              <p>3. Update Basic Salary: ₹25,000 → ₹35,000 (promotion increment)</p>
              <p>4. Update Department (if changed): "Mathematics" → "Senior Wing"</p>
              <p>5. Update Grade/Level (if applicable): "Level-1" → "Level-2"</p>
              <p>6. Save record</p>
            </div>
          </div>

          <InfoBox type="success">
            <strong>Internal Note:</strong> Issue promotion letter separately (external to system). 
            Update effective from date in staff notes.
          </InfoBox>
        </div>
      </Card>
    </div>
  )
}

function ReportsContent() {
  return (
    <div className="space-y-6">
      <InfoBox type="info">
        HR module provides real-time analytics and reports for workforce management.
      </InfoBox>

      {/* Dashboard Stats */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart2 size={18} className="text-[var(--primary-500)]" />
          <h3 className="text-base font-bold">Dashboard Statistics</h3>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Top cards on HR module show key metrics:
        </p>

        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-muted)]">
            <tr>
              <th className="px-4 py-2 text-left">Stat</th>
              <th className="px-4 py-2 text-left">Meaning</th>
              <th className="px-4 py-2 text-left">Use Case</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            <tr>
              <td className="px-4 py-3 font-semibold">Total Staff</td>
              <td className="px-4 py-3">Active + Inactive count</td>
              <td className="px-4 py-3">Overall workforce size</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold">Active</td>
              <td className="px-4 py-3">Currently working staff</td>
              <td className="px-4 py-3">Payroll processing count</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold">Monthly Payroll</td>
              <td className="px-4 py-3">Sum of all net salaries</td>
              <td className="px-4 py-3">Budget planning & forecasting</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-semibold">Departments</td>
              <td className="px-4 py-3">Unique department count</td>
              <td className="px-4 py-3">Organization structure analysis</td>
            </tr>
          </tbody>
        </table>
      </Card>

      {/* Salary Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <DollarSign size={18} className="text-[var(--success)]" />
          <h3 className="text-base font-bold">Salary Summary Report</h3>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          After generating payroll, you get detailed breakdown:
        </p>

        <div className="p-4 bg-[var(--bg-muted)] rounded-[var(--radius-md)] font-mono text-xs space-y-2">
          <p className="font-bold">Month: January 2025</p>
          <p>Total Staff: 25</p>
          <p>Total Payout: ₹7,50,000</p>
          
          <div className="pt-2 border-t border-[var(--border)] space-y-1">
            <p className="font-semibold">Breakdown by Category:</p>
            <p className="ml-3">├─ Teaching Staff: ₹5,00,000 (15 staff)</p>
            <p className="ml-3">├─ Non-Teaching: ₹1,50,000 (6 staff)</p>
            <p className="ml-3">├─ Administration: ₹80,000 (3 staff)</p>
            <p className="ml-3">└─ Support: ₹20,000 (1 staff)</p>
          </div>

          <div className="pt-2 border-t border-[var(--border)] space-y-1">
            <p className="font-semibold">Total Deductions:</p>
            <p className="ml-3">├─ PF: ₹90,000</p>
            <p className="ml-3">├─ ESI: ₹5,625</p>
            <p className="ml-3">└─ Prof Tax: ₹4,000</p>
          </div>
        </div>

        <InfoBox type="success">
          <strong>Export:</strong> Take screenshot or manually export to Excel for management reporting
        </InfoBox>
      </Card>

      {/* Leave Reports */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Calendar size={18} className="text-[var(--warning)]" />
          <h3 className="text-base font-bold">Leave Reports (Manual Analysis)</h3>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Currently manual - export staff data and analyze in Excel:
        </p>

        <div className="space-y-3 text-sm">
          <div>
            <strong>Analysis 1: Department-wise Leave Usage</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Filter by department</li>
              <li>Check which dept has low CL balance</li>
              <li>Indicates workload or burnout</li>
            </ul>
          </div>

          <div>
            <strong>Analysis 2: Leave Exhaustion Pattern</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Staff with &lt;3 CL remaining → Monitor closely</li>
              <li>May indicate personal issues or health problems</li>
              <li>Proactive intervention needed</li>
            </ul>
          </div>

          <div>
            <strong>Analysis 3: LWP Tracking</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Staff with &gt;5 LWP days → Financial stress indicator</li>
              <li>Investigate and provide support if needed</li>
            </ul>
          </div>
        </div>

        <InfoBox type="info">
          <strong>Future:</strong> Auto-generated leave reports with charts coming soon
        </InfoBox>
      </Card>
    </div>
  )
}

function TroubleshootingContent() {
  return (
    <div className="space-y-6">
      <InfoBox type="warning">
        Common issues and their solutions. Read carefully before contacting support.
      </InfoBox>

      {/* Problem 1 */}
      <Card className="p-6 border-l-4 border-l-[var(--danger)]">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">
          Problem 1: Salary Not Generating
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-[var(--danger)]">Symptom:</strong>
            <p className="mt-1">Click "Generate Payroll" → No salary slips appear</p>
          </div>

          <div>
            <strong>Check These Points:</strong>
            <div className="space-y-1 mt-2 ml-4">
              <CheckItem>At least 1 active staff exists in system</CheckItem>
              <CheckItem>Month selected is valid (YYYY-MM format)</CheckItem>
              <CheckItem>Working days &gt;0 and &lt;32</CheckItem>
              <CheckItem>Browser console has no errors (Press F12)</CheckItem>
            </div>
          </div>

          <div>
            <strong className="text-[var(--success)]">Fix:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Refresh page (Ctrl+R)</li>
              <li>Try different month</li>
              <li>Clear browser cache</li>
              <li>If persists: Contact support with screenshot</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Problem 2 */}
      <Card className="p-6 border-l-4 border-l-[var(--warning)]">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">
          Problem 2: Notifications Not Sent
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-[var(--danger)]">Symptom:</strong>
            <p className="mt-1">Salary generated but "Notifications Sent: 0"</p>
          </div>

          <div>
            <strong>Check These Points:</strong>
            <div className="space-y-2 mt-2">
              <div className="ml-4">
                <CheckItem>Checkbox "Send notifications" was CHECKED before clicking generate</CheckItem>
              </div>
              <div className="ml-4">
                <p className="font-semibold mb-1">Settings → Modules → HR:</p>
                <div className="ml-4 space-y-1">
                  <CheckItem>Send Salary Slip Email: ON</CheckItem>
                  <CheckItem>Send Salary Slip SMS: ON</CheckItem>
                </div>
              </div>
              <div className="ml-4">
                <p className="font-semibold mb-1">Settings → Notifications:</p>
                <div className="ml-4 space-y-1">
                  <CheckItem>Quiet Hours: Disabled OR current time not in quiet period</CheckItem>
                </div>
              </div>
              <div className="ml-4">
                <p className="font-semibold mb-1">Message Credits:</p>
                <div className="ml-4 space-y-1">
                  <CheckItem>Balance &gt;0 for SMS (check top-right corner)</CheckItem>
                  <CheckItem>Email quota not exhausted</CheckItem>
                </div>
              </div>
            </div>
          </div>

          <div>
            <strong className="text-[var(--success)]">Fix:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Enable notification settings in both tabs</li>
              <li>Wait till quiet hours end (check current time)</li>
              <li>Purchase message credits if balance is 0</li>
              <li>Regenerate salary WITH notifications checked</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Problem 3 */}
      <Card className="p-6 border-l-4 border-l-[var(--primary-500)]">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">
          Problem 3: Wrong Salary Calculation
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-[var(--danger)]">Example:</strong>
            <p className="mt-1">Expected Net ₹30,000 but showing ₹28,000</p>
          </div>

          <div>
            <strong>Debug Steps:</strong>
            <div className="space-y-2 mt-2 ml-4">
              <p>1. Check Basic Salary entered correctly in staff record</p>
              <p>2. Go to Settings → Modules → HR and verify:</p>
              <div className="ml-4 space-y-1">
                <CheckItem>PF %: Should be 12% (not 15%)</CheckItem>
                <CheckItem>ESI: Should be OFF if salary &gt;₹21k</CheckItem>
                <CheckItem>Prof Tax: Should match your state rules</CheckItem>
              </div>
              <p>3. Verify Deductions column in salary table</p>
              <p>4. Manual calculation:</p>
            </div>
          </div>

          <div className="p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)] font-mono text-xs">
            <p>Basic: 25000</p>
            <p>HRA: 5000 (20%)</p>
            <p>DA: 3750 (15%)</p>
            <p className="pt-1 border-t border-[var(--border)]">Gross: 33750</p>
            <p className="pt-1 mt-1">PF: 3000 (12% of basic)</p>
            <p>ESI: 253 (0.75% of gross - if enabled)</p>
            <p className="pt-1 border-t border-[var(--border)]">Total Ded: 3253</p>
            <p className="pt-1 mt-1 font-bold">Net: 33750 - 3253 = 30497 ✅</p>
          </div>

          <div>
            <strong className="text-[var(--success)]">Fix:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Adjust settings to match your policy</li>
              <li>Verify basic salary in staff record</li>
              <li>Regenerate salary for the month</li>
              <li>If manual deductions needed: Note in system</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Problem 4 */}
      <Card className="p-6 border-l-4 border-l-[var(--info)]">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">
          Problem 4: Duplicate Employee ID Error
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-[var(--danger)]">Symptom:</strong>
            <p className="mt-1">Error: "Employee ID already exists"</p>
          </div>

          <div>
            <strong>Cause:</strong>
            <p className="mt-1">Trying to add EMP-001 when it's already used by another staff</p>
          </div>

          <div>
            <strong className="text-[var(--success)]">Fix:</strong>
            <div className="space-y-2 mt-2">
              <p>1. Check existing staff list</p>
              <p>2. Use different ID format:</p>
              <div className="ml-4 p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)] font-mono text-xs space-y-1">
                <p>EMP-XXX (generic)</p>
                <p>TCH-PGT-XXX (teaching PGT)</p>
                <p>TCH-TGT-XXX (teaching TGT)</p>
                <p>ADM-XXX (admin)</p>
                <p>SUP-XXX (support)</p>
              </div>
              <p>3. Maintain systematic naming for easy tracking</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Problem 5 */}
      <Card className="p-6 border-l-4 border-l-[var(--warning)]">
        <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">
          Problem 5: Invalid PAN/IFSC Format
        </h3>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-[var(--danger)]">Symptom:</strong>
            <p className="mt-1">Error: "Invalid PAN number format" or "Invalid IFSC code"</p>
          </div>

          <div>
            <strong>Correct Formats:</strong>
            <div className="p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)] font-mono text-xs mt-2">
              <p><strong>PAN:</strong> ABCDE1234F (5 letters + 4 digits + 1 letter)</p>
              <p className="mt-2"><strong>IFSC:</strong> SBIN0001234 (4 letters + 0 + 6 chars)</p>
            </div>
          </div>

          <div>
            <strong className="text-[var(--success)]">Fix:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Verify PAN from PAN card (check case - all UPPERCASE)</li>
              <li>Verify IFSC from bank passbook/cheque</li>
              <li>Use UPPERCASE only</li>
              <li>No spaces or special characters</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}

function BestPracticesContent() {
  return (
    <div className="space-y-6">
      <InfoBox type="success">
        Follow these practices to maintain smooth HR & Payroll operations.
      </InfoBox>

      {/* DO's */}
      <Card className="p-6 border-l-4 border-l-[var(--success)]">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle size={20} className="text-[var(--success)]" />
          <h3 className="text-base font-bold">DO's ✅</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="flex items-center gap-2">
              <span className="text-lg">1.</span>
              Generate salary 2-3 days before disbursement day
            </strong>
            <ul className="list-disc list-inside mt-1 ml-6 space-y-1 text-[var(--text-muted)]">
              <li>Gives time to verify calculations</li>
              <li>Fix errors before actual payment</li>
              <li>Staff get time to review payslips</li>
            </ul>
          </div>

          <div>
            <strong className="flex items-center gap-2">
              <span className="text-lg">2.</span>
              Keep Employee IDs systematic
            </strong>
            <div className="mt-1 ml-6 p-3 bg-[var(--bg-muted)] rounded-[var(--radius-md)] font-mono text-xs space-y-1">
              <p>Teaching: TCH-PGT-001, TCH-TGT-002</p>
              <p>Admin: ADM-001, ADM-002</p>
              <p>Support: SUP-001, SUP-002</p>
            </div>
          </div>

          <div>
            <strong className="flex items-center gap-2">
              <span className="text-lg">3.</span>
              Review salary slips before sending notifications
            </strong>
            <ul className="list-disc list-inside mt-1 ml-6 space-y-1 text-[var(--text-muted)]">
              <li>Generate WITHOUT notifications first</li>
              <li>Verify all calculations manually</li>
              <li>Check total payout matches budget</li>
              <li>Then regenerate WITH notifications</li>
            </ul>
          </div>

          <div>
            <strong className="flex items-center gap-2">
              <span className="text-lg">4.</span>
              Maintain leave register separately (Excel backup)
            </strong>
            <ul className="list-disc list-inside mt-1 ml-6 space-y-1 text-[var(--text-muted)]">
              <li>System tracks everything but backup is safe</li>
              <li>Export monthly leave data</li>
              <li>Useful for audits and compliance</li>
            </ul>
          </div>

          <div>
            <strong className="flex items-center gap-2">
              <span className="text-lg">5.</span>
              Update bank details regularly
            </strong>
            <ul className="list-disc list-inside mt-1 ml-6 space-y-1 text-[var(--text-muted)]">
              <li>Before NEFT/RTGS payment processing</li>
              <li>Verify IFSC codes are correct</li>
              <li>Keep account numbers up to date</li>
            </ul>
          </div>

          <div>
            <strong className="flex items-center gap-2">
              <span className="text-lg">6.</span>
              Archive old payslips properly
            </strong>
            <ul className="list-disc list-inside mt-1 ml-6 space-y-1 text-[var(--text-muted)]">
              <li>Download/print monthly payslips</li>
              <li>Store for 7 years (Income Tax requirement)</li>
              <li>Organize by year and month</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* DON'Ts */}
      <Card className="p-6 border-l-4 border-l-[var(--danger)]">
        <div className="flex items-center gap-3 mb-4">
          <XCircle size={20} className="text-[var(--danger)]" />
          <h3 className="text-base font-bold">DON'Ts ❌</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="flex items-center gap-2 text-[var(--danger)]">
              <span className="text-lg">1.</span>
              Don't change PF% mid-year without staff notice
            </strong>
            <p className="mt-1 ml-6 text-[var(--text-muted)]">
              PF changes need proper communication. Issue circular before changing settings.
            </p>
          </div>

          <div>
            <strong className="flex items-center gap-2 text-[var(--danger)]">
              <span className="text-lg">2.</span>
              Don't delete staff records
            </strong>
            <p className="mt-1 ml-6 text-[var(--text-muted)]">
              Mark as "Inactive" or "Resigned" instead. Maintain historical data for compliance.
            </p>
          </div>

          <div>
            <strong className="flex items-center gap-2 text-[var(--danger)]">
              <span className="text-lg">3.</span>
              Don't process same month twice without checking
            </strong>
            <p className="mt-1 ml-6 text-[var(--text-muted)]">
              Regenerating overwrites previous data. Always verify before regenerating.
            </p>
          </div>

          <div>
            <strong className="flex items-center gap-2 text-[var(--danger)]">
              <span className="text-lg">4.</span>
              Don't share payslip data externally
            </strong>
            <p className="mt-1 ml-6 text-[var(--text-muted)]">
              Salary information is confidential. Never share on WhatsApp groups or unsecured channels.
            </p>
          </div>

          <div>
            <strong className="flex items-center gap-2 text-[var(--danger)]">
              <span className="text-lg">5.</span>
              Don't enable notifications without testing first
            </strong>
            <p className="mt-1 ml-6 text-[var(--text-muted)]">
              Test with 1-2 staff first. Avoid sending wrong calculations to entire staff.
            </p>
          </div>
        </div>
      </Card>

      {/* Month-End Checklist */}
      <Card className="p-6 border-l-4 border-l-[var(--primary-500)]">
        <div className="flex items-center gap-3 mb-4">
          <CheckSquare size={20} className="text-[var(--primary-500)]" />
          <h3 className="text-base font-bold">Month-End Payroll Checklist</h3>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <strong className="text-[var(--primary-600)]">Before Month End:</strong>
            <div className="mt-2 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Verify all attendance marked (for LOP calculation)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Update any mid-month changes (increments, deductions)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Check leave applications approved/rejected</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Note any advances given to staff</span>
              </label>
            </div>
          </div>

          <div>
            <strong className="text-[var(--warning-dark)]">On Salary Processing Day:</strong>
            <div className="mt-2 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Go to HR & Payroll → Salary tab</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Select correct month (YYYY-MM)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Set working days (26 for full month)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Generate WITHOUT notifications</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Review all salary slips carefully</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Verify total payout matches budget</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Check PF/ESI calculations</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Regenerate WITH notifications (if all correct)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Download salary summary (screenshot/export)</span>
              </label>
            </div>
          </div>

          <div>
            <strong className="text-[var(--success-dark)]">After Processing:</strong>
            <div className="mt-2 space-y-2">
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Send summary to Principal/Management</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Process bank transfers (NEFT file - external)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>File payslips (digital + print)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Update accounts (debit salary expense)</span>
              </label>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-1" />
                <span>Deposit PF/ESI to government portals (external)</span>
              </label>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

function ComplianceContent() {
  return (
    <div className="space-y-6">
      <InfoBox type="warning">
        Compliance is critical for avoiding legal issues. Maintain proper documentation and meet deadlines.
      </InfoBox>

      {/* Documents to Maintain */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <FileText size={20} className="text-[var(--primary-500)]" />
          <h3 className="text-base font-bold">Documents to Maintain</h3>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <strong className="block mb-2">1. Employee Record File (per staff):</strong>
            <ul className="list-disc list-inside space-y-1 ml-4 text-[var(--text-muted)]">
              <li>Appointment letter (signed copy)</li>
              <li>Resume with passport-size photo</li>
              <li>ID proofs (Aadhar, PAN, Voter ID)</li>
              <li>Bank details (cancelled cheque)</li>
              <li>Educational qualification certificates</li>
              <li>Experience certificates from previous employer</li>
              <li>Relieving letter from last organization</li>
              <li>Medical fitness certificate (if required)</li>
              <li>Police verification (for sensitive roles)</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">2. Monthly Payroll Register:</strong>
            <ul className="list-disc list-inside space-y-1 ml-4 text-[var(--text-muted)]">
              <li>All salary slips (digital + print)</li>
              <li>Monthly summary sheet</li>
              <li>Bank transfer proof (NEFT receipt)</li>
              <li>Staff signatures (acknowledgment)</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">3. Leave Register:</strong>
            <ul className="list-disc list-inside space-y-1 ml-4 text-[var(--text-muted)]">
              <li>Leave applications (signed by staff)</li>
              <li>Approval records (signed by admin)</li>
              <li>Leave balance carry-forward sheet</li>
              <li>Medical certificates (for sick leave &gt; 3 days)</li>
            </ul>
          </div>

          <div>
            <strong className="block mb-2">4. Statutory Registers:</strong>
            <ul className="list-disc list-inside space-y-1 ml-4 text-[var(--text-muted)]">
              <li><strong>PF Register:</strong> ECR file for EPFO portal upload</li>
              <li><strong>ESI Register:</strong> Monthly challans & receipts</li>
              <li><strong>Professional Tax:</strong> State portal returns</li>
              <li><strong>Form 16:</strong> Annual tax statement (TDS)</li>
              <li><strong>Form 24Q:</strong> Quarterly TDS return</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Statutory Deadlines */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={20} className="text-[var(--danger)]" />
          <h3 className="text-base font-bold">Compliance Deadlines (Critical)</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-muted)]">
              <tr>
                <th className="px-4 py-2 text-left">Compliance</th>
                <th className="px-4 py-2 text-left">Deadline</th>
                <th className="px-4 py-2 text-left">Penalty for Delay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              <tr className="bg-[var(--danger-light)]">
                <td className="px-4 py-3 font-semibold">PF Deposit</td>
                <td className="px-4 py-3">15th of next month</td>
                <td className="px-4 py-3">12% interest + damages</td>
              </tr>
              <tr className="bg-[var(--warning-light)]">
                <td className="px-4 py-3 font-semibold">ESI Deposit</td>
                <td className="px-4 py-3">21st of next month</td>
                <td className="px-4 py-3">12% interest per annum</td>
              </tr>
              <tr className="bg-[var(--warning-light)]">
                <td className="px-4 py-3 font-semibold">Professional Tax</td>
                <td className="px-4 py-3">End of next month</td>
                <td className="px-4 py-3">State-specific fines</td>
              </tr>
              <tr className="bg-[var(--danger-light)]">
                <td className="px-4 py-3 font-semibold">TDS (Form 24Q)</td>
                <td className="px-4 py-3">Quarterly (within 30 days)</td>
                <td className="px-4 py-3">₹200/day + interest</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold">Form 16 (Annual)</td>
                <td className="px-4 py-3">15th June</td>
                <td className="px-4 py-3">₹500 per day per employee</td>
              </tr>
            </tbody>
          </table>
        </div>

        <InfoBox type="danger">
          <strong>Critical:</strong> Missing PF/ESI deadlines can lead to legal action. 
          Set calendar reminders 5 days before deadline.
        </InfoBox>
      </Card>

      {/* Audit Trail */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-[var(--success)]" />
          <h3 className="text-base font-bold">Audit Trail (Auto-Logged)</h3>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-4">
          System automatically logs all HR activities for compliance and security:
        </p>

        <div className="space-y-2 text-sm">
          <CheckItem>Who generated salary (admin name + user ID)</CheckItem>
          <CheckItem>When generated (exact timestamp)</CheckItem>
          <CheckItem>What changed (if salary regenerated for same month)</CheckItem>
          <CheckItem>Notification status (sent/failed with count)</CheckItem>
          <CheckItem>Leave deductions/credits with reason</CheckItem>
          <CheckItem>Staff record updates (salary increment, promotion)</CheckItem>
          <CheckItem>IP address of admin who made changes</CheckItem>
        </div>

        <div className="mt-4 p-3 bg-[var(--primary-50)] rounded-[var(--radius-md)]">
          <p className="text-xs font-semibold text-[var(--primary-700)] mb-2">
            Access Audit Logs:
          </p>
          <p className="text-xs text-[var(--primary-600)]">
            <strong>Settings → Data & Audit → Filter by "Staff"</strong>
          </p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            View complete history of all HR-related activities
          </p>
        </div>

        <InfoBox type="success">
          <strong>Audit Logs:</strong> Tamper-proof, timestamped records useful during 
          labor disputes or compliance audits.
        </InfoBox>
      </Card>

      {/* Data Security */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database size={20} className="text-[var(--info)]" />
          <h3 className="text-base font-bold">Data Security & Privacy</h3>
        </div>

        <div className="space-y-3 text-sm">
          <div>
            <strong className="text-[var(--success)]">System Security:</strong>
            <div className="space-y-1 mt-2 ml-4">
              <CheckItem>Encryption: Salary data encrypted at rest (AES-256)</CheckItem>
              <CheckItem>Access Control: Only Admin + assigned staff roles</CheckItem>
              <CheckItem>Audit Logs: Every action tracked with IP & timestamp</CheckItem>
              <CheckItem>Backup: Daily automatic backups (retained 30 days)</CheckItem>
              <CheckItem>Privacy: Staff data NEVER shared with third parties</CheckItem>
            </div>
          </div>

          <div>
            <strong className="text-[var(--danger)]">Your Responsibilities:</strong>
            <ul className="list-disc list-inside mt-2 ml-4 space-y-1 text-[var(--text-muted)]">
              <li>🔒 Don't share admin password with anyone</li>
              <li>🔒 Logout after salary processing (especially on shared computers)</li>
              <li>🔒 Download payslips to secure location only (not desktop)</li>
              <li>🔒 Don't screenshot and share on WhatsApp/Telegram groups</li>
              <li>🔒 Use strong password (min 8 chars, mix of letters/numbers/symbols)</li>
              <li>🔒 Enable 2FA (Two-Factor Authentication) if available</li>
            </ul>
          </div>
        </div>

        <InfoBox type="danger">
          <strong>Data Breach:</strong> Unauthorized sharing of salary data is a legal offense. 
          Can lead to termination and criminal charges.
        </InfoBox>
      </Card>

      {/* Retention Policy */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Archive size={20} className="text-[var(--warning)]" />
          <h3 className="text-base font-bold">Document Retention Policy</h3>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-[var(--bg-muted)]">
            <tr>
              <th className="px-4 py-2 text-left">Document Type</th>
              <th className="px-4 py-2 text-left">Retention Period</th>
              <th className="px-4 py-2 text-left">Legal Requirement</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            <tr>
              <td className="px-4 py-3">Salary Registers</td>
              <td className="px-4 py-3 font-semibold">7 years</td>
              <td className="px-4 py-3">Income Tax Act</td>
            </tr>
            <tr>
              <td className="px-4 py-3">PF Records</td>
              <td className="px-4 py-3 font-semibold">Permanent</td>
              <td className="px-4 py-3">EPF Act</td>
            </tr>
            <tr>
              <td className="px-4 py-3">ESI Records</td>
              <td className="px-4 py-3 font-semibold">6 years</td>
              <td className="px-4 py-3">ESI Act</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Leave Records</td>
              <td className="px-4 py-3 font-semibold">3 years</td>
              <td className="px-4 py-3">Shop & Est. Act</td>
            </tr>
            <tr>
              <td className="px-4 py-3">Form 16</td>
              <td className="px-4 py-3 font-semibold">Permanent</td>
              <td className="px-4 py-3">Employee reference</td>
            </tr>
          </tbody>
        </table>

        <InfoBox type="info">
          <strong>Tip:</strong> Create year-wise folders (HR_2024, HR_2025) and archive 
          documents systematically. Keep both digital and print copies.
        </InfoBox>
      </Card>
    </div>
  )
}