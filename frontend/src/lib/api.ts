// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('[API Config] Base URL:', API_BASE_URL);

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    try {
      const error = await response.json();
      console.error('[API] Error response:', error);
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    } catch (e) {
      console.error('[API] Failed to parse error response:', e);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  }
  
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    console.error('[API] Invalid content type:', contentType);
    throw new Error('Invalid response: expected JSON');
  }
  
  const text = await response.text();
  if (!text) {
    console.error('[API] Empty response received');
    throw new Error('Empty response from server');
  }
  
  try {
    const data = JSON.parse(text);
    console.log('[API] Parsed response successfully');
    return data;
  } catch (e) {
    console.error('[API] Failed to parse JSON:', e);
    throw new Error('Invalid JSON response from server');
  }
}

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  console.log('[API] Response:', {
    url,
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get('content-type')
  });
  
  return handleResponse<T>(response);
}

// API Methods
export const api = {
  // Routes
  routes: {
    getAll: () => apiFetch<any[]>('/api/routes'),
    getById: (id: number) => apiFetch<any>(`/api/routes/${id}`),
    create: (data: any) => apiFetch<any>('/api/routes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => apiFetch<any>(`/api/routes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => apiFetch<any>(`/api/routes/${id}`, {
      method: 'DELETE',
    }),
  },

  // Vehicles
  vehicles: {
    getAll: () => apiFetch<any[]>('/api/vehicles'),
    getById: (id: number) => apiFetch<any>(`/api/vehicles/${id}`),
    getByRoute: (routeId: number) => apiFetch<any[]>(`/api/vehicles/route/${routeId}`),
    create: (data: any) => apiFetch<any>('/api/vehicles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: any) => apiFetch<any>(`/api/vehicles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => apiFetch<any>(`/api/vehicles/${id}`, {
      method: 'DELETE',
    }),
  },

  // Occupancy
  occupancy: {
    getByVehicle: (vehicleId: number) => apiFetch<any>(`/api/occupancy/${vehicleId}`),
    getAll: () => apiFetch<any>(`/api/occupancy/all`),
    update: (vehicleId: number, data: { current_occupancy: number }) => 
      apiFetch<any>(`/api/occupancy/${vehicleId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (vehicleId: number) =>
      apiFetch<any>(`/api/occupancy/${vehicleId}` , {
        method: 'DELETE',
      }),
  },

  // Payments
  payments: {
    create: (data: any) => apiFetch<any>('/api/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    initiate: (data: any) => apiFetch<any>('/api/payments/initiate-payment', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAll: () => apiFetch<any[]>('/api/payments'),
    getById: (id: number, refresh = false) => apiFetch<any>(`/api/payments/${id}${refresh ? '?refresh=1' : ''}`),
  },

  // Feedback
  feedback: {
    create: (data: any) => apiFetch<any>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAll: () => apiFetch<any[]>('/api/feedback'),
    getById: (id: number) => apiFetch<any>(`/api/feedback/${id}`),
    getNTSAStats: () => apiFetch<any>('/api/feedback/admin/ntsa-stats'),
    forwardToNTSA: (feedbackId: number, data?: any) => apiFetch<any>(`/api/feedback/admin/ntsa-forward/${feedbackId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Admin APIs
  admin: {
    // Get dashboard overview
    getDashboard: () => apiFetch<any>('/api/admin/dashboard'),
    
    // Get all payments
    getPayments: (params?: { limit?: number; offset?: number; routeId?: string; status?: string; startDate?: string; endDate?: string }) => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));
      if (params?.routeId) qs.set('routeId', params.routeId);
      if (params?.status) qs.set('status', params.status);
      if (params?.startDate) qs.set('startDate', params.startDate);
      if (params?.endDate) qs.set('endDate', params.endDate);
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch<any>(`/api/admin/payments${query}`);
    },
    
    // Get revenue summary. params: { startDate?: string, endDate?: string, period?: 'day'|'week'|'month' }
    getRevenue: (params?: { startDate?: string; endDate?: string; period?: string }) => {
      const qs = new URLSearchParams();
      if (params?.startDate) qs.set('startDate', params.startDate);
      if (params?.endDate) qs.set('endDate', params.endDate);
      if (params?.period) qs.set('period', params.period);
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch<any>(`/api/admin/revenue${query}`);
    },

    // Get reports from complaint-demo
    getReports: (params?: { limit?: number; offset?: number }) => {
      const qs = new URLSearchParams();
      if (params?.limit) qs.set('limit', String(params.limit));
      if (params?.offset) qs.set('offset', String(params.offset));
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch<any>(`/api/admin/reports${query}`);
    },
  },

  // Users (authentication)
  users: {
    login: (credentials: { username: string; password: string }) =>
      apiFetch<any>('/api/users/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      }),
    register: (data: any) => apiFetch<any>('/api/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  // Lost and Found
  lostAndFound: {
    createReport: (data: any) => apiFetch<any>('/api/lost-and-found/report', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAllReports: (token?: string) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      return apiFetch<any>('/api/lost-and-found', { headers });
    },
    getReportById: (id: number, token?: string) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      return apiFetch<any>(`/api/lost-and-found/${id}`, { headers });
    },
    updateStatus: (id: number, data: any, token?: string) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      return apiFetch<any>(`/api/lost-and-found/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers,
      });
    },
    deleteReport: (id: number, token?: string) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      return apiFetch<any>(`/api/lost-and-found/${id}`, {
        method: 'DELETE',
        headers,
      });
    },
    getStats: (token?: string) => {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      return apiFetch<any>('/api/lost-and-found/stats', { headers });
    },
  },

  // Export base URL for backward compatibility
  baseURL: API_BASE_URL,
};

export default api;