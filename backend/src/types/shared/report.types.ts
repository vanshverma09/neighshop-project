export type ReportReason =
  | 'spam'
  | 'fraud'
  | 'offensive'
  | 'counterfeit'
  | 'duplicate'
  | 'wrong_category'
  | 'other';

export type ReportStatus = 'pending' | 'under_review' | 'resolved' | 'dismissed';

export interface IReport {
  id: number;
  advertisement_id: number;
  reporter_id: number;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;

  // Joined fields
  ad_title?: string;
  ad_price?: number;
  ad_status?: string;
  ad_image?: string;
  reporter_name?: string;
  reporter_email?: string;
  seller_name?: string;
  seller_email?: string;
}

export interface IAdminLog {
  id: number;
  admin_id: number;
  action_type: string;
  target_entity: string;
  target_id?: number | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
}
