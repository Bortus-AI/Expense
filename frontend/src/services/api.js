import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for OCR processing
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method.toUpperCase()} request to ${config.url}`);
    
    // Ensure the API instance gets the same auth headers as the default axios instance
    if (axios.defaults.headers.common['Authorization']) {
      config.headers['Authorization'] = axios.defaults.headers.common['Authorization'];
    }
    
    if (axios.defaults.headers.common['X-Company-ID']) {
      config.headers['X-Company-ID'] = axios.defaults.headers.common['X-Company-ID'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Handle specific error cases
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      console.warn('Authentication failed, redirecting to login');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth';
    } else if (error.response?.status === 403) {
      console.warn('Access forbidden - insufficient permissions');
    } else if (error.response?.status >= 500) {
      console.error('Server error occurred');
    } else if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
    } else if (!error.response) {
      console.error('Network error - server may be down');
    }

    return Promise.reject(error);
  }
);

// Transaction API with enhanced filtering
export const transactionAPI = {
  getAll: (page = 1, limit = 50, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return api.get(`/transactions?${params}`);
  },
  getById: (id) => api.get(`/transactions/${id}`),
  importCSV: (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return api.post('/transactions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => api.delete(`/transactions/${id}`),
  update: (id, data) => api.put(`/transactions/${id}`, data)
};

// Receipt API with enhanced filtering
export const receiptAPI = {
  getAll: (page = 1, limit = 20, filters = {}) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    });
    return api.get(`/receipts?${params}`);
  },
  getById: (id) => api.get(`/receipts/${id}`),
  upload: (file) => {
    const formData = new FormData();
    formData.append('receipt', file);
    return api.post('/receipts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  update: (id, data) => api.put(`/receipts/${id}`, data),
  delete: (id) => api.delete(`/receipts/${id}`)
};

// Match API
export const matchAPI = {
  getAll: () => 
    api.get('/matches'),
  
  getPending: () => 
    api.get('/matches/pending'),
  
  findMatches: (receiptId) => 
    api.post(`/matches/find/${receiptId}`),
  
  create: (data) => 
    api.post('/matches', data),
  
  confirm: (id) => 
    api.put(`/matches/${id}/confirm`),
  
  reject: (id) => 
    api.put(`/matches/${id}/reject`),
  
  delete: (id) => 
    api.delete(`/matches/${id}`),
  
  autoMatch: (threshold = 75) => 
    api.post('/matches/auto-match', { threshold }),
  
  getStats: () => 
    api.get('/matches/stats')
};

// Export API
export const exportAPI = {
  getOptions: () => 
    api.get('/exports/options'),
  
  generatePDF: (reportType, data) => 
    api.post(`/exports/pdf/${reportType}`, data, {
      responseType: 'blob'
    }),
  
  generateExcel: (reportType, data) => 
    api.post(`/exports/excel/${reportType}`, data, {
      responseType: 'blob'
    }),

  generatePreview: (reportType, data) => 
    api.post(`/exports/preview/${reportType}`, data)
};

// Health check
export const healthCheck = () => 
  api.get('/health');

// Analytics API
export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
  exportData: (params = {}) => api.get('/analytics/export', { params })
};

// Company API
export const companyAPI = {
  getDetails: () => api.get('/companies/current'),
  updateSettings: (settings) => api.put('/companies/current', settings),
  inviteUser: (inviteData) => api.post('/companies/current/invite', inviteData),
  getUsers: () => api.get('/companies/current/users'),
  getUsersForFilter: () => {
    // Use the /companies/current/users/filter endpoint instead of the ID-based one
    // This will use the user's current company context from the backend
    // Updated: 2024-01-15 - Force browser refresh
    console.log('getUsersForFilter called - using current company endpoint');
    return api.get('/companies/current/users/filter');
  },
  updateUserRole: (userId, role) => api.put(`/companies/current/users/${userId}/role`, { role }),
  removeUser: (userId) => api.delete(`/companies/current/users/${userId}`)
};

// Master Data API
export const masterDataAPI = {
  getCategories: () => api.get('/masterdata/categories'),
  addCategory: (name) => api.post('/masterdata/categories', { name }),
  updateCategory: (id, name) => api.put(`/masterdata/categories/${id}`, { name }),
  deleteCategory: (id) => api.delete(`/masterdata/categories/${id}`),
  importCategories: (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return api.post('/masterdata/categories/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getJobNumbers: () => api.get('/masterdata/job_numbers'),
  addJobNumber: (name) => api.post('/masterdata/job_numbers', { name }),
  updateJobNumber: (id, name) => api.put(`/masterdata/job_numbers/${id}`, { name }),
  deleteJobNumber: (id) => api.delete(`/masterdata/job_numbers/${id}`),
  importJobNumbers: (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return api.post('/masterdata/job_numbers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  getCostCodes: () => api.get('/masterdata/cost_codes'),
  addCostCode: (name, category_id) => api.post('/masterdata/cost_codes', { name, category_id }),
  updateCostCode: (id, name, category_id) => api.put(`/masterdata/cost_codes/${id}`, { name, category_id }),
  deleteCostCode: (id) => api.delete(`/masterdata/cost_codes/${id}`),
  importCostCodes: (file) => {
    const formData = new FormData();
    formData.append('csvFile', file);
    return api.post('/masterdata/cost_codes/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// Export both as named export and default export
export { api };
export default api;
