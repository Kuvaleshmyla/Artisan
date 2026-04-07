import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    try {
        let token = req.cookies.jwt;
        if (!token) {
            return res.status(401).json({ message: 'Not authorized, no token' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.userId).select('-password');
        
        if (!req.user || req.user.status === 'banned') {
            return res.status(401).json({ message: 'Not authorized, user banned or deleted' });
        }
        
        next();
    } catch (error) {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Not authorized for this role' });
        }
        next();
    };
};

/** Sets req.user when a valid session cookie exists; never sends 401 (for public routes that adapt by role). */
export const optionalProtect = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if (!token) return next();
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId).select('-password');
        if (user && user.status !== 'banned') {
            req.user = user;
        }
    } catch {
        // treat as anonymous
    }
    next();
};
