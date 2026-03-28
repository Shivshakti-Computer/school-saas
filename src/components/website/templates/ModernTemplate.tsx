import { TemplateProps, WebsiteNav, WebsiteFooter, SectionRenderer, AnnouncementPopup } from './shared'

export function ModernTemplate(props: TemplateProps) {
  const { school, website, currentPage, subdomain } = props
  const primary = website.primaryColor || '#4F46E5'
  const pages = (website.pages || []).filter((p: any) => p.enabled)
  const page = pages.find((p: any) => p.slug === currentPage) || pages[0]

  return (
    <div className="min-h-screen bg-white">
      <WebsiteNav {...props} style="light" />

      {/* Hero — home only */}
      {currentPage === 'home' && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primary}, ${primary}cc)` }} />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,white,transparent_50%)]" />
          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32">
            <div className="max-w-2xl">
              {website.admissionOpen && (
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-4 animate-pulse">
                  🎓 Admissions Open for New Session
                </span>
              )}
              <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
                {school.name}
              </h1>
              <p className="mt-4 text-lg text-white/90 font-medium">{website.tagline}</p>
              <p className="mt-3 text-sm text-white/70 max-w-lg leading-relaxed">
                {website.about?.slice(0, 200)}{website.about?.length > 200 ? '...' : ''}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {website.admissionOpen && (
                  <a href={`/website/${subdomain}?page=admissions`} className="px-6 py-3 bg-white font-semibold rounded-xl text-sm shadow-lg hover:shadow-xl transition-shadow" style={{ color: primary }}>
                    Apply for Admission
                  </a>
                )}
                <a href={`/website/${subdomain}?page=contact`} className="px-6 py-3 bg-white/20 text-white font-semibold rounded-xl text-sm hover:bg-white/30 transition-colors backdrop-blur-sm">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
          {/* Wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="white" className="w-full"><path d="M0,32L60,37.3C120,43,240,53,360,53.3C480,53,600,43,720,37.3C840,32,960,32,1080,37.3C1200,43,1320,53,1380,58.7L1440,64L1440,80L1380,80C1320,80,1200,80,1080,80C960,80,840,80,720,80C600,80,480,80,360,80C240,80,120,80,60,80L0,80Z" /></svg>
          </div>
        </section>
      )}

      {/* Page header for non-home pages */}
      {currentPage !== 'home' && page && (
        <section className="py-14" style={{ background: `linear-gradient(135deg, ${primary}15, ${primary}05)` }}>
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900">{page.title}</h1>
            <div className="mt-3 w-12 h-1 rounded-full mx-auto" style={{ background: primary }} />
          </div>
        </section>
      )}

      {/* Render page sections */}
      {page?.sections?.filter((s: any) => s.enabled).sort((a: any, b: any) => a.order - b.order).map((section: any) => (
        <SectionRenderer key={section.id} section={section} website={website} school={school} primary={primary} />
      ))}

      <WebsiteFooter {...props} style="dark" />
      <AnnouncementPopup website={website} />
    </div>
  )
}