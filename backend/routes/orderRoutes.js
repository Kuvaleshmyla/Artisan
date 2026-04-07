import express from 'express';
import {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getArtisanOrders,
    addOrderFeedback,
    addOrderIssue,
    getAllOrders,
    updateOrderStatus,
    verifyPaymentAsArtisan,
    deleteOrderByAdmin
} from '../middleware/controllers/orderController.js';
import { protect, authorizeRoles } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, authorizeRoles('customer'), addOrderItems);
router.route('/myorders').get(protect, authorizeRoles('customer'), getMyOrders);
router.route('/artisanorders').get(protect, authorizeRoles('artisan'), getArtisanOrders);
router.route('/all').get(protect, authorizeRoles('admin'), getAllOrders);
router.route('/:id/status').put(protect, authorizeRoles('admin'), updateOrderStatus);
router.route('/:id/verify-payment').put(protect, authorizeRoles('artisan'), verifyPaymentAsArtisan);
router.route('/:id/feedback').post(protect, addOrderFeedback);
router.route('/:id/issue').post(protect, addOrderIssue);
router.route('/:id')
    .get(protect, getOrderById)
    .delete(protect, authorizeRoles('admin'), deleteOrderByAdmin);

export default router;
