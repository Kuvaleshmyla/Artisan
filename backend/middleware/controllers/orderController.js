import Order from '../../models/Order.js';
import ArtisanProfile from '../../models/ArtisanProfile.js';

import sendOrderConfirmationEmail from '../../utils/sendEmail.js';

const enrichOrderArtisans = async (orderOrOrders) => {
    const list = Array.isArray(orderOrOrders) ? orderOrOrders : [orderOrOrders];
    const artisanIds = [
        ...new Set(
            list
                .flatMap((o) => o?.items || [])
                .map((item) => item?.artisanId?._id ?? item?.artisanId)
                .filter(Boolean)
                .map((id) => String(id))
        ),
    ];

    if (artisanIds.length === 0) return orderOrOrders;

    const profiles = await ArtisanProfile.find({ userId: { $in: artisanIds } }).select(
        'businessName craftType region state country isVerified marketplaceActive'
    );
    const byUserId = new Map(profiles.map((p) => [String(p.userId), p]));

    const enrichedList = list.map((order) => {
        const obj = typeof order?.toObject === 'function' ? order.toObject() : order;
        if (!obj?.items?.length) return obj;

        obj.items = obj.items.map((item) => {
            const aid = item?.artisanId?._id
                ? String(item.artisanId._id)
                : item?.artisanId
                  ? String(item.artisanId)
                  : null;
            const profile = aid ? byUserId.get(aid) : null;
            if (profile && item?.artisanId) {
                item.artisanId.businessName = profile.businessName;
                item.artisanId.craftType = profile.craftType;
                item.artisanId.region = profile.region;
                item.artisanId.state = profile.state;
                item.artisanId.country = profile.country;
                item.artisanId.isVerified = profile.isVerified;
                item.artisanId.marketplaceActive = profile.marketplaceActive;
            }
            return item;
        });
        return obj;
    });

    return Array.isArray(orderOrOrders) ? enrichedList : enrichedList[0];
};

export const addOrderItems = async (req, res) => {
    try {
        const { orderItems, shippingAddress, paymentMethod, totalAmount, paymentScreenshot } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }
        if (paymentMethod === 'qr_upload' && !paymentScreenshot) {
            return res.status(400).json({ message: 'Upload your payment screenshot before completing the order.' });
        } else {
            const order = new Order({
                customerId: req.user._id,
                items: orderItems,
                shippingAddress,
                paymentMethod,
                totalAmount,
                paymentScreenshot
            });

            const createdOrder = await order.save();
            
            // Trigger Email asynchronously
            sendOrderConfirmationEmail(shippingAddress.email || req.user.email, createdOrder._id.toString());
            
            res.status(201).json(createdOrder);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name email')
            .populate('items.artisanId', 'name email businessName');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const role = req.user.role;
        if (role === 'admin') {
            const enriched = await enrichOrderArtisans(order);
            return res.json(enriched);
        }
        if (role === 'customer' && order.customerId._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }
        if (role === 'artisan') {
            const hasItem = order.items.some((item) => {
                const aid = item.artisanId?._id || item.artisanId;
                return aid && aid.toString() === req.user._id.toString();
            });
            if (!hasItem) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        }

        const enriched = await enrichOrderArtisans(order);
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user._id })
            .populate('items.artisanId', 'name email businessName');
        const enriched = await enrichOrderArtisans(orders);
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getArtisanOrders = async (req, res) => {
    try {
        const orders = await Order.find({ 'items.artisanId': req.user._id })
            .populate('customerId', 'name email')
            .populate('items.artisanId', 'name email businessName');

        const artisanOrders = orders.map((order) => {
            const filteredItems = order.items.filter((item) => {
                const aid = item.artisanId?._id || item.artisanId;
                return aid && aid.toString() === req.user._id.toString();
            });
            const o = order.toObject();
            return { ...o, items: filteredItems };
        });

        const enriched = await enrichOrderArtisans(artisanOrders);
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addOrderFeedback = async (req, res) => {
    try {
        const { feedback } = req.body;
        const order = await Order.findById(req.params.id);

        if (order) {
            order.feedback = feedback;
            await order.save();
            res.json({ message: 'Feedback added successfully', order });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const addOrderIssue = async (req, res) => {
    try {
        const { issue } = req.body;
        const order = await Order.findById(req.params.id);

        if (order) {
            order.issue = issue;
            await order.save();
            res.json({ message: 'Issue reported successfully', order });
        } else {
            res.status(404).json({ message: 'Order not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('customerId', 'name email')
            .populate('items.artisanId', 'name email businessName');
        const enriched = await enrichOrderArtisans(orders);
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Admin only: advance fulfillment after artisan has accepted (verified payment). Enforces linear workflow. */
export const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const adminAllowed = ['processing', 'shipped', 'delivered', 'cancelled'];

        if (!adminAllowed.includes(status)) {
            return res.status(400).json({
                message: 'Admins may only set processing, shipped, delivered, or cancelled. Accepted is set when an artisan verifies payment.'
            });
        }

        const order = await Order.findById(req.params.id).populate('customerId', 'name email').populate('items.artisanId', 'name email businessName');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const current = order.status;

        if (status === 'cancelled') {
            if (current === 'delivered') {
                return res.status(400).json({ message: 'Cannot cancel a delivered order.' });
            }
            if (current === 'cancelled') {
                return res.status(400).json({ message: 'Order is already cancelled.' });
            }
        } else if (status === 'processing') {
            if (current !== 'accepted') {
                return res.status(400).json({
                    message: 'Order must be accepted by the artisan (payment verified) before it can move to processing.'
                });
            }
        } else if (status === 'shipped') {
            if (current !== 'processing') {
                return res.status(400).json({ message: 'Order must be in processing before it can be shipped.' });
            }
        } else if (status === 'delivered') {
            if (current !== 'shipped') {
                return res.status(400).json({ message: 'Order must be shipped before it can be delivered.' });
            }
        }

        order.status = status;
        await order.save();
        const refreshed = await Order.findById(order._id)
            .populate('customerId', 'name email')
            .populate('items.artisanId', 'name email businessName');
        const enriched = await enrichOrderArtisans(refreshed);
        res.json({ message: 'Order status updated successfully', order: enriched });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Artisan: verify payment screenshot and accept the order (status → accepted). Only artisans; fulfillment steps are admin-only. */
export const verifyPaymentAsArtisan = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('customerId', 'name email')
            .populate('items.artisanId', 'name email businessName');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const isTheirOrder = order.items.some((item) => {
            const aid = item.artisanId?._id || item.artisanId;
            return aid && aid.toString() === req.user._id.toString();
        });
        if (!isTheirOrder) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'This order is not awaiting payment verification.' });
        }
        if (!order.paymentScreenshot) {
            return res.status(400).json({ message: 'No payment screenshot was uploaded for this order.' });
        }

        order.paymentStatus = 'paid';
        order.status = 'accepted';
        await order.save();
        const refreshed = await Order.findById(order._id)
            .populate('customerId', 'name email')
            .populate('items.artisanId', 'name email businessName');
        const enriched = await enrichOrderArtisans(refreshed);
        res.json({ message: 'Payment verified and order accepted', order: enriched });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Admin: permanently remove order only when delivered or cancelled */
export const deleteOrderByAdmin = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        if (!['delivered', 'cancelled'].includes(order.status)) {
            return res.status(400).json({
                message: 'Orders can only be deleted after they are delivered or cancelled.',
            });
        }
        await Order.deleteOne({ _id: order._id });
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
