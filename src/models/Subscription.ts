// FILE: src/models/Subscription.ts
// UPDATED: Added scheduled cancel, refund tracking

import mongoose, { Schema, Document } from 'mongoose'

export interface IPaymentRecord {
  razorpayPaymentId: string
  razorpayOrderId: string
  amount: number
  currency: string
  method?: string
  status: 'captured' | 'failed' | 'refunded'
  paidAt: Date
  invoiceNumber?: string
  invoiceUrl?: string
}

export interface IRefundRecord {
  razorpayRefundId: string
  razorpayPaymentId: string
  amount: number
  status: 'pending' | 'processed' | 'failed'
  reason: string
  initiatedAt: Date
  processedAt?: Date
}

export interface ISubscription extends Document {
  tenantId: mongoose.Types.ObjectId
  razorpaySubId: string
  razorpayCustomerId: string
  plan: 'starter' | 'growth' | 'pro' | 'enterprise'
  billingCycle: 'monthly' | 'yearly'
  amount: number
  status: 'created' | 'active' | 'scheduled_cancel' | 'paused' | 'cancelled' | 'expired'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  // Cancel fields
  cancelledAt?: Date
  cancelReason?: string
  cancelFeedback?: string
  cancelCategory?: string
  scheduledCancelAt?: Date   // When it will actually cancel (period end)
  // Refund
  refundHistory: IRefundRecord[]
  refundEligible: boolean
  refundDeadline?: Date      // 30 days from purchase
  // Payment
  paymentHistory: IPaymentRecord[]
  invoiceCount: number
  lastPaymentAt?: Date
  upgradedFrom?: string
  isDemo: boolean
  metadata?: Record<string, any>
}

const PaymentRecordSchema = new Schema({
  razorpayPaymentId: { type: String, required: true },
  razorpayOrderId: { type: String, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { type: String },
  status: {
    type: String,
    enum: ['captured', 'failed', 'refunded'],
    default: 'captured',
  },
  paidAt: { type: Date, default: Date.now },
  invoiceNumber: { type: String },
  invoiceUrl: { type: String },
}, { _id: false })

const RefundRecordSchema = new Schema({
  razorpayRefundId: { type: String, required: true },
  razorpayPaymentId: { type: String, required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processed', 'failed'],
    default: 'pending',
  },
  reason: { type: String, required: true },
  initiatedAt: { type: Date, default: Date.now },
  processedAt: { type: Date },
}, { _id: false })

const SubscriptionSchema = new Schema<ISubscription>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'School',
    required: true,
    index: true,
  },
  razorpaySubId: { type: String, required: true },
  razorpayCustomerId: { type: String, required: true },
  plan: {
    type: String,
    enum: ['starter', 'growth', 'pro', 'enterprise'],
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
    enum: ['created', 'active', 'scheduled_cancel', 'paused', 'cancelled', 'expired'],
    default: 'created',
  },
  currentPeriodStart: { type: Date, required: true },
  currentPeriodEnd: { type: Date, required: true },
  // Cancel
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  cancelFeedback: { type: String },
  cancelCategory: { type: String },
  scheduledCancelAt: { type: Date },
  // Refund
  refundHistory: { type: [RefundRecordSchema], default: [] },
  refundEligible: { type: Boolean, default: false },
  refundDeadline: { type: Date },
  // Payment
  paymentHistory: { type: [PaymentRecordSchema], default: [] },
  invoiceCount: { type: Number, default: 0 },
  lastPaymentAt: { type: Date },
  upgradedFrom: { type: String },
  isDemo: { type: Boolean, default: false },
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true })

SubscriptionSchema.index({ tenantId: 1, status: 1 })
SubscriptionSchema.index({ currentPeriodEnd: 1 })
SubscriptionSchema.index({ status: 1, scheduledCancelAt: 1 })

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>('Subscription', SubscriptionSchema)