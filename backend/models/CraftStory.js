import mongoose from 'mongoose';

const craftStorySchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        body: { type: String, default: '' },
        /** Image URLs (e.g. /uploads/...) showing the craft */
        images: { type: [String], default: [] },
        sortOrder: { type: Number, default: 0 },
    },
    { timestamps: true }
);

export default mongoose.model('CraftStory', craftStorySchema);
