import { Request, Response } from 'express';
import { query, getOne, QueryResult } from '../database/db';
import { IEnquiry } from '../types/shared/enquiry.types';
import { IAdvertisement } from '../types/shared/advertisement.types';

// 1. BUYER SENDS ENQUIRY
export async function createEnquiry(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const buyerId = req.user.id;
    const { advertisement_id, message } = req.body;

    if (!advertisement_id || !message || String(message).trim() === '') {
      res.status(400).json({ success: false, message: 'Advertisement ID and message are required.' });
      return;
    }

    const ad = await getOne<IAdvertisement>('SELECT id, seller_id, title FROM advertisements WHERE id = ?', [advertisement_id]);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Advertisement not found.' });
      return;
    }

    if (ad.seller_id === buyerId) {
      res.status(400).json({ success: false, message: 'You cannot send an enquiry on your own advertisement.' });
      return;
    }

    const result = await query<QueryResult>(
      'INSERT INTO enquiries (advertisement_id, buyer_id, seller_id, message, status) VALUES (?, ?, ?, ?, ?)',
      [advertisement_id, buyerId, ad.seller_id, String(message).trim(), 'pending']
    );

    const enquiryId = result[0]?.insertId || (result as any).insertId;

    res.status(201).json({
      success: true,
      message: 'Your enquiry has been delivered to the seller!',
      enquiryId,
      enquiry: { id: enquiryId }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to send enquiry', error: err.message });
  }
}

// 2. BUYER VIEWS SUBMITTED ENQUIRIES
export async function getBuyerEnquiries(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const buyerId = req.user.id;

    const items = await query<IEnquiry>(`
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

    res.json({
      success: true,
      enquiries: items
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch enquiries', error: err.message });
  }
}

// 3. SELLER VIEWS RECEIVED ENQUIRIES
export async function getSellerEnquiries(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const sellerId = req.user.id;

    const items = await query<IEnquiry>(`
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

    res.json({
      success: true,
      enquiries: items
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch seller enquiries', error: err.message });
  }
}

// 4. SELLER REPLIES TO ENQUIRY
export async function replyEnquiry(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const { reply } = req.body;
    const sellerId = req.user.id;

    const replyText = reply && String(reply).trim() !== '' 
      ? String(reply).trim() 
      : 'Thank you for your interest! The item is available.';

    const enquiry = await getOne<IEnquiry>('SELECT * FROM enquiries WHERE id = ?', [id]);
    if (!enquiry) {
      res.status(404).json({ success: false, message: 'Enquiry not found.' });
      return;
    }

    if (enquiry.seller_id !== sellerId && req.user.role !== 'admin') {
      res.status(403).json({ success: false, message: 'Unauthorized to respond to this enquiry.' });
      return;
    }

    await query(
      "UPDATE enquiries SET reply = ?, status = 'responded', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [replyText, id]
    );

    res.json({
      success: true,
      message: 'Reply sent to buyer successfully!'
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to send reply', error: err.message });
  }
}
