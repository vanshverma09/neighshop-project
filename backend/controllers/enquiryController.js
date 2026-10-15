const db = require('../database/db');

// 1. BUYER SENDS ENQUIRY
exports.createEnquiry = async (req, res) => {
    try {
        const buyerId = req.user.id;
        const { advertisement_id, message } = req.body;

        if (!advertisement_id || !message || message.trim() === '') {
            return res.status(400).json({ success: false, message: 'Advertisement ID and message are required.' });
        }

        const ad = await db.getOne('SELECT id, seller_id, title FROM advertisements WHERE id = ?', [advertisement_id]);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'Advertisement not found.' });
        }

        if (ad.seller_id === buyerId) {
            return res.status(400).json({ success: false, message: 'You cannot send an enquiry on your own advertisement.' });
        }

        const result = await db.query(
            'INSERT INTO enquiries (advertisement_id, buyer_id, seller_id, message, status) VALUES (?, ?, ?, ?, ?)',
            [advertisement_id, buyerId, ad.seller_id, message.trim(), 'pending']
        );

        return res.status(201).json({
            success: true,
            message: 'Your enquiry has been delivered to the seller!',
            enquiryId: result.insertId
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to send enquiry', error: err.message });
    }
};

// 2. BUYER VIEWS SUBMITTED ENQUIRIES
exports.getBuyerEnquiries = async (req, res) => {
    try {
        const buyerId = req.user.id;

        const items = await db.query(`
            SELECT 
                e.*,
                a.title as ad_title,
                a.price as ad_price,
                a.status as ad_status,
                u.name as seller_name,
                u.avatar_url as seller_avatar,
                u.phone as seller_phone,
                (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as ad_image
            FROM enquiries e
            JOIN advertisements a ON e.advertisement_id = a.id
            JOIN users u ON e.seller_id = u.id
            WHERE e.buyer_id = ?
            ORDER BY e.created_at DESC
        `, [buyerId]);

        return res.json({
            success: true,
            enquiries: items
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch enquiries', error: err.message });
    }
};

// 3. SELLER VIEWS RECEIVED ENQUIRIES
exports.getSellerEnquiries = async (req, res) => {
    try {
        const sellerId = req.user.id;

        const items = await db.query(`
            SELECT 
                e.*,
                a.title as ad_title,
                a.price as ad_price,
                u.name as buyer_name,
                u.email as buyer_email,
                u.phone as buyer_phone,
                u.avatar_url as buyer_avatar,
                (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as ad_image
            FROM enquiries e
            JOIN advertisements a ON e.advertisement_id = a.id
            JOIN users u ON e.buyer_id = u.id
            WHERE e.seller_id = ?
            ORDER BY e.created_at DESC
        `, [sellerId]);

        return res.json({
            success: true,
            enquiries: items
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch seller enquiries', error: err.message });
    }
};

// 4. SELLER REPLIES TO ENQUIRY
exports.replyEnquiry = async (req, res) => {
    try {
        const { id } = req.params;
        const { reply } = req.body;
        const sellerId = req.user.id;

        if (!reply || reply.trim() === '') {
            return res.status(400).json({ success: false, message: 'Reply message cannot be empty.' });
        }

        const enquiry = await db.getOne('SELECT * FROM enquiries WHERE id = ?', [id]);
        if (!enquiry) {
            return res.status(404).json({ success: false, message: 'Enquiry not found.' });
        }

        if (enquiry.seller_id !== sellerId && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Unauthorized to respond to this enquiry.' });
        }

        await db.query(
            "UPDATE enquiries SET reply = ?, status = 'responded', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            [reply.trim(), id]
        );

        return res.json({
            success: true,
            message: 'Reply sent to buyer successfully!'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to send reply', error: err.message });
    }
};
