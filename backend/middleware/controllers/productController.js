import mongoose from 'mongoose';
import Product from '../../models/Product.js';
import Order from '../../models/Order.js';
import User from '../../models/User.js';
import ArtisanProfile from '../../models/ArtisanProfile.js';
import { getMarketplaceVisibleArtisanIds, isArtisanVisibleOnMarketplace } from '../../utils/marketplaceVisibility.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const enrichWithArtisanProfile = async (products) => {
    const list = Array.isArray(products) ? products : [products];
    const artisanIds = [
        ...new Set(
            list
                .map((p) => p?.artisanId?._id ?? p?.artisanId)
                .filter(Boolean)
                .map((id) => String(id))
        ),
    ];

    if (artisanIds.length === 0) return list;

    const profiles = await ArtisanProfile.find({ userId: { $in: artisanIds } }).select(
        'businessName craftType region state country isVerified marketplaceActive'
    );
    const byUserId = new Map(profiles.map((p) => [String(p.userId), p]));

    return list.map((p) => {
        const obj = typeof p?.toObject === 'function' ? p.toObject() : p;
        const aid = obj?.artisanId?._id ? String(obj.artisanId._id) : obj?.artisanId ? String(obj.artisanId) : null;
        const profile = aid ? byUserId.get(aid) : null;
        if (profile && obj?.artisanId) {
            obj.artisanId.businessName = profile.businessName;
            obj.artisanId.craftType = profile.craftType;
            obj.artisanId.region = profile.region;
            obj.artisanId.state = profile.state;
            obj.artisanId.country = profile.country;
            obj.artisanId.isVerified = profile.isVerified;
            obj.artisanId.marketplaceActive = profile.marketplaceActive;
        }
        return obj;
    });
};

// @desc    List categories on marketplace-visible products
// @route   GET /api/products/meta/categories
// @access  Public
export const getProductCategories = async (req, res) => {
    try {
        const visibleIds = await getMarketplaceVisibleArtisanIds();
        const cats = await Product.distinct('category', { artisanId: { $in: visibleIds } });
        res.json(cats.filter(Boolean).sort((a, b) => String(a).localeCompare(String(b))));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Logged-in artisan's products (includes pending verification)
// @route   GET /api/products/artisan/mine
// @access  Private artisan (admin optional artisanId query)
export const getMyArtisanProducts = async (req, res) => {
    try {
        const ownerId =
            req.user.role === 'admin' && req.query.artisanId ? req.query.artisanId : req.user._id;
        const products = await Product.find({ artisanId: ownerId }).populate('artisanId', 'name email qrCodeImage');
        const enriched = await enrichWithArtisanProfile(products);
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Products (public: verified marketplace only; cookie admin: full artisan catalog)
// @route   GET /api/products
// @access  Public + optional admin
export const getProducts = async (req, res) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        const artisanIdParam = req.query.artisan?.trim();
        const category = req.query.category?.trim();

        let baseArtisanConstraint;

        if (isAdmin) {
            const allArtisanIds = await User.find({ role: 'artisan' }).distinct('_id');
            if (artisanIdParam) {
                baseArtisanConstraint = { artisanId: artisanIdParam };
            } else {
                baseArtisanConstraint = { artisanId: { $in: allArtisanIds } };
            }
        } else if (artisanIdParam) {
            const ok = await isArtisanVisibleOnMarketplace(artisanIdParam);
            if (!ok) {
                return res.json([]);
            }
            baseArtisanConstraint = { artisanId: artisanIdParam };
        } else {
            const visibleIds = await getMarketplaceVisibleArtisanIds();
            baseArtisanConstraint = { artisanId: { $in: visibleIds } };
        }

        const keyword = req.query.keyword?.trim();

        let query;
        if (keyword) {
            const regex = new RegExp(escapeRegex(keyword), 'i');

            const fromProfiles = await ArtisanProfile.find({
                $or: [
                    { businessName: { $regex: regex } },
                    { craftType: { $regex: regex } },
                    { region: { $regex: regex } },
                    { state: { $regex: regex } }
                ]
            }).distinct('userId');
            const fromNames = await User.find({ role: 'artisan', name: { $regex: regex } }).distinct('_id');
            const fromEmails = await User.find({ role: 'artisan', email: { $regex: regex } }).distinct('_id');
            const idStrings = [...new Set([...fromProfiles.map(String), ...fromNames.map(String), ...fromEmails.map(String)])];
            const artisanMatchIds = idStrings
                .filter((id) => mongoose.Types.ObjectId.isValid(id))
                .map((id) => new mongoose.Types.ObjectId(id));

            const orClause = {
                $or: [
                    { name: { $regex: regex } },
                    { category: { $regex: regex } },
                    ...(artisanMatchIds.length ? [{ artisanId: { $in: artisanMatchIds } }] : [])
                ]
            };

            query = { $and: [baseArtisanConstraint, orClause] };
        } else {
            query = baseArtisanConstraint;
        }

        if (category) {
            const catRegex = new RegExp(escapeRegex(category), 'i');
            query = { $and: [query, { category: catRegex }] };
        }

        const products = await Product.find(query).populate('artisanId', 'name email qrCodeImage');
        const enriched = await enrichWithArtisanProfile(products);
        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('artisanId', 'name email qrCodeImage');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        const aid = product.artisanId?._id || product.artisanId;
        if (aid) {
            const artisanUser = await User.findById(aid).select('status role');
            if (!artisanUser || artisanUser.status === 'banned') {
                return res.status(404).json({ message: 'Product not found' });
            }
            const isOwner = req.user && aid.toString() === req.user._id.toString();
            const isAdminViewer = req.user?.role === 'admin';
            if (!isOwner && !isAdminViewer) {
                const visible = await isArtisanVisibleOnMarketplace(aid);
                if (!visible) {
                    return res.status(404).json({ message: 'Product not found' });
                }
            }
        }
        const enriched = await enrichWithArtisanProfile(product);
        res.json(enriched[0]);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Artisan
export const createProduct = async (req, res) => {
    try {
        const { name, price, description, category, stock, images } = req.body;

        const product = new Product({
            name,
            price,
            description,
            category,
            stock,
            images,
            artisanId: req.user._id,
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Artisan
export const updateProduct = async (req, res) => {
    try {
        const { name, price, description, category, stock, images } = req.body;

        const product = await Product.findById(req.params.id);

        if (product) {
            if (product.artisanId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to edit this product' });
            }

            product.name = name || product.name;
            product.price = price || product.price;
            product.description = description || product.description;
            product.category = category || product.category;
            product.stock = stock || product.stock;
            product.images = images || product.images;

            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            if (product.artisanId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
                return res.status(403).json({ message: 'Not authorized to delete this product' });
            }
            await Product.deleteOne({ _id: product._id });
            res.json({ message: 'Product removed successfully' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create new review
// @route   POST /api/products/:id/reviews
// @access  Private/Customer
export const createProductReview = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const product = await Product.findById(req.params.id);

        if (product) {
            // require that the user purchased this product before reviewing
            const hasPurchased = await Order.findOne({
                customerId: req.user._id,
                'items.productId': product._id,
                $or: [
                    { status: 'delivered' },
                    { paymentStatus: 'paid' }
                ]
            });

            if (!hasPurchased) {
                return res.status(403).json({ message: 'Only customers who purchased this product can leave a review' });
            }

            const alreadyReviewed = product.reviews.find(
                (r) => r.user.toString() === req.user._id.toString()
            );

            if (alreadyReviewed) {
                return res.status(400).json({ message: 'Product already reviewed' });
            }

            const review = {
                name: req.user.name,
                rating: Number(rating),
                comment,
                user: req.user._id,
            };

            product.reviews.push(review);
            product.ratings.count = product.reviews.length;
            product.ratings.average = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

            await product.save();
            res.status(201).json({ message: 'Review added' });
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
