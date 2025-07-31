/**
 * Theme definitions following Material Design guidelines
 */

// Light theme with professional color palette
export const lightTheme = {
  dark: false,
  colors: {
    // Primary colors
    primary: '#2196F3',
    primaryVariant: '#1976D2',
    secondary: '#FF9800',
    secondaryVariant: '#F57C00',
    
    // Background colors
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    
    // Text colors
    text: '#212121',
    textSecondary: '#757575',
    textDisabled: '#9E9E9E',
    
    // Status colors
    error: '#F44336',
    success: '#4CAF50',
    warning: '#FFC107',
    info: '#2196F3',
    
    // Border and divider colors
    border: '#E0E0E0',
    divider: '#E0E0E0',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Icon colors
    icon: '#757575',
    iconActive: '#2196F3',
  },
  
  // Typography system
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold', lineHeight: 40 },
    h2: { fontSize: 28, fontWeight: 'bold', lineHeight: 36 },
    h3: { fontSize: 24, fontWeight: 'bold', lineHeight: 32 },
    h4: { fontSize: 20, fontWeight: 'bold', lineHeight: 28 },
    h5: { fontSize: 18, fontWeight: 'bold', lineHeight: 26 },
    h6: { fontSize: 16, fontWeight: 'bold', lineHeight: 24 },
    subtitle1: { fontSize: 16, fontWeight: 'normal', lineHeight: 24 },
    subtitle2: { fontSize: 14, fontWeight: 'normal', lineHeight: 20 },
    body1: { fontSize: 16, fontWeight: 'normal', lineHeight: 24 },
    body2: { fontSize: 14, fontWeight: 'normal', lineHeight: 20 },
    button: { fontSize: 14, fontWeight: 'bold', lineHeight: 16 },
    caption: { fontSize: 12, fontWeight: 'normal', lineHeight: 16 },
    overline: { fontSize: 10, fontWeight: 'normal', lineHeight: 14 },
  },
  
  // Elevation system
  elevation: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    low: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    high: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};

// Dark theme optimized for readability
export const darkTheme = {
  dark: true,
  colors: {
    // Primary colors
    primary: '#64B5F6',
    primaryVariant: '#1976D2',
    secondary: '#FFB74D',
    secondaryVariant: '#F57C00',
    
    // Background colors
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2D2D2D',
    
    // Text colors
    text: '#FFFFFF',
    textSecondary: '#B0B0B0',
    textDisabled: '#616161',
    
    // Status colors
    error: '#FF6B6B',
    success: '#66BB6A',
    warning: '#FFD54F',
    info: '#42A5F5',
    
    // Border and divider colors
    border: '#424242',
    divider: '#424242',
    
    // Overlay colors
    overlay: 'rgba(0, 0, 0, 0.7)',
    
    // Icon colors
    icon: '#B0B0B0',
    iconActive: '#64B5F6',
  },
  
  // Typography system (same as light theme)
  typography: lightTheme.typography,
  
  // Elevation system (same as light theme)
  elevation: lightTheme.elevation,
};

// AMOLED dark theme for OLED screens
export const amoledDarkTheme = {
  ...darkTheme,
  colors: {
    ...darkTheme.colors,
    background: '#000000',
    surface: '#000000',
    surfaceVariant: '#121212',
  },
};

// Theme options
export const THEME_OPTIONS = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
  AMOLED: 'amoled',
};

// Default theme configuration
export const DEFAULT_THEME = THEME_OPTIONS.LIGHT;

// Theme configuration with user preferences
export const themeConfig = {
  [THEME_OPTIONS.LIGHT]: lightTheme,
  [THEME_OPTIONS.DARK]: darkTheme,
  [THEME_OPTIONS.SYSTEM]: 'system', // Will be determined at runtime
  [THEME_OPTIONS.AMOLED]: amoledDarkTheme,
};

export default {
  lightTheme,
  darkTheme,
  amoledDarkTheme,
  THEME_OPTIONS,
  DEFAULT_THEME,
  themeConfig,
};