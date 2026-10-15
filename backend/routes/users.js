const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Public seller profile view
router.get('/seller/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const seller = await db.getOne(`
            SELECT 
                u.id, u.name, u.avatar_url, u.created_at,
                sp.business_name, sp.bio, sp.rating, sp.total_sales, sp.city, sp.state, sp.is_verified
            FROM users u
            LEFT JOIN seller_profiles sp ON sp.user_id = u.id
            WHERE u.id = ? AND u.status = 'active'
        `, [id]);

        if (!seller) {
            return res.status(404).json({ success: false, message: 'Seller profile not found' });
        }

        const activeAds = await db.query(`
            SELECT 
                a.id, a.title, a.price, a.product_condition, a.location, a.city, a.created_at,
                c.name as category_name,
                (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
            FROM advertisements a
            JOIN categories c ON a.category_id = c.id
            WHERE a.seller_id = ? AND a.status = 'approved'
            ORDER BY a.created_at DESC
        `, [id]);

        return res.json({
            success: true,
            seller,
            activeAds
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch seller profile', error: err.message });
    }
});

module.exports = router;
