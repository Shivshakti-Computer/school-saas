import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'
import { FAQSection } from '@/components/marketing/FAQSection'
import { CTA } from '@/components/marketing/CTA'

export const metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about VidyaFlow — pricing, features, trial, data security, and more.',
}
const extraFaqs = [
  { q: 'How do I register my school?', a: 'Click "Start free trial" on the homepage. Fill in your school name, phone number, and create a school code (subdomain). You will get instant access to the admin panel.' },
  { q: 'What happens after the trial ends?', a: 'After trial expires, all features are blocked. You can only access the subscription page to choose a plan. Your data remains safe — nothing is deleted.' },
  { q: 'Can I change my plan later?', a: 'Yes. You can upgrade or downgrade your plan anytime from the Subscription page inside the admin panel. Changes take effect immediately.' },
  { q: 'How many users can I add?', a: 'Each plan has student and teacher limits. Admin accounts are included. Parents and students get their own login portals automatically.' },
  { q: 'Is there a mobile app?', a: 'The platform is a Progressive Web App (PWA). It can be installed on any phone like a native app — no Play Store or App Store needed. Works offline for basic features too.' },
  { q: 'Can multiple schools use the same platform?', a: 'Yes. This is a multi-tenant SaaS platform. Each school gets its own isolated database, subdomain, and admin panel. Schools cannot see each other\'s data.' },
  { q: 'What payment methods are supported?', a: 'Schools can enable online fee payment using Razorpay (UPI, cards, netbanking). The platform subscription itself is also paid via Razorpay.' },
  { q: 'Can I export my data?', a: 'Yes. Reports, student lists, fee records, and attendance data can be exported as CSV/Excel from the admin panel (available on Growth plan and above).' },
  { q: 'Is my data secure?', a: 'Yes. We use encrypted connections (HTTPS), role-based access control, tenant isolation, and JWT-based authentication. Passwords are hashed with bcrypt.' },
  { q: 'Do you provide training?', a: 'Yes. We provide onboarding support via WhatsApp/call. We can also do screen-sharing sessions to help you set up your school.' },
  { q: 'What if I need a custom feature?', a: 'Contact us. For Enterprise plan customers, we offer custom module development and priority support.' },
  { q: 'Can parents see attendance and fees?', a: 'Yes. Parents get their own login portal where they can view attendance, fee status, exam results, and notices.' },
]

export default function FAQPage() {
  return (
    <>
      <div className="py-12">
        <Container>
          <SectionTitle
            eyebrow="FAQ"
            title="Frequently Asked Questions"
            subtitle="Everything you need to know before getting started. Can't find your answer? Contact us directly."
          />

          <div className="mt-8 grid grid-cols-1 gap-3 max-w-3xl">
            {extraFaqs.map((f, i) => (
              <details key={i} className="group bg-white border border-slate-200 rounded-2xl overflow-hidden">
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-extrabold text-slate-900">{f.q}</span>
                  <svg className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-5">
                  <p className="text-sm text-slate-600 leading-relaxed">{f.a}</p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-10 bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-3xl">
            <h3 className="text-sm font-extrabold text-slate-900">Still have questions?</h3>
            <p className="mt-2 text-sm text-slate-600">
              Reach out to us on WhatsApp or email. We typically respond within a few hours during business days.
            </p>
            <div className="mt-3 flex gap-3">
              <a href="/contact" className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors">
                Contact Us
              </a>
            </div>
          </div>
        </Container>
      </div>
      <CTA />
    </>
  )
}