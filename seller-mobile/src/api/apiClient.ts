import {
  IAdvertisement,
  CreateAdDTO,
  UpdateAdDTO,
  ICategory,
  IEnquiry,
  IUser,
  AuthResponse
} from '../types';

const BASE_URL = 'http://localhost:5000/api';

class SellerApiClient {
  private token: string | null = null;
  private currentUser: IUser | null = null;

  constructor() {
    // Default to seed seller for quick evaluation
    this.login('seller@neighshop.com', 'Seller@123').catch(() => {
      // ignore startup login failure if server starting up
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
  }

  getCurrentUser(): IUser | null {
    return this.currentUser;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`);
    }

    return data as T;
  }

  // --- Auth ---
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(res.token);
    this.setCurrentUser(res.user);
    return res;
  }

  async logout(): Promise<void> {
    this.token = null;
    this.currentUser = null;
  }

  // --- Categories ---
  async getCategories(): Promise<{ categories: ICategory[] }> {
    return this.request<{ categories: ICategory[] }>('/categories');
  }

  // --- Seller Advertisements ---
  async getMyAdvertisements(status?: string): Promise<{ advertisements: IAdvertisement[] }> {
    const q = status && status !== 'all' ? `?status=${status}` : '';
    return this.request<{ advertisements: IAdvertisement[] }>(`/advertisements/seller/me${q}`);
  }

  async getAdvertisementById(id: number): Promise<{ advertisement: IAdvertisement }> {
    return this.request<{ advertisement: IAdvertisement }>(`/advertisements/${id}`);
  }

  async createAdvertisement(dto: CreateAdDTO): Promise<{ message: string; advertisement: IAdvertisement }> {
    return this.request<{ message: string; advertisement: IAdvertisement }>('/advertisements', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  }

  async updateAdvertisement(id: number, dto: UpdateAdDTO): Promise<{ message: string; advertisement: IAdvertisement }> {
    return this.request<{ message: string; advertisement: IAdvertisement }>(`/advertisements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dto),
    });
  }

  async deleteAdvertisement(id: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/advertisements/${id}`, {
      method: 'DELETE',
    });
  }

  async markAsSold(id: number): Promise<{ message: string; advertisement: IAdvertisement }> {
    return this.updateAdvertisement(id, { status: 'sold' });
  }

  // --- Enquiries ---
  async getSellerEnquiries(): Promise<{ enquiries: IEnquiry[] }> {
    return this.request<{ enquiries: IEnquiry[] }>('/enquiries/seller');
  }

  async updateEnquiryStatus(id: number, status: 'replied' | 'closed'): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // --- Profile ---
  async getProfile(): Promise<{ user: IUser }> {
    return this.request<{ user: IUser }>('/users/profile');
  }

  async updateProfile(data: Partial<IUser>): Promise<{ message: string; user: IUser }> {
    return this.request<{ message: string; user: IUser }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
}

export const sellerApi = new SellerApiClient();
