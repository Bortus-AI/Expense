import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // In a real app, you would validate the token with your backend
        // For now, we'll just set a mock user
        setUser({id: 1, name: 'John Doe', email: 'john@example.com'});
      }
    } catch (error) {
      console.log('Error checking auth state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      // In a real app, you would make an API call to your backend
      // For now, we'll simulate a successful login
      const mockUser = {id: 1, name: 'John Doe', email};
      const mockToken = 'mock-auth-token';
      
      setUser(mockUser);
      await AsyncStorage.setItem('authToken', mockToken);
      
      return {success: true};
    } catch (error) {
      return {success: false, error: error.message};
    }
  };

  const register = async (name, email, password) => {
    try {
      // In a real app, you would make an API call to your backend
      // For now, we'll simulate a successful registration
      const mockUser = {id: 1, name, email};
      const mockToken = 'mock-auth-token';
      
      setUser(mockUser);
      await AsyncStorage.setItem('authToken', mockToken);
      
      return {success: true};
    } catch (error) {
      return {success: false, error: error.message};
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      await AsyncStorage.removeItem('authToken');
      return {success: true};
    } catch (error) {
      return {success: false, error: error.message};
    }
  };

  const value = {
    user,
    setUser,
    isLoading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;