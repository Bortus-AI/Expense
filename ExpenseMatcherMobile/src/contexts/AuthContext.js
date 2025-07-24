import React, { createContext, useContext, useState, useEffect } from 'react';
import AuthService from '../services/authService';
import Toast from 'react-native-toast-message';

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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const isAuth = await AuthService.isAuthenticated();
      
      if (isAuth) {
        const userData = await AuthService.getCurrentUser();
        const companyData = await AuthService.getCurrentCompany();
        
        setUser(userData);
        setCurrentCompany(companyData);
        setIsAuthenticated(true);
        
        // Load companies from storage
        // You might want to refresh this from the API
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { user: userData, companies: companiesData } = await AuthService.login(email, password);
      
      setUser(userData);
      setCompanies(companiesData);
      setCurrentCompany(companiesData?.[0] || null);
      setIsAuthenticated(true);
      
      Toast.show({
        type: 'success',
        text1: 'Welcome back!',
        text2: `Logged in successfully`,
      });
      
      return { user: userData, companies: companiesData };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      const { user: newUser, companies: companiesData } = await AuthService.register(userData);
      
      setUser(newUser);
      setCompanies(companiesData);
      setCurrentCompany(companiesData?.[0] || null);
      setIsAuthenticated(true);
      
      Toast.show({
        type: 'success',
        text1: 'Welcome!',
        text2: 'Account created successfully',
      });
      
      return { user: newUser, companies: companiesData };
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Registration Failed',
        text2: error.message,
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setCompanies([]);
      setCurrentCompany(null);
      setIsAuthenticated(false);
      
      Toast.show({
        type: 'info',
        text1: 'Logged out',
        text2: 'See you next time!',
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setUser(null);
      setCompanies([]);
      setCurrentCompany(null);
      setIsAuthenticated(false);
    }
  };

  const switchCompany = async (company) => {
    try {
      await AuthService.switchCompany(company);
      setCurrentCompany(company);
      
      Toast.show({
        type: 'success',
        text1: 'Company Switched',
        text2: `Now working with ${company.name}`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Switch Failed',
        text2: error.message,
      });
    }
  };

  const uploadReceipt = async (imageUri, fileName) => {
    try {
      const result = await AuthService.uploadReceipt(imageUri, fileName);
      
      Toast.show({
        type: 'success',
        text1: 'Receipt Uploaded',
        text2: 'Processing started...',
      });
      
      return result;
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message,
      });
      throw error;
    }
  };

  const value = {
    user,
    companies,
    currentCompany,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    switchCompany,
    uploadReceipt,
    // API methods
    getTransactions: AuthService.getTransactions,
    getReceipts: AuthService.getReceipts,
    getMatches: AuthService.getMatches,
    confirmMatch: AuthService.confirmMatch,
    rejectMatch: AuthService.rejectMatch,
    autoMatch: AuthService.autoMatch,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 