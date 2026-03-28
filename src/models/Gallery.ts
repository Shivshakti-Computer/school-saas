import mongoose, { Schema, Document } from 'mongoose'

export interface IGalleryAlbum extends Document {
    tenantId: mongoose.Types.ObjectId
    name: string
    description: string
    coverImage?: string
    images: Array<{ url: string; caption?: string; uploadedAt: Date }>
    isPublic: boolean
    createdBy: mongoose.Types.ObjectId
}

const GalleryAlbumSchema = new Schema<IGalleryAlbum>({
    tenantId: { type: Schema.Types.ObjectId, ref: 'School', required: true, index: true },
    name: { type: String, required: true },
    description: { type: String },
    coverImage: { type: String },
    images: [{
        url: { type: String, required: true },
        caption: { type: String },
        uploadedAt: { type: Date, default: Date.now },
    }],
    isPublic: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

GalleryAlbumSchema.index({ tenantId: 1, createdAt: -1 })

export const GalleryAlbum = mongoose.models.GalleryAlbum ||
    mongoose.model<IGalleryAlbum>('GalleryAlbum', GalleryAlbumSchema)