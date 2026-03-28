import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { Shield, Lock, Eye, Server, Key, Users, Database, AlertTriangle } from 'lucide-react'

export const metadata = {
  title: 'Security',
  description: 'Learn about VidyaFlow security measures — encryption, access control, tenant isolation, and more.',
}

const securityFeatures = [
  {
    icon: Lock,
    title: 'Encrypted Connections',
    desc: 'All data transmitted between your browser and our servers is encrypted using TLS/HTTPS. No data travels in plain text.',
  },
  {
    icon: Key,
    title: 'Secure Authentication',
    desc: 'Passwords are hashed using bcrypt. Sessions use JWT tokens with automatic refresh every 30 seconds to detect plan/subscription changes.',
  },
  {
    icon: Users,
    title: 'Role-Based Access Control',
    desc: 'Four distinct roles: Admin, Teacher, Student, Parent. Each role can only access its own routes and data. Cross-role access is blocked at middleware level.',
  },
  {
    icon: Database,
    title: 'Multi-Tenant Data Isolation',
    desc: 'Each school\'s data is isolated using tenant IDs. School A cannot access School B\'s students, fees, or any data — enforced at database query level.',
  },
  {
    icon: Shield,
    title: 'Plan-Based Module Locking',
    desc: 'Modules are locked/unlocked based on subscription plan. Even if a URL is manually typed, middleware blocks access to modules not included in the current plan.',
  },
  {
    icon: Eye,
    title: 'Subscription Expiry Enforcement',
    desc: 'When a subscription expires, all features are immediately blocked — both UI pages and API endpoints return 403. Only the subscription page remains accessible.',
  },
  {
    icon: Server,
    title: 'Cloud Infrastructure',
    desc: 'Hosted on modern cloud infrastructure with automatic backups, monitoring, and uptime guarantees. Database hosted on MongoDB Atlas with encryption at rest.',
  },
  {
    icon: AlertTriangle,
    title: 'Trial Restrictions',
    desc: 'Trial accounts get access to only Starter-level modules. Advanced features like Fees, Exams, Library, HR are locked until a paid plan is activated.',
  },
]

export default function SecurityPage() {
  return (
    <>
      <div className="py-12">
        <Container>
          <SectionTitle
            eyebrow="Security"
            title="Your school data is safe with us"
            subtitle="We take data security seriously. Here's how we protect your information at every level."
          />

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {securityFeatures.map(f => (
              <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <f.icon size={18} />
                </div>
                <h3 className="mt-3 text-sm font-extrabold text-slate-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Architecture Overview */}
          <div className="mt-14 bg-slate-50 border border-slate-200 rounded-2xl p-6">
            <h3 className="text-lg font-extrabold text-slate-900">Security Architecture</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Frontend</p>
                <p className="mt-2 text-sm text-slate-700">Next.js with server-side rendering. No sensitive data exposed to client. JWT stored in HTTP-only cookies.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Middleware</p>
                <p className="mt-2 text-sm text-slate-700">Edge middleware validates every request — checks authentication, role, plan, subscription status, and module access before any page or API loads.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Database</p>
                <p className="mt-2 text-sm text-slate-700">MongoDB Atlas with tenant-level isolation. Every query is scoped to the logged-in school. Encryption at rest enabled.</p>
              </div>
            </div>
          </div>

          {/* Compliance */}
          <div className="mt-8 bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-lg font-extrabold text-slate-900">Data Handling Practices</h3>
            <ul className="mt-4 space-y-3">
              {[
                'We do not sell, share, or trade school data with any third party.',
                'School data is only accessible by the school\'s own admin and authorized staff.',
                'Superadmin access is limited to platform management — not individual school data.',
                'Payment information is handled by Razorpay — we do not store card/UPI details.',
                'You can request data export or deletion by contacting support.',
                'We retain data for the duration of your subscription + 90 days grace period.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Shield size={14} className="text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </div>
      <CTA />
    </>
  )
}