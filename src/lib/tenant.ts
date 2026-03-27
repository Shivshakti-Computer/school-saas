import { School } from '@/models/School'
import { connectDB } from './db'
import { headers } from 'next/headers'

export async function getTenantFromRequest(req: Request): Promise<any> {
    const hostname = new URL(req.url).hostname
    return getTenantFromHostname(hostname)
}

export async function getTenantFromHostname(hostname: string): Promise<any> {
    await connectDB()

    const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'shivshakticloud.in'

    // Extract subdomain: stmarys.shivshakticloud.in → "stmarys"
    let subdomain = hostname.replace(`.${appDomain}`, '').replace(`www.`, '')

    // If it's the main domain or localhost, return null (superadmin/landing)
    if (subdomain === appDomain || subdomain === 'localhost' || subdomain === hostname) {
        return null
    }

    const school = await School.findOne({ subdomain, isActive: true })
    return school
}

// For server components
export async function getCurrentTenant() {
    const headersList = await headers()
    const hostname = headersList.get('host') || ''
    return getTenantFromHostname(hostname)
}