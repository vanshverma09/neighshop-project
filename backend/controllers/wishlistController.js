const db = require('../database/db');

exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const items = await db.query(`
            SELECT 
                a.id, a.seller_id, a.category_id, a.title, a.description,
                a.price, a.product_condition, a.location, a.city, a.state,
                a.status, a.is_featured, a.created_at,
                c.name as category_name,
                u.name as seller_name,
                (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
            FROM favourites f
            JOIN advertisements a ON f.advertisement_id = a.id
            JOIN categories c ON a.category_id = c.id
            JOIN users u ON a.seller_id = u.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `, [userId]);

        return res.json({
            success: true,
            total: items.length,
            wishlist: items.map(item => ({ ...item, is_favourited: true }))
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch favourites', error: err.message });
    }
};

exports.toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { adId } = req.params;

        const ad = await db.getOne('SELECT id FROM advertisements WHERE id = ?', [adId]);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'Advertisement not found.' });
        }

        const existing = await db.getOne('SELECT id FROM favourites WHERE user_id = ? AND advertisement_id = ?', [userId, adId]);

        if (existing) {
            // Remove
            await db.query('DELETE FROM favourites WHERE id = ?', [existing.id]);
            return res.json({
                success: true,
                is_favourited: false,
                message: 'Removed from favourites.'
            });
        } else {
            // Add
            await db.query('INSERT INTO favourites (user_id, advertisement_id) VALUES (?, ?)', [userId, adId]);
            return res.json({
                success: true,
                is_favourited: true,
                message: 'Added to favourites!'
            });
        }
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update favourites', error: err.message });
    }
};
