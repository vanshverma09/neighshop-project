import { IUser, AuthResponse } from './types/user.types';
import { IAdvertisement, AdQueryParams } from './types/advertisement.types';
import { ICategory } from './types/category.types';
import { IReport, IAdminLog } from './types/report.types';

const API_BASE = 'http://localhost:5000/api';

export function getAdminToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function setAdminAuth(token: string, user: IUser): void {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_user', JSON.stringify(user));
}

export function clearAdminAuth(): void {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function getAdminUser(): IUser | null {
  const user = localStorage.getItem('admin_user');
  return user ? JSON.parse(user) : null;
}

export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `API request failed with status ${response.status}`);
  }

  return data as T;
}

export interface AdminStatsResponse {
  success: boolean;
  stats: {
    users: {
      total_users: number;
      total_sellers: number;
      total_buyers: number;
      active_users: number;
      suspended_users: number;
    };
    advertisements: {
      total_ads: number;
      pending_ads: number;
      approved_ads: number;
      rejected_ads: number;
      sold_ads: number;
      featured_ads: number;
    };
    reports: {
      total_reports: number;
      pending_reports: number;
      resolved_reports: number;
    };
    enquiriesCount: number;
  };
  categoryBreakdown: { name: string; ad_count: number }[];
  recentPending: IAdvertisement[];
  recentReports: IReport[];
}

export const adminApi = {
  // Auth
  login: (email: string, password: string) => apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getProfile: () => apiRequest<{ success: boolean; user: IUser }>('/auth/profile'),

  // Dashboard Stats
  getStats: () => apiRequest<AdminStatsResponse>('/admin/stats'),

  // Advertisements
  getAdvertisements: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      advertisements: IAdvertisement[];
    }>(`/admin/advertisements?${qs}`);
  },
  updateAdStatus: (id: number | string, status: string, rejection_reason: string | null = null) =>
    apiRequest<{ success: boolean; message: string; status: string; rejection_reason?: string }>(`/admin/advertisements/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, rejection_reason })
    }),
  toggleFeatured: (id: number | string) =>
    apiRequest<{ success: boolean; is_featured: boolean; message: string }>(`/admin/advertisements/${id}/featured`, {
      method: 'PATCH'
    }),

  // Users
  getUsers: (params: Record<string, any> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest<{
      success: boolean;
      total: number;
      page: number;
      totalPages: number;
      users: IUser[];
    }>(`/admin/users?${qs}`);
  },
  updateUserStatus: (id: number | string, status: string) =>
    apiRequest<{ success: boolean; message: string }>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  // Categories
  getCategories: () => apiRequest<{ success: boolean; categories: ICategory[] }>('/categories'),
  createCategory: (data: { name: string; icon?: string; description?: string; display_order?: number }) =>
    apiRequest<{ success: boolean; message: string; categoryId: number }>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
  updateCategory: (id: number | string, data: Partial<ICategory>) =>
    apiRequest<{ success: boolean; message: string }>(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
  deleteCategory: (id: number | string) =>
    apiRequest<{ success: boolean; message: string }>(`/admin/categories/${id}`, {
      method: 'DELETE'
    }),
  createSubcategory: (data: { category_id: number; name: string; display_order?: number }) =>
    apiRequest<{ success: boolean; message: string; subcategoryId: number }>('/admin/subcategories', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  // Reports
  getReports: (status = 'all') =>
    apiRequest<{ success: boolean; reports: IReport[] }>(`/admin/reports?status=${status}`),
  updateReportStatus: (id: number | string, data: { status: string; admin_notes?: string; takeDownAd?: boolean }) =>
    apiRequest<{ success: boolean; message: string }>(`/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    }),

  // Logs
  getAuditLogs: () => apiRequest<{ success: boolean; logs: IAdminLog[] }>('/admin/audit-logs')
};
