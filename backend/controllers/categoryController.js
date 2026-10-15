const db = require('../database/db');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await db.query('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
        const subcategories = await db.query('SELECT * FROM subcategories ORDER BY display_order ASC, name ASC');

        // Fetch ad count per category
        const counts = await db.query(`
            SELECT category_id, count(*) as count 
            FROM advertisements 
            WHERE status = 'approved' 
            GROUP BY category_id
        `);
        const countMap = {};
        counts.forEach(c => { countMap[c.category_id] = c.count; });

        const formatted = categories.map(cat => ({
            ...cat,
            ad_count: countMap[cat.id] || 0,
            subcategories: subcategories.filter(sub => sub.category_id === cat.id)
        }));

        return res.json({
            success: true,
            categories: formatted
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch categories', error: err.message });
    }
};

exports.getCategoryBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const category = await db.getOne('SELECT * FROM categories WHERE slug = ?', [slug]);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        const subcategories = await db.query('SELECT * FROM subcategories WHERE category_id = ? ORDER BY display_order ASC', [category.id]);
        return res.json({
            success: true,
            category: {
                ...category,
                subcategories
            }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Failed to fetch category', error: err.message });
    }
};
