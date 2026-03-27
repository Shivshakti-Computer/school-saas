// =============================================================
// FILE: src/app/contact/page.tsx
// =============================================================
"use client"


import Link from "next/link";

export default function ContactPage() {
    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0A0F1E', color: 'white', minHeight: '100vh' }}>
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap'); .jakarta{font-family:'Plus Jakarta Sans',sans-serif}`}</style>

            <nav style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }} className="jakarta">← Shivshakti School Suite</Link>
                <Link href="/register" style={{ background: '#4F46E5', color: 'white', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Free Trial</Link>
            </nav>

            <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px' }}>
                <p style={{ fontSize: 12, color: '#818CF8', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>CONTACT</p>
                <h1 className="jakarta" style={{ fontSize: 48, fontWeight: 800, margin: '0 0 16px' }}>Baat Karein</h1>
                <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 48, fontSize: 16 }}>
                    Hindi mein support available hai. WhatsApp preferred.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {[
                        { icon: '💬', label: 'WhatsApp (Preferred)', value: '+91 74770 36832', href: 'https://wa.me/917477036832', note: 'Mon–Sat, 9AM–6PM' },
                        { icon: '📞', label: 'Phone', value: '+91 74770 36832', href: 'tel:+917477036832', note: '' },
                        { icon: '📞', label: 'Phone 2', value: '+91 90090 87883', href: 'tel:+919009087883', note: '' },
                        { icon: '✉️', label: 'Email', value: 'shivshakticomputeracademy25@gmail.com', href: 'mailto:shivshakticomputeracademy25@gmail.com', note: '' },
                        { icon: '📍', label: 'Address', value: '1st Floor, Above Usha Matching Center, Near Babra Petrol Pump, Banaras Road, Phunderdihari, Ambikapur – 497001', href: '', note: '' },
                    ].map(c => (
                        <div key={c.label} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                            <span style={{ fontSize: 24, flexShrink: 0 }}>{c.icon}</span>
                            <div>
                                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', margin: '0 0 4px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{c.label}</p>
                                {c.href ? (
                                    <a href={c.href} style={{ color: '#818CF8', fontSize: 15, textDecoration: 'none' }}>{c.value}</a>
                                ) : (
                                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.5 }}>{c.value}</p>
                                )}
                                {c.note && <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', margin: '3px 0 0' }}>{c.note}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}