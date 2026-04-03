// FILE: src/models/CreditTransaction.ts
// Every credit add/deduct logged here
// ═══════════════════════════════════════════════════════════

import mongoose, { Schema, Document } from 'mongoose'

export type TransactionType =
    | 'monthly_grant'      // Free credits given each month
    | 'trial_grant'        // Trial credits
    | 'upgrade_grant'
    | 'pack_purchase'      // School bought a credit pack
    | 'addon_purchase'     // School bought extra students/teachers
    | 'message_deduct'     // Credits used for messaging
    | 'refund_credit'      // Credits refunded on cancellation
    | 'admin_adjust'       // Superadmin manual adjustment
    | 'rollover'           // Credits carried from last month
    | 'expired'            // Credits that expired

export interface ICreditTransaction extends Document {
    tenantId: mongoose.Types.ObjectId
    type: TransactionType
    amount: number              // Positive = added, Negative = deducted
    balanceBefore: number
    balanceAfter: number
    description: string
    // For pack purchases
    packId?: string
    orderId?: string
    razorpayPaymentId?: string
    amountPaid?: number         // ₹ paid
    // For message deductions
    messageLogId?: mongoose.Types.ObjectId
    channel?: string
    purpose?: string
    // For admin adjustments
    adjustedBy?: string
    adjustmentReason?: string
    createdAt: Date
}

const CreditTransactionSchema = new Schema<ICreditTransaction>({
    tenantId: {
        type: Schema.Types.ObjectId,
        ref: 'School',
        required: true,
        index: true,
    },
    type: {
        type: String,
        enum: [
            'monthly_grant', 'trial_grant', 'pack_purchase',
            'addon_purchase', 'message_deduct', 'refund_credit',
            'admin_adjust', 'rollover', 'expired',
        ],
        required: true,
    },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true },
    packId: { type: String },
    orderId: { type: String },
    razorpayPaymentId: { type: String },
    amountPaid: { type: Number },
    messageLogId: { type: Schema.Types.ObjectId, ref: 'MessageLog' },
    channel: { type: String },
    purpose: { type: String },
    adjustedBy: { type: String },
    adjustmentReason: { type: String },
}, { timestamps: true })

CreditTransactionSchema.index({ tenantId: 1, createdAt: -1 })
CreditTransactionSchema.index({ tenantId: 1, type: 1 })

export const CreditTransaction =
    mongoose.models.CreditTransaction ||
    mongoose.model<ICreditTransaction>('CreditTransaction', CreditTransactionSchema)