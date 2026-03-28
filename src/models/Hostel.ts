import mongoose, { Schema, Document } from 'mongoose'

export interface IHostelRoom extends Document {
    tenantId: mongoose.Types.ObjectId
    hostelName: string
    roomNo: string
    floor: number
    type: 'single' | 'double' | 'dormitory'
    capacity: number
    occupants: mongoose.Types.ObjectId[]
    amenities: string[]
    monthlyFee: number
    isActive: boolean
}

const HostelRoomSchema = new Schema<IHostelRoom>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    hostelName: { type: String, required: true },
    roomNo: { type: String, required: true },
    floor: { type: Number, default: 0 },
    type: { type: String, enum: ['single', 'double', 'dormitory'], default: 'double' },
    capacity: { type: Number, required: true, default: 2 },
    occupants: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    amenities: [{ type: String }],
    monthlyFee: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

HostelRoomSchema.index({ tenantId: 1, hostelName: 1, roomNo: 1 }, { unique: true })

export const HostelRoom = mongoose.models.HostelRoom ||
    mongoose.model<IHostelRoom>('HostelRoom', HostelRoomSchema)

/* ── Mess Menu ── */
export interface IMessMenu extends Document {
    tenantId: mongoose.Types.ObjectId
    day: string
    meals: Array<{
        type: 'breakfast' | 'lunch' | 'snacks' | 'dinner'
        items: string[]
        time: string
    }>
}

const MessMenuSchema = new Schema<IMessMenu>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    day: { type: String, required: true },
    meals: [{
        type: { type: String, enum: ['breakfast', 'lunch', 'snacks', 'dinner'], required: true },
        items: [{ type: String }],
        time: { type: String, required: true },
    }]
}, { timestamps: true })

MessMenuSchema.index({ tenantId: 1, day: 1 }, { unique: true })

export const MessMenu = mongoose.models.MessMenu ||
    mongoose.model<IMessMenu>('MessMenu', MessMenuSchema)