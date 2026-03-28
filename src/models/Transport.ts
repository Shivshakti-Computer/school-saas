import mongoose, { Schema, Document } from 'mongoose'

export interface IRoute extends Document {
    tenantId: mongoose.Types.ObjectId
    routeName: string
    routeNo: string
    busNo: string
    driverName: string
    driverPhone: string
    conductorName?: string
    conductorPhone?: string
    stops: Array<{
        name: string
        pickupTime: string
        dropTime: string
        fee: number
    }>
    capacity: number
    assignedStudents: mongoose.Types.ObjectId[]
    isActive: boolean
}

const RouteSchema = new Schema<IRoute>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    routeName: { type: String, required: true },
    routeNo: { type: String, required: true },
    busNo: { type: String, required: true },
    driverName: { type: String, required: true },
    driverPhone: { type: String, required: true },
    conductorName: { type: String },
    conductorPhone: { type: String },
    stops: [{
        name: { type: String, required: true },
        pickupTime: { type: String, required: true },
        dropTime: { type: String, required: true },
        fee: { type: Number, default: 0 },
    }],
    capacity: { type: Number, default: 40 },
    assignedStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
    isActive: { type: Boolean, default: true },
}, { timestamps: true })

RouteSchema.index({ tenantId: 1, routeNo: 1 }, { unique: true })

export const Route = mongoose.models.Route ||
    mongoose.model<IRoute>('Route', RouteSchema)