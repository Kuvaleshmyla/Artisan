import mongoose from 'mongoose';
import User from '../models/User.js';
import ArtisanProfile from '../models/ArtisanProfile.js';

/**
 * Artisan is listed on the marketplace when profile.marketplaceActive is not explicitly false.
 * New registrations set marketplaceActive: false until an admin approves (verify).
 * Legacy profiles without the field remain visible.
 */
export async function isArtisanVisibleOnMarketplace(userId) {
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) return false;
    const uid = userId.toString();
    const artisanUser = await User.findById(uid).select('role status');
    if (!artisanUser || artisanUser.role !== 'artisan' || artisanUser.status === 'banned') {
        return false;
    }
    const profile = await ArtisanProfile.findOne({ userId: uid });
    if (!profile || profile.marketplaceActive === false) {
        return false;
    }
    return true;
}

/** @returns {Promise<import('mongoose').Types.ObjectId[]>} */
export async function getMarketplaceVisibleArtisanIds() {
    const activeArtisanIds = await User.find({ role: 'artisan', status: 'active' }).distinct('_id');
    return ArtisanProfile.find({
        userId: { $in: activeArtisanIds },
        $nor: [{ marketplaceActive: false }],
    }).distinct('userId');
}
