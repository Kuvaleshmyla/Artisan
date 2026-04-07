import express from 'express';
import {
    registerUser,
    loginUser,
    logoutUser,
    getUserProfile,
    getAllUsers,
    getAllArtisans,
    deleteUserById,
    deleteArtisanById,
    rejectPendingArtisan,
} from '../middleware/controllers/authController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

const registerMaybeMultipart = (req, res, next) => {
    if (req.headers['content-type']?.includes('multipart/form-data')) {
        return upload.fields([
            { name: 'gallery', maxCount: 15 },
            { name: 'workVideo', maxCount: 1 },
        ])(req, res, next);
    }
    next();
};

router.post('/register', registerMaybeMultipart, registerUser);
router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.get('/profile', protect, getUserProfile);
router.get('/customers', protect, authorizeRoles('admin'), getAllUsers);
router.get('/artisans', protect, authorizeRoles('admin'), getAllArtisans);
router.delete('/users/:id', protect, authorizeRoles('admin'), deleteUserById);
router.delete('/artisans/:id', protect, authorizeRoles('admin'), deleteArtisanById);
router.delete('/artisans/pending/:id', protect, authorizeRoles('admin'), rejectPendingArtisan);

export default router;
