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

  // Refresh access token
  const refreshAccessToken = async () => {
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
  };

  // Axios response interceptor for automatic token refresh
  useEffect(() => {
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry && refreshToken) {
          console.log('Received 401 error, attempting token refresh...');
          originalRequest._retry = true;

          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              console.log('Token refreshed successfully, retrying request');
              originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed in interceptor:', refreshError);
            // Don't retry on refresh failure
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken]);

  // Load user data from token
  const loadUserFromToken = async () => {
    if (!accessToken) {
      console.log('No access token found, skipping user data load');
      setLoading(false);
      return;
    }

    if (isTokenExpired(accessToken)) {
      console.log('Access token expired, attempting refresh...');
      const newToken = await refreshAccessToken();
      if (!newToken) {
        console.log('Token refresh failed, clearing session');
        setLoading(false);
        return;
      }
    }

    try {
      console.log('Loading user data from token...');
      
      // Set up axios authorization header first
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      
      const decoded = jwtDecode(accessToken);
      
      // Load user's companies first to get role information
      const response = await api.get('/companies');
      
      if (response.data && response.data.companies) {
        setCompanies(response.data.companies);
        
        if (response.data.companies.length > 0) {
          const savedCompanyId = localStorage.getItem('currentCompanyId');
          const savedCompany = response.data.companies.find(c => c.id === parseInt(savedCompanyId));
          const currentComp = savedCompany || response.data.companies[0];
          setCurrentCompany(currentComp);
          
          // Set user with role information from current company
          setUser({
            id: decoded.id,
            email: decoded.email,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            currentRole: currentComp.role,
            currentCompany: currentComp
          });
          
          // Set company header
          axios.defaults.headers.common['X-Company-ID'] = currentComp.id.toString();
          console.log('User data loaded successfully, current company:', currentComp.name, 'role:', currentComp.role);
        } else {
          // Set user without role if no companies
          setUser({
            id: decoded.id,
            email: decoded.email,
            firstName: decoded.firstName,
            lastName: decoded.lastName,
            currentRole: null,
            currentCompany: null
          });
        }
      } else {
        console.error('Invalid response format from /companies endpoint');
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      
      // Only clear state if it's a real authentication error (not network issues)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        console.log('Authentication error detected, clearing session');
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
      } else {
        console.log('Network or server error, keeping session intact:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (accessToken && !user) {
      // Only load user data if we have a token but no user data
      console.log('Initializing auth state from stored token...');
      loadUserFromToken();
    } else if (!accessToken) {
      setLoading(false);
    }
  }, [accessToken, user]);

  // Login function
  const login = async (email, password) => {
    try {
      console.log('Starting login process...');
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { user, companies, accessToken, refreshToken } = response.data;
      console.log('Login successful, setting up user session...', { userId: user.id, companiesCount: companies.length });

      // Store tokens
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      // Set user data
      const currentComp = companies.length > 0 ? companies[0] : null;
      setUser({
        ...user,
        currentRole: currentComp?.role || null,
        currentCompany: currentComp
      });
      setCompanies(companies);
      
      if (companies.length > 0) {
        setCurrentCompany(currentComp);
        localStorage.setItem('currentCompanyId', currentComp.id.toString());
      }

      // Configure axios defaults immediately
      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      if (companies.length > 0) {
        axios.defaults.headers.common['X-Company-ID'] = currentComp.id.toString();
      }

      console.log('Login setup completed successfully, role:', currentComp?.role);
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

  // Switch company
  const switchCompany = (company) => {
    setCurrentCompany(company);
    localStorage.setItem('currentCompanyId', company.id.toString());
    
    // Update user object with new role and company
    setUser(prev => ({
      ...prev,
      currentRole: company.role,
      currentCompany: company
    }));
    
    // Update axios header
    axios.defaults.headers.common['X-Company-ID'] = company.id.toString();
    console.log('Switched to company:', company.name, 'role:', company.role);
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