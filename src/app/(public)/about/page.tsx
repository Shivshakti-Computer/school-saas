import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { CTA } from '@/components/marketing/CTA'
import { Users, Target, Lightbulb, MapPin } from 'lucide-react'

export const metadata = {
  title: 'About Us',
  description: 'Learn about VidyaFlow — a modern school ERP platform built for Indian schools by Shivshakti Computer Academy.',
}

const values = [
  { icon: Target, title: 'Mission', desc: 'Make school management effortless for every school — big or small — across India.' },
  { icon: Lightbulb, title: 'Built for Speed', desc: 'Lightweight UI that works on low-end devices. No heavy frameworks, no bloat.' },
  { icon: Users, title: 'Multi-Tenant SaaS', desc: 'Each school gets isolated data, its own subdomain, and plan-based module access.' },
  { icon: MapPin, title: 'Made in India', desc: 'Designed for Indian school workflows — Hindi/English support, ₹ billing, CBSE/State board compatible.' },
]

const milestones = [
  { year: '2024', text: 'Platform development started — core modules built' },
  { year: '2024', text: 'Multi-tenant architecture with plan-based access control' },
  { year: '2025', text: 'Public launch with Starter, Growth, Pro, and Enterprise plans' },
  { year: '2025', text: 'PWA support, parent/student portals, school website builder' },
]


export default function AboutPage() {
  return (
    <>
      <div className="py-12">
        <Container>
          <SectionTitle
            eyebrow="About Us"
            title="Built by educators, for educators"
            subtitle="Shivshakti School Suite is a product of Shivshakti Computer Academy, Ambikapur. We understand the daily challenges schools face — and we built a platform to solve them."
          />

          {/* Story */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Our Story</h3>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                We started as a computer training academy in Ambikapur, Chhattisgarh. Over the years, we saw 
                schools around us struggle with paper registers, manual fee tracking, and disconnected parent 
                communication. Most existing software was either too expensive, too complex, or not built for 
                Indian school workflows.
              </p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                So we built Shivshakti School Suite — a modern, lightweight, cloud-based school management 
                platform that any school can start using in minutes. No installation, no hardware needed. Just 
                register, log in, and start managing your school.
              </p>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Today, our platform supports complete school operations: student management, attendance, fee 
                collection, exam results, website builder, parent portals, and 20+ modules — all accessible 
                based on your chosen plan.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <h3 className="text-lg font-extrabold text-slate-900 mb-4">Timeline</h3>
              <div className="space-y-4">
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-indigo-600 flex-shrink-0" />
                      {i < milestones.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
                    </div>
                    <div className="pb-4">
                      <span className="text-xs font-semibold text-indigo-600">{m.year}</span>
                      <p className="text-sm text-slate-700 mt-0.5">{m.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Values */}
          <div className="mt-14">
            <h3 className="text-lg font-extrabold text-slate-900 mb-6">What Drives Us</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {values.map(v => (
                <div key={v.title} className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-700">
                    <v.icon size={18} />
                  </div>
                  <h4 className="mt-3 text-sm font-extrabold text-slate-900">{v.title}</h4>
                  <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="mt-14 bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-lg font-extrabold text-slate-900">The Team</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              We are a small, focused team of developers and educators based in Chhattisgarh, India. 
              We believe in building products that are fast, reliable, and genuinely useful — not bloated 
              with features nobody uses.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              {['Full-Stack Development', 'UI/UX Design', 'School Operations', 'Customer Support'].map(s => (
                <span key={s} className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </div>
      <CTA />
    </>
  )
}