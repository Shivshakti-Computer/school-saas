import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI not defined')

let cached = (global as any).mongoose || { conn: null, promise: null }

export async function connectDB() {
    if (cached.conn) return cached.conn

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
            bufferCommands: false,
        })
    }

    cached.conn = await cached.promise
    return cached.conn
}

// MOST IMPORTANT FUNCTION — always use this in API routes
// Automatically adds tenantId to every query
export function withTenant(tenantId: string) {
    return {
        filter: (query: object) => ({ ...query, tenantId }),

        // Usage: const { filter } = withTenant(tenantId)
        // Student.find(filter({ class: "10A" }))
        // → Student.find({ class: "10A", tenantId: "xxx" })
    }
}