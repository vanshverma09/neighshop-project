const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'neighshop_classifieds_super_secret_jwt_key_2026_vansh';

async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        return res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.getOne('SELECT id, name, email, phone, avatar_url, role, status FROM users WHERE id = ?', [decoded.id]);
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid token: User account no longer exists.' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Your account has been suspended by an administrator.' });
        }

        if (user.status === 'deactivated') {
            return res.status(403).json({ success: false, message: 'Account is deactivated. Please contact support.' });
        }

        req.user = user;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired authorization token.', error: err.message });
    }
}

// Optional auth: Populates req.user if token is valid, but does not block unauthenticated users
async function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.getOne('SELECT id, name, email, phone, avatar_url, role, status FROM users WHERE id = ?', [decoded.id]);
        req.user = (user && user.status === 'active') ? user : null;
    } catch {
        req.user = null;
    }
    next();
}

module.exports = {
    authenticateToken,
    optionalAuth,
    JWT_SECRET
};
