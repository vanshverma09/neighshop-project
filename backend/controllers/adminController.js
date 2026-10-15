const db = require('../database/db');

// Helper to log admin actions
async function logAdminAction(adminId, actionType, targetEntity, targetId, details, req) {
    try {
        const ip = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
        await db.query(
            'INSERT INTO admin_logs (admin_id, action_type, target_entity, target_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [adminId, actionType, targetEntity, targetId, details, ip]
        );
    } catch (err) {
        console.error('Failed to write admin log:', err);
    }
}

// 1. DASHBOARD OVERVIEW & KEY METRICS
exports.getDashboardStats = async (req, res) => {
    try {
        const userStats = await db.query(`
            SELECT 
                count(*) as total_users,
                SUM(CASE WHEN role = 'seller' THEN 1 ELSE 0 END) as total_sellers,
                SUM(CASE WHEN role = 'buyer' THEN 1 ELSE 0 END) as total_buyers,
                SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
                SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) as suspended_users
            FROM users
        `);

        const adStats = await db.query(`
            SELECT 
                count(*) as total_ads,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_ads,
                SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_ads,
                SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_ads,
                SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_ads,
                SUM(CASE WHEN is_featured = 1 THEN 1 ELSE 0 END) as featured_ads
            FROM advertisements
        `);

        const reportStats = await db.query(`
            SELECT 
                count(*) as total_reports,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_reports,
                SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_reports
            FROM reports
        `);

        const enquiriesStats = await db.query('SELECT count(*) as total_enquiries FROM enquiries');

        // Category breakdown
        const categoryStats = await db.query(`
            SELECT c.name, count(a.id) as ad_count 
            FROM categories c
            LEFT JOIN advertisements a ON c.id = a.category_id
            GROUP BY c.id, c.name
            ORDER BY ad_count DESC
        `);

        // Recent listings pending approval
        const recentPending = await db.query(`
            SELECT 
                a.id, a.title, a.price, a.location, a.city, a.created_at,
                c.name as category_name,
                u.name as seller_name,
                (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
            FROM advertisements a
            JOIN categories c ON a.category_id = c.id
            JOIN users u ON a.seller_id = u.id
            WHERE a.status = 'pending'
            ORDER BY a.created_at DESC
            LIMIT 5
        `);

        // Recent reports
        const recentReports = await db.query(`
            SELECT r.*, a.title as ad_title, u.name as reporter_name
            FROM reports r
            JOIN advertisements a ON r.advertisement_id = a.id
            JOIN users u ON r.reporter_id = u.id
            ORDER BY r.created_at DESC
            LIMIT 5
        `);

        return res.json({
            success: true,
            stats: {
                users: userStats[0],
                advertisements: adStats[0],
                reports: reportStats[0],
                enquiriesCount: enquiriesStats[0].total_enquiries
            },
            categoryBreakdown: categoryStats,
            recentPending,
            recentReports
        });
    } catch (err) {
        console.error('Error in getDashboardStats:', err);
        return res.status(500).json({ success: false, message: 'Failed to retrieve admin stats', error: err.message });
    }
};

