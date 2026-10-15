export type EnquiryStatus = 'pending' | 'responded' | 'replied' | 'closed';

export interface IEnquiry {
  id: number;
  advertisement_id: number;
  buyer_id: number;
  seller_id: number;
  message: string;
  reply?: string | null;
  phone?: string | null;
  status: EnquiryStatus;
  created_at: string;
  updated_at?: string;
  
  // Joined fields
  buyer_name?: string;
  buyer_email?: string;
  buyer_phone?: string;
  buyer_avatar?: string;
  ad_title?: string;
  ad_price?: number;
  ad_image?: string;
}
