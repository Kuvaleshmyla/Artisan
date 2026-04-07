import mongoose from 'mongoose';

const artisanProfileSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    businessName: { type: String, required: true },
    description: { type: String, required: true },
    craftType: { type: String, default: '' },
    region: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: 'India' },
    /** When false, artisan is hidden from public catalog until admin approves. Omit on legacy profiles = visible. */
    marketplaceActive: { type: Boolean },
    documents: [{ type: String }], // URLs to identity or business verification docs
    isVerified: { type: Boolean, default: false }, // Admins to toggle this
    /** Workshop / portfolio photos shown on public artisan page */
    galleryImages: [{ type: String }],
    /** Intro video of the craft / workshop (required at registration for new artisans) */
    workVideo: { type: String, default: '' },
    qrCodeImage: { type: String, default: '' }, // Active QR shown at checkout
    qrCodeImages: [{ type: String }], // History of uploaded QR images
    earnings: { type: Number, default: 0 },
    workExperience: { type: String, default: '' } // Artisan work experience
}, { timestamps: true });

export default mongoose.model('ArtisanProfile', artisanProfileSchema);
