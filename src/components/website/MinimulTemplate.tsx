// =============================================================
// MINIMAL TEMPLATE
// Tone: Clean, modern, distraction-free
// Color: White bg + Deep slate (#0F172A) + Electric indigo (#6366F1)
// Font: DM Mono (accent labels) + Outfit (body/headings)
// Feel: EdTech startup, confident, brutally clean
// =============================================================

interface WebsiteProps {
    school: { name: string; address: string; phone: string; email: string; logo?: string }
    website: any
    subdomain: string
    loginUrl: string
}

export function MinimalTemplate({ school, website, loginUrl }: WebsiteProps) {
    const slate = '#0F172A'
    const accent = '#6366F1'
    const muted = '#64748B'
    const surface = '#F1F5F9'

    const tagline = website.tagline ?? 'Education, Reimagined.'
    const about = website.about ?? ''
    const stats = website.stats ?? []
    const facilities = website.facilities ?? []
    const phone = website.phone || school.phone
    const email = website.email || school.email
    const address = website.address || school.address

    const fontLink = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
  `

    return (
        <div style={{ fontFamily: "'Outfit', sans-serif", color: slate, background: 'white' }}>
            <style>{fontLink}</style>

            {/* ── Navigation ── */}
            <nav style={{
                padding: '20px 56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 50,
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid #E2E8F0',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {school.logo && (
                        <img src={school.logo} alt="Logo" style={{ height: '32px' }} />
                    )}
                    <span style={{ fontWeight: 700, fontSize: '16px', color: slate }}>{school.name}</span>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {['About', 'Contact'].map(link => (
                        <a
                            key={link}
                            href={`#${link.toLowerCase()}`}
                            style={{
                                color: muted, fontSize: '14px', fontWeight: 500,
                                textDecoration: 'none', padding: '8px 16px',
                                borderRadius: '8px',
                            }}
                        >
                            {link}
                        </a>
                    ))}
                    <a
                        href={loginUrl}
                        style={{
                            background: slate, color: 'white',
                            padding: '9px 20px', borderRadius: '8px',
                            fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                            letterSpacing: '0.01em',
                        }}
                    >
                        Login →
                    </a>
                </div>
            </nav>

            {/* ── Hero ── */}
            <section style={{
                padding: '120px 56px 100px',
                maxWidth: '1100px', margin: '0 auto',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '64px', alignItems: 'center',
            }}>
                <div>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                        background: `${accent}11`, borderRadius: '100px',
                        padding: '6px 14px', marginBottom: '24px',
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: accent }} />
                        <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '11px', color: accent,
                            fontWeight: 500, letterSpacing: '0.06em',
                        }}>
                            NOW ENROLLING
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: '52px', fontWeight: 800,
                        color: slate, margin: '0 0 16px',
                        lineHeight: 1.05, letterSpacing: '-0.02em',
                    }}>
                        {school.name}
                    </h1>

                    <p style={{
                        fontSize: '20px', color: muted,
                        fontWeight: 300, margin: '0 0 40px',
                        lineHeight: 1.6,
                    }}>
                        {tagline}
                    </p>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        {website.showAdmission !== false && (
                            <a href="#contact" style={{
                                background: accent, color: 'white',
                                padding: '13px 28px', borderRadius: '10px',
                                fontWeight: 600, fontSize: '15px',
                                textDecoration: 'none', letterSpacing: '-0.01em',
                            }}>
                                Apply Now
                            </a>
                        )}
                        <a href={loginUrl} style={{
                            background: surface, color: slate,
                            padding: '13px 28px', borderRadius: '10px',
                            fontWeight: 600, fontSize: '15px',
                            textDecoration: 'none', letterSpacing: '-0.01em',
                        }}>
                            Student Login
                        </a>
                    </div>
                </div>

                {/* Right side: Stats grid */}
                {stats.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                    }}>
                        {stats.map((s: any, i: number) => (
                            <div key={i} style={{
                                background: i % 2 === 0 ? slate : surface,
                                borderRadius: '16px',
                                padding: '32px 24px',
                            }}>
                                <p style={{
                                    fontSize: '40px', fontWeight: 800,
                                    color: i % 2 === 0 ? 'white' : accent,
                                    margin: '0 0 4px', letterSpacing: '-0.02em',
                                }}>
                                    {s.value}
                                </p>
                                <p style={{
                                    fontSize: '13px', fontWeight: 500,
                                    color: i % 2 === 0 ? '#94A3B8' : muted,
                                    margin: 0,
                                }}>
                                    {s.label}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Decorative block when no stats */
                    <div style={{
                        background: `linear-gradient(135deg, ${accent}18, ${accent}05)`,
                        borderRadius: '24px',
                        padding: '48px',
                        border: `1px solid ${accent}22`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {school.logo ? (
                            <img src={school.logo} alt="Logo" style={{ height: '100px', opacity: 0.6 }} />
                        ) : (
                            <p style={{
                                fontFamily: "'DM Mono', monospace",
                                color: `${accent}88`, fontSize: '13px', textAlign: 'center',
                            }}>
                                {school.name}
                            </p>
                        )}
                    </div>
                )}
            </section>

            {/* ── About ── */}
            {about && (
                <section id="about" style={{
                    background: surface,
                    padding: '80px 56px',
                }}>
                    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
                        <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '11px', color: accent,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            display: 'block', marginBottom: '12px',
                        }}>
                            01 — About
                        </span>
                        <h2 style={{
                            fontSize: '36px', fontWeight: 700,
                            color: slate, margin: '0 0 24px',
                            letterSpacing: '-0.02em',
                        }}>
                            Who we are
                        </h2>
                        <p style={{
                            fontSize: '17px', color: muted,
                            lineHeight: 1.9, margin: 0, fontWeight: 400,
                        }}>
                            {about}
                        </p>
                    </div>
                </section>
            )}

            {/* ── Facilities ── */}
            {facilities.length > 0 && (
                <section id="facilities" style={{ padding: '80px 56px' }}>
                    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                        <span style={{
                            fontFamily: "'DM Mono', monospace",
                            fontSize: '11px', color: accent,
                            letterSpacing: '0.1em', textTransform: 'uppercase',
                            display: 'block', marginBottom: '12px',
                        }}>
                            02 — Facilities
                        </span>
                        <h2 style={{
                            fontSize: '36px', fontWeight: 700,
                            color: slate, margin: '0 0 40px',
                            letterSpacing: '-0.02em',
                        }}>
                            Everything you need
                        </h2>
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: '10px',
                        }}>
                            {facilities.map((f: string, i: number) => (
                                <span key={i} style={{
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: '8px',
                                    padding: '10px 18px',
                                    fontSize: '14px', fontWeight: 500,
                                    color: slate,
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                }}>
                                    <span style={{
                                        width: '6px', height: '6px',
                                        borderRadius: '50%', background: accent,
                                        flexShrink: 0,
                                    }} />
                                    {f}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Contact ── */}
            <section id="contact" style={{
                background: slate, padding: '80px 56px',
            }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <span style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: '11px', color: `${accent}aa`,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        display: 'block', marginBottom: '12px',
                    }}>
                        03 — Contact
                    </span>
                    <h2 style={{
                        fontSize: '36px', fontWeight: 700,
                        color: 'white', margin: '0 0 48px',
                        letterSpacing: '-0.02em',
                    }}>
                        Let's connect
                    </h2>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        {[
                            { icon: '→', label: 'Phone', value: phone, href: `tel:${phone}` },
                            { icon: '→', label: 'Email', value: email, href: `mailto:${email}` },
                            { icon: '→', label: 'Address', value: address, href: undefined },
                        ].filter(c => c.value).map((c, i) => (
                            <div key={i} style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '24px 28px', flex: '1', minWidth: '200px',
                            }}>
                                <p style={{
                                    fontFamily: "'DM Mono', monospace",
                                    fontSize: '10px', color: `${accent}bb`,
                                    letterSpacing: '0.12em', textTransform: 'uppercase',
                                    margin: '0 0 10px',
                                }}>
                                    {c.label}
                                </p>
                                {c.href ? (
                                    <a href={c.href} style={{
                                        color: 'white', fontSize: '15px',
                                        textDecoration: 'none', fontWeight: 500,
                                    }}>
                                        {c.value}
                                    </a>
                                ) : (
                                    <p style={{
                                        color: '#94A3B8', fontSize: '14px',
                                        margin: 0, lineHeight: 1.6,
                                    }}>
                                        {c.value}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer style={{
                background: '#070E1A',
                padding: '24px 56px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                flexWrap: 'wrap', gap: '12px',
            }}>
                <p style={{ fontSize: '13px', color: '#334155', margin: 0 }}>
                    © {new Date().getFullYear()} {school.name}
                </p>
                <p style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: '11px', color: '#1E293B', margin: 0,
                }}>
                    Powered by Shivshakti School Suite
                </p>
            </footer>
        </div>
    )
}