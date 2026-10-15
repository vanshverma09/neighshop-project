const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

exports.register = async (req, res) => {
    try {
        const { name, email, password, phone, role = 'buyer', businessName, city = 'Mumbai', state = 'Maharashtra' } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
        }

        const validRoles = ['buyer', 'seller'];
        const userRole = validRoles.includes(role) ? role : 'buyer';

        // Check if user already exists
        const existing = await db.getOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=002f34&color=fff&size=150`;

        const result = await db.query(
            'INSERT INTO users (name, email, password_hash, phone, avatar_url, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name.trim(), email.toLowerCase().trim(), passwordHash, phone || null, avatarUrl, userRole, 'active']
        );

        const newUserId = result.insertId;

        // If seller, create default seller profile
        if (userRole === 'seller') {
            await db.query(
                'INSERT INTO seller_profiles (user_id, business_name, bio, city, state, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
                [newUserId, businessName || `${name}'s Store`, 'Verified Classified Seller on NeighShop', city, state, 0]
            );
        }

        const token = jwt.sign(
            { id: newUserId, email: email.toLowerCase().trim(), role: userRole },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful!',
            token,
            user: {
                id: newUserId,
                name: name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone || null,
                avatar_url: avatarUrl,
                role: userRole,
                status: 'active'
            }
        });
    } catch (err) {
        console.error('Error in register:', err);
        return res.status(500).json({ success: false, message: 'Registration failed due to a server error.', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required.' });
        }

        const user = await db.getOne('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. User not found.' });
        }

        if (user.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Account is suspended by an administrator.' });
        }

        if (user.status === 'deactivated') {
            return res.status(403).json({ success: false, message: 'Account has been deactivated.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials. Incorrect password.' });
        }

        // Fetch seller profile if seller
        let sellerProfile = null;
        if (user.role === 'seller') {
            sellerProfile = await db.getOne('SELECT * FROM seller_profiles WHERE user_id = ?', [user.id]);
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                avatar_url: user.avatar_url,
                role: user.role,
                status: user.status
            },
            sellerProfile
        });
    } catch (err) {
        console.error('Error in login:', err);
        return res.status(500).json({ success: false, message: 'Login failed due to a server error.', error: err.message });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await db.getOne('SELECT id, name, email, phone, avatar_url, role, status, created_at FROM users WHERE id = ?', [req.user.id]);
        let sellerProfile = null;
        if (user.role === 'seller' || user.role === 'admin') {
            sellerProfile = await db.getOne('SELECT * FROM seller_profiles WHERE user_id = ?', [user.id]);
        }

        // Also get quick stats
        const favCount = await db.getOne('SELECT count(*) as count FROM favourites WHERE user_id = ?', [user.id]);
        const adCount = await db.getOne('SELECT count(*) as count FROM advertisements WHERE seller_id = ?', [user.id]);

        return res.json({
            success: true,
            user,
            sellerProfile,
            stats: {
                favouritesCount: favCount ? favCount.count : 0,
                myAdsCount: adCount ? adCount.count : 0
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: err.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, avatar_url, businessName, bio, address, city, state } = req.body;
        const userId = req.user.id;

        await db.query(
            'UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), avatar_url = COALESCE(?, avatar_url) WHERE id = ?',
            [name, phone, avatar_url, userId]
        );

        if (req.user.role === 'seller') {
            const profile = await db.getOne('SELECT id FROM seller_profiles WHERE user_id = ?', [userId]);
            if (profile) {
                await db.query(
                    'UPDATE seller_profiles SET business_name = COALESCE(?, business_name), bio = COALESCE(?, bio), address = COALESCE(?, address), city = COALESCE(?, city), state = COALESCE(?, state) WHERE user_id = ?',
                    [businessName, bio, address, city, state, userId]
                );
            } else {
                await db.query(
                    'INSERT INTO seller_profiles (user_id, business_name, bio, address, city, state) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, businessName || `${name}'s Store`, bio, address, city, state]
                );
            }
        }

        const updatedUser = await db.getOne('SELECT id, name, email, phone, avatar_url, role, status FROM users WHERE id = ?', [userId]);
        const updatedSellerProfile = await db.getOne('SELECT * FROM seller_profiles WHERE user_id = ?', [userId]);

        return res.json({
            success: true,
            message: 'Profile updated successfully!',
            user: updatedUser,
            sellerProfile: updatedSellerProfile
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update profile', error: err.message });
    }
};

exports.switchRole = async (req, res) => {
    try {
        const { targetRole } = req.body;
        if (!['buyer', 'seller'].includes(targetRole)) {
            return res.status(400).json({ success: false, message: 'Target role must be either buyer or seller.' });
        }

        // If switching from buyer to seller, ensure seller profile exists
        if (targetRole === 'seller') {
            const profile = await db.getOne('SELECT id FROM seller_profiles WHERE user_id = ?', [req.user.id]);
            if (!profile) {
                await db.query(
                    'INSERT INTO seller_profiles (user_id, business_name, bio, city, state) VALUES (?, ?, ?, ?, ?)',
                    [req.user.id, `${req.user.name}'s Classifieds`, 'Verified NeighShop Seller', 'Mumbai', 'Maharashtra']
                );
            }
        }

        await db.query('UPDATE users SET role = ? WHERE id = ?', [targetRole, req.user.id]);
        
        // Issue fresh token
        const newToken = jwt.sign(
            { id: req.user.id, email: req.user.email, role: targetRole },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.json({
            success: true,
            message: `Switched mode to ${targetRole}!`,
            token: newToken,
            role: targetRole
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Role switch failed', error: err.message });
    }
};
