import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Main App Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import TransactionsScreen from '../screens/main/TransactionsScreen';
import ReceiptsScreen from '../screens/main/ReceiptsScreen';
import CameraScreen from '../screens/main/CameraScreen';
import MatchesScreen from '../screens/main/MatchesScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

// Loading Screen
import LoadingScreen from '../screens/LoadingScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const styles = StyleSheet.create({
  tabBarIcon: {
    fontSize: 24,
  },
});

const renderTabBarIcon = (routeName, focused, size) => {
  let iconName;

  switch (routeName) {
    case 'Dashboard':
      iconName = focused ? '📊' : '📈';
      break;
    case 'Transactions':
      iconName = focused ? '💳' : '💰';
      break;
    case 'Camera':
      iconName = '📷';
      break;
    case 'Receipts':
      iconName = focused ? '🧾' : '📄';
      break;
    case 'Matches':
      iconName = focused ? '🔗' : '🔍';
      break;
    default:
      iconName = '❓';
  }

  const iconStyle = {
    fontSize: size,
    color: focused ? '#667eea' : '#8e8e93',
  };

  return <Text style={[styles.tabBarIcon, iconStyle]}>{iconName}</Text>;
};


const AuthNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size }) => renderTabBarIcon(route.name, focused, size),
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#8e8e93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e1e1e1',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#667eea',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={DashboardScreen}
        options={{
          title: '💳 Expense Matcher',
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Transactions" 
        component={TransactionsScreen}
        options={{
          title: 'Transactions',
          tabBarLabel: 'Transactions',
        }}
      />
      <Tab.Screen 
        name="Camera" 
        component={CameraScreen}
        options={{
          title: 'Capture Receipt',
          tabBarLabel: 'Camera',
          tabBarStyle: { display: 'none' }, // Hide tab bar on camera screen
        }}
      />
      <Tab.Screen 
        name="Receipts" 
        component={ReceiptsScreen}
        options={{
          title: 'Receipts',
          tabBarLabel: 'Receipts',
        }}
      />
      <Tab.Screen 
        name="Matches" 
        component={MatchesScreen}
        options={{
          title: 'Matches',
          tabBarLabel: 'Matches',
        }}
      />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerStyle: {
            backgroundColor: '#667eea',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default AppNavigator; 