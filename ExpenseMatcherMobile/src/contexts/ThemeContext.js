import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import {
  lightTheme,
  darkTheme,
  amoledDarkTheme,
  THEME_OPTIONS,
  DEFAULT_THEME
} from '../themes';

const ThemeContext = createContext();

// Theme configuration
const themes = {
  [THEME_OPTIONS.LIGHT]: lightTheme,
  [THEME_OPTIONS.DARK]: darkTheme,
  [THEME_OPTIONS.AMOLED]: amoledDarkTheme,
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(lightTheme);
  const [themeOption, setThemeOption] = useState(DEFAULT_THEME);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [customColors, setCustomColors] = useState({});

  // Load theme from storage on app start
  useEffect(() => {
    loadTheme();
    
    // Listen for system theme changes
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeOption === THEME_OPTIONS.SYSTEM) {
        applySystemTheme(colorScheme);
      }
    });
    
    return () => {
      subscription?.remove();
    };
  }, []);

  // Apply system theme when theme option changes
  useEffect(() => {
    if (themeOption === THEME_OPTIONS.SYSTEM) {
      const colorScheme = Appearance.getColorScheme();
      applySystemTheme(colorScheme);
    }
  }, [themeOption]);

  const loadTheme = async () => {
    try {
      const savedThemeOption = await AsyncStorage.getItem('themeOption');
      const savedCustomColors = await AsyncStorage.getItem('customColors');
      
      if (savedThemeOption) {
        setThemeOption(savedThemeOption);
      }
      
      if (savedCustomColors) {
        const parsedCustomColors = JSON.parse(savedCustomColors);
        setCustomColors(parsedCustomColors);
        applyCustomColors(parsedCustomColors);
      } else if (savedThemeOption) {
        applyTheme(savedThemeOption);
      }
    } catch (error) {
      console.log('Error loading theme:', error);
    }
  };

  const applySystemTheme = (colorScheme) => {
    const systemTheme = colorScheme === 'dark' ? darkTheme : lightTheme;
    setTheme(systemTheme);
    setIsDarkMode(colorScheme === 'dark');
  };

  const applyTheme = (selectedThemeOption) => {
    switch (selectedThemeOption) {
      case THEME_OPTIONS.LIGHT:
        setTheme(lightTheme);
        setIsDarkMode(false);
        break;
      case THEME_OPTIONS.DARK:
        setTheme(darkTheme);
        setIsDarkMode(true);
        break;
      case THEME_OPTIONS.AMOLED:
        setTheme(amoledDarkTheme);
        setIsDarkMode(true);
        break;
      case THEME_OPTIONS.SYSTEM:
        const colorScheme = Appearance.getColorScheme();
        applySystemTheme(colorScheme);
        break;
      default:
        setTheme(lightTheme);
        setIsDarkMode(false);
    }
  };

  const applyCustomColors = (colors) => {
    setTheme(prevTheme => ({
      ...prevTheme,
      colors: {
        ...prevTheme.colors,
        ...colors,
      },
    }));
  };

  const changeTheme = async (newThemeOption) => {
    setThemeOption(newThemeOption);
    applyTheme(newThemeOption);
    
    try {
      await AsyncStorage.setItem('themeOption', newThemeOption);
    } catch (error) {
      console.log('Error saving theme option:', error);
    }
  };

  const setCustomPrimaryColor = async (color) => {
    const newCustomColors = {
      ...customColors,
      primary: color,
      primaryVariant: color, // Simplified for now
    };
    
    setCustomColors(newCustomColors);
    applyCustomColors(newCustomColors);
    
    try {
      await AsyncStorage.setItem('customColors', JSON.stringify(newCustomColors));
    } catch (error) {
      console.log('Error saving custom colors:', error);
    }
  };

  const setCustomAccentColor = async (color) => {
    const newCustomColors = {
      ...customColors,
      secondary: color,
      secondaryVariant: color, // Simplified for now
    };
    
    setCustomColors(newCustomColors);
    applyCustomColors(newCustomColors);
    
    try {
      await AsyncStorage.setItem('customColors', JSON.stringify(newCustomColors));
    } catch (error) {
      console.log('Error saving custom colors:', error);
    }
  };

  const resetCustomColors = async () => {
    setCustomColors({});
    applyTheme(themeOption);
    
    try {
      await AsyncStorage.removeItem('customColors');
    } catch (error) {
      console.log('Error resetting custom colors:', error);
    }
  };

  const exportTheme = () => {
    return {
      themeOption,
      customColors,
    };
  };

  const importTheme = async (themeData) => {
    if (themeData.themeOption) {
      await changeTheme(themeData.themeOption);
    }
    
    if (themeData.customColors) {
      setCustomColors(themeData.customColors);
      applyCustomColors(themeData.customColors);
      
      try {
        await AsyncStorage.setItem('customColors', JSON.stringify(themeData.customColors));
      } catch (error) {
        console.log('Error importing custom colors:', error);
      }
    }
  };

  const value = {
    theme,
    themeOption,
    isDarkMode,
    changeTheme,
    setCustomPrimaryColor,
    setCustomAccentColor,
    resetCustomColors,
    exportTheme,
    importTheme,
    THEME_OPTIONS,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;