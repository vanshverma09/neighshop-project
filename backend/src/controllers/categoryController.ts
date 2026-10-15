import { Request, Response } from 'express';
import { query, getOne } from '../database/db';
import { ICategory, ISubcategory } from '../types/shared/category.types';

export async function getAllCategories(_req: Request, res: Response): Promise<void> {
  try {
    const categories = await query<ICategory>('SELECT * FROM categories ORDER BY display_order ASC, name ASC');
    const subcategories = await query<ISubcategory>('SELECT * FROM subcategories ORDER BY display_order ASC, name ASC');

    // Fetch ad count per category
    const counts = await query<{ category_id: number; count: number }>(`
      SELECT category_id, count(*) as count 
      FROM advertisements 
      WHERE status = 'approved' 
      GROUP BY category_id
    `);

    const countMap: Record<number, number> = {};
    counts.forEach(c => {
      countMap[c.category_id] = c.count;
    });

    const formatted: ICategory[] = categories.map(cat => ({
      ...cat,
      ad_count: countMap[cat.id] || 0,
      subcategories: subcategories.filter(sub => sub.category_id === cat.id)
    }));

    res.json({
      success: true,
      categories: formatted
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch categories', error: err.message });
  }
}

export async function getCategoryBySlug(req: Request, res: Response): Promise<void> {
  try {
    const { slug } = req.params;
    const category = await getOne<ICategory>('SELECT * FROM categories WHERE slug = ?', [slug]);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }
    const subcategories = await query<ISubcategory>(
      'SELECT * FROM subcategories WHERE category_id = ? ORDER BY display_order ASC',
      [category.id]
    );

    res.json({
      success: true,
      category: {
        ...category,
        subcategories
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch category', error: err.message });
  }
}
