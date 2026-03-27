import mongoose, { Schema, Document } from 'mongoose'
import type { ModuleKey, Plan } from '@/lib/moduleRegistry'

// paymentSettings ka apna interface — clean aur reusable
export interface IPaymentSettings {
    razorpayKeyId?: string
    razorpayKeySecret?: string   // ⚠️  encrypt karke store karo (AES-256 etc.)
    enableOnlinePayment?: boolean
    paymentMethods?: string[] // ['upi', 'card', 'netbanking']
}

export interface ISchool extends Document {
    name: string
    subdomain: string          // unique — used as URL slug
    address: string
    phone: string
    email: string
    logo?: string              // Cloudinary URL
    plan: Plan
    trialEndsAt: Date
    subscriptionId?: string    // Razorpay subscription ID
    modules: ModuleKey[]       // manually enabled modules
    theme: {
        primary: string
        secondary: string
    }
    paymentSettings?: IPaymentSettings,
    isActive: boolean
    onboardingComplete: boolean
    createdAt: Date
    updatedAt: Date
}



const SchoolSchema = new Schema<ISchool>({
    name: { type: String, required: true },
    subdomain: { type: String, required: true, unique: true, lowercase: true },
    address: { type: String, default: '' },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    logo: { type: String },
    plan: { type: String, enum: ['starter', 'pro', 'enterprise'], default: 'starter' },
    trialEndsAt: { type: Date, required: true },
    subscriptionId: { type: String },
    modules: { type: [String], default: ['students', 'attendance', 'notices'] },
    theme: {
        primary: { type: String, default: '#534AB7' },
        secondary: { type: String, default: '#1D9E75' },
    },
    paymentSettings: {
        razorpayKeyId: { type: String },
        razorpayKeySecret: { type: String },
        enableOnlinePayment: { type: Boolean, default: false },
        paymentMethods: { type: [String], default: [] },
    },
    isActive: { type: Boolean, default: true },
    onboardingComplete: { type: Boolean, default: false },
}, { timestamps: true })

export const School = mongoose.models.School || mongoose.model<ISchool>('School', SchoolSchema)