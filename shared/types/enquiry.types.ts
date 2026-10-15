export type EnquiryStatus = 'pending' | 'responded' | 'closed';

export interface IEnquiry {
  id: number;
  advertisement_id: number;
  buyer_id: number;
  seller_id: number;
  message: string;
  reply?: string | null;
  status: EnquiryStatus;
  created_at: string;
  updated_at?: string;

  // Joined fields
  ad_title?: string;
  ad_price?: number;
  ad_status?: string;
  ad_image?: string;
  seller_name?: string;
  seller_avatar?: string;
  seller_phone?: string;
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_avatar?: string;
}
