import express from 'express';
import {
    getProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    createProductReview,
    getProductCategories,
    getMyArtisanProducts
} from '../middleware/controllers/productController.js';
import { protect, authorizeRoles, optionalProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/meta/categories', getProductCategories);
router.get('/artisan/mine', protect, authorizeRoles('artisan', 'admin'), getMyArtisanProducts);

router.route('/')
    .get(optionalProtect, getProducts)
    .post(protect, authorizeRoles('artisan', 'admin'), createProduct);

router.route('/:id')
    .get(optionalProtect, getProductById)
    .put(protect, authorizeRoles('artisan', 'admin'), updateProduct)
    .delete(protect, authorizeRoles('admin', 'artisan'), deleteProduct);

router.route('/:id/reviews')
    .post(protect, createProductReview);

export default router;
