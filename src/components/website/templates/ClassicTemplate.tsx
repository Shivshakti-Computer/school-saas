import { TemplateProps, WebsiteNav, WebsiteFooter, SectionRenderer, AnnouncementPopup } from './shared'

export function ClassicTemplate(props: TemplateProps) {
  const { school, website, currentPage, subdomain } = props
  const primary = website.primaryColor || '#1E40AF'
  const pages = (website.pages || []).filter((p: any) => p.enabled)
  const page = pages.find((p: any) => p.slug === currentPage) || pages[0]

  return (
    <div className="min-h-screen bg-white">
      <WebsiteNav {...props} style="dark" />

      {currentPage === 'home' && (
        <section className="bg-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%23ffffff'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
          <div className="relative max-w-6xl mx-auto px-4 py-20 md:py-32 text-center">
            {website.logo && <img src={website.logo} alt="" className="h-20 w-auto mx-auto mb-4" />}
            <h1 className="text-3xl md:text-5xl font-bold text-white">{school.name}</h1>
            <p className="mt-3 text-lg text-slate-300">{website.tagline}</p>
            <div className="mt-2 w-16 h-1 mx-auto rounded-full" style={{ background: primary }} />
            <p className="mt-6 text-sm text-slate-400 max-w-2xl mx-auto">{website.about?.slice(0, 200)}</p>
            <div className="mt-8 flex justify-center gap-3">
              {website.admissionOpen && (
                <a href={`/website/${subdomain}?page=admissions`} className="px-6 py-3 text-white font-semibold rounded-lg text-sm" style={{ background: primary }}>Admission Enquiry</a>
              )}
              <a href={`/website/${subdomain}?page=about`} className="px-6 py-3 border border-slate-600 text-slate-300 font-semibold rounded-lg text-sm hover:bg-slate-800">Learn More</a>
            </div>
          </div>
        </section>
      )}

      {currentPage !== 'home' && page && (
        <section className="bg-slate-900 py-14">
          <div className="max-w-6xl mx-auto px-4 text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-white">{page.title}</h1>
            <div className="mt-2 w-12 h-1 mx-auto rounded-full" style={{ background: primary }} />
          </div>
        </section>
      )}

      {page?.sections?.filter((s: any) => s.enabled).sort((a: any, b: any) => a.order - b.order).map((section: any) => (
        <SectionRenderer key={section.id} section={section} website={website} school={school} primary={primary} />
      ))}

      <WebsiteFooter {...props} style="dark" />
      <AnnouncementPopup website={website} />
    </div>
  )
}