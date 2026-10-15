import { Request, Response } from 'express';
import { query, getOne } from '../database/db';
import { IUser } from '../types/shared/user.types';
import { IAdvertisement } from '../types/shared/advertisement.types';

export async function getSellerPublicProfile(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const seller = await getOne<IUser & {
      business_name?: string;
      bio?: string;
      rating?: number;
      total_sales?: number;
      city?: string;
      state?: string;
      is_verified?: boolean;
    }>(`
      SELECT 
        u.id, u.name, u.avatar_url, u.created_at,
        sp.business_name, sp.bio, sp.rating, sp.total_sales, sp.city, sp.state, sp.is_verified
      FROM users u
      LEFT JOIN seller_profiles sp ON sp.user_id = u.id
      WHERE u.id = ? AND u.status = 'active'
    `, [id]);

    if (!seller) {
      res.status(404).json({ success: false, message: 'Seller profile not found' });
      return;
    }

    const activeAds = await query<IAdvertisement>(`
      SELECT 
        a.id, a.title, a.price, a.product_condition, a.location, a.city, a.created_at,
        c.name as category_name,
        (SELECT image_url FROM advertisement_images WHERE advertisement_id = a.id ORDER BY is_primary DESC, id ASC LIMIT 1) as primary_image
      FROM advertisements a
      JOIN categories c ON a.category_id = c.id
      WHERE a.seller_id = ? AND a.status = 'approved'
      ORDER BY a.created_at DESC
    `, [id]);

    res.json({
      success: true,
      seller: {
        ...seller,
        is_verified: Boolean(seller.is_verified)
      },
      activeAds: activeAds.map(a => ({
        ...a,
        is_featured: Boolean(a.is_featured)
      }))
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch seller profile', error: err.message });
  }
}