// 2. GET ALL ADVERTISEMENTS (With search and status filtering)
exports.getAllAdvertisements = async (req, res) => {
    try {
        const { status, categoryId, search, isFeatured, page = 1, limit = 20 } = req.query;
        const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

        const conditions = [];
        const params = [];

        if (status && status !== 'all') {
            conditions.push('a.status = ?');
            params.push(status);
        }

        if (categoryId) {
            conditions.push('a.category_id = ?');
            params.push(parseInt(categoryId, 10));
        }

        if (isFeatured !== undefined && isFeatured !== '') {
            conditions.push('a.is_featured = ?');
            params.push(isFeatured === 'true' || isFeatured === '1' ? 1 : 0);
        }

        if (search && search.trim() !== '') {
            conditions.push('(LOWER(a.title) LIKE ? OR LOWER(u.name) LIKE ? OR LOWER(a.city) LIKE ?)');
            const term = `%${search.toLowerCase().trim()}%`;
            params.push(term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countQuery = `
            SELECT count(*) as total 
            FROM advertisements a
            JOIN users u ON a.seller_id = u.id
            ${whereClause}
        `;
        const totalResult = await db.query(countQuery, params);
        const total = totalResult[0] ? totalResult[0].total : 0;

        const dataQuery = `
            SELECT 
                a.*,
                c.name as category_name,
                sc.name as subcategory_name,
                u.name as seller_name,
                u.email as seller_email,
                u.phone as seller_phone,
                (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
            FROM advertisements a
            JOIN categories c ON a.category_id = c.id
            LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
            JOIN users u ON a.seller_id = u.id
            ${whereClause}
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const items = await db.query(dataQuery, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

        return res.json({
            success: true,
            total,
            page: parseInt(page, 10),
            totalPages: Math.ceil(total / parseInt(limit, 10)),
            advertisements: items
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve advertisements', error: err.message });
    }
};

// 3. AD APPROVAL WORKFLOW: APPROVE / REJECT
exports.updateAdStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, rejection_reason } = req.body; // 'approved' | 'rejected' | 'pending' | 'sold'

        if (!['approved', 'rejected', 'pending', 'sold'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be approved, rejected, pending, or sold.' });
        }

        const ad = await db.getOne('SELECT * FROM advertisements WHERE id = ?', [id]);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'Advertisement not found.' });
        }

        if (status === 'rejected' && (!rejection_reason || rejection_reason.trim() === '')) {
            return res.status(400).json({ success: false, message: 'Rejection reason is required when rejecting an advertisement.' });
        }

        const reason = status === 'rejected' ? rejection_reason.trim() : null;

        await db.query(
            'UPDATE advertisements SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, reason, id]
        );

        // Audit log
        await logAdminAction(
            req.user.id,
            status === 'approved' ? 'approve_ad' : (status === 'rejected' ? 'reject_ad' : 'update_ad_status'),
            'advertisement',
            id,
            status === 'approved' ? `Approved advertisement: "${ad.title}"` : `Rejected advertisement: "${ad.title}". Reason: ${reason}`,
            req
        );

        return res.json({
            success: true,
            message: `Advertisement status successfully updated to ${status}.`,
            status,
            rejection_reason: reason
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update advertisement status', error: err.message });
    }
};

// 4. TOGGLE FEATURED STATUS
exports.toggleFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        const ad = await db.getOne('SELECT id, title, is_featured FROM advertisements WHERE id = ?', [id]);

        if (!ad) {
            return res.status(404).json({ success: false, message: 'Advertisement not found.' });
        }

        const newStatus = ad.is_featured ? 0 : 1;
        await db.query('UPDATE advertisements SET is_featured = ? WHERE id = ?', [newStatus, id]);

        await logAdminAction(
            req.user.id,
            newStatus ? 'feature_ad' : 'unfeature_ad',
            'advertisement',
            id,
            `${newStatus ? 'Marked' : 'Unmarked'} "${ad.title}" as featured`,
            req
        );

        return res.json({
            success: true,
            is_featured: !!newStatus,
            message: `Advertisement is now ${newStatus ? 'FEATURED' : 'standard'}.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to toggle featured status', error: err.message });
    }
};

// 5. USER & SELLER MANAGEMENT
exports.getUsers = async (req, res) => {
    try {
        const { role, status, search, page = 1, limit = 20 } = req.query;
        const offset = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);

        const conditions = [];
        const params = [];

        if (role && role !== 'all') {
            conditions.push('u.role = ?');
            params.push(role);
        }

        if (status && status !== 'all') {
            conditions.push('u.status = ?');
            params.push(status);
        }

        if (search && search.trim() !== '') {
            conditions.push('(LOWER(u.name) LIKE ? OR LOWER(u.email) LIKE ? OR LOWER(u.phone) LIKE ?)');
            const term = `%${search.toLowerCase().trim()}%`;
            params.push(term, term, term);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        const countQuery = `SELECT count(*) as total FROM users u ${whereClause}`;
        const totalResult = await db.query(countQuery, params);
        const total = totalResult[0] ? totalResult[0].total : 0;

        const dataQuery = `
            SELECT 
                u.id, u.name, u.email, u.phone, u.avatar_url, u.role, u.status, u.created_at,
                sp.business_name, sp.rating, sp.total_sales, sp.is_verified,
                (SELECT count(*) FROM advertisements WHERE seller_id = u.id) as total_ads
            FROM users u
            LEFT JOIN seller_profiles sp ON sp.user_id = u.id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const users = await db.query(dataQuery, [...params, parseInt(limit, 10), parseInt(offset, 10)]);

        return res.json({
            success: true,
            total,
            page: parseInt(page, 10),
            totalPages: Math.ceil(total / parseInt(limit, 10)),
            users
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve users', error: err.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active', 'suspended', 'deactivated'

        if (!['active', 'suspended', 'deactivated'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status. Must be active, suspended, or deactivated.' });
        }

        const user = await db.getOne('SELECT id, name, role FROM users WHERE id = ?', [id]);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }

        if (user.role === 'admin') {
            return res.status(400).json({ success: false, message: 'Cannot suspend an administrator account.' });
        }

        await db.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);

        await logAdminAction(
            req.user.id,
            status === 'suspended' ? 'suspend_user' : 'activate_user',
            'user',
            id,
            `Changed user "${user.name}" status to ${status}`,
            req
        );

        return res.json({
            success: true,
            message: `User account is now ${status}.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update user status', error: err.message });
    }
};

// 6. CATEGORIES & SUBCATEGORIES MANAGEMENT
exports.createCategory = async (req, res) => {
    try {
        const { name, icon = 'tag', description, display_order = 0 } = req.body;
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Category name is required.' });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const result = await db.query(
            'INSERT INTO categories (name, slug, icon, description, display_order) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), slug, icon, description || '', parseInt(display_order, 10)]
        );

        await logAdminAction(req.user.id, 'create_category', 'category', result.insertId, `Created category: ${name}`, req);

        return res.status(201).json({
            success: true,
            message: 'Category created successfully!',
            categoryId: result.insertId
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to create category', error: err.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, description, display_order } = req.body;

        await db.query(`
            UPDATE categories SET
                name = COALESCE(?, name),
                icon = COALESCE(?, icon),
                description = COALESCE(?, description),
                display_order = COALESCE(?, display_order)
            WHERE id = ?
        `, [name, icon, description, display_order, id]);

        return res.json({ success: true, message: 'Category updated successfully!' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update category', error: err.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if there are existing ads in this category
        const adsCount = await db.getOne('SELECT count(*) as count FROM advertisements WHERE category_id = ?', [id]);
        if (adsCount && adsCount.count > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete category: It contains ${adsCount.count} active advertisements. Reassign or remove listings first.`
            });
        }

        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        await logAdminAction(req.user.id, 'delete_category', 'category', id, `Deleted category id ${id}`, req);

        return res.json({ success: true, message: 'Category deleted successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to delete category', error: err.message });
    }
};

exports.createSubcategory = async (req, res) => {
    try {
        const { category_id, name, display_order = 0 } = req.body;
        if (!category_id || !name) {
            return res.status(400).json({ success: false, message: 'Category ID and Subcategory name are required.' });
        }

        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const result = await db.query(
            'INSERT INTO subcategories (category_id, name, slug, display_order) VALUES (?, ?, ?, ?)',
            [category_id, name.trim(), slug, parseInt(display_order, 10)]
        );

        return res.status(201).json({
            success: true,
            message: 'Subcategory added successfully!',
            subcategoryId: result.insertId
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to create subcategory', error: err.message });
    }
};

// 7. REPORTS MANAGEMENT
exports.getAllReports = async (req, res) => {
    try {
        const { status } = req.query;
        let sql = `
            SELECT 
                r.*,
                a.title as ad_title,
                a.price as ad_price,
                a.status as ad_status,
                u_rep.name as reporter_name,
                u_rep.email as reporter_email,
                u_sel.name as seller_name,
                u_sel.email as seller_email,
                (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as ad_image
            FROM reports r
            JOIN advertisements a ON r.advertisement_id = a.id
            JOIN users u_rep ON r.reporter_id = u_rep.id
            JOIN users u_sel ON a.seller_id = u_sel.id
        `;
        const params = [];

        if (status && status !== 'all') {
            sql += ' WHERE r.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY r.created_at DESC';

        const reports = await db.query(sql, params);
        return res.json({ success: true, reports });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch reports', error: err.message });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, admin_notes, takeDownAd } = req.body;

        if (!['pending', 'under_review', 'resolved', 'dismissed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid report status.' });
        }

        const report = await db.getOne('SELECT * FROM reports WHERE id = ?', [id]);
        if (!report) {
            return res.status(404).json({ success: false, message: 'Report not found.' });
        }

        await db.query(
            'UPDATE reports SET status = ?, admin_notes = COALESCE(?, admin_notes), updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, admin_notes, id]
        );

        // If admin opted to take down the violating ad
        if (takeDownAd) {
            await db.query(
                "UPDATE advertisements SET status = 'rejected', rejection_reason = ? WHERE id = ?",
                [`Suspended due to investigated policy violation: ${report.reason}`, report.advertisement_id]
            );
        }

        await logAdminAction(
            req.user.id,
            'resolve_report',
            'report',
            id,
            `Report status updated to ${status}. ${takeDownAd ? 'Violating ad taken down.' : ''}`,
            req
        );

        return res.json({
            success: true,
            message: `Report has been marked as ${status}.`
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to update report', error: err.message });
    }
};

// 8. PLATFORM AUDIT LOGS
exports.getAuditLogs = async (req, res) => {
    try {
        const logs = await db.query(`
            SELECT 
                l.*,
                u.name as admin_name,
                u.email as admin_email
            FROM admin_logs l
            JOIN users u ON l.admin_id = u.id
            ORDER BY l.created_at DESC
            LIMIT 50
        `);

        return res.json({ success: true, logs });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to retrieve logs', error: err.message });
    }
};
