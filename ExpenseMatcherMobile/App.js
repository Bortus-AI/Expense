import React, { useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import MainNavigator from './src/navigation/MainNavigator';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { AuthProvider } from './src/contexts/AuthContext';
import { NetworkProvider } from './src/contexts/NetworkContext';
import { initDatabaseWithMigrations } from './src/services/migrationService';
import { useBackgroundSync } from './src/services/backgroundSyncService';
import Toast from 'react-native-toast-message';
import ThemeTransition from './src/components/common/ThemeTransition';
import ThemeOnboarding from './src/components/common/ThemeOnboarding';

const AppContent = () => {
  const { theme } = useTheme();
  
  return (
    <ThemeOnboarding>
      <ThemeTransition theme={theme}>
        <NavigationContainer>
          <MainNavigator />
          <Toast />
        </NavigationContainer>
      </ThemeTransition>
    </ThemeOnboarding>
  );
};

const App = () => {
  useEffect(() => {
    // Initialize database with migrations
    initDatabaseWithMigrations()
      .then(() => {
        console.log('Database initialized successfully');
      })
      .catch((error) => {
        console.error('Failed to initialize database:', error);
      });
  }, []);

  // Use background sync
  useBackgroundSync();

  return (
    <AuthProvider>
      <ThemeProvider>
        <NetworkProvider>
          <AppContent />
        </NetworkProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;