import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-netinfo/netinfo';
import Toast from 'react-native-toast-message';

class OfflineService {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected;
      
      if (wasOffline && this.isOnline) {
        this.syncPendingData();
        Toast.show({
          type: 'success',
          text1: 'Back Online',
          text2: 'Syncing pending data...',
        });
      } else if (!this.isOnline) {
        Toast.show({
          type: 'info',
          text1: 'Offline Mode',
          text2: 'Changes will sync when connection returns',
        });
      }
    });
  }

  async storeOfflineData(key, data) {
    try {
      const timestamp = new Date().toISOString();
      const offlineData = {
        data,
        timestamp,
        synced: false,
      };
      await AsyncStorage.setItem(`offline_${key}`, JSON.stringify(offlineData));
    } catch (error) {
      console.error('Error storing offline data:', error);
    }
  }

  async getOfflineData(key) {
    try {
      const stored = await AsyncStorage.getItem(`offline_${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error retrieving offline data:', error);
      return null;
    }
  }

  async cacheApiResponse(endpoint, data) {
    try {
      const cacheKey = `cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const cacheData = {
        data,
        timestamp: new Date().toISOString(),
        endpoint,
      };
      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.error('Error caching API response:', error);
    }
  }

  async getCachedResponse(endpoint, maxAge = 5 * 60 * 1000) { // 5 minutes default
    try {
      const cacheKey = `cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const cached = await AsyncStorage.getItem(cacheKey);
      
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const age = new Date().getTime() - new Date(cacheData.timestamp).getTime();
      
      if (age > maxAge) {
        await AsyncStorage.removeItem(cacheKey);
        return null;
      }
      
      return cacheData.data;
    } catch (error) {
      console.error('Error getting cached response:', error);
      return null;
    }
  }

  async addToSyncQueue(action, data) {
    try {
      const queueItem = {
        id: Date.now().toString(),
        action,
        data,
        timestamp: new Date().toISOString(),
        retries: 0,
      };
      
      this.syncQueue.push(queueItem);
      await this.persistSyncQueue();
      
      if (this.isOnline) {
        this.syncPendingData();
      }
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  async persistSyncQueue() {
    try {
      await AsyncStorage.setItem('sync_queue', JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Error persisting sync queue:', error);
    }
  }

  async loadSyncQueue() {
    try {
      const stored = await AsyncStorage.getItem('sync_queue');
      this.syncQueue = stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading sync queue:', error);
      this.syncQueue = [];
    }
  }

  async syncPendingData() {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    const maxRetries = 3;
    const itemsToSync = [...this.syncQueue];
    
    for (const item of itemsToSync) {
      try {
        await this.syncItem(item);
        this.removeSyncItem(item.id);
      } catch (error) {
        console.error(`Sync failed for item ${item.id}:`, error);
        item.retries = (item.retries || 0) + 1;
        
        if (item.retries >= maxRetries) {
          this.removeSyncItem(item.id);
          Toast.show({
            type: 'error',
            text1: 'Sync Failed',
            text2: `Failed to sync ${item.action} after ${maxRetries} attempts`,
          });
        }
      }
    }
    
    await this.persistSyncQueue();
  }

  async syncItem(item) {
    // This would contain the actual sync logic for different action types
    switch (item.action) {
      case 'uploadReceipt':
        return await this.syncReceiptUpload(item.data);
      case 'updateTransaction':
        return await this.syncTransactionUpdate(item.data);
      case 'confirmMatch':
        return await this.syncMatchConfirmation(item.data);
      default:
        throw new Error(`Unknown sync action: ${item.action}`);
    }
  }

  async syncReceiptUpload(data) {
    // Implementation would depend on your API structure
    const AuthService = require('./authService').default;
    return await AuthService.uploadReceipt(data.formData);
  }

  async syncTransactionUpdate(data) {
    // Implementation for transaction updates
    console.log('Syncing transaction update:', data);
  }

  async syncMatchConfirmation(data) {
    // Implementation for match confirmations
    const AuthService = require('./authService').default;
    return await AuthService.confirmMatch(data.matchId);
  }

  removeSyncItem(id) {
    this.syncQueue = this.syncQueue.filter(item => item.id !== id);
  }

  async clearCache() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
      
      Toast.show({
        type: 'success',
        text1: 'Cache Cleared',
        text2: 'All cached data has been removed',
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  async getCacheSize() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith('cache_') || key.startsWith('offline_'));
      
      let totalSize = 0;
      for (const key of cacheKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += value.length;
        }
      }
      
      return {
        keys: cacheKeys.length,
        size: totalSize,
        sizeFormatted: this.formatBytes(totalSize),
      };
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return { keys: 0, size: 0, sizeFormatted: '0 B' };
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Offline-first data operations
  async getTransactionsOfflineFirst(page = 1, limit = 20) {
    const cacheKey = `transactions_page_${page}_limit_${limit}`;
    
    // Try cache first
    const cached = await this.getCachedResponse(cacheKey);
    if (cached && !this.isOnline) {
      return cached;
    }
    
    // Try network if online
    if (this.isOnline) {
      try {
        const AuthService = require('./authService').default;
        const fresh = await AuthService.getTransactions(page, limit);
        await this.cacheApiResponse(cacheKey, fresh);
        return fresh;
      } catch (error) {
        console.error('Network fetch failed, using cache:', error);
        return cached || { transactions: [], total: 0 };
      }
    }
    
    return cached || { transactions: [], total: 0 };
  }

  async getReceiptsOfflineFirst(page = 1, limit = 20) {
    const cacheKey = `receipts_page_${page}_limit_${limit}`;
    
    const cached = await this.getCachedResponse(cacheKey);
    if (cached && !this.isOnline) {
      return cached;
    }
    
    if (this.isOnline) {
      try {
        const AuthService = require('./authService').default;
        const fresh = await AuthService.getReceipts(page, limit);
        await this.cacheApiResponse(cacheKey, fresh);
        return fresh;
      } catch (error) {
        console.error('Network fetch failed, using cache:', error);
        return cached || { receipts: [], total: 0 };
      }
    }
    
    return cached || { receipts: [], total: 0 };
  }
}

export default new OfflineService();