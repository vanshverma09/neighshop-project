export type UserRole = 'buyer' | 'seller' | 'admin';
export type UserStatus = 'active' | 'suspended' | 'deactivated';

export interface IUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  avatar_url?: string | null;
  role: UserRole;
  status: UserStatus;
  created_at?: string;
  updated_at?: string;
}

export interface ISellerProfile {
  id: number;
  user_id: number;
  business_name?: string | null;
  bio?: string | null;
  rating: number;
  total_sales: number;
  address?: string | null;
  city: string;
  state: string;
  is_verified: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: IUser;
  sellerProfile?: ISellerProfile | null;
  error?: string;
}
