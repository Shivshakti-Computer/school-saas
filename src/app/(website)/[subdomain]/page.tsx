import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { notFound } from 'next/navigation'
import { ModernTemplate } from '@/components/website/templates/ModernTemplate'
import { ClassicTemplate } from '@/components/website/templates/ClassicTemplate'
import { ElegantTemplate } from '@/components/website/templates/ElegantTemplate'
import { getDefaultWebsite } from '@/lib/websiteDefault'

interface PageProps {
    params: Promise<{ subdomain: string }>
    searchParams: Promise<{ page?: string }>
}

export default async function SchoolWebsite({ params, searchParams }: PageProps) {
    const { subdomain } = await params
    const { page: currentPage } = await searchParams

    await connectDB()
    const school = await School.findOne({ subdomain, isActive: true }).lean() as any
    if (!school) return notFound()

    const website = school.website || getDefaultWebsite({
        name: school.name, address: school.address,
        phone: school.phone, email: school.email,
    })

    if (!website.isPublished) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto mb-4">
                        <span className="text-2xl">🏫</span>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900">{school.name}</h1>
                    <p className="text-slate-500 mt-2">Our website is coming soon. Please check back later.</p>
                    <div className="mt-6 text-sm text-slate-400 space-y-1">
                        {school.phone && <p>📞 {school.phone}</p>}
                        {school.email && <p>✉️ {school.email}</p>}
                    </div>
                </div>
            </div>
        )
    }

    const activePage = currentPage || 'home'
    const data = {
        school: { name: school.name, address: school.address, phone: school.phone, email: school.email, logo: school.logo },
        website,
        currentPage: activePage,
        subdomain,
    }

    const template = website.template || 'modern'
    if (template === 'classic') return <ClassicTemplate {...data} />
    if (template === 'elegant') return <ElegantTemplate {...data} />
    return <ModernTemplate {...data} />
}

export async function generateMetadata({ params }: PageProps) {
    const { subdomain } = await params
    await connectDB()
    const school = await School.findOne({ subdomain }).lean() as any

    return {
        title: school?.website?.seoTitle || school?.name || 'School',
        description: school?.website?.seoDescription || school?.website?.about?.slice(0, 160) || `${school?.name} - Official School Website`,
        openGraph: {
            title: school?.website?.seoTitle || school?.name,
            description: school?.website?.seoDescription || school?.website?.about?.slice(0, 160),
            images: school?.website?.logo ? [{ url: school.website.logo }] : [],
        },
    }
}