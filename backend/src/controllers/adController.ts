import { Request, Response } from 'express';
import { query, getOne, QueryResult } from '../database/db';
import { IAdvertisement, IAdImage, AdQueryParams } from '../types/shared/advertisement.types';

// 1. GET ALL APPROVED ADS (Public Marketplace with Filters & Pagination)
export async function getAdvertisements(req: Request, res: Response): Promise<void> {
  try {
    const {
      search,
      categoryId,
      subcategoryId,
      minPrice,
      maxPrice,
      condition,
      city,
      location,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query as unknown as AdQueryParams;

    const pageNum = Math.max(1, parseInt(String(page || 1), 10));
    const limitNum = Math.max(1, parseInt(String(limit || 12), 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = ["a.status = 'approved'"];
    const params: any[] = [];

    if (search && typeof search === 'string' && search.trim() !== '') {
      conditions.push('(LOWER(a.title) LIKE ? OR LOWER(a.description) LIKE ?)');
      const term = `%${search.toLowerCase().trim()}%`;
      params.push(term, term);
    }

    if (categoryId) {
      conditions.push('a.category_id = ?');
      params.push(parseInt(String(categoryId), 10));
    }

    if (subcategoryId) {
      conditions.push('a.subcategory_id = ?');
      params.push(parseInt(String(subcategoryId), 10));
    }

    if (minPrice) {
      conditions.push('a.price >= ?');
      params.push(parseFloat(String(minPrice)));
    }

    if (maxPrice) {
      conditions.push('a.price <= ?');
      params.push(parseFloat(String(maxPrice)));
    }

    if (condition) {
      conditions.push('a.product_condition = ?');
      params.push(condition);
    }

    if (city && city !== 'All India' && typeof city === 'string' && city.trim() !== '') {
      conditions.push('LOWER(a.city) = ?');
      params.push(city.toLowerCase().trim());
    }

    if (location && typeof location === 'string' && location.trim() !== '') {
      conditions.push('LOWER(a.location) LIKE ?');
      params.push(`%${location.toLowerCase().trim()}%`);
    }

    let orderBy = 'a.is_featured DESC, a.created_at DESC';
    if (sort === 'oldest') orderBy = 'a.created_at ASC';
    else if (sort === 'price_asc') orderBy = 'a.price ASC';
    else if (sort === 'price_desc') orderBy = 'a.price DESC';

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching items
    const countQuery = `SELECT count(*) as total FROM advertisements a ${whereClause}`;
    const totalResult = await query<{ total: number }>(countQuery, params);
    const total = totalResult[0] ? totalResult[0].total : 0;

    // Fetch paginated listings
    const dataQuery = `
      SELECT 
        a.id, a.seller_id, a.category_id, a.subcategory_id, a.title, 
        a.description, a.price, a.product_condition, a.location, a.city, 
        a.state, a.status, a.is_featured, a.views_count, a.created_at,
        c.name as category_name,
        c.icon as category_icon,
        sc.name as subcategory_name,
        u.name as seller_name,
        u.avatar_url as seller_avatar,
        (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
      FROM advertisements a
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
      JOIN users u ON a.seller_id = u.id
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const queryParams = [...params, limitNum, offset];
    const items = await query<IAdvertisement>(dataQuery, queryParams);

    // Check if user has favorited
    let userFavIds = new Set<number>();
    if (req.user) {
      const favs = await query<{ advertisement_id: number }>(
        'SELECT advertisement_id FROM favourites WHERE user_id = ?',
        [req.user.id]
      );
      userFavIds = new Set(favs.map(f => f.advertisement_id));
    }

    const formatted = items.map(item => ({
      ...item,
      is_featured: Boolean(item.is_featured),
      is_favourited: userFavIds.has(item.id)
    }));

    res.json({
      success: true,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      advertisements: formatted
    });
  } catch (err: any) {
    console.error('Error fetching ads:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve advertisements.', error: err.message });
  }
}

// 2. GET FEATURED ADS
export async function getFeaturedAds(_req: Request, res: Response): Promise<void> {
  try {
    const items = await query<IAdvertisement>(`
      SELECT 
        a.id, a.title, a.price, a.location, a.city, a.created_at, a.is_featured, a.status,
        c.name as category_name,
        (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
      FROM advertisements a
      JOIN categories c ON a.category_id = c.id
      WHERE a.status = 'approved' AND a.is_featured = 1
      ORDER BY a.created_at DESC
      LIMIT 6
    `);

    res.json({
      success: true,
      featured: items.map(i => ({ ...i, is_featured: Boolean(i.is_featured) }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured ads', error: err.message });
  }
}

// 3. GET SINGLE AD DETAILS
export async function getAdvertisementById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const ad = await getOne<IAdvertisement>(`
      SELECT 
        a.*,
        c.name as category_name,
        sc.name as subcategory_name,
        u.name as seller_name,
        u.email as seller_email,
        u.phone as seller_phone,
        u.avatar_url as seller_avatar,
        u.created_at as seller_joined,
        sp.business_name,
        sp.bio as seller_bio,
        sp.rating as seller_rating,
        sp.total_sales as seller_sales,
        sp.is_verified as seller_verified
      FROM advertisements a
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN subcategories sc ON a.subcategory_id = sc.id
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN seller_profiles sp ON sp.user_id = u.id
      WHERE a.id = ?
    `, [id]);

    if (!ad) {
      res.status(404).json({ success: false, message: 'Advertisement not found.' });
      return;
    }

    // If not approved, only seller or admin can view
    if (ad.status !== 'approved') {
      const isOwner = req.user && req.user.id === ad.seller_id;
      const isAdmin = req.user && req.user.role === 'admin';
      if (!isOwner && !isAdmin) {
        res.status(403).json({ success: false, message: 'This advertisement is not publicly active.' });
        return;
      }
    }

    // Increment view count
    await query('UPDATE advertisements SET views_count = views_count + 1 WHERE id = ?', [id]);

    // Fetch all images
    const images = await query<IAdImage>(
      'SELECT id, image_url, is_primary FROM advertisement_images WHERE advertisement_id = ? ORDER BY is_primary DESC, id ASC',
      [id]
    );

    // Check favourite status
    let isFavourited = false;
    if (req.user) {
      const fav = await getOne<{ id: number }>(
        'SELECT id FROM favourites WHERE user_id = ? AND advertisement_id = ?',
        [req.user.id, id]
      );
      isFavourited = !!fav;
    }

    // Similar products in same category
    const similar = await query<IAdvertisement>(`
      SELECT 
        a.id, a.title, a.price, a.location, a.city, a.created_at,
        (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
      FROM advertisements a
      WHERE a.category_id = ? AND a.id != ? AND a.status = 'approved'
      ORDER BY a.created_at DESC
      LIMIT 4
    `, [ad.category_id, id]);

    res.json({
      success: true,
      advertisement: {
        ...ad,
        is_featured: Boolean(ad.is_featured),
        seller_verified: Boolean(ad.seller_verified),
        images: images.length > 0 ? images : [{ id: 0, advertisement_id: Number(id), image_url: 'https://images.unsplash.com/photo-1581291518655-9523843770d1?w=800', is_primary: true, display_order: 1 }],
        is_favourited: isFavourited,
        similar
      }
    });
  } catch (err: any) {
    console.error('Error fetching ad detail:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve advertisement.', error: err.message });
  }
}

// 4. CREATE ADVERTISEMENT (Seller Only)
export async function createAdvertisement(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const {
      title,
      description,
      price,
      category_id,
      subcategory_id,
      product_condition = 'used_good',
      location = 'Mumbai',
      city = 'Mumbai',
      state = 'Maharashtra',
      contact_phone,
      contact_email,
      imageUrls,
      images
    } = req.body;

    if (!title || !description || !price || !category_id) {
      res.status(400).json({ success: false, message: 'Title, description, price, and category are required.' });
      return;
    }

    const sellerId = req.user.id;
    const phone = contact_phone || req.user.phone || '';
    const email = contact_email || req.user.email || '';

    // Insertion into advertisements (status = 'pending')
    const result = await query<QueryResult>(`
      INSERT INTO advertisements (
        seller_id, category_id, subcategory_id, title, description, 
        price, product_condition, location, city, state, 
        contact_phone, contact_email, status, is_featured, views_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0)
    `, [
      sellerId,
      parseInt(category_id, 10),
      subcategory_id ? parseInt(subcategory_id, 10) : null,
      String(title).trim(),
      String(description).trim(),
      parseFloat(price),
      product_condition,
      location,
      city,
      state,
      phone,
      email
    ]);

    const adId = result[0]?.insertId || (result as any).insertId;

    // Process images (either uploaded files or image URLs)
    const imagesToInsert: { url: string; isPrimary: number }[] = [];

    // 1. Files uploaded via Multer
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      req.files.forEach((file, index) => {
        const fullUrl = `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
        imagesToInsert.push({ url: fullUrl, isPrimary: index === 0 ? 1 : 0 });
      });
    }

    // 2. Additional URLs passed as array or comma-separated string
    const rawImages = images || imageUrls;
    if (rawImages) {
      const urls = Array.isArray(rawImages) ? rawImages : [rawImages];
      urls.forEach((url, idx) => {
        if (url && typeof url === 'string' && url.trim().startsWith('http')) {
          imagesToInsert.push({
            url: url.trim(),
            isPrimary: imagesToInsert.length === 0 && idx === 0 ? 1 : 0
          });
        }
      });
    }


    // If no images provided, use clean fallback
    if (imagesToInsert.length === 0) {
      imagesToInsert.push({
        url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800',
        isPrimary: 1
      });
    }

    for (let i = 0; i < imagesToInsert.length; i++) {
      await query(
        'INSERT INTO advertisement_images (advertisement_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)',
        [adId, imagesToInsert[i].url, imagesToInsert[i].isPrimary, i + 1]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Advertisement submitted successfully! It is currently pending administrative review.',
      adId,
      status: 'pending',
      advertisement: { id: adId, status: 'pending' }
    });
  } catch (err: any) {
    console.error('Error creating advertisement:', err);
    res.status(500).json({ success: false, message: 'Failed to create advertisement.', error: err.message });
  }
}

// 5. UPDATE ADVERTISEMENT (Owner Seller or Admin)
export async function updateAdvertisement(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const ad = await getOne<IAdvertisement>('SELECT * FROM advertisements WHERE id = ?', [id]);

    if (!ad) {
      res.status(404).json({ success: false, message: 'Advertisement not found.' });
      return;
    }

    if (ad.seller_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'You are not authorized to edit this advertisement.' });
      return;
    }

    const {
      title,
      description,
      price,
      category_id,
      subcategory_id,
      product_condition,
      location,
      city,
      state,
      contact_phone
    } = req.body;

    await query(`
      UPDATE advertisements SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        price = COALESCE(?, price),
        category_id = COALESCE(?, category_id),
        subcategory_id = COALESCE(?, subcategory_id),
        product_condition = COALESCE(?, product_condition),
        location = COALESCE(?, location),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        contact_phone = COALESCE(?, contact_phone)
      WHERE id = ?
    `, [
      title,
      description,
      price ? parseFloat(price) : null,
      category_id ? parseInt(category_id, 10) : null,
      subcategory_id ? parseInt(subcategory_id, 10) : null,
      product_condition,
      location,
      city,
      state,
      contact_phone,
      id
    ]);

    res.json({
      success: true,
      message: 'Advertisement updated successfully!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update advertisement', error: err.message });
  }
}

