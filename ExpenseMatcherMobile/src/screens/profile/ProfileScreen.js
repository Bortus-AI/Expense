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

const ProfileScreen = ({navigation}) => {
  const {theme} = useTheme();
  const {user, logout} = useAuth();

  const handleSettingsPress = () => {
    navigation.navigate('Settings');
  };

  const handleAboutPress = () => {
    navigation.navigate('About');
  };

  const handleLogout = async () => {
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
      padding: 30,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 15,
    },
    avatarText: {
      fontSize: 40,
      color: theme.colors.primary,
    },
    nameText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 5,
    },
    emailText: {
      fontSize: 16,
      color: '#FFFFFF',
    },
    menuContainer: {
      marginTop: 20,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuIcon: {
      fontSize: 24,
      color: theme.colors.primary,
      marginRight: 15,
    },
    menuText: {
      fontSize: 16,
      color: theme.colors.text,
      flex: 1,
    },
    logoutButton: {
      backgroundColor: theme.colors.error,
      margin: 20,
      padding: 15,
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
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={styles.nameText}>{user?.name || 'User'}</Text>
        <Text style={styles.emailText}>{user?.email || 'user@example.com'}</Text>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity style={styles.menuItem} onPress={handleSettingsPress}>
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleAboutPress}>
          <Text style={styles.menuIcon}>ℹ️</Text>
          <Text style={styles.menuText}>About</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProfileScreen;
