import mongoose, { Schema, Document } from 'mongoose'

export interface IStop {
    name: string
    pickupTime: string   // "HH:MM"
    dropTime: string   // "HH:MM"
    fee: number   // monthly fee for this stop
    order: number   // sequence order
}

export interface IRoute extends Document {
    tenantId: mongoose.Types.ObjectId
    routeName: string
    routeNo: string
    busNo: string
    vehicleType: 'bus' | 'van' | 'auto'
    driverName: string
    driverPhone: string
    driverLicense?: string
    conductorName?: string
    conductorPhone?: string
    stops: IStop[]
    capacity: number
    assignedStudents: mongoose.Types.ObjectId[]
    isActive: boolean
    createdBy: mongoose.Types.ObjectId
    updatedBy?: mongoose.Types.ObjectId
    notes?: string
}

const StopSchema = new Schema<IStop>(
    {
        name: { type: String, required: true, trim: true, maxlength: 200 },
        pickupTime: {
            type: String, required: true,
            validate: {
                validator: (v: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
                message: 'pickupTime must be HH:MM',
            },
        },
        dropTime: {
            type: String, required: true,
            validate: {
                validator: (v: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(v),
                message: 'dropTime must be HH:MM',
            },
        },
        fee: { type: Number, default: 0, min: 0 },
        order: { type: Number, default: 0 },
    },
    { _id: false }
)

const RouteSchema = new Schema<IRoute>(
    {
        tenantId: {
            type: Schema.Types.ObjectId,
            ref: 'School',
            required: true,
            index: true,
        },
        routeName: { type: String, required: true, trim: true, maxlength: 200 },
        routeNo: { type: String, required: true, trim: true, maxlength: 20 },
        busNo: { type: String, required: true, trim: true, maxlength: 50 },
        vehicleType: {
            type: String,
            enum: ['bus', 'van', 'auto'],
            default: 'bus',
        },
        driverName: { type: String, required: true, trim: true },
        driverPhone: { type: String, required: true, trim: true },
        driverLicense: { type: String, trim: true, default: '' },
        conductorName: { type: String, trim: true, default: '' },
        conductorPhone: { type: String, trim: true, default: '' },
        stops: { type: [StopSchema], default: [] },
        capacity: { type: Number, default: 40, min: 1, max: 100 },
        assignedStudents: [{
            type: Schema.Types.ObjectId,
            ref: 'Student',
        }],
        isActive: { type: Boolean, default: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: { type: String, trim: true, maxlength: 500, default: '' },
    },
    { timestamps: true }
)

RouteSchema.index({ tenantId: 1, routeNo: 1 }, { unique: true })
RouteSchema.index({ tenantId: 1, isActive: 1 })

// Normalize stops order before save
RouteSchema.pre('save', function () {
    if (this.stops?.length) {
        this.stops = this.stops.map((s, i) => ({ ...s, order: i + 1 }))
    }
})

export const Route =
    mongoose.models.Route ||
    mongoose.model<IRoute>('Route', RouteSchema)