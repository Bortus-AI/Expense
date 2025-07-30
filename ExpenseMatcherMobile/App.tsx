import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider, useTheme, getThemedStatusBarStyle } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';

const ThemedApp = () => {
  const { theme, isDarkMode } = useTheme();
  
  return (
    <>
      <StatusBar 
        barStyle={getThemedStatusBarStyle(isDarkMode)} 
        backgroundColor={theme.colors.primary}
        translucent={false}
      />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
      <Toast />
    </>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
};

export default App;
