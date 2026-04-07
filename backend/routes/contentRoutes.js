import express from 'express';
import {
    listCraftStories,
    createCraftStory,
    updateCraftStory,
    deleteCraftStory,
} from '../middleware/controllers/craftStoryController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/craft-stories', listCraftStories);
router.post('/craft-stories', protect, authorizeRoles('admin'), createCraftStory);
router.put('/craft-stories/:id', protect, authorizeRoles('admin'), updateCraftStory);
router.delete('/craft-stories/:id', protect, authorizeRoles('admin'), deleteCraftStory);

export default router;
