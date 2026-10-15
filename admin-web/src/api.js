const API_BASE = 'http://localhost:5000/api';

export function getAdminToken() {
  return localStorage.getItem('admin_token');
}

export function setAdminAuth(token, user) {
  localStorage.setItem('admin_token', token);
  localStorage.setItem('admin_user', JSON.stringify(user));
}

export function clearAdminAuth() {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
}

export function getAdminUser() {
  const user = localStorage.getItem('admin_user');
  return user ? JSON.parse(user) : null;
}

export async function apiRequest(endpoint, options = {}) {
  const token = getAdminToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      if (endpoint !== '/auth/login') {
        // clear token if expired
        // clearAdminAuth();
      }
    }
    throw new Error(data.message || `API request failed with status ${response.status}`);
  }

  return data;
}

export const adminApi = {
  // Auth
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  getProfile: () => apiRequest('/auth/profile'),

  // Dashboard Stats
  getStats: () => apiRequest('/admin/stats'),

  // Advertisements
  getAdvertisements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/advertisements?${qs}`);
  },
  updateAdStatus: (id, status, rejection_reason = null) => apiRequest(`/admin/advertisements/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, rejection_reason })
  }),
  toggleFeatured: (id) => apiRequest(`/admin/advertisements/${id}/featured`, {
    method: 'PATCH'
  }),

  // Users
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/admin/users?${qs}`);
  },
  updateUserStatus: (id, status) => apiRequest(`/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  }),

  // Categories
  getCategories: () => apiRequest('/categories'),
  createCategory: (data) => apiRequest('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, {
    method: 'DELETE'
  }),
  createSubcategory: (data) => apiRequest('/admin/subcategories', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // Reports
  getReports: (status = 'all') => apiRequest(`/admin/reports?status=${status}`),
  updateReportStatus: (id, data) => apiRequest(`/admin/reports/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  }),

  // Logs
  getAuditLogs: () => apiRequest('/admin/logs')
};
