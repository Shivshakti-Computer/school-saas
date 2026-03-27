// -------------------------------------------------------------
// FILE: src/app/website/[subdomain]/page.tsx
// Public school website — subdomain se render hota hai
// -------------------------------------------------------------

import { NextRequest } from 'next/server'
import { connectDB } from '@/lib/db'
import { School } from '@/models/School'
import { notFound } from 'next/navigation'
import { ClassicTemplate } from '@/components/website/CassicTemplate'
import { MinimalTemplate } from '@/components/website/MinimulTemplate'
import { ModernTemplate } from '@/components/website/ModerTemplate'

export default async function SchoolWebsite({
    params,
}: { params: Promise<{ subdomain: string }> }) {
    const { subdomain } = await params

    await connectDB()
    const school = await School.findOne({
        subdomain,
        isActive: true,
    }).lean() as any

    if (!school) return notFound()

    const website = school.website ?? {}
    const data = {
        school: {
            name: school.name,
            address: school.address,
            phone: school.phone,
            email: school.email,
            logo: school.logo,
        },
        website,
        subdomain,
        loginUrl: `https://${subdomain}.${process.env.NEXT_PUBLIC_APP_DOMAIN}/login`,
    }

    const template = website.template ?? 'modern'

    if (template === 'classic') return <ClassicTemplate {...data} />
    if (template === 'minimal') return <MinimalTemplate {...data} />
    return <ModernTemplate {...data} />
}

// Generate metadata for SEO
export async function generateMetadata({
    params,
}: { params: Promise<{ subdomain: string }> }) {
    const { subdomain } = await params
    await connectDB()
    const school = await School.findOne({ subdomain }).lean() as any

    return {
        title: school?.name ?? 'School',
        description: school?.website?.about ?? 'School website',
    }
}