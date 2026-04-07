import ArtisanProfile from '../../models/ArtisanProfile.js';
import User from '../../models/User.js';
import { isArtisanVisibleOnMarketplace } from '../../utils/marketplaceVisibility.js';

export const getArtisanProfile = async (req, res) => {
    try {
        const profile = await ArtisanProfile.findOne({ userId: req.user._id }).populate('userId', 'name email');
        if (profile) return res.json(profile);
        res.status(404).json({ message: 'Artisan profile not found' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateArtisanProfile = async (req, res) => {
    try {
        const {
            qrCodeImage,
            workExperience,
            businessName,
            description,
            craftType,
            region,
            state,
            country,
            galleryImages,
            removeGalleryImage,
            removeQrImage,
            workVideo,
            removeWorkVideo,
        } = req.body;
        const profile = await ArtisanProfile.findOne({ userId: req.user._id });
        
        if (profile) {
            if (qrCodeImage) {
                profile.qrCodeImage = qrCodeImage;
                if (!profile.qrCodeImages) profile.qrCodeImages = [];
                if (!profile.qrCodeImages.includes(qrCodeImage)) {
                    profile.qrCodeImages.push(qrCodeImage);
                }
            }
            if (removeQrImage) {
                const url = String(removeQrImage);
                profile.qrCodeImages = (profile.qrCodeImages || []).filter((u) => u !== url);
                if (profile.qrCodeImage === url) {
                    profile.qrCodeImage = profile.qrCodeImages[0] || '';
                }
            }
            if (Array.isArray(galleryImages)) {
                profile.galleryImages = galleryImages.filter(Boolean);
            }
            if (removeGalleryImage) {
                const url = String(removeGalleryImage);
                profile.galleryImages = (profile.galleryImages || []).filter((u) => u !== url);
            }
            if (workVideo !== undefined && typeof workVideo === 'string') {
                profile.workVideo = workVideo.trim();
            }
            if (removeWorkVideo === true || removeWorkVideo === 'true') {
                profile.workVideo = '';
            }
            profile.workExperience = workExperience ?? profile.workExperience;
            profile.businessName = businessName || profile.businessName;
            profile.description = description || profile.description;
            if (craftType !== undefined) profile.craftType = craftType;
            if (region !== undefined) profile.region = region;
            if (state !== undefined) profile.state = state;
            if (country !== undefined) profile.country = country;
            
            const updatedProfile = await profile.save();
            res.json(updatedProfile);
        } else {
            res.status(404).json({ message: 'Artisan profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getArtisanQrCode = async (req, res) => {
    try {
        const artisanUser = await User.findById(req.params.id).select('role status');
        if (!artisanUser || artisanUser.role !== 'artisan' || artisanUser.status === 'banned') {
            return res.status(404).json({ message: 'Artisan not found' });
        }
        const visible = await isArtisanVisibleOnMarketplace(req.params.id);
        if (!visible) {
            return res.status(404).json({ message: 'Artisan not found' });
        }
        const profile = await ArtisanProfile.findOne({ userId: req.params.id });
        if (profile) {
            res.json({ qrCodeImage: profile.qrCodeImage });
        } else {
            res.status(404).json({ message: 'Artisan not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Public storefront header for an artisan (by user id) */
export const getPublicArtisanProfile = async (req, res) => {
    try {
        const artisanUser = await User.findById(req.params.userId).select('role status');
        if (!artisanUser || artisanUser.role !== 'artisan' || artisanUser.status === 'banned') {
            return res.status(404).json({ message: 'Artisan not found' });
        }
        const profile = await ArtisanProfile.findOne({ userId: req.params.userId }).populate('userId', 'name email');
        if (!profile) {
            return res.status(404).json({ message: 'Artisan not found' });
        }
        const visible = await isArtisanVisibleOnMarketplace(req.params.userId);
        if (!visible) {
            return res.status(404).json({ message: 'Artisan not found' });
        }
        const viewer = req.user;
        const canSeeWorkshopMedia =
            viewer?.role === 'admin' ||
            (viewer?.role === 'artisan' &&
                viewer._id &&
                String(viewer._id) === String(req.params.userId));

        const payload = profile.toObject ? profile.toObject() : { ...profile };
        if (!canSeeWorkshopMedia) {
            payload.galleryImages = [];
            payload.workVideo = '';
        }
        res.json(payload);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAdminStats = async (req, res) => {
    try {
        const usersCount = await User.countDocuments({ role: 'customer', status: 'active' });
        const artisansCount = await User.countDocuments({ role: 'artisan', status: 'active' });
        
        const pendingRaw = await ArtisanProfile.find({ marketplaceActive: false }).populate({
            path: 'userId',
            select: 'name email status role',
            match: { status: 'active', role: 'artisan' },
        });
        const pendingArtisans = pendingRaw.filter((p) => p.userId);

        res.json({
            usersCount,
            artisansCount,
            pendingVerificationCount: pendingArtisans.length,
            flagsCount: 0,
            pendingArtisans,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const verifyArtisan = async (req, res) => {
    try {
        const profile = await ArtisanProfile.findById(req.params.id);
        if (profile) {
            profile.isVerified = true;
            profile.marketplaceActive = true;
            await profile.save();
            res.json({ message: 'Artisan verified' });
        } else {
            res.status(404).json({ message: 'Profile not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Full artisan profile list for admin moderation / verification */
export const getAdminArtisanProfiles = async (req, res) => {
    try {
        const pendingOnly = req.query.pending === 'true';
        const filter = pendingOnly
            ? { marketplaceActive: false }
            : { $nor: [{ marketplaceActive: false }] };

        const profiles = await ArtisanProfile.find(filter)
            .populate({
                path: 'userId',
                select: 'name email status createdAt role',
                match: { status: 'active', role: 'artisan' },
            })
            .sort({ updatedAt: -1 });
        // Drop profiles whose user was removed or banned (revoked artisans no longer appear)
        res.json(profiles.filter((p) => p.userId));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Admin-only: view artisan storefront data before approval or for support (bypasses marketplace visibility) */
export const getAdminArtisanPreview = async (req, res) => {
    try {
        const { userId } = req.params;
        const artisanUser = await User.findById(userId).select('role status');
        if (!artisanUser || artisanUser.role !== 'artisan') {
            return res.status(404).json({ message: 'Artisan not found' });
        }
        const profile = await ArtisanProfile.findOne({ userId }).populate('userId', 'name email status');
        if (!profile) {
            return res.status(404).json({ message: 'Artisan profile not found' });
        }
        res.json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
