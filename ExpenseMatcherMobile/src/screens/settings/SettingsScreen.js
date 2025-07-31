import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Pressable,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNetwork } from '../../contexts/NetworkContext';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import SyncStatusIndicator from '../../components/common/SyncStatusIndicator';
import { getStorageUsage, clearCache, optimizeStorage } from '../../services/offlineStorageService';
import Toast from 'react-native-toast-message';

const SettingsScreen = ({ navigation }) => {
  const {
    theme,
    themeOption,
    isDarkMode,
    changeTheme,
    THEME_OPTIONS,
    exportTheme,
    importTheme,
    setCustomPrimaryColor,
    setCustomAccentColor,
    resetCustomColors,
  } = useTheme();
  
  const { user, logout } = useAuth();
  const { isConnected, isInternetReachable } = useNetwork();
  const { isSyncing, lastSyncTime, triggerManualSync } = useOfflineSync();
  
  // State for various settings
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [ocrEnabled, setOcrEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [analyticsOptOut, setAnalyticsOptOut] = useState(false);
  const [syncFrequency, setSyncFrequency] = useState('30'); // minutes
  const [storageUsage, setStorageUsage] = useState({ totalSize: 0, unit: 'KB', keysCount: 0 });
  const [debugMode, setDebugMode] = useState(false);
  const [experimentalFeatures, setExperimentalFeatures] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [locationServices, setLocationServices] = useState(true);
  const [adPersonalization, setAdPersonalization] = useState(true);
  const [imageCompression, setImageCompression] = useState('medium');
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [notificationSound, setNotificationSound] = useState('default');
  
  // State for modals and forms
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Load storage usage on mount
  useEffect(() => {
    loadStorageUsage();
  }, []);
  
  const loadStorageUsage = async () => {
    try {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.warn('Failed to load storage usage:', error);
    }
  };

  const handleThemeChange = useCallback((newThemeOption) => {
    console.log('Changing theme to:', newThemeOption);
    changeTheme(newThemeOption);
  }, [changeTheme]);

  const showThemeOptions = () => {
    Alert.alert(
      'Select Theme',
      'Choose your preferred theme',
      [
        {
          text: 'Light',
          onPress: () => handleThemeChange(THEME_OPTIONS.LIGHT),
        },
        {
          text: 'Dark',
          onPress: () => handleThemeChange(THEME_OPTIONS.DARK),
        },
        {
          text: 'AMOLED Dark',
          onPress: () => handleThemeChange(THEME_OPTIONS.AMOLED),
        },
        {
          text: 'System',
          onPress: () => handleThemeChange(THEME_OPTIONS.SYSTEM),
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Toast.show({
                type: 'success',
                text1: 'Logged Out',
                text2: 'You have been successfully logged out',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Logout Failed',
                text2: 'Failed to logout. Please try again.',
              });
            }
          },
        },
      ]
    );
  };
  
  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };
  
  const handleSavePassword = () => {
    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Password Error',
        text2: 'New passwords do not match',
      });
      return;
    }
    
    // In a real app, you would make an API call to change the password
    Toast.show({
      type: 'success',
      text1: 'Password Changed',
      text2: 'Your password has been updated successfully',
    });
    
    setShowPasswordModal(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };
  
  const handleClearCache = async () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear all cached data? This will not delete your receipts but may temporarily affect performance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearCache();
              await loadStorageUsage();
              Toast.show({
                type: 'success',
                text1: 'Cache Cleared',
                text2: 'All cached data has been removed',
              });
            } catch (error) {
              Toast.show({
                type: 'error',
                text1: 'Clear Failed',
                text2: 'Failed to clear cache',
              });
            }
          },
        },
      ]
    );
  };
  
  const handleOptimizeStorage = async () => {
    try {
      const result = await optimizeStorage();
      await loadStorageUsage();
      Toast.show({
        type: 'success',
        text1: 'Storage Optimized',
        text2: `Removed ${result.removedItems} expired items`,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Optimization Failed',
        text2: 'Failed to optimize storage',
      });
    }
  };
  
  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'This will export all your receipt data. The file will be saved to your device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: () => {
            // In a real app, you would implement the actual export functionality
            Toast.show({
              type: 'success',
              text1: 'Data Exported',
              text2: 'Your data has been exported successfully',
            });
          },
        },
      ]
    );
  };
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all associated data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, you would implement the actual account deletion
            Toast.show({
              type: 'success',
              text1: 'Account Deleted',
              text2: 'Your account has been deleted successfully',
            });
          },
        },
      ]
    );
  };
  
  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to their default values. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset all settings to default values
            setNotificationsEnabled(true);
            setOcrEnabled(true);
            setEmailNotifications(true);
            setPushNotifications(true);
            setDataCollection(true);
            setAnalyticsOptOut(false);
            setSyncFrequency('30');
            setDebugMode(false);
            setExperimentalFeatures(false);
            setBiometricAuth(false);
            setLocationServices(true);
            setAdPersonalization(true);
            setImageCompression('medium');
            setDoNotDisturb(false);
            setNotificationSound('default');
            
            Toast.show({
              type: 'success',
              text1: 'Settings Reset',
              text2: 'All settings have been reset to default values',
            });
          },
        },
      ]
    );
  };
  
  const formatStorageSize = (size) => {
    if (size < 1024) {
      return `${size.toFixed(2)} KB`;
    } else {
      return `${(size / 1024).toFixed(2)} MB`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: theme.colors.primary,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    searchContainer: {
      padding: 10,
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    searchInput: {
      backgroundColor: theme.colors.background,
      borderRadius: 8,
      padding: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    section: {
      marginTop: 20,
      backgroundColor: theme.colors.surface,
      padding: 15,
      marginHorizontal: 15,
      borderRadius: 8,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    settingItemLast: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
    },
    settingText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    settingTextSecondary: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    versionContainer: {
      alignItems: 'center',
      padding: 30,
    },
    versionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 20,
      width: '80%',
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
      textAlign: 'center',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      flex: 1,
      marginHorizontal: 5,
    },
    dangerButton: {
      backgroundColor: theme.colors.error,
    },
    dangerButtonText: {
      color: '#FFFFFF',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
        <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
          <Icon name="search" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {showSearch && (
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search settings..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}
      
      <ScrollView>
        {/* Account Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setShowAccountModal(true)}
          >
            <Text style={styles.settingText}>Profile Information</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleChangePassword}
          >
            <Text style={styles.settingText}>Change Password</Text>
          </TouchableOpacity>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Biometric Authentication</Text>
            <Switch
              value={biometricAuth}
              onValueChange={setBiometricAuth}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={biometricAuth ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('StorageSettings')}
          >
            <Text style={styles.settingText}>Linked Accounts</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItemLast}>
            <Text style={styles.settingText}>Subscription Status</Text>
            <Text style={styles.settingTextSecondary}>Premium</Text>
          </TouchableOpacity>
        </View>
        
        {/* Appearance Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={showThemeOptions}
          >
            <Text style={styles.settingText}>Theme Mode</Text>
            <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
              {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => navigation.navigate('ThemeCustomization')}
          >
            <Text style={styles.settingText}>Customize Theme</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItemLast}>
            <Text style={styles.settingText}>Reset to Default Theme</Text>
            <Button
              title="Reset"
              onPress={resetCustomColors}
              variant="outline"
              textStyle={{ fontSize: 12 }}
              style={{ paddingVertical: 5, paddingHorizontal: 10 }}
            />
          </TouchableOpacity>
        </View>
        
        {/* Notification Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Push Notifications</Text>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={pushNotifications ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Email Notifications</Text>
            <Switch
              value={emailNotifications}
              onValueChange={setEmailNotifications}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={emailNotifications ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Notification Sound</Text>
            <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
              {notificationSound}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.settingItemLast}>
            <Text style={styles.settingText}>Do Not Disturb</Text>
            <Switch
              value={doNotDisturb}
              onValueChange={setDoNotDisturb}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={doNotDisturb ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>
        
        {/* Privacy Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Data Collection</Text>
            <Switch
              value={dataCollection}
              onValueChange={setDataCollection}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={dataCollection ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Analytics Opt-Out</Text>
            <Switch
              value={analyticsOptOut}
              onValueChange={setAnalyticsOptOut}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={analyticsOptOut ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Location Services</Text>
            <Switch
              value={locationServices}
              onValueChange={setLocationServices}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={locationServices ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItemLast}>
            <Text style={styles.settingText}>Ad Personalization</Text>
            <Switch
              value={adPersonalization}
              onValueChange={setAdPersonalization}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={adPersonalization ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>
        
        {/* Sync Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sync</Text>
          <TouchableOpacity style={styles.settingItem} onPress={triggerManualSync}>
            <Text style={styles.settingText}>Manual Sync</Text>
            {isSyncing ? (
              <Text style={styles.settingTextSecondary}>Syncing...</Text>
            ) : (
              <SyncStatusIndicator
                isSyncing={isSyncing}
                lastSyncTime={lastSyncTime}
                style={{ padding: 0 }}
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Sync Frequency</Text>
            <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
              Every {syncFrequency} minutes
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Selective Sync</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Conflict Resolution</Text>
            <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
              Timestamp
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItemLast} onPress={handleExportData}>
            <Text style={styles.settingText}>Export Data</Text>
          </TouchableOpacity>
        </View>
        
        {/* Storage Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Cache Size</Text>
            <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
              {formatStorageSize(storageUsage.totalSize)}
            </Text>
          </View>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleClearCache}>
            <Text style={styles.settingText}>Clear Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleOptimizeStorage}>
            <Text style={styles.settingText}>Optimize Storage</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Offline Data</Text>
            <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
              {storageUsage.keysCount} items
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItemLast}>
            <Text style={styles.settingText}>Image Compression</Text>
            <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
              {imageCompression}
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Advanced Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Debug Mode</Text>
            <Switch
              value={debugMode}
              onValueChange={setDebugMode}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={debugMode ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingText}>Experimental Features</Text>
            <Switch
              value={experimentalFeatures}
              onValueChange={setExperimentalFeatures}
              trackColor={{false: '#767577', true: theme.colors.primary}}
              thumbColor={experimentalFeatures ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Developer Options</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>App Version</Text>
            <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
              v1.0.0
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Send Feedback</Text>
            <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItemLast} onPress={handleResetSettings}>
            <Text style={styles.settingText}>Reset Settings</Text>
          </TouchableOpacity>
        </View>
        
        {/* Danger Zone */}
        <View style={[styles.section, { borderColor: theme.colors.error, borderWidth: 1 }]}>
          <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Danger Zone</Text>
          <TouchableOpacity style={styles.settingItemLast} onPress={handleDeleteAccount}>
            <Text style={[styles.settingText, { color: theme.colors.error }]}>Delete Account</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Expense Matcher v1.0.0</Text>
        </View>
      </ScrollView>
      
      {/* Account Modal */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Account Information</Text>
            <Text style={[styles.settingText, { marginBottom: 10 }]}>Name: {user?.name || 'User'}</Text>
            <Text style={[styles.settingText, { marginBottom: 20 }]}>Email: {user?.email || 'user@example.com'}</Text>
            <View style={styles.buttonContainer}>
              <Button
                title="Close"
                onPress={() => setShowAccountModal(false)}
                style={styles.button}
              />
              <Button
                title="Logout"
                onPress={handleLogout}
                variant="danger"
                style={[styles.button, styles.dangerButton]}
                textStyle={styles.dangerButtonText}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      {/* Change Password Modal */}
      <Modal
        visible={showPasswordModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <Input
              label="Current Password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry={true}
            />
            <Input
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={true}
            />
            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={true}
            />
            <View style={styles.buttonContainer}>
              <Button
                title="Cancel"
                onPress={() => setShowPasswordModal(false)}
                variant="outline"
                style={styles.button}
              />
              <Button
                title="Save"
                onPress={handleSavePassword}
                style={styles.button}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SettingsScreen;