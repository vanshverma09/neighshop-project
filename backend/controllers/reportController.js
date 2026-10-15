const db = require('../database/db');

exports.submitReport = async (req, res) => {
    try {
        const reporterId = req.user.id;
        const { advertisement_id, reason, description } = req.body;

        if (!advertisement_id || !reason) {
            return res.status(400).json({ success: false, message: 'Advertisement ID and violation reason are required.' });
        }

        const validReasons = ['spam', 'fraud', 'offensive', 'counterfeit', 'duplicate', 'wrong_category', 'other'];
        if (!validReasons.includes(reason)) {
            return res.status(400).json({ success: false, message: `Invalid reason. Must be one of: ${validReasons.join(', ')}` });
        }

        const ad = await db.getOne('SELECT id FROM advertisements WHERE id = ?', [advertisement_id]);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'Advertisement not found.' });
        }

        const result = await db.query(
            'INSERT INTO reports (advertisement_id, reporter_id, reason, description, status) VALUES (?, ?, ?, ?, ?)',
            [advertisement_id, reporterId, reason, description || '', 'pending']
        );

        return res.status(201).json({
            success: true,
            message: 'Report submitted successfully. Our safety moderation team will investigate.',
            reportId: result.insertId
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to submit report', error: err.message });
    }
};
