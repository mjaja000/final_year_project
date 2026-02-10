// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
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
    getAll: () => apiFetch<any[]>('/api/payments'),
    getById: (id: number) => apiFetch<any>(`/api/payments/${id}`),
  },

  // Feedback
  feedback: {
    create: (data: any) => apiFetch<any>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    getAll: () => apiFetch<any[]>('/api/feedback'),
    getById: (id: number) => apiFetch<any>(`/api/feedback/${id}`),
  },

  // Admin APIs
  admin: {
    // Get revenue summary. params: { startDate?: string, endDate?: string, period?: 'day'|'week'|'month' }
    getRevenue: (params?: { startDate?: string; endDate?: string; period?: string }) => {
      const qs = new URLSearchParams();
      if (params?.startDate) qs.set('startDate', params.startDate);
      if (params?.endDate) qs.set('endDate', params.endDate);
      if (params?.period) qs.set('period', params.period);
      const query = qs.toString() ? `?${qs.toString()}` : '';
      return apiFetch<any>(`/api/admin/revenue${query}`);
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
};

export default api;
