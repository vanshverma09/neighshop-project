export type EnquiryStatus = 'pending' | 'replied' | 'closed';

export interface IEnquiry {
  id: number;
  advertisement_id: number;
  buyer_id: number;
  seller_id: number;
  message: string;
  phone?: string | null;
  status: EnquiryStatus;
  created_at: string;
  updated_at?: string;
  
  // Joined fields
  buyer_name?: string;
  buyer_email?: string;
  ad_title?: string;
  ad_price?: number;
  ad_image?: string;
}
