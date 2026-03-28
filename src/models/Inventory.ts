import mongoose, { Schema, Document } from 'mongoose'

export interface IInventoryItem extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    category: string
    sku?: string
    quantity: number
    minStock: number
    unitPrice: number
    location?: string
    lastUpdated: Date
    updatedBy: mongoose.Types.ObjectId
}

const InventoryItemSchema = new Schema<IInventoryItem>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    sku: { type: String },
    quantity: { type: Number, required: true, default: 0 },
    minStock: { type: Number, default: 5 },
    unitPrice: { type: Number, default: 0 },
    location: { type: String },
    lastUpdated: { type: Date, default: Date.now },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

InventoryItemSchema.index({ tenantId: 1, category: 1 })
InventoryItemSchema.index({ tenantId: 1, name: 1 })

export const InventoryItem = mongoose.models.InventoryItem ||
    mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema)