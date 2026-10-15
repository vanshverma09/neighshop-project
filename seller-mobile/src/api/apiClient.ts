import {
  IAdvertisement,
  CreateAdDTO,
  UpdateAdDTO,
  ICategory,
  IEnquiry,
  IUser,
  AuthResponse
} from '../types';
import { CONFIG } from '../config';

const BASE_URL = CONFIG.API_BASE;

type AuthChangeListener = (user: IUser | null) => void;

class SellerApiClient {
  private token: string | null = null;
  private currentUser: IUser | null = null;
  private authListeners: AuthChangeListener[] = [];
  private onSessionExpiredCallback: (() => void) | null = null;

  constructor() {
    // Attempt automatic login for demo seller
    this.login('seller@neighshop.com', 'Seller@123').catch(() => {
      // server still starting or offline
    });
  }

  setToken(token: string | null) {
    this.token = token;
  }

  getToken(): string | null {
    return this.token;
  }

  setCurrentUser(user: IUser | null) {
    this.currentUser = user;
    this.notifyAuthListeners();
  }

  getCurrentUser(): IUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  subscribeAuthChange(listener: AuthChangeListener): () => void {
    this.authListeners.push(listener);
    listener(this.currentUser);
    return () => {
      this.authListeners = this.authListeners.filter(l => l !== listener);
    };
  }

  private notifyAuthListeners() {
    this.authListeners.forEach(listener => {
      try {
        listener(this.currentUser);
      } catch (e) {
        console.error('Error in seller auth listener:', e);
      }
    });
  }

  setOnSessionExpired(callback: () => void) {
    this.onSessionExpiredCallback = callback;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.token) {
      this.token = null;
      this.currentUser = null;
      this.notifyAuthListeners();
      if (this.onSessionExpiredCallback) {
        this.onSessionExpiredCallback();
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data as T;
  }

  // --- Authentication ---
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    this.setCurrentUser(res.user);
    return res;
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    business_name?: string;
    business_address?: string;
  }): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        ...data,
        role: 'seller'
      }),
    });
    this.setToken(res.token);
    this.setCurrentUser(res.user);
    return res;
  }

  async logout(): Promise<void> {
    try {
      if (this.token) {
        await this.request('/auth/logout', { method: 'POST' });
      }
    } catch {
      // ignore network errors on logout
    } finally {
      this.token = null;
      this.currentUser = null;
      this.notifyAuthListeners();
    }
  }

  // --- Categories ---
  async getCategories(): Promise<{ categories: ICategory[] }> {
    return this.request<{ categories: ICategory[] }>('/categories');
  }

  // --- Seller Advertisements ---
  async getMyAdvertisements(status?: string): Promise<{
    advertisements: IAdvertisement[];
    counts: {
      total: number;
      approved_count: number;
      pending_count: number;
      rejected_count: number;
      sold_count: number;
    };
  }> {
    const q = status && status !== 'all' ? `?status=${status}` : '';
    return this.request<{
      advertisements: IAdvertisement[];
      counts: {
        total: number;
        approved_count: number;
        pending_count: number;
        rejected_count: number;
        sold_count: number;
      };
    }>(`/advertisements/my-ads${q}`);
  }

  async getAdvertisementById(id: number): Promise<{ advertisement: IAdvertisement }> {
    return this.request<{ advertisement: IAdvertisement }>(`/advertisements/${id}`);
  }

  async createAdvertisement(dto: CreateAdDTO): Promise<{ message: string; adId: number; advertisement: IAdvertisement }> {
    return this.request<{ message: string; adId: number; advertisement: IAdvertisement }>('/advertisements', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateAdvertisement(id: number, dto: UpdateAdDTO): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/advertisements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteAdvertisement(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/advertisements/${id}`, {
      method: 'DELETE',
    });
  }

  async markAsSold(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/advertisements/${id}/sold`, {
      method: 'PATCH',
    });
  }

  async uploadImages(formData: FormData): Promise<{ success: boolean; urls: string[]; url: string; message: string }> {
    return this.request<{ success: boolean; urls: string[]; url: string; message: string }>('/advertisements/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // --- Enquiries ---
  async getSellerEnquiries(): Promise<{ enquiries: IEnquiry[] }> {
    return this.request<{ enquiries: IEnquiry[] }>('/enquiries/seller');
  }

  async replyToEnquiry(id: number, reply: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/enquiries/${id}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ reply }),
    });
  }

  async updateEnquiryStatus(id: number, status: 'replied' | 'closed'): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // --- Profile ---
  async getProfile(): Promise<{ user: IUser; sellerProfile?: any; stats?: { favouritesCount: number; myAdsCount: number } }> {
    return this.request<{ user: IUser; sellerProfile?: any; stats?: { favouritesCount: number; myAdsCount: number } }>('/auth/profile');
  }

  async updateProfile(data: {
    name?: string;
    phone?: string;
    avatar_url?: string;
    business_name?: string;
    business_address?: string;
    bio?: string;
    city?: string;
    state?: string;
  }): Promise<{ message: string; user: IUser; sellerProfile?: any }> {
    return this.request<{ message: string; user: IUser; sellerProfile?: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const sellerApi = new SellerApiClient();
