// -------------------------------------------------------------
// FILE: src/components/website/ModernTemplate.tsx
// Modern template — bold design
// -------------------------------------------------------------

interface WebsiteProps {
    school: { name: string; address: string; phone: string; email: string; logo?: string }
    website: any
    subdomain: string
    loginUrl: string
}

// ─────────────────────────────────────────────
// MODERN TEMPLATE  (original — verified ✓)
// ─────────────────────────────────────────────
export function ModernTemplate({ school, website, loginUrl }: WebsiteProps) {
    const primary = website.primaryColor ?? '#4F46E5'
    const tagline = website.tagline ?? 'Excellence in Education'
    const about = website.about ?? ''
    const stats = website.stats ?? []
    const facilities = website.facilities ?? []
    const phone = website.phone || school.phone
    const email = website.email || school.email
    const address = website.address || school.address

    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: '#0F172A' }}>
            {/* Nav */}
            <nav style={{
                background: primary, padding: '14px 40px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {school.logo && (
                        <img src={school.logo} alt="Logo" style={{ height: '36px', borderRadius: '8px' }} />
                    )}
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>{school.name}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <a href="#about" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', textDecoration: 'none' }}>About</a>
                    <a href="#contact" style={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', textDecoration: 'none' }}>Contact</a>
                    <a href={loginUrl} style={{
                        background: 'white', color: primary, padding: '6px 16px',
                        borderRadius: '8px', fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                    }}>
                        Portal Login
                    </a>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                background: `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`,
                padding: '80px 40px', textAlign: 'center', color: 'white',
            }}>
                <h1 style={{ fontSize: '48px', fontWeight: 800, margin: '0 0 16px', lineHeight: 1.1 }}>
                    {school.name}
                </h1>
                <p style={{ fontSize: '20px', opacity: 0.9, margin: '0 0 32px' }}>{tagline}</p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {website.showAdmission !== false && (
                        <a href="#contact" style={{
                            background: 'white', color: primary, padding: '12px 28px',
                            borderRadius: '10px', fontWeight: 700, fontSize: '15px', textDecoration: 'none',
                        }}>
                            Apply for Admission
                        </a>
                    )}
                    <a href={loginUrl} style={{
                        background: 'rgba(255,255,255,0.2)', color: 'white',
                        padding: '12px 28px', borderRadius: '10px', fontWeight: 600,
                        fontSize: '15px', textDecoration: 'none', border: '1.5px solid rgba(255,255,255,0.4)',
                    }}>
                        Student / Parent Login
                    </a>
                </div>
            </section>

            {/* Stats */}
            {stats.length > 0 && (
                <section style={{
                    background: '#F8FAFC', padding: '48px 40px',
                    display: 'flex', gap: '40px', justifyContent: 'center', flexWrap: 'wrap',
                }}>
                    {stats.map((s: any, i: number) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <p style={{ fontSize: '40px', fontWeight: 800, color: primary, margin: 0 }}>{s.value}</p>
                            <p style={{ fontSize: '14px', color: '#64748B', margin: '4px 0 0' }}>{s.label}</p>
                        </div>
                    ))}
                </section>
            )}

            {/* About */}
            {about && (
                <section id="about" style={{ padding: '64px 40px', maxWidth: '800px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '16px', textAlign: 'center' }}>
                        About Us
                    </h2>
                    <p style={{ fontSize: '16px', color: '#475569', lineHeight: 1.8, textAlign: 'center' }}>
                        {about}
                    </p>
                </section>
            )}

            {/* Facilities */}
            {facilities.length > 0 && (
                <section style={{ background: '#F8FAFC', padding: '64px 40px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 700, textAlign: 'center', marginBottom: '32px' }}>
                        Our Facilities
                    </h2>
                    <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center',
                        maxWidth: '800px', margin: '0 auto',
                    }}>
                        {facilities.map((f: string, i: number) => (
                            <span key={i} style={{
                                background: 'white', border: `2px solid ${primary}22`,
                                color: primary, padding: '8px 20px', borderRadius: '40px',
                                fontSize: '14px', fontWeight: 500,
                            }}>
                                ✓ {f}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {/* Contact */}
            <section id="contact" style={{ padding: '64px 40px', textAlign: 'center' }}>
                <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '32px' }}>Contact Us</h2>
                <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {phone && (
                        <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '24px 32px', minWidth: '200px' }}>
                            <p style={{ fontSize: '24px', marginBottom: '8px' }}>📞</p>
                            <p style={{ fontWeight: 600, marginBottom: '4px' }}>Phone</p>
                            <a href={`tel:${phone}`} style={{ color: primary, textDecoration: 'none', fontSize: '15px' }}>{phone}</a>
                        </div>
                    )}
                    {email && (
                        <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '24px 32px', minWidth: '200px' }}>
                            <p style={{ fontSize: '24px', marginBottom: '8px' }}>✉️</p>
                            <p style={{ fontWeight: 600, marginBottom: '4px' }}>Email</p>
                            <a href={`mailto:${email}`} style={{ color: primary, textDecoration: 'none', fontSize: '15px' }}>{email}</a>
                        </div>
                    )}
                    {address && (
                        <div style={{ background: '#F8FAFC', borderRadius: '16px', padding: '24px 32px', minWidth: '200px' }}>
                            <p style={{ fontSize: '24px', marginBottom: '8px' }}>📍</p>
                            <p style={{ fontWeight: 600, marginBottom: '4px' }}>Address</p>
                            <p style={{ color: '#475569', fontSize: '14px', maxWidth: '200px' }}>{address}</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: '#0F172A', color: '#94A3B8', padding: '24px 40px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', margin: 0 }}>
                    © {new Date().getFullYear()} {school.name} · Powered by Shivshakti School Suite
                </p>
            </footer>
        </div>
    )
}