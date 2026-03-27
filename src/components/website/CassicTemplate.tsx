interface WebsiteProps {
    school: { name: string; address: string; phone: string; email: string; logo?: string }
    website: any
    subdomain: string
    loginUrl: string
}

// =============================================================
// CLASSIC TEMPLATE
// Tone: Traditional, trustworthy, prestigious
// Color: Deep navy (#1B2A4A) + Gold (#C9A84C)
// Font: Playfair Display (headings) + Lora (body)
// Feel: Old-school prestige, like a century-old institution
// =============================================================

export function ClassicTemplate({ school, website, loginUrl }: WebsiteProps) {
    const navy = '#1B2A4A'
    const gold = '#C9A84C'
    const cream = '#FDF8EF'

    const tagline = website.tagline ?? 'A Legacy of Excellence'
    const about = website.about ?? ''
    const stats = website.stats ?? []
    const facilities = website.facilities ?? []
    const phone = website.phone || school.phone
    const email = website.email || school.email
    const address = website.address || school.address

    const fontLink = `
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');
  `

    return (
        <div style={{ fontFamily: "'Lora', Georgia, serif", color: navy, background: 'white' }}>
            <style>{fontLink}</style>

            {/* ── Top Bar ── */}
            <div style={{
                background: navy, color: gold,
                padding: '8px 48px',
                display: 'flex', justifyContent: 'flex-end', gap: '24px',
                fontSize: '12px', letterSpacing: '0.05em',
            }}>
                {phone && <span>☎ {phone}</span>}
                {email && <span>✉ {email}</span>}
            </div>

            {/* ── Navigation ── */}
            <nav style={{
                background: cream,
                borderBottom: `3px solid ${gold}`,
                padding: '0 48px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 50,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 0' }}>
                    {school.logo && (
                        <img src={school.logo} alt="Logo" style={{ height: '52px' }} />
                    )}
                    <div>
                        <p style={{
                            fontFamily: "'Playfair Display', serif",
                            fontWeight: 700, fontSize: '20px',
                            color: navy, margin: 0, lineHeight: 1.2,
                        }}>
                            {school.name}
                        </p>
                        <p style={{ fontSize: '11px', color: gold, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                            Est. Since
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                    {['About', 'Facilities', 'Contact'].map(link => (
                        <a
                            key={link}
                            href={`#${link.toLowerCase()}`}
                            style={{
                                color: navy, fontSize: '13px', textDecoration: 'none',
                                letterSpacing: '0.08em', textTransform: 'uppercase',
                                fontFamily: "'Playfair Display', serif", fontWeight: 500,
                                borderBottom: '2px solid transparent',
                                paddingBottom: '2px',
                            }}
                        >
                            {link}
                        </a>
                    ))}
                    <a
                        href={loginUrl}
                        style={{
                            background: navy, color: gold,
                            padding: '8px 20px', fontSize: '12px',
                            letterSpacing: '0.08em', textTransform: 'uppercase',
                            fontWeight: 600, textDecoration: 'none',
                            fontFamily: "'Playfair Display', serif",
                        }}
                    >
                        Portal Login
                    </a>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section style={{
                background: `linear-gradient(160deg, ${navy} 60%, #2a3f6e 100%)`,
                padding: '100px 48px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Decorative lines */}
                <div style={{
                    position: 'absolute', top: '32px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '120px', height: '2px',
                    background: `linear-gradient(to right, transparent, ${gold}, transparent)`,
                }} />

                {school.logo && (
                    <img
                        src={school.logo}
                        alt="Logo"
                        style={{
                            height: '80px', marginBottom: '24px',
                            filter: 'brightness(0) invert(1)',
                            opacity: 0.9,
                        }}
                    />
                )}

                <h1 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '56px', fontWeight: 900,
                    color: 'white', margin: '0 0 8px',
                    lineHeight: 1.1,
                }}>
                    {school.name}
                </h1>

                {/* Gold ornamental divider */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', margin: '20px 0' }}>
                    <div style={{ width: '60px', height: '1px', background: gold }} />
                    <span style={{ color: gold, fontSize: '20px' }}>✦</span>
                    <div style={{ width: '60px', height: '1px', background: gold }} />
                </div>

                <p style={{
                    fontFamily: "'Lora', serif",
                    fontStyle: 'italic',
                    fontSize: '22px', color: `${gold}cc`,
                    margin: '0 0 40px',
                }}>
                    {tagline}
                </p>

                <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {website.showAdmission !== false && (
                        <a href="#contact" style={{
                            background: gold, color: navy,
                            padding: '14px 32px', fontWeight: 700,
                            fontSize: '14px', letterSpacing: '0.08em',
                            textTransform: 'uppercase', textDecoration: 'none',
                            fontFamily: "'Playfair Display', serif",
                        }}>
                            Apply for Admission
                        </a>
                    )}
                    <a href={loginUrl} style={{
                        background: 'transparent', color: gold,
                        padding: '14px 32px', fontWeight: 600,
                        fontSize: '14px', letterSpacing: '0.08em',
                        textTransform: 'uppercase', textDecoration: 'none',
                        border: `1.5px solid ${gold}66`,
                        fontFamily: "'Playfair Display', serif",
                    }}>
                        Student / Parent Login
                    </a>
                </div>

                <div style={{
                    position: 'absolute', bottom: '32px', left: '50%',
                    transform: 'translateX(-50%)',
                    width: '120px', height: '2px',
                    background: `linear-gradient(to right, transparent, ${gold}, transparent)`,
                }} />
            </section>

            {/* ── Stats ── */}
            {stats.length > 0 && (
                <section style={{
                    background: cream,
                    borderTop: `1px solid ${gold}44`,
                    borderBottom: `1px solid ${gold}44`,
                    padding: '52px 48px',
                    display: 'flex', gap: '48px',
                    justifyContent: 'center', flexWrap: 'wrap',
                }}>
                    {stats.map((s: any, i: number) => (
                        <div key={i} style={{ textAlign: 'center', position: 'relative' }}>
                            {i > 0 && (
                                <div style={{
                                    position: 'absolute', left: '-24px', top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '1px', height: '40px',
                                    background: `${gold}55`,
                                }} />
                            )}
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontSize: '44px', fontWeight: 900,
                                color: navy, margin: 0,
                            }}>
                                {s.value}
                            </p>
                            <p style={{
                                fontSize: '12px', color: gold,
                                margin: '6px 0 0',
                                letterSpacing: '0.12em', textTransform: 'uppercase',
                            }}>
                                {s.label}
                            </p>
                        </div>
                    ))}
                </section>
            )}

            {/* ── About ── */}
            {about && (
                <section id="about" style={{ padding: '80px 48px', maxWidth: '820px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <p style={{ color: gold, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                            Our Story
                        </p>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '36px', fontWeight: 700,
                            color: navy, margin: 0,
                        }}>
                            About Us
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '16px' }}>
                            <div style={{ width: '40px', height: '1px', background: gold }} />
                            <span style={{ color: gold }}>✦</span>
                            <div style={{ width: '40px', height: '1px', background: gold }} />
                        </div>
                    </div>
                    <p style={{
                        fontSize: '16px', color: '#334155',
                        lineHeight: 2, textAlign: 'center',
                        fontStyle: 'italic',
                    }}>
                        {about}
                    </p>
                </section>
            )}

            {/* ── Facilities ── */}
            {facilities.length > 0 && (
                <section id="facilities" style={{ background: cream, padding: '72px 48px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <p style={{ color: gold, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                            What We Offer
                        </p>
                        <h2 style={{
                            fontFamily: "'Playfair Display', serif",
                            fontSize: '32px', fontWeight: 700, color: navy, margin: 0,
                        }}>
                            Our Facilities
                        </h2>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '16px', maxWidth: '900px', margin: '0 auto',
                    }}>
                        {facilities.map((f: string, i: number) => (
                            <div key={i} style={{
                                background: 'white',
                                border: `1px solid ${gold}44`,
                                padding: '20px 24px',
                                display: 'flex', alignItems: 'center', gap: '12px',
                            }}>
                                <span style={{ color: gold, fontSize: '18px', flexShrink: 0 }}>✦</span>
                                <span style={{ fontSize: '14px', color: navy, fontWeight: 600, lineHeight: 1.4 }}>{f}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── Contact ── */}
            <section id="contact" style={{ padding: '72px 48px', textAlign: 'center' }}>
                <p style={{ color: gold, fontSize: '12px', letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                    Get in Touch
                </p>
                <h2 style={{
                    fontFamily: "'Playfair Display', serif",
                    fontSize: '32px', fontWeight: 700, color: navy, margin: '0 0 40px',
                }}>
                    Contact Us
                </h2>
                <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {[
                        { icon: '☎', label: 'Phone', value: phone, href: `tel:${phone}` },
                        { icon: '✉', label: 'Email', value: email, href: `mailto:${email}` },
                        { icon: '⚑', label: 'Address', value: address, href: undefined },
                    ].filter(c => c.value).map((c, i) => (
                        <div key={i} style={{
                            background: cream,
                            border: `1px solid ${gold}44`,
                            padding: '32px 40px', minWidth: '220px',
                        }}>
                            <p style={{ fontSize: '28px', color: gold, margin: '0 0 12px' }}>{c.icon}</p>
                            <p style={{
                                fontFamily: "'Playfair Display', serif",
                                fontWeight: 600, fontSize: '14px',
                                letterSpacing: '0.1em', textTransform: 'uppercase',
                                color: navy, margin: '0 0 8px',
                            }}>
                                {c.label}
                            </p>
                            {c.href ? (
                                <a href={c.href} style={{ color: gold, fontSize: '14px', textDecoration: 'none' }}>{c.value}</a>
                            ) : (
                                <p style={{ color: '#475569', fontSize: '13px', maxWidth: '180px', margin: '0 auto', lineHeight: 1.6 }}>{c.value}</p>
                            )}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{
                background: navy,
                padding: '32px 48px', textAlign: 'center',
                borderTop: `3px solid ${gold}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ width: '40px', height: '1px', background: `${gold}55` }} />
                    <span style={{ color: gold, fontSize: '14px' }}>✦</span>
                    <div style={{ width: '40px', height: '1px', background: `${gold}55` }} />
                </div>
                <p style={{ fontSize: '13px', color: `${gold}88`, margin: 0, letterSpacing: '0.05em' }}>
                    © {new Date().getFullYear()} {school.name} · Powered by Shivshakti School Suite
                </p>
            </footer>
        </div>
    )
}
