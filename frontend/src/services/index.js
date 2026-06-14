import api from './api';

// Auth Services
export const authService = {
  register: async (email, password, name, role = 'user') => {
    const response = await api.post('/auth/register', { email, password, name, role });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Room Services
export const roomService = {
  getAllRooms: async (filters = {}) => {
    const response = await api.get('/university-rooms', { params: filters });
    return response.data;
  },

  getRoomById: async (id) => {
    const response = await api.get(`/university-rooms/${id}`);
    return response.data;
  },

  checkAvailability: async (roomId, startTime, endTime) => {
    const response = await api.get(`/university-rooms/${roomId}/availability`, {
      params: { startTime, endTime }
    });
    return response.data;
  },

  createRoom: async (roomData) => {
    const response = await api.post('/university-rooms', roomData);
    return response.data;
  },

  updateRoom: async (id, roomData) => {
    const response = await api.put(`/university-rooms/${id}`, roomData);
    return response.data;
  },

  deleteRoom: async (id) => {
    const response = await api.delete(`/university-rooms/${id}`);
    return response.data;
  }
};

// Booking Services
export const bookingService = {
  createBooking: async (bookingData) => {
    const response = await api.post('/university-bookings', bookingData);
    return response.data;
  },

  getAllBookings: async (filters = {}) => {
    const response = await api.get('/university-bookings', { params: filters });
    return response.data;
  },

  getUserBookings: async () => {
    const response = await api.get('/university-bookings/my/bookings');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/university-bookings/${id}`);
    return response.data;
  },

  updateBooking: async (id, bookingData) => {
    const response = await api.put(`/university-bookings/${id}`, bookingData);
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await api.delete(`/university-bookings/${id}`);
    return response.data;
  },

  checkInBooking: async (id) => {
    const response = await api.post(`/university-bookings/${id}/checkin`);
    return response.data;
  }
};

// Report Services
export const reportService = {
  getUsageStats: async (filters = {}) => {
    const response = await api.get('/reports/statistics', { params: filters });
    return response.data;
  },

  getRoomUtilization: async (filters = {}) => {
    const response = await api.get('/reports/utilization', { params: filters });
    return response.data;
  },

  getUserActivity: async (filters = {}) => {
    const response = await api.get('/reports/activity', { params: filters });
    return response.data;
  }
};
