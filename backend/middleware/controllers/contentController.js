import PlatformContent from '../../models/PlatformContent.js';

const DEFAULTS = {
    'craft-stories': {
        title: 'Craft & heritage',
        body: 'Stories about traditional crafts and the makers who keep them alive will appear here. Admins can edit this from Platform content.',
    },
    about: {
        title: 'About ArtisanMarket',
        body: 'A marketplace connecting customers with verified artisans. Admins can customize this page.',
    },
};

export const getPublicContentBySlug = async (req, res) => {
    try {
        const slug = req.params.slug?.trim();
        if (!slug) {
            return res.status(400).json({ message: 'Missing slug' });
        }
        let doc = await PlatformContent.findOne({ slug });
        if (!doc) {
            const fallback = DEFAULTS[slug] || { title: slug, body: '' };
            doc = await PlatformContent.create({ slug, ...fallback });
        }
        res.json({ slug: doc.slug, title: doc.title, body: doc.body, updatedAt: doc.updatedAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const upsertPlatformContent = async (req, res) => {
    try {
        const slug = req.params.slug?.trim();
        const { title, body } = req.body;
        if (!slug) {
            return res.status(400).json({ message: 'Missing slug' });
        }
        const doc = await PlatformContent.findOneAndUpdate(
            { slug },
            {
                $set: {
                    title: title ?? '',
                    body: body ?? '',
                },
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );
        res.json({ slug: doc.slug, title: doc.title, body: doc.body, updatedAt: doc.updatedAt });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
