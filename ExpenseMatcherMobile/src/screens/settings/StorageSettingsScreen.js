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

const StorageSettingsScreen = () => {
  const { theme } = useTheme();
  const { triggerManualSync, isSyncing } = useOfflineSync();
  const [storageUsage, setStorageUsage] = useState({
    totalSize: 0,
    unit: 'KB',
    keysCount: 0,
  });
  const [isOptimizing, setIsOptimizing] = useState(false);

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
                text1: 'Clear Failed',
                text2: 'Failed to clear cache',
              });
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    try {
      await triggerManualSync();
      Toast.show({
        type: 'success',
        text1: 'Sync Complete',
        text2: 'Your data has been synced successfully',
      });
    } catch (error) {
      console.error('Manual sync error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Failed to sync data',
      });
    }
  };

  const formatStorageSize = (size) => {
    if (size < 1024) {
      return `${size.toFixed(2)} KB`;
    } else {
      return `${(size / 1024).toFixed(2)} MB`;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Storage Usage</Text>
        <View style={styles.storageInfo}>
          <View style={styles.storageItem}>
            <Icon name="storage" size={24} color={theme.colors.primary} />
            <View style={styles.storageText}>
              <Text style={[styles.storageLabel, { color: theme.colors.text }]}>Total Storage</Text>
              <Text style={[styles.storageValue, { color: theme.colors.text }]}>{formatStorageSize(storageUsage.totalSize)}</Text>
            </View>
          </View>
          
          <View style={styles.storageItem}>
            <Icon name="description" size={24} color={theme.colors.primary} />
            <View style={styles.storageText}>
              <Text style={[styles.storageLabel, { color: theme.colors.text }]}>Receipts</Text>
              <Text style={[styles.storageValue, { color: theme.colors.text }]}>{storageUsage.keysCount} items</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Sync Options</Text>
        
        <View style={styles.option}>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Manual Sync</Text>
            <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
              Force sync all pending changes now
            </Text>
          </View>
          <Button
            title="Sync Now"
            onPress={handleManualSync}
            disabled={isSyncing}
            loading={isSyncing}
            style={styles.button}
          />
        </View>
        
        <View style={styles.option}>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Optimize Storage</Text>
            <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
              Remove expired cache items and optimize storage
            </Text>
          </View>
          <Button
            title="Optimize"
            onPress={handleOptimizeStorage}
            disabled={isOptimizing}
            loading={isOptimizing}
            variant="secondary"
            style={styles.button}
          />
        </View>
        
        <View style={styles.option}>
          <View style={styles.optionText}>
            <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Clear Cache</Text>
            <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
              Remove all cached data (receipts will remain)
            </Text>
          </View>
          <Button
            title="Clear"
            onPress={handleClearCache}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  storageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  storageText: {
    marginLeft: 8,
  },
  storageLabel: {
    fontSize: 14,
    color: '#666',
  },
  storageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 4,
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

export default StorageSettingsScreen;