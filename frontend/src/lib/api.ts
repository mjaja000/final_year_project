import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Add auth token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const api = {
  // Routes
  routes: {
    getAll: async () => {
      const { data } = await apiClient.get('/routes');
      return data;
    },
    getById: async (id: string | number) => {
      const { data } = await apiClient.get(`/routes/${id}`);
      return data;
    },
    getVehicles: async (routeId: string | number) => {
      const { data } = await apiClient.get(`/routes/${routeId}/vehicles`);
      return data;
    },
  },

  // Payments
  payments: {
    initiate: async (payload: {
      phone: string;
      amount: number;
      vehicle: string;
      route: string | number;
    }) => {
      const { data } = await apiClient.post('/payments/initiate', {
        phoneNumber: payload.phone,
        amount: payload.amount,
        vehicle: payload.vehicle,
        route_id: payload.route,
      });
      return data;
    },
    simulate: async (payload: {
      phone: string;
      amount: number;
      vehicle: string;
      route: string | number;
    }) => {
      const { data } = await apiClient.post('/payments/simulate', {
        phoneNumber: payload.phone,
        amount: payload.amount,
        vehicle: payload.vehicle,
        route_id: payload.route,
      });
      return data;
    },
    getStatus: async (paymentId: number, refresh?: boolean) => {
      const params = refresh ? { refresh: '1' } : {};
      const { data } = await apiClient.get(`/payments/${paymentId}`, { params });
      return data;
    },
    getAll: async () => {
      const { data } = await apiClient.get('/payments');
      return data;
    },
  },

  // Vehicles
  vehicles: {
    getAll: async () => {
      const { data } = await apiClient.get('/vehicles');
      return data;
    },
    getById: async (id: string | number) => {
      const { data } = await apiClient.get(`/vehicles/${id}`);
      return data;
    },
    getByRoute: async (routeId: string | number) => {
      const { data } = await apiClient.get(`/routes/${routeId}/vehicles`);
      return data;
    },
  },

  // Auth
  auth: {
    login: async (email: string, password: string) => {
      const { data } = await apiClient.post('/auth/login', { email, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      return data;
    },
    logout: () => {
      localStorage.removeItem('token');
    },
    getCurrentUser: async () => {
      const { data } = await apiClient.get('/auth/me');
      return data;
    },
  },

  // Driver
  driver: {
    getMe: async () => {
      const { data } = await apiClient.get('/drivers/me');
      return data;
    },
    updateStatus: async (status: string) => {
      const { data} = await apiClient.patch('/drivers/me/status', { status });
      return data;
    },
    addPassengerPayment: async (payload: any) => {
      const { data } = await apiClient.post('/drivers/me/add-passenger-payment', payload);
      return data;
    },
  },

  // Occupancy
  occupancy: {
    getByVehicle: async (vehicleId: string | number) => {
      const { data } = await apiClient.get(`/occupancy/${vehicleId}`);
      return data;
    },
    update: async (vehicleId: string | number, occupancy: number) => {
      const { data } = await apiClient.patch(`/occupancy/${vehicleId}`, { occupancy });
      return data;
    },
  },
};

export default api;
