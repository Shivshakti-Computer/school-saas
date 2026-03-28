import { School } from '@/models/School'
import { connectDB } from './db'

/**
 * Find school by school code (subdomain field)
 * Used in: school website rendering, API lookups
 */
export async function getSchoolByCode(code: string) {
    await connectDB()
    const school = await School.findOne({
        subdomain: code.toLowerCase().trim(),
        isActive: true,
    }).lean()
    return school
}

/**
 * Find school by MongoDB _id
 * Used in: API routes with session.user.tenantId
 */
export async function getSchoolById(id: string) {
    await connectDB()
    const school = await School.findById(id).lean()
    return school
}