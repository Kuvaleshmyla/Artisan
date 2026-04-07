import express from 'express';
import { createPaymentIntent, getStripeKey } from '../middleware/controllers/stripeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/create-payment-intent', protect, createPaymentIntent);
router.get('/config', protect, getStripeKey);

export default router;
