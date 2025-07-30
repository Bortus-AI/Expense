import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import axios from 'axios';

// API Configuration
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000/api'  // Android emulator
  : 'https://your-production-api.com/api';

class AuthService {
  constructor() {
    this.setupAxiosInterceptors();
  }

  setupAxiosInterceptors() {
    // Request interceptor to add auth token
    axios.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        config.baseURL = API_BASE_URL;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            const newToken = await this.getAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            await this.logout();
            throw refreshError;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async login(email, password) {
    try {
      const response = await axios.post('/auth/login', {
        email,
        password
      });

      const { accessToken, refreshToken, user, companies } = response.data;

      // Store tokens securely
      await this.storeTokens(accessToken, refreshToken);
      
      // Store user data
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('companies', JSON.stringify(companies));

      // Set default company if available
      if (companies && companies.length > 0) {
        await AsyncStorage.setItem('currentCompany', JSON.stringify(companies[0]));
      }

      return { user, companies };
    } catch (error) {
      console.error('Login error:', error);
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  }

  async register(userData) {
    try {
      const response = await axios.post('/auth/register', userData);
      const { accessToken, refreshToken, user, companies } = response.data;

      await this.storeTokens(accessToken, refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('companies', JSON.stringify(companies));

      if (companies && companies.length > 0) {
        await AsyncStorage.setItem('currentCompany', JSON.stringify(companies[0]));
      }

      return { user, companies };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  }

  async logout() {
    try {
      // Call logout endpoint
      await axios.post('/auth/logout');
    } catch (error) {
      console.log('Logout API call failed:', error);
    } finally {
      // Clear all stored data
      await this.clearTokens();
      await AsyncStorage.multiRemove([
        'user',
        'companies',
        'currentCompany',
        'pendingUploads'
      ]);
    }
  }

  async refreshAccessToken() {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post('/auth/refresh', {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      await this.storeTokens(accessToken, newRefreshToken);

      return accessToken;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  async storeTokens(accessToken, refreshToken) {
    try {
      await Keychain.setCredentials('accessToken', 'token', accessToken);
      await Keychain.setCredentials('refreshToken', 'token', refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      // Fallback to AsyncStorage if Keychain fails
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }
  }

  async getAccessToken() {
    try {
      const credentials = await Keychain.getCredentials('accessToken');
      return credentials ? credentials.password : null;
    } catch (error) {
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem('accessToken');
    }
  }

  async getRefreshToken() {
    try {
      const credentials = await Keychain.getCredentials('refreshToken');
      return credentials ? credentials.password : null;
    } catch (error) {
      return await AsyncStorage.getItem('refreshToken');
    }
  }

  async clearTokens() {
    try {
      await Keychain.resetCredentials('accessToken');
      await Keychain.resetCredentials('refreshToken');
    } catch (error) {
      console.log('Keychain clear failed, using AsyncStorage');
    }
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
  }

  async getCurrentUser() {
    const userJson = await AsyncStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  }

  async getCurrentCompany() {
    const companyJson = await AsyncStorage.getItem('currentCompany');
    return companyJson ? JSON.parse(companyJson) : null;
  }

  async switchCompany(company) {
    await AsyncStorage.setItem('currentCompany', JSON.stringify(company));
  }

  async isAuthenticated() {
    const token = await this.getAccessToken();
    const user = await this.getCurrentUser();
    return !!(token && user);
  }

  // API Methods
  async uploadReceipt(formData) {
    try {
      const response = await axios.post('/receipts/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000 // 30 seconds for uploads
      });

      return response.data;
    } catch (error) {
      console.error('Upload error:', error);
      throw new Error(error.response?.data?.error || 'Upload failed');
    }
  }

  async getTransactions(page = 1, limit = 20) {
    try {
      const response = await axios.get(`/transactions?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch transactions');
    }
  }

  async getReceipts(page = 1, limit = 20) {
    try {
      const response = await axios.get(`/receipts?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch receipts');
    }
  }

  async getMatches() {
    try {
      const response = await axios.get('/matches');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch matches');
    }
  }

  async confirmMatch(matchId) {
    try {
      const response = await axios.put(`/matches/${matchId}/confirm`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to confirm match');
    }
  }

  async rejectMatch(matchId) {
    try {
      const response = await axios.put(`/matches/${matchId}/reject`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to reject match');
    }
  }

  async autoMatch(threshold = 70) {
    try {
      const response = await axios.post('/matches/auto-match', { threshold });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Auto-match failed');
    }
  }
}

export default new AuthService(); 