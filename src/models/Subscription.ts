// src/models/Subscription.ts

import mongoose, { Schema, Document } from 'mongoose'

export interface ISubscription extends Document {
    tenantId: mongoose.Types.ObjectId
    razorpaySubId: string
    razorpayCustomerId: string
    plan: 'starter' | 'pro' | 'enterprise'
    billingCycle: 'monthly' | 'yearly'
    amount: number
    status: 'created' | 'active' | 'paused' | 'cancelled' | 'expired'
    currentPeriodStart: Date
    currentPeriodEnd: Date
    cancelledAt?: Date
    cancelReason?: string
}

const SubscriptionSchema = new Schema<ISubscription>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    razorpaySubId: { type: String, required: true, unique: true },
    razorpayCustomerId: { type: String, required: true },
    plan: {
        type: String,
        enum: ['starter', 'pro', 'enterprise'],
        required: true,
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly'],
        required: true,
    },
    amount: { type: Number, required: true },
    status: {
        type: String,
        enum: ['created', 'active', 'paused', 'cancelled', 'expired'],
        default: 'created',
    },
    currentPeriodStart: { type: Date, required: true },
    currentPeriodEnd: { type: Date, required: true },
    cancelledAt: { type: Date },
    cancelReason: { type: String },
}, { timestamps: true })

export const Subscription =
    mongoose.models.Subscription ||
    mongoose.model<ISubscription>('Subscription', SubscriptionSchema)