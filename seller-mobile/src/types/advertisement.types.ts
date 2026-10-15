export type AdStatus = 'pending' | 'approved' | 'rejected' | 'sold';
export type ProductCondition = 'new' | 'used_like_new' | 'used_good' | 'used_fair';

export interface IAdImage {
  id: number;
  advertisement_id: number;
  image_url: string;
  is_primary: boolean;
  display_order: number;
  created_at?: string;
}

export interface IAdvertisement {
  id: number;
  seller_id: number;
  category_id: number;
  subcategory_id?: number | null;
  title: string;
  description: string;
  price: number;
  product_condition: ProductCondition;
  location: string;
  city: string;
  state: string;
  latitude?: number | null;
  longitude?: number | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  status: AdStatus;
  rejection_reason?: string | null;
  is_featured: boolean;
  views_count: number;
  created_at: string;
  updated_at?: string;
  
  // Joined fields
  category_name?: string;
  category_icon?: string;
  subcategory_name?: string;
  seller_name?: string;
  seller_email?: string;
  seller_phone?: string;
  seller_avatar?: string;
  seller_joined?: string;
  seller_rating?: number;
  seller_sales?: number;
  seller_verified?: boolean;
  business_name?: string;
  seller_business_name?: string;
  primary_image?: string;
  images?: IAdImage[];
  is_favourited?: boolean;
  similar?: IAdvertisement[];
}

export interface CreateAdDTO {
  title: string;
  description: string;
  price: number;
  category_id: number;
  subcategory_id?: number | null;
  product_condition?: ProductCondition;
  location: string;
  city: string;
  state: string;
  contact_phone?: string;
  contact_email?: string;
  images?: string[];
}

export interface UpdateAdDTO extends Partial<CreateAdDTO> {
  status?: AdStatus;
}