// 6. DELETE ADVERTISEMENT
export async function deleteAdvertisement(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const ad = await getOne<IAdvertisement>('SELECT * FROM advertisements WHERE id = ?', [id]);

    if (!ad) {
      res.status(404).json({ success: false, message: 'Advertisement not found.' });
      return;
    }

    if (ad.seller_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'You cannot delete another seller’s advertisement.' });
      return;
    }

    await query('DELETE FROM advertisements WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Advertisement deleted successfully.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to delete advertisement', error: err.message });
  }
}

// 7. MARK AS SOLD
export async function markAsSold(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const ad = await getOne<IAdvertisement>('SELECT * FROM advertisements WHERE id = ?', [id]);

    if (!ad) {
      res.status(404).json({ success: false, message: 'Advertisement not found.' });
      return;
    }

    if (ad.seller_id !== req.user.id && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized action.' });
      return;
    }

    await query("UPDATE advertisements SET status = 'sold' WHERE id = ?", [id]);

    res.json({
      success: true,
      message: 'Advertisement marked as sold.'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to update ad status', error: err.message });
  }
}

// 8. GET SELLER'S OWN ADS (With status filter)
export async function getMyAdvertisements(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { status } = req.query; // 'all', 'approved', 'pending', 'rejected', 'sold'
    const sellerId = req.user.id;

    let sql = `
      SELECT 
        a.*,
        c.name as category_name,
        (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
      FROM advertisements a
      JOIN categories c ON a.category_id = c.id
      WHERE a.seller_id = ?
    `;
    const params: any[] = [sellerId];

    if (status && status !== 'all') {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY a.created_at DESC';

    const ads = await query<IAdvertisement>(sql, params);

    // Compute summary counts for the seller dashboard
    const counts = await query<{
      total: number;
      approved_count: number;
      pending_count: number;
      rejected_count: number;
      sold_count: number;
    }>(`
      SELECT 
        count(*) as total,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'sold' THEN 1 ELSE 0 END) as sold_count
      FROM advertisements
      WHERE seller_id = ?
    `, [sellerId]);

    res.json({
      success: true,
      counts: counts[0] || { total: 0, approved_count: 0, pending_count: 0, rejected_count: 0, sold_count: 0 },
      advertisements: ads.map(a => ({
        ...a,
        is_featured: Boolean(a.is_featured)
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve your advertisements', error: err.message });
  }
}
