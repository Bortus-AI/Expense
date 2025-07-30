import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Light theme colors
const lightTheme = {
  mode: 'light',
  colors: {
    primary: '#667eea',
    primaryDark: '#5a6fd8',
    primaryLight: '#7c8ef0',
    secondary: '#764ba2',
    background: '#f8f9fa',
    surface: '#ffffff',
    card: '#ffffff',
    border: '#e1e1e1',
    borderLight: '#f0f4f8',
    text: '#2d3748',
    textSecondary: '#4a5568',
    textLight: '#718096',
    textMuted: '#a0aec0',
    success: '#38a169',
    successLight: '#c6f6d5',
    warning: '#d69e2e',
    warningLight: '#fef5e7',
    error: '#e53e3e',
    errorLight: '#fed7d7',
    info: '#3182ce',
    infoLight: '#bee3f8',
    overlay: 'rgba(0, 0, 0, 0.5)',
    overlayLight: 'rgba(0, 0, 0, 0.1)',
    shadow: 'rgba(0, 0, 0, 0.1)',
    disabled: '#e2e8f0',
    disabledText: '#a0aec0',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    round: 50,
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: 'bold',
      lineHeight: 40,
    },
    h2: {
      fontSize: 28,
      fontWeight: 'bold',
      lineHeight: 36,
    },
    h3: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
    },
    h5: {
      fontSize: 18,
      fontWeight: '600',
      lineHeight: 24,
    },
    h6: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 22,
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600',
      lineHeight: 20,
    },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 6,
    },
  },
};

// Dark theme colors
const darkTheme = {
  ...lightTheme,
  mode: 'dark',
  colors: {
    primary: '#7c8ef0',
    primaryDark: '#667eea',
    primaryLight: '#9aa5f2',
    secondary: '#9f7aea',
    background: '#1a202c',
    surface: '#2d3748',
    card: '#374151',
    border: '#4a5568',
    borderLight: '#2d3748',
    text: '#f7fafc',
    textSecondary: '#e2e8f0',
    textLight: '#cbd5e0',
    textMuted: '#a0aec0',
    success: '#68d391',
    successLight: '#2f855a',
    warning: '#f6e05e',
    warningLight: '#b7791f',
    error: '#fc8181',
    errorLight: '#c53030',
    info: '#63b3ed',
    infoLight: '#2b6cb0',
    overlay: 'rgba(0, 0, 0, 0.7)',
    overlayLight: 'rgba(0, 0, 0, 0.3)',
    shadow: 'rgba(0, 0, 0, 0.3)',
    disabled: '#4a5568',
    disabledText: '#718096',
  },
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themePreference, setThemePreference] = useState('system'); // 'light', 'dark', 'system'

  useEffect(() => {
    loadThemePreference();
    
    // Listen to system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themePreference === 'system') {
        setIsDarkMode(colorScheme === 'dark');
      }
    });

    return () => subscription?.remove();
  }, [themePreference]);

  const loadThemePreference = async () => {
    try {
      const stored = await AsyncStorage.getItem('themePreference');
      const preference = stored || 'system';
      setThemePreference(preference);
      
      if (preference === 'system') {
        const systemColorScheme = Appearance.getColorScheme();
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(preference === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
      // Default to system preference
      const systemColorScheme = Appearance.getColorScheme();
      setIsDarkMode(systemColorScheme === 'dark');
    }
  };

  const setTheme = async (preference) => {
    try {
      await AsyncStorage.setItem('themePreference', preference);
      setThemePreference(preference);
      
      if (preference === 'system') {
        const systemColorScheme = Appearance.getColorScheme();
        setIsDarkMode(systemColorScheme === 'dark');
      } else {
        setIsDarkMode(preference === 'dark');
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newPreference = isDarkMode ? 'light' : 'dark';
    setTheme(newPreference);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const value = {
    theme,
    isDarkMode,
    themePreference,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Helper functions for creating themed styles
export const createThemedStyles = (styleFunction) => {
  return (theme) => styleFunction(theme);
};

// Common themed components and utilities
export const getThemedStatusBarStyle = (isDarkMode) => {
  return isDarkMode ? 'light-content' : 'dark-content';
};

export const getThemedNavigationBarStyle = (theme) => ({
  backgroundColor: theme.colors.surface,
  borderTopColor: theme.colors.border,
});

// Predefined component styles that work with both themes
export const ThemedStyles = {
  button: (theme, variant = 'primary') => ({
    backgroundColor: variant === 'primary' ? theme.colors.primary : theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: variant === 'outline' ? 1 : 0,
  }),
  
  card: (theme) => ({
    backgroundColor: theme.colors.card,
    borderColor: theme.colors.border,
    ...theme.shadows.md,
  }),
  
  input: (theme) => ({
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    color: theme.colors.text,
  }),
  
  text: (theme, variant = 'body1') => ({
    color: theme.colors.text,
    ...theme.typography[variant],
  }),
  
  surface: (theme) => ({
    backgroundColor: theme.colors.surface,
  }),
  
  background: (theme) => ({
    backgroundColor: theme.colors.background,
  }),
};