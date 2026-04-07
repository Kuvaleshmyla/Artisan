import User from '../../models/User.js';
import ArtisanProfile from '../../models/ArtisanProfile.js';
import Product from '../../models/Product.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '30d'
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, businessName, description, craftType, region, state, country } =
            req.body;

        const fileGroups = req.files && !Array.isArray(req.files) ? req.files : null;
        const galleryFiles = fileGroups?.gallery || (Array.isArray(req.files) ? req.files : []);
        const videoFiles = fileGroups?.workVideo || [];
        const uploadedGallery = galleryFiles.map((f) => `/${String(f.path).replace(/\\/g, '/')}`);
        const workVideoUrl = videoFiles[0] ? `/${String(videoFiles[0].path).replace(/\\/g, '/')}` : '';
        
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const validRole = ['customer', 'artisan'].includes(role) ? role : 'customer';

        const user = await User.create({
            name, email, password: hashedPassword, role: validRole
        });

        if (user) {
            // If artisan, create artisan profile
            if (validRole === 'artisan') {
                if (!businessName || !description) return res.status(400).json({ message: 'Business name and description required for artisans' });
                if (uploadedGallery.length < 2) {
                    await User.deleteOne({ _id: user._id });
                    return res.status(400).json({ message: 'Please upload at least two workshop or portfolio images.' });
                }
                if (!workVideoUrl) {
                    await User.deleteOne({ _id: user._id });
                    return res.status(400).json({
                        message: 'Please upload one short video of your craft or workshop (MP4, WebM, or MOV).',
                    });
                }
                await ArtisanProfile.create({
                    userId: user._id,
                    businessName,
                    description,
                    craftType: craftType || '',
                    region: region || '',
                    state: state || '',
                    country: country || 'India',
                    galleryImages: uploadedGallery,
                    workVideo: workVideoUrl,
                    marketplaceActive: false,
                    isVerified: false
                });
            }

            generateToken(res, user._id);
            res.status(201).json({
                _id: user._id, name: user.name, email: user.email, role: user.role
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Hard-delete a pending artisan application so they can register again with the same email. */
export const rejectPendingArtisan = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);
        if (!user || user.role !== 'artisan') {
            return res.status(404).json({ message: 'Artisan not found' });
        }
        const profile = await ArtisanProfile.findOne({ userId });
        if (!profile || profile.marketplaceActive !== false) {
            return res.status(400).json({
                message: 'Only pending (not approved) artisan applications can be rejected this way.',
            });
        }

        await Product.deleteMany({ artisanId: userId });
        await ArtisanProfile.deleteOne({ userId });
        await User.deleteOne({ _id: userId });

        res.json({ message: 'Application rejected. The email may be used to register again.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await bcrypt.compare(password, user.password))) {
            if (user.status === 'banned') {
                return res.status(403).json({ message: 'This account has been restricted and cannot sign in.' });
            }
            
            generateToken(res, user._id);
            res.status(200).json({
                _id: user._id, name: user.name, email: user.email, role: user.role
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

export const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ role: 'customer', status: 'active' }).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const getAllArtisans = async (req, res) => {
    try {
        const artisans = await User.find({ role: 'artisan', status: 'active' }).select('-password');
        res.json(artisans);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/** Soft-ban: user cannot log in; JWT requests fail in protect() */
export const deleteUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role !== 'customer') {
            return res.status(400).json({ message: 'This action only applies to customer accounts' });
        }
        if (user.status === 'banned') {
            return res.status(400).json({ message: 'Account is already restricted' });
        }

        user.status = 'banned';
        await user.save();

        res.json({ message: 'Customer access revoked. They can no longer sign in.', user: { _id: user._id, email: user.email, status: user.status } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const deleteArtisanById = async (req, res) => {
    try {
        const artisanId = req.params.id;
        const artisan = await User.findById(artisanId);

        if (!artisan) {
            return res.status(404).json({ message: 'Artisan not found' });
        }
        if (artisan.role !== 'artisan') {
            return res.status(400).json({ message: 'This action only applies to artisan accounts' });
        }
        if (artisan.status === 'banned') {
            return res.status(400).json({ message: 'Account is already restricted' });
        }

        artisan.status = 'banned';
        await artisan.save();

        res.json({ message: 'Artisan access revoked. They can no longer sign in.', artisan: { _id: artisan._id, email: artisan.email, status: artisan.status } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
