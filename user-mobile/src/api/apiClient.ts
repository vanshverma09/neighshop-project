import { IAdvertisement, AdQueryParams } from '../types/advertisement.types';
import { ICategory } from '../types/category.types';
import { IUser, AuthResponse } from '../types/user.types';
import { IEnquiry } from '../types/enquiry.types';

const API_BASE = 'http://localhost:5000/api';

let authToken: string | null = null;
let cachedUser: IUser | null = null;

export function setAuthToken(token: string | null, user?: IUser | null): void {
  authToken = token;
  if (user !== undefined) cachedUser = user;
}

export function getAuthToken(): string | null {
  return authToken;
}

export function getCachedUser(): IUser | null {
  return cachedUser;
}

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data as T;
}

export const userApi = {
  // Authentication
  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  register: (data: { name: string; email: string; password: string; phone?: string }) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...data, role: 'buyer' })
    }),

  getProfile: () => apiFetch<{ success: boolean; user: IUser; stats: any }>('/auth/profile'),

  // Advertisements Feed
  getAdvertisements: (params: AdQueryParams = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    return apiFetch<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      advertisements: IAdvertisement[];
    }>(`/advertisements?${query.toString()}`);
  },

  getFeaturedAds: () =>
    apiFetch<{ success: boolean; featured: IAdvertisement[] }>('/advertisements/featured'),

  getAdvertisementById: (id: number | string) =>
    apiFetch<{ success: boolean; advertisement: IAdvertisement }>(`/advertisements/${id}`),

  // Categories
  getCategories: () =>
    apiFetch<{ success: boolean; categories: ICategory[] }>('/categories'),

  // Wishlist / Favorites
  getWishlist: () =>
    apiFetch<{ success: boolean; total: number; wishlist: IAdvertisement[] }>('/wishlist'),

  toggleWishlist: (adId: number | string) =>
    apiFetch<{ success: boolean; is_favourited: boolean; message: string }>(`/wishlist/${adId}/toggle`, {
      method: 'POST'
    }),

  // Buyer Inquiries / Chat
  createEnquiry: (advertisement_id: number, message: string) =>
    apiFetch<{ success: boolean; message: string; enquiryId: number }>('/enquiries', {
      method: 'POST',
      body: JSON.stringify({ advertisement_id, message })
    }),

  getBuyerEnquiries: () =>
    apiFetch<{ success: boolean; enquiries: IEnquiry[] }>('/enquiries/buyer'),

  // Safety Reports
  submitReport: (advertisement_id: number, reason: string, description: string) =>
    apiFetch<{ success: boolean; message: string; reportId: number }>('/reports', {
      method: 'POST',
      body: JSON.stringify({ advertisement_id, reason, description })
    })
};
