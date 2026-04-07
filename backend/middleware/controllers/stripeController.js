import dotenv from 'dotenv';
dotenv.config();

// Minimal stripe controller stub to avoid module-not-found errors.
// Replace with real Stripe integration as needed.

export const createPaymentIntent = async (req, res) => {
    try {
        // TODO: integrate with Stripe SDK
        res.status(501).json({ message: 'Payment intent not implemented' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getStripeKey = (req, res) => {
    try {
        res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
