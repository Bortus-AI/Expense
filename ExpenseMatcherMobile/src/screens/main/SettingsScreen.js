import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import OfflineService from '../../services/offlineService';
import Toast from 'react-native-toast-message';

const SettingsScreen = ({ navigation }) => {
  const { theme, isDarkMode, themePreference, setTheme, toggleTheme } = useTheme();
  const { user, currentCompany, logout } = useAuth();
  const [cacheInfo, setCacheInfo] = useState(null);
  const [loadingCache, setLoadingCache] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);

  useEffect(() => {
    loadCacheInfo();
  }, []);

  const loadCacheInfo = async () => {
    try {
      const info = await OfflineService.getCacheSize();
      setCacheInfo(info);
    } catch (error) {
      console.error('Error loading cache info:', error);
    }
  };

  const handleThemeChange = (mode) => {
    setTheme(mode);
    Toast.show({
      type: 'success',
      text1: 'Theme Updated',
      text2: `Switched to ${mode} mode`,
    });
  };

  const clearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all offline data and cached images. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setLoadingCache(true);
            try {
              await OfflineService.clearCache();
              await loadCacheInfo();
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to clear cache',
              });
            } finally {
              setLoadingCache(false);
            }
          }
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      paddingBottom: 20,
    },
    section: {
      backgroundColor: theme.colors.surface,
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.sm,
    },
    sectionHeader: {
      paddingHorizontal: theme.spacing.lg,
      paddingTop: theme.spacing.lg,
      paddingBottom: theme.spacing.sm,
    },
    sectionTitle: {
      ...theme.typography.h6,
      color: theme.colors.text,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    settingItemLast: {
      borderBottomWidth: 0,
    },
    settingLabel: {
      flex: 1,
    },
    settingTitle: {
      ...theme.typography.body1,
      color: theme.colors.text,
      marginBottom: 2,
    },
    settingDescription: {
      ...theme.typography.caption,
      color: theme.colors.textLight,
    },
    settingValue: {
      ...theme.typography.body2,
      color: theme.colors.textSecondary,
    },
    themeOptions: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.lg,
    },
    themeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
    },
    themeRadio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 2,
      borderColor: theme.colors.primary,
      marginRight: theme.spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    themeRadioSelected: {
      backgroundColor: theme.colors.primary,
    },
    themeRadioInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.colors.surface,
    },
    themeOptionText: {
      ...theme.typography.body1,
      color: theme.colors.text,
    },
    profileSection: {
      alignItems: 'center',
      paddingVertical: theme.spacing.xl,
    },
    profileAvatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.md,
    },
    profileInitials: {
      ...theme.typography.h3,
      color: theme.colors.surface,
      fontWeight: 'bold',
    },
    profileName: {
      ...theme.typography.h5,
      color: theme.colors.text,
      marginBottom: 4,
    },
    profileCompany: {
      ...theme.typography.body2,
      color: theme.colors.textLight,
    },
    cacheInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cacheInfoText: {
      ...theme.typography.caption,
      color: theme.colors.textLight,
      flex: 1,
    },
    clearCacheButton: {
      backgroundColor: theme.colors.error,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.borderRadius.md,
    },
    clearCacheText: {
      ...theme.typography.caption,
      color: theme.colors.surface,
      fontWeight: '600',
    },
    logoutButton: {
      backgroundColor: theme.colors.error,
      marginHorizontal: theme.spacing.md,
      marginTop: theme.spacing.md,
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.borderRadius.lg,
      alignItems: 'center',
    },
    logoutText: {
      ...theme.typography.button,
      color: theme.colors.surface,
    },
    versionInfo: {
      alignItems: 'center',
      paddingVertical: theme.spacing.lg,
    },
    versionText: {
      ...theme.typography.caption,
      color: theme.colors.textMuted,
    },
  });

  const getInitials = (firstName, lastName) => {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'U';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Profile Section */}
      <View style={styles.section}>
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>
              {getInitials(user?.firstName, user?.lastName)}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {user?.firstName} {user?.lastName}
          </Text>
          {currentCompany && (
            <Text style={styles.profileCompany}>
              {currentCompany.name}
            </Text>
          )}
        </View>
      </View>

      {/* Appearance Settings */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Appearance</Text>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>Theme</Text>
            <Text style={styles.settingDescription}>
              Choose your preferred theme
            </Text>
          </View>
        </View>
        
        <View style={styles.themeOptions}>
          {['light', 'dark', 'system'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={styles.themeOption}
              onPress={() => handleThemeChange(mode)}
            >
              <View style={[
                styles.themeRadio,
                themePreference === mode && styles.themeRadioSelected
              ]}>
                {themePreference === mode && (
                  <View style={styles.themeRadioInner} />
                )}
              </View>
              <Text style={styles.themeOptionText}>
                {mode === 'system' ? 'System Default' : 
                 mode.charAt(0).toUpperCase() + mode.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Data & Storage */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>Offline Sync</Text>
            <Text style={styles.settingDescription}>
              Sync data when connection returns
            </Text>
          </View>
          <Switch
            value={syncEnabled}
            onValueChange={setSyncEnabled}
            trackColor={{ false: theme.colors.disabled, true: theme.colors.primary }}
            thumbColor={theme.colors.surface}
          />
        </View>
        
        <View style={[styles.settingItem, styles.settingItemLast]}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>Cache Storage</Text>
            <View style={styles.cacheInfo}>
              <Text style={styles.cacheInfoText}>
                {cacheInfo ? 
                  `${cacheInfo.keys} items, ${cacheInfo.sizeFormatted}` : 
                  'Loading...'
                }
              </Text>
              <TouchableOpacity
                style={styles.clearCacheButton}
                onPress={clearCache}
                disabled={loadingCache}
              >
                {loadingCache ? (
                  <ActivityIndicator size="small" color={theme.colors.surface} />
                ) : (
                  <Text style={styles.clearCacheText}>Clear</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* App Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>About</Text>
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>Version</Text>
          </View>
          <Text style={styles.settingValue}>1.0.0</Text>
        </View>
        
        <View style={[styles.settingItem, styles.settingItemLast]}>
          <View style={styles.settingLabel}>
            <Text style={styles.settingTitle}>Build</Text>
          </View>
          <Text style={styles.settingValue}>Phase 3</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* Version Info */}
      <View style={styles.versionInfo}>
        <Text style={styles.versionText}>
          Expense Matcher Mobile v1.0.0
        </Text>
        <Text style={styles.versionText}>
          Built with ❤️ for efficient expense management
        </Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;