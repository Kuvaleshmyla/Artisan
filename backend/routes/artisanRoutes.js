import express from 'express';
import { protect, authorizeRoles, optionalProtect } from '../middleware/authMiddleware.js';
import {
    getArtisanProfile,
    updateArtisanProfile,
    getArtisanQrCode,
    getAdminStats,
    verifyArtisan,
    getPublicArtisanProfile,
    getAdminArtisanProfiles,
    getAdminArtisanPreview
} from '../middleware/controllers/artisanController.js';

const router = express.Router();

router.route('/profile')
    .get(protect, authorizeRoles('artisan'), getArtisanProfile)
    .put(protect, authorizeRoles('artisan'), updateArtisanProfile);

router.get('/admin/stats', protect, authorizeRoles('admin'), getAdminStats);
router.get('/admin/profiles', protect, authorizeRoles('admin'), getAdminArtisanProfiles);
router.get('/admin/preview/:userId', protect, authorizeRoles('admin'), getAdminArtisanPreview);
router.put('/admin/verify/:id', protect, authorizeRoles('admin'), verifyArtisan);

router.get('/public/:userId', optionalProtect, getPublicArtisanProfile);
router.get('/:id/qrcode', getArtisanQrCode);

export default router;
