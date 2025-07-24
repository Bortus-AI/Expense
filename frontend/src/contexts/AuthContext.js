import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [currentCompany, setCurrentCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState(localStorage.getItem('accessToken'));
  const [refreshToken, setRefreshToken] = useState(localStorage.getItem('refreshToken'));

  // Configure axios defaults
  useEffect(() => {
    if (accessToken) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [accessToken]);

  // Set company header for API requests
  useEffect(() => {
    if (currentCompany) {
      axios.defaults.headers.common['X-Company-ID'] = currentCompany.id;
    } else {
      delete axios.defaults.headers.common['X-Company-ID'];
    }
  }, [currentCompany]);

  // Check if token is expired
  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const decoded = jwtDecode(token);
      return decoded.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  };

  // Refresh access token
  const refreshAccessToken = useCallback(async () => {
    try {
      if (!refreshToken || isTokenExpired(refreshToken)) {
        logout();
        return null;
      }

      const response = await api.post('/auth/refresh', {
        refreshToken
      });

      const newAccessToken = response.data.accessToken;
      setAccessToken(newAccessToken);
      localStorage.setItem('accessToken', newAccessToken);
      
      return newAccessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return null;
    }
  }, [refreshToken, isTokenExpired, logout]);

  // Axios response interceptor for automatic token refresh
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          const newToken = await refreshAccessToken();
          if (newToken) {
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            return axios(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken, refreshAccessToken]);

  // Load user data from token
  const loadUserFromToken = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }

    if (isTokenExpired(accessToken)) {
      const newToken = await refreshAccessToken();
      if (!newToken) {
        setLoading(false);
        return;
      }
    }

    try {
      const decoded = jwtDecode(accessToken);
      setUser({
        id: decoded.id,
        email: decoded.email,
        firstName: decoded.firstName,
        lastName: decoded.lastName
      });

      // Load user's companies
      const response = await api.get('/companies');
      setCompanies(response.data.companies);
      
      if (response.data.companies.length > 0) {
        const savedCompanyId = localStorage.getItem('currentCompanyId');
        const savedCompany = response.data.companies.find(c => c.id === parseInt(savedCompanyId));
        setCurrentCompany(savedCompany || response.data.companies[0]);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [accessToken, isTokenExpired, refreshAccessToken, logout]);

  // Initialize auth state
  useEffect(() => {
    loadUserFromToken();
  }, [loadUserFromToken]);

  // Login function
  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { user, companies, accessToken, refreshToken } = response.data;

      // Store tokens
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set user data
      setUser(user);
      setCompanies(companies);
      
      if (companies.length > 0) {
        setCurrentCompany(companies[0]);
        localStorage.setItem('currentCompanyId', companies[0].id.toString());
      }

      return { success: true, user, companies };
    } catch (error) {
      console.error('Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);

      const { user, company, accessToken, refreshToken } = response.data;

      // Store tokens
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set user data
      setUser(user);
      setCompanies([company]);
      setCurrentCompany(company);
      localStorage.setItem('currentCompanyId', company.id.toString());

      return { success: true, user, company };
    } catch (error) {
      console.error('Registration failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  };

  // Logout function
  const logout = useCallback(async () => {
    try {
      if (accessToken) {
        await api.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Clear state and localStorage
      setUser(null);
      setCompanies([]);
      setCurrentCompany(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentCompanyId');
      
      // Clear axios headers
      delete axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['X-Company-ID'];
    }
  }, [accessToken]);

  // Switch company
  const switchCompany = (company) => {
    setCurrentCompany(company);
    localStorage.setItem('currentCompanyId', company.id.toString());
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      await api.put('/auth/profile', profileData);
      
      setUser(prev => ({
        ...prev,
        firstName: profileData.firstName,
        lastName: profileData.lastName
      }));

      return { success: true };
    } catch (error) {
      console.error('Profile update failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Profile update failed'
      };
    }
  };

  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await api.put('/auth/password', {
        currentPassword,
        newPassword
      });

      return { success: true };
    } catch (error) {
      console.error('Password change failed:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Password change failed'
      };
    }
  };

  const value = {
    user,
    companies,
    currentCompany,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    switchCompany,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 