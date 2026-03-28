// FILE: src/components/marketing/CTA.tsx

import Link from 'next/link'
import { Container } from './Container'
import { clsx } from 'clsx'

export function CTA() {
  return (
    <section className="section-padding">
      <Container>
        <div className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-gradient-to-br from-brand via-purple-600 to-brand-dark" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.15),transparent_60%)]" />
            <div
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage: 'radial-gradient(white 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              }}
            />
          </div>

          <div className="relative px-6 sm:px-10 lg:px-14 py-12 sm:py-16">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <span className="text-white font-extrabold text-sm">VF</span>
                </div>
                <div className="leading-tight">
                  <span className="text-sm font-bold text-white/90">VidyaFlow</span>
                  <span className="text-[10px] text-white/40 block">
                    by Shivshakti Computer Academy
                  </span>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight">
                Ready to digitize your school?
              </h2>

              <p className="mt-4 text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
                Start with a 14-day free trial — no credit card needed.
                Upgrade only when you&apos;re confident. We help you onboard quickly.
              </p>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
                {[
                  '14-day free trial',
                  'No credit card',
                  'Cancel anytime',
                  'Free onboarding support',
                ].map(item => (
                  <span key={item} className="flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                      <circle cx="8" cy="8" r="8" fill="rgba(255,255,255,0.1)" />
                      <path
                        d="M5 8l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity="0.6"
                      />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/register"
                  className={clsx(
                    'inline-flex items-center justify-center gap-2',
                    'px-7 py-3.5 rounded-xl',
                    'bg-white text-brand font-semibold text-[15px]',
                    'hover:bg-white/90 hover:shadow-lg hover:shadow-white/20',
                    'transition-all duration-200 hover:-translate-y-0.5'
                  )}
                >
                  Start Free Trial
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8h10M9 4l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>

                <Link
                  href="/contact"
                  className={clsx(
                    'inline-flex items-center justify-center gap-2',
                    'px-7 py-3.5 rounded-xl',
                    'bg-white/10 text-white font-semibold text-[15px]',
                    'border border-white/20 backdrop-blur-sm',
                    'hover:bg-white/15 hover:border-white/30',
                    'transition-all duration-200'
                  )}
                >
                  Talk to Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}