import mongoose from 'mongoose';

const platformContentSchema = new mongoose.Schema(
    {
        slug: { type: String, required: true, unique: true, trim: true },
        title: { type: String, default: '' },
        body: { type: String, default: '' },
    },
    { timestamps: true }
);

export default mongoose.model('PlatformContent', platformContentSchema);
