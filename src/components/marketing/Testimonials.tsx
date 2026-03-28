import { Container } from './Container'
import { SectionTitle } from './MiniUI'

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Principal, Delhi Public School',
    quote: 'VidyaFlow made our attendance and fee tracking completely paperless. Parents love the transparency.',
  },
  {
    name: 'Sunita Sharma',
    role: 'Class Teacher',
    quote: 'Marking attendance and managing exam marks is simple. It works perfectly on my phone — no training needed.',
  },
  {
    name: 'Amit Patel',
    role: 'Parent',
    quote: 'I can check my child\'s attendance, fee status, and exam results without visiting the school. Very convenient.',
  },
]

export function Testimonials() {
  return (
    <div className="py-14">
      <Container>
        <SectionTitle
          eyebrow="Trust"
          title="Loved by schools that want speed and simplicity"
          subtitle="Designed for real school workflows. Built to run smoothly even on low-end devices."
        />

        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map(t => (
            <div key={t.quote} className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(s => (
                  <svg key={s} className="w-4 h-4 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">"{t.quote}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-extrabold text-slate-900">{t.name}</div>
                  <div className="text-slate-500 text-xs">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </div>
  )
}