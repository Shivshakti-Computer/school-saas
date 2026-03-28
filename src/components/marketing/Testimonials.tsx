// FILE: src/components/marketing/Testimonials.tsx

import { Container } from './Container'
import { SectionTitle } from './MiniUI'

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Principal, Delhi Public School',
    quote:
      'VidyaFlow made our attendance and fee tracking completely paperless. Parents love the transparency and our staff saves hours every week.',
    rating: 5,
    tag: 'Admin Experience',
  },
  {
    name: 'Sunita Sharma',
    role: 'Class Teacher',
    quote:
      'Marking attendance and managing exam marks is simple. It works perfectly on my phone — no training needed for teachers.',
    rating: 5,
    tag: 'Teacher Friendly',
  },
  {
    name: 'Amit Patel',
    role: 'Parent',
    quote:
      'I can check my child’s attendance, fee status, and exam results without visiting the school. Very convenient and fast.',
    rating: 5,
    tag: 'Parent Trust',
  },
]

function StarRating({ count = 5 }: { count?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="w-4 h-4 text-amber-400"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

export function Testimonials() {
  return (
    <section id="testimonials" className="section-padding relative">
      <Container>
        <SectionTitle
          eyebrow="✦ Trusted by Schools"
          title="Loved by schools that want speed and simplicity"
          subtitle="Designed for real school workflows. Built to run smoothly even on low-end devices and busy school environments."
        />

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { value: '4.8/5', label: 'Average Rating' },
            { value: '95%', label: 'Parent Satisfaction' },
            { value: '60%', label: 'Less Manual Work' },
            { value: '2 hrs/day', label: 'Time Saved' },
          ].map((stat) => (
            <div key={stat.label} className="card-dark p-4 text-center">
              <div className="text-xl sm:text-2xl font-extrabold text-white">{stat.value}</div>
              <div className="text-[11px] sm:text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, index) => (
            <div key={t.quote} className="card-dark p-5 flex flex-col relative overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />

              <div className="mb-4">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  {t.tag}
                </span>
              </div>

              <div className="mb-3 text-3xl leading-none text-brand/40">“</div>

              <StarRating count={t.rating} />

              <p className="mt-4 text-sm text-slate-300 leading-relaxed flex-1">
                {t.quote}
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm text-white ${
                    index === 0
                      ? 'bg-gradient-to-br from-brand to-purple-500'
                      : index === 1
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                      : 'bg-gradient-to-br from-amber-500 to-orange-500'
                  }`}
                >
                  {t.name.charAt(0)}
                </div>

                <div>
                  <div className="text-sm font-bold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}