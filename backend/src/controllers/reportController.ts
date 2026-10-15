import { Request, Response } from 'express';
import { query, getOne, QueryResult } from '../database/db';
import { IAdvertisement } from '../types/shared/advertisement.types';

export async function submitReport(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const reporterId = req.user.id;
    const { advertisement_id, reason, description } = req.body;

    if (!advertisement_id || !reason) {
      res.status(400).json({ success: false, message: 'Advertisement ID and violation reason are required.' });
      return;
    }

    const validReasons = ['spam', 'fraud', 'offensive', 'counterfeit', 'duplicate', 'wrong_category', 'other'];
    if (!validReasons.includes(reason)) {
      res.status(400).json({ success: false, message: `Invalid reason. Must be one of: ${validReasons.join(', ')}` });
      return;
    }

    const ad = await getOne<IAdvertisement>('SELECT id FROM advertisements WHERE id = ?', [advertisement_id]);
    if (!ad) {
      res.status(404).json({ success: false, message: 'Advertisement not found.' });
      return;
    }

    const result = await query<QueryResult>(
      'INSERT INTO reports (advertisement_id, reporter_id, reason, description, status) VALUES (?, ?, ?, ?, ?)',
      [advertisement_id, reporterId, reason, description || '', 'pending']
    );

    const reportId = result[0]?.insertId || (result as any).insertId;

    res.status(201).json({
      success: true,
      message: 'Report submitted successfully. Our safety moderation team will investigate.',
      reportId
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to submit report', error: err.message });
  }
}
