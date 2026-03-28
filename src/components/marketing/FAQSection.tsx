'use client'
import { useState } from 'react'
import { Container } from './Container'
import { SectionTitle } from './MiniUI'
import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

const faqs = [
    { q: 'Is this an app or a website?', a: 'It is a web platform that also supports an installable app-like experience using PWA. No Play Store is required.' },
    { q: 'Can we start with trial?', a: 'Yes. Trial is available with limited modules. Upgrade anytime to unlock plan modules.' },
    { q: 'Can parents pay fees online?', a: 'Yes on eligible plans. Online fee payment can be enabled with the school’s own payment gateway settings.' },
    { q: 'Does it work on low-end phones?', a: 'Yes. The UI is lightweight and optimized for speed.' },
    { q: 'Can we export data?', a: 'Yes. Reports and exports are available on eligible plans.' },
]

export function FAQSection() {
    const [open, setOpen] = useState<number | null>(0)

    return (
        <div className="py-14 bg-slate-50 border-y border-slate-100">
            <Container>
                <SectionTitle
                    eyebrow="FAQ"
                    title="Questions schools ask before buying"
                    subtitle="If you still have questions, contact us and we will guide you."
                />

                <div className="mt-8 grid grid-cols-1 gap-3 max-w-3xl">
                    {faqs.map((f, i) => {
                        const isOpen = open === i
                        return (
                            <button
                                key={f.q}
                                onClick={() => setOpen(isOpen ? null : i)}
                                className="text-left bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-sm transition-shadow"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <div className="text-sm font-extrabold text-slate-900">{f.q}</div>
                                    <ChevronDown className={clsx("text-slate-400 transition-transform", isOpen && "rotate-180")} size={18} />
                                </div>
                                {isOpen && (
                                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                                        {f.a}
                                    </p>
                                )}
                            </button>
                        )
                    })}
                </div>
            </Container>
        </div>
    )
}