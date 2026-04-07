import CraftStory from '../../models/CraftStory.js';

export const listCraftStories = async (req, res) => {
    try {
        const stories = await CraftStory.find({}).sort({ sortOrder: 1, createdAt: -1 }).lean();
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const normalizeImages = (images) => {
    if (!Array.isArray(images)) return [];
    return images.map((u) => String(u).trim()).filter(Boolean);
};

export const createCraftStory = async (req, res) => {
    try {
        const { title, body, sortOrder, images } = req.body;
        if (!title || !String(title).trim()) {
            return res.status(400).json({ message: 'Title is required' });
        }
        const story = await CraftStory.create({
            title: title.trim(),
            body: body ?? '',
            images: normalizeImages(images),
            sortOrder: Number(sortOrder) || 0,
        });
        res.status(201).json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCraftStory = async (req, res) => {
    try {
        const { title, body, sortOrder, images } = req.body;
        const story = await CraftStory.findById(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }
        if (title !== undefined) story.title = String(title).trim();
        if (body !== undefined) story.body = body;
        if (images !== undefined) story.images = normalizeImages(images);
        if (sortOrder !== undefined) story.sortOrder = Number(sortOrder) || 0;
        await story.save();
        res.json(story);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteCraftStory = async (req, res) => {
    try {
        const story = await CraftStory.findByIdAndDelete(req.params.id);
        if (!story) {
            return res.status(404).json({ message: 'Story not found' });
        }
        res.json({ message: 'Story removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
