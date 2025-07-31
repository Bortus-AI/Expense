import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Button from '../../components/common/Button';
import { getStorageUsage, optimizeStorage, clearCache } from '../../services/offlineStorageService';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import Toast from 'react-native-toast-message';
import { trackScreenView, trackButtonClick } from '../../services/analyticsService';

const StorageSettingsScreen = () => {
  const { theme } = useTheme();
  const { triggerManualSync, isSyncing } = useOfflineSync();
  const [storageUsage, setStorageUsage] = useState({
    totalSize: 0,
    unit: 'KB',
    keysCount: 0,
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Track screen view when component mounts
  React.useEffect(() => {
    trackScreenView('StorageSettingsScreen');
  }, []);

  useEffect(() => {
    loadStorageUsage();
  }, []);

  const loadStorageUsage = async () => {
    try {
      const usage = await getStorageUsage();
      setStorageUsage(usage);
    } catch (error) {
      console.warn('Failed to load storage usage:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load storage usage',
      });
    }
  };

  const handleOptimizeStorage = async () => {
    trackButtonClick('OptimizeStorage', 'StorageSettingsScreen');
    setIsOptimizing(true);
    try {
      const result = await optimizeStorage();
      await loadStorageUsage();
      
      Toast.show({
        type: 'success',
        text1: 'Storage Optimized',
        text2: `Removed ${result.removedItems} expired items`,
      });
    } catch (error) {
      console.error('Error optimizing storage:', error);
      Toast.show({
        type: 'error',
        text1: 'Optimization Failed',
        text2: 'Failed to optimize storage',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleClearCache = async () => {
    trackButtonClick('ClearCache', 'StorageSettingsScreen');
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
              console.error('Error clearing cache:', error);
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to clear cache',
              });
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    trackButtonClick('ManualSync', 'StorageSettingsScreen');
    try {
      const result = await triggerManualSync();
      Toast.show({
        type: 'success',
        text1: 'Sync Complete',
        text2: result.message,
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Failed to sync data',
      });
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      padding: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 16,
    },
    storageInfo: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 16,
    },
    storageInfoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    storageInfoLabel: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    storageInfoValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    optionText: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '500',
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
    },
    button: {
      minWidth: 100,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Information</Text>
          
          <View style={styles.storageInfo}>
            <View style={styles.storageInfoRow}>
              <Text style={styles.storageInfoLabel}>Total Storage Used:</Text>
              <Text style={styles.storageInfoValue}>{storageUsage.totalSize.toFixed(2)} {storageUsage.unit}</Text>
            </View>
            <View style={styles.storageInfoRow}>
              <Text style={styles.storageInfoLabel}>Stored Keys:</Text>
              <Text style={styles.storageInfoValue}>{storageUsage.keysCount}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Storage Management</Text>
          
          <View style={styles.option}>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Optimize Storage</Text>
              <Text style={styles.optionDescription}>Remove expired and unnecessary data</Text>
            </View>
            <Button
              title="Optimize"
              onPress={handleOptimizeStorage}
              disabled={isOptimizing}
              loading={isOptimizing}
              style={styles.button}
            />
          </View>
          
          <View style={styles.option}>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Clear Cache</Text>
              <Text style={styles.optionDescription}>Remove all cached data</Text>
            </View>
            <Button
              title="Clear"
              onPress={handleClearCache}
              style={styles.button}
            />
          </View>
          
          <View style={styles.option}>
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Manual Sync</Text>
              <Text style={styles.optionDescription}>Sync data with server now</Text>
            </View>
            <Button
              title="Sync"
              onPress={handleManualSync}
              disabled={isSyncing}
              loading={isSyncing}
              style={styles.button}
            />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default StorageSettingsScreen;