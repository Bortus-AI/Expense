import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {useAuth} from '../../contexts/AuthContext';
import { trackScreenView, trackButtonClick } from '../../services/analyticsService';

const ProfileScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user, logout} = useAuth();
  
  // Track screen view when component mounts
  React.useEffect(() => {
    trackScreenView('ProfileScreen', { userId: user?.id });
  }, [user?.id]);

  const handleSettingsPress = () => {
    trackButtonClick('OpenSettings', 'ProfileScreen');
    navigation.navigate('Settings');
  };

  const handleAboutPress = () => {
    trackButtonClick('OpenAbout', 'ProfileScreen');
    navigation.navigate('About');
  };

  const handleLogout = async () => {
    trackButtonClick('Logout', 'ProfileScreen');
    try {
      const result = await logout();
      if (!result.success) {
        alert('Logout failed. Please try again.');
      }
    } catch (error) {
      alert('Logout error: ' + error.message);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      alignItems: 'center',
      padding: 30,
      backgroundColor: theme.colors.primary,
    },
    userName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginTop: 10,
    },
    userEmail: {
      fontSize: 16,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    section: {
      margin: 16,
      padding: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    optionText: {
      flex: 1,
      fontSize: 16,
      color: theme.colors.text,
    },
    logoutButton: {
      margin: 16,
      padding: 16,
      backgroundColor: theme.colors.error,
      borderRadius: 8,
      alignItems: 'center',
    },
    logoutText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.userName}>{user?.name || 'User'}</Text>
        <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Settings</Text>
        
        <TouchableOpacity style={styles.option} onPress={handleSettingsPress}>
          <Text style={styles.optionText}>Settings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.option} onPress={handleAboutPress}>
          <Text style={styles.optionText}>About</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;
