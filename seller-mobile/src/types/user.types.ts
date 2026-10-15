export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deleted';

export interface IUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  avatar_url?: string | null;
  is_verified?: boolean;
  business_name?: string | null;
  business_address?: string | null;
  seller_rating?: number;
  total_sales?: number;
  created_at: string;
  updated_at?: string;
}

export interface AuthResponse {
  token: string;
  user: IUser;
}
