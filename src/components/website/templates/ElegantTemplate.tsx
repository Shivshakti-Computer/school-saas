import { TemplateProps, WebsiteNav, WebsiteFooter, SectionRenderer, AnnouncementPopup } from './shared'

export function ElegantTemplate(props: TemplateProps) {
  const { school, website, currentPage, subdomain } = props
  const primary = website.primaryColor || '#0F172A'
  const accent = website.secondaryColor || '#6366F1'
  const pages = (website.pages || []).filter((p: any) => p.enabled)
  const page = pages.find((p: any) => p.slug === currentPage) || pages[0]

  return (
    <div className="min-h-screen bg-white">
      <WebsiteNav {...props} style="light" />

      {currentPage === 'home' && (
        <section className="py-24 md:py-36">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              {website.admissionOpen && (
                <span className="inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold mb-6" style={{ borderColor: accent, color: accent }}>
                  ✦ Admissions Open
                </span>
              )}
              <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight">{school.name}</h1>
              <div className="mt-4 flex items-center justify-center gap-3">
                <div className="w-8 h-px bg-slate-300" />
                <p className="text-sm font-medium tracking-wider uppercase text-slate-500">{website.tagline}</p>
                <div className="w-8 h-px bg-slate-300" />
              </div>
              <p className="mt-6 text-base text-slate-600 leading-relaxed max-w-xl mx-auto">{website.about?.slice(0, 200)}</p>
              <div className="mt-8 flex justify-center gap-3">
                {website.admissionOpen && (
                  <a href={`/website/${subdomain}?page=admissions`} className="px-6 py-3 text-white font-semibold rounded-xl text-sm" style={{ background: primary }}>Apply Now</a>
                )}
                <a href={`/website/${subdomain}?page=about`} className="px-6 py-3 border border-slate-300 text-slate-700 font-semibold rounded-xl text-sm hover:bg-slate-50">Explore</a>
              </div>
            </div>
          </div>
        </section>
      )}

      {currentPage !== 'home' && page && (
        <section className="py-16 border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">{page.title}</h1>
            <div className="mt-3 flex items-center justify-center gap-3">
              <div className="w-8 h-px bg-slate-300" />
              <div className="w-2 h-2 rounded-full" style={{ background: accent }} />
              <div className="w-8 h-px bg-slate-300" />
            </div>
          </div>
        </section>
      )}

      {page?.sections?.filter((s: any) => s.enabled).sort((a: any, b: any) => a.order - b.order).map((section: any) => (
        <SectionRenderer key={section.id} section={section} website={website} school={school} primary={primary} />
      ))}

      <WebsiteFooter {...props} style="light" />
      <AnnouncementPopup website={website} />
    </div>
  )
}