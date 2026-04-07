import express from 'express';
import upload from '../middleware/uploadMiddleware.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, upload.single('image'), (req, res) => {
    res.send(`/${req.file.path.replace(/\\/g, '/')}`);
});

/** Workshop intro video (artisan profile) — field name must be workVideo */
router.post(
    '/work-video',
    protect,
    authorizeRoles('artisan', 'admin'),
    upload.single('workVideo'),
    (req, res) => {
        if (!req.file) {
            return res.status(400).json({ message: 'No video file received' });
        }
        res.send(`/${req.file.path.replace(/\\/g, '/')}`);
    }
);

export default router;
