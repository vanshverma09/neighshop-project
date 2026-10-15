export type ReportReason = 'fraud' | 'inappropriate' | 'duplicate' | 'spam' | 'wrong_category' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'dismissed' | 'action_taken';

export interface IReport {
  id: number;
  reporter_id: number;
  advertisement_id: number;
  reason: ReportReason;
  description?: string | null;
  status: ReportStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
  reporter_name?: string;
  ad_title?: string;
  seller_id?: number;
  seller_name?: string;
}
