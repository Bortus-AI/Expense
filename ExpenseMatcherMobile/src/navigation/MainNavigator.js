import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

// Import screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ReceiptsListScreen from '../screens/receipts/ReceiptsListScreen';
import ReceiptDetailScreen from '../screens/receipts/ReceiptDetailScreen';
import ReceiptEditScreen from '../screens/receipts/ReceiptEditScreen';
import GalleryScreen from '../screens/receipts/GalleryScreen';
import CameraScreen from '../screens/camera/CameraScreen';
import OCRReviewScreen from '../screens/camera/OCRReviewScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import StorageSettingsScreen from '../screens/settings/StorageSettingsScreen';
import ThemeCustomizationScreen from '../screens/settings/ThemeCustomizationScreen';

// Import contexts
import {useTheme} from '../contexts/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

const AuthNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{headerShown: false}}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const DashboardStack = createNativeStackNavigator();
const ReceiptsStack = createNativeStackNavigator();
const CameraStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

const DashboardStackNavigator = () => {
  return (
    <DashboardStack.Navigator>
      <DashboardStack.Screen name="Dashboard" component={DashboardScreen} />
    </DashboardStack.Navigator>
  );
};

const ReceiptsStackNavigator = () => {
  return (
    <ReceiptsStack.Navigator>
      <ReceiptsStack.Screen name="Receipts" component={ReceiptsListScreen} />
      <ReceiptsStack.Screen name="Gallery" component={GalleryScreen} />
      <ReceiptsStack.Screen name="ReceiptDetail" component={ReceiptDetailScreen} />
      <ReceiptsStack.Screen name="ReceiptEdit" component={ReceiptEditScreen} />
    </ReceiptsStack.Navigator>
  );
};

const CameraStackNavigator = () => {
  return (
    <CameraStack.Navigator>
      <CameraStack.Screen name="Camera" component={CameraScreen} />
      <CameraStack.Screen name="OCRReview" component={OCRReviewScreen} />
    </CameraStack.Navigator>
  );
};

const ProfileStackNavigator = () => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="Profile" component={ProfileScreen} />
      <ProfileStack.Screen name="Settings" component={SettingsScreen} />
      <ProfileStack.Screen name="ThemeCustomization" component={ThemeCustomizationScreen} />
      <ProfileStack.Screen name="StorageSettings" component={StorageSettingsScreen} />
      <ProfileStack.Screen name="About" component={AboutScreen} />
    </ProfileStack.Navigator>
  );
};

const MainTabs = () => {
  const {theme} = useTheme();
  
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName;
          
          if (route.name === 'Dashboard') {
            iconName = 'dashboard';
          } else if (route.name === 'Receipts') {
            iconName = 'receipt';
          } else if (route.name === 'Camera') {
            iconName = 'camera';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        headerShown: false,
      })}>
      <Tab.Screen name="Dashboard" component={DashboardStackNavigator} />
      <Tab.Screen name="Receipts" component={ReceiptsStackNavigator} />
      <Tab.Screen name="Camera" component={CameraStackNavigator} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

const MainNavigator = () => {
  // This would typically use AuthContext to determine if user is logged in
  const isLoggedIn = false; // Placeholder
  
  return (
    <>
      {isLoggedIn ? <MainTabs /> : <AuthNavigator />}
    </>
  );
};

export default MainNavigator;