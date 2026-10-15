const API_BASE = 'http://localhost:5000/api';

export function getAuthToken() {
  return localStorage.getItem('mobile_token');
}

export function setAuth(token, user) {
  localStorage.setItem('mobile_token', token);
  localStorage.setItem('mobile_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('mobile_token');
  localStorage.removeItem('mobile_user');
}

export function getCurrentUser() {
  const u = localStorage.getItem('mobile_user');
  return u ? JSON.parse(u) : null;
}

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  getProfile: () => request('/auth/profile'),
  switchRole: (targetRole) => request('/auth/switch-role', {
    method: 'POST',
    body: JSON.stringify({ targetRole })
  }),

  // Categories
  getCategories: () => request('/categories'),

  // Advertisements (Public Discovery)
  getAdvertisements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/advertisements?${qs}`);
  },
  getFeaturedAds: () => request('/advertisements/featured'),
  getAdDetail: (id) => request(`/advertisements/${id}`),

  // Wishlist
  getWishlist: () => request('/wishlist'),
  toggleWishlist: (adId) => request(`/wishlist/${adId}`, { method: 'POST' }),

  // Seller Ad Management
  createAd: (formData) => request('/advertisements', {
    method: 'POST',
    body: formData
  }),
  updateAd: (id, data) => request(`/advertisements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteAd: (id) => request(`/advertisements/${id}`, { method: 'DELETE' }),
  markAsSold: (id) => request(`/advertisements/${id}/sold`, { method: 'PATCH' }),
  getMyAds: (status = 'all') => request(`/advertisements/seller/my-ads?status=${status}`),

  // Enquiries & Chat
  sendEnquiry: (advertisement_id, message) => request('/enquiries', {
    method: 'POST',
    body: JSON.stringify({ advertisement_id, message })
  }),
  getBuyerEnquiries: () => request('/enquiries/buyer'),
  getSellerEnquiries: () => request('/enquiries/seller'),
  replyEnquiry: (id, reply) => request(`/enquiries/${id}/reply`, {
    method: 'POST',
    body: JSON.stringify({ reply })
  }),

  // Reports
  submitReport: (advertisement_id, reason, description) => request('/reports', {
    method: 'POST',
    body: JSON.stringify({ advertisement_id, reason, description })
  }),

  // Public Seller Profile
  getSellerProfile: (sellerId) => request(`/users/seller/${sellerId}`)
};
