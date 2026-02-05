// API Configuration and Service Layer
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// API Error Handler
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

// Generic fetch wrapper with error handling
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const token = localStorage.getItem('adminToken');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.message || 'API request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or other errors
    throw new APIError(
      error.message || 'Network error occurred',
      0,
      null
    );
  }
}

// Services API
export const servicesAPI = {
  // Get all services
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/services?${queryParams}` : '/services';
    return apiRequest(endpoint);
  },

  // Get service by ID
  getById: async (id) => {
    return apiRequest(`/services/${id}`);
  },

  // Get services by category
  getByCategory: async (category) => {
    return apiRequest(`/services/category/${category}`);
  },

  // Search services
  search: async (query, filters = {}) => {
    const params = new URLSearchParams({ q: query, ...filters }).toString();
    return apiRequest(`/services/search?${params}`);
  },

  // Create a new service
  create: async (serviceData) => {
    return apiRequest('/services', {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  // Update a service
  update: async (id, serviceData) => {
    return apiRequest(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData),
    });
  },

  // Delete a service
  delete: async (id) => {
    return apiRequest(`/services/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload service images
  uploadImages: async (formData) => {
    const url = `${API_BASE_URL}/services/upload-images`;
    const token = localStorage.getItem('adminToken');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Image upload failed');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  },

  // Toggle service availability
  toggleAvailability: async (id) => {
    return apiRequest(`/services/${id}/availability`, {
      method: 'PATCH',
    });
  },
};

// Bookings API
export const bookingsAPI = {
  // Create a new booking
  create: async (bookingData) => {
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Create a new room booking (manual/reception)
  createRoomBooking: async (bookingData) => {
    return apiRequest('/bookings/rooms', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Get booking by ID or reference
  getById: async (id) => {
    return apiRequest(`/bookings/${id}`);
  },

  // Get all bookings (with filters)
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/bookings?${queryParams}` : '/bookings';
    return apiRequest(endpoint);
  },

  // Get booking statistics
  getStats: async (period = 'month') => {
    return apiRequest(`/bookings/stats?period=${period}`);
  },

  // Update booking status
  updateStatus: async (id, status, notes = '') => {
    return apiRequest(`/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  // Update payment status
  updatePayment: async (id, paymentData) => {
    return apiRequest(`/bookings/${id}/payment`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  },

  // Add note to booking
  addNote: async (id, note, type = 'general') => {
    return apiRequest(`/bookings/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ note, type }),
    });
  },

  // Cancel booking
  cancel: async (id) => {
    return apiRequest(`/bookings/${id}`, {
      method: 'DELETE',
    });
  },
};

// Contacts API
export const contactsAPI = {
  // Submit a contact form
  create: async (contactData) => {
    return apiRequest('/contacts', {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },

  // Get all contacts
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/contacts?${queryParams}` : '/contacts';
    return apiRequest(endpoint);
  },
};

// Rooms API
export const roomsAPI = {
  // Get all rooms
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/rooms?${queryParams}` : '/rooms';
    return apiRequest(endpoint);
  },

  // Get room by ID
  getById: async (id) => {
    return apiRequest(`/rooms/${id}`);
  },

  // Create a new room
  create: async (roomData) => {
    return apiRequest('/rooms', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  },

  // Update room
  update: async (id, roomData) => {
    return apiRequest(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(roomData),
    });
  },

  // Delete room
  delete: async (id) => {
    return apiRequest(`/rooms/${id}`, {
      method: 'DELETE',
    });
  },

  // Upload room images
  uploadImages: async (formData) => {
    const url = `${API_BASE_URL}/rooms/upload-images`;
    const token = localStorage.getItem('adminToken');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Image upload failed');
      }

      return data;
    } catch (error) {
      throw new Error(error.message || 'Network error occurred');
    }
  },

  // Get rooms by type
  getByType: async (type) => {
    return apiRequest(`/rooms/type/${type}`);
  },

  // Toggle room availability
  toggleAvailability: async (id) => {
    return apiRequest(`/rooms/${id}/availability`, {
      method: 'PATCH',
    });
  },

  // Update room status
  updateStatus: async (id, status) => {
    return apiRequest(`/rooms/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // Search rooms
  search: async (query, filters = {}) => {
    const params = new URLSearchParams({ q: query, ...filters }).toString();
    return apiRequest(`/rooms/search?${params}`);
  },
};

// Expenditures API
export const expendituresAPI = {
  // Get all expenditures
  getAll: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/expenditures?${queryParams}` : '/expenditures';
    return apiRequest(endpoint);
  },

  // Create a new expenditure
  create: async (data) => {
    return apiRequest('/expenditures', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete an expenditure
  delete: async (id) => {
    return apiRequest(`/expenditures/${id}`, {
      method: 'DELETE',
    });
  },
};

// Settings API
export const settingsAPI = {
  // Get all settings
  getAll: async () => {
    return apiRequest('/settings');
  },

  // Get settings by group
  getByGroup: async (group) => {
    return apiRequest(`/settings/${group}`);
  },

  // Update settings (bulk)
  update: async (settings, group = 'general') => {
    return apiRequest('/settings', {
      method: 'POST',
      body: JSON.stringify({ settings, group }),
    });
  },
};

// Admin API
export const adminAPI = {
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },
  // Get dashboard data
  getDashboard: async () => {
    return apiRequest('/admin/dashboard');
  },

  // Seed initial data
  seedData: async () => {
    return apiRequest('/admin/seed', {
      method: 'POST',
    });
  },

  // Seed rooms data
  seedRooms: async () => {
    return apiRequest('/admin/seed-rooms', {
      method: 'POST',
    });
  },

  // Get booking reports
  getBookingReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/admin/reports/bookings?${queryParams}` : '/admin/reports/bookings';
    return apiRequest(endpoint);
  },

  // Get revenue reports
  getRevenueReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/admin/reports/revenue?${queryParams}` : '/admin/reports/revenue';
    return apiRequest(endpoint);
  },
};

// Health check
export const healthCheck = async () => {
  return apiRequest('/health');
};

// Export the APIError for error handling in components
export { APIError };

// Default export with all APIs
export default {
  services: servicesAPI,
  bookings: bookingsAPI,
  contacts: contactsAPI,
  rooms: roomsAPI,
  expenditures: expendituresAPI,
  settings: settingsAPI,
  admin: adminAPI,
  healthCheck,
};
