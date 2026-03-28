import Link from 'next/link'
import { Container } from './Container'

export function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <Container>
        <div className="py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-extrabold flex items-center justify-center text-xs">
                VF
              </div>
              <span className="text-sm font-extrabold text-slate-900">VidyaFlow</span>
            </div>
            <p className="mt-3 text-sm text-slate-600 leading-relaxed">
              Complete school management platform: website, portals, fees, exams, reports, and mobile app experience.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              A unit of Shivshakti Computer Academy
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Product</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link className="block text-slate-600 hover:text-slate-900" href="/features">Features</Link>
              <Link className="block text-slate-600 hover:text-slate-900" href="/modules">Modules</Link>
              <Link className="block text-slate-600 hover:text-slate-900" href="/pricing">Pricing</Link>
              <Link className="block text-slate-600 hover:text-slate-900" href="/security">Security</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Company</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link className="block text-slate-600 hover:text-slate-900" href="/about">About</Link>
              <Link className="block text-slate-600 hover:text-slate-900" href="/contact">Contact</Link>
              <Link className="block text-slate-600 hover:text-slate-900" href="/faq">FAQ</Link>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Legal</p>
            <div className="mt-3 space-y-2 text-sm">
              <Link className="block text-slate-600 hover:text-slate-900" href="/privacy">Privacy Policy</Link>
              <Link className="block text-slate-600 hover:text-slate-900" href="/terms">Terms</Link>
              <Link className="block text-slate-600 hover:text-slate-900" href="/refund">Refund & Cancellation</Link>
            </div>
          </div>
        </div>

        <div className="py-6 border-t border-slate-100 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} VidyaFlow — A unit of Shivshakti Computer Academy. All rights reserved.
          </p>
          <p className="text-xs text-slate-500">
            Support: WhatsApp / Call: +91-XXXXXXXXXX
          </p>
        </div>
      </Container>
    </footer>
  )
}