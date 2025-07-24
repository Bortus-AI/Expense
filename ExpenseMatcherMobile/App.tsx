import React from 'react';
import { StatusBar } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import Toast from 'react-native-toast-message';

const App = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
      <Toast />
    </>
  );
};

export default App;
