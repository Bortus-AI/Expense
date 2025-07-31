/**
 * Offline Storage Service for managing local data persistence
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initDatabase, saveReceipt, updateReceipt, deleteReceipt, getReceipts, getReceiptById } from './databaseService';
import { obfuscateData, deobfuscateData, generateId } from './encryptionService';

// Cache expiration time (24 hours)
const CACHE_EXPIRATION_TIME = 24 * 60 * 60 * 1000;

// Storage limits
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_RECEIPTS_TO_KEEP = 1000; // Maximum number of receipts to keep locally

// Initialize storage
export const initOfflineStorage = async () => {
  try {
    // Initialize SQLite database
    await initDatabase();
    
    // Initialize AsyncStorage keys if needed
    const storageKeys = await AsyncStorage.getAllKeys();
    if (!storageKeys.includes('storageInitialized')) {
      await AsyncStorage.setItem('storageInitialized', 'true');
    }
    
    console.log('Offline storage initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing offline storage:', error);
    throw error;
  }
};

// Intelligent caching system
export const getCachedData = async (key) => {
  try {
    const cachedItem = await AsyncStorage.getItem(key);
    
    if (cachedItem) {
      const { data, timestamp } = JSON.parse(cachedItem);
      const now = Date.now();
      
      // Check if cache has expired
      if (now - timestamp < CACHE_EXPIRATION_TIME) {
        return deobfuscateData(data);
      } else {
        // Remove expired cache
        await AsyncStorage.removeItem(key);
        return null;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

export const setCachedData = async (key, data) => {
  try {
    const obfuscatedData = obfuscateData(data);
    const cacheItem = {
      data: obfuscatedData,
      timestamp: Date.now(),
    };
    
    await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
    return true;
  } catch (error) {
    console.error('Error setting cached data:', error);
    throw error;
  }
};

export const clearCache = async (key) => {
  try {
    if (key) {
      await AsyncStorage.removeItem(key);
    } else {
      // Clear all cache items (but not other AsyncStorage data)
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith('cache_'));
      await AsyncStorage.multiRemove(cacheKeys);
    }
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};

// Storage optimization and cleanup strategies
export const optimizeStorage = async () => {
  try {
    // Clean up expired cache items
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    
    const now = Date.now();
    const keysToRemove = [];
    
    for (const key of cacheKeys) {
      const cachedItem = await AsyncStorage.getItem(key);
      if (cachedItem) {
        const { timestamp } = JSON.parse(cachedItem);
        if (now - timestamp >= CACHE_EXPIRATION_TIME) {
          keysToRemove.push(key);
        }
      }
    }
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`Removed ${keysToRemove.length} expired cache items`);
    }
    
    // Check storage size and clean up if needed
    const storageUsage = await getStorageUsage();
    if (storageUsage.totalSize > MAX_CACHE_SIZE) {
      // Clean up oldest cache items to reduce storage usage
      await cleanupLargeStorage();
    }
    
    // Clean up old receipts if we have too many
    const receipts = await getReceipts();
    if (receipts.length > MAX_RECEIPTS_TO_KEEP) {
      await cleanupOldReceipts(receipts);
    }
    
    // In a real implementation, you might also:
    // - Compress large data
    // - Remove old logs
    // - Clean up temporary files
    
    return { success: true, removedItems: keysToRemove.length };
  } catch (error) {
    console.error('Error optimizing storage:', error);
    throw error;
  }
};

// Cleanup large storage
const cleanupLargeStorage = async () => {
  try {
    // Get all cache keys sorted by timestamp (oldest first)
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(k => k.startsWith('cache_'));
    
    const cacheItems = [];
    for (const key of cacheKeys) {
      const cachedItem = await AsyncStorage.getItem(key);
      if (cachedItem) {
        const { timestamp } = JSON.parse(cachedItem);
        cacheItems.push({ key, timestamp });
      }
    }
    
    // Sort by timestamp (oldest first)
    cacheItems.sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest items until we're under the limit
    let totalSize = 0;
    const keysToRemove = [];
    
    for (const item of cacheItems) {
      const value = await AsyncStorage.getItem(item.key);
      if (value) {
        totalSize += value.length;
        if (totalSize > MAX_CACHE_SIZE * 0.8) { // Leave some buffer
          keysToRemove.push(item.key);
        }
      }
    }
    
    if (keysToRemove.length > 0) {
      await AsyncStorage.multiRemove(keysToRemove);
      console.log(`Removed ${keysToRemove.length} old cache items to reduce storage size`);
    }
  } catch (error) {
    console.error('Error cleaning up large storage:', error);
  }
};

// Cleanup old receipts
const cleanupOldReceipts = async (receipts) => {
  try {
    // Sort receipts by date (oldest first)
    receipts.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Remove oldest receipts beyond the limit
    const receiptsToRemove = receipts.slice(0, receipts.length - MAX_RECEIPTS_TO_KEEP);
    
    console.log(`Would remove ${receiptsToRemove.length} old receipts`);
    // In a real implementation, you would actually delete these receipts
    // or archive them to a separate table
  } catch (error) {
    console.error('Error cleaning up old receipts:', error);
  }
};

// Storage quota management
export const getStorageUsage = async () => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    let totalSize = 0;
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
    
    // Convert to KB
    const sizeInKB = totalSize / 1024;
    
    return {
      totalSize: sizeInKB,
      unit: 'KB',
      keysCount: keys.length,
    };
  } catch (error) {
    console.error('Error getting storage usage:', error);
    throw error;
  }
};

// Migration system for data structure updates
export const migrateData = async (currentVersion, targetVersion) => {
  try {
    const storedVersion = await AsyncStorage.getItem('dataVersion');
    const version = storedVersion ? parseInt(storedVersion, 10) : 0;
    
    if (version < targetVersion) {
      // Perform migrations based on version numbers
      for (let i = version + 1; i <= targetVersion; i++) {
        switch (i) {
          case 1:
            // Migration to version 1
            await migrateToVersion1();
            break;
          case 2:
            // Migration to version 2
            await migrateToVersion2();
            break;
          // Add more migration cases as needed
        }
      }
      
      // Update stored version
      await AsyncStorage.setItem('dataVersion', targetVersion.toString());
      console.log(`Data migrated from version ${version} to ${targetVersion}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error migrating data:', error);
    throw error;
  }
};

// Specific migration functions
const migrateToVersion1 = async () => {
  // Migration logic for version 1
  console.log('Performing migration to version 1');
  // Example: Add new fields to existing records
};

const migrateToVersion2 = async () => {
  // Migration logic for version 2
  console.log('Performing migration to version 2');
  // Example: Change data structure format
};

// Receipt operations with offline support
export const saveReceiptOffline = async (receiptData) => {
  try {
    console.log('Saving receipt offline:', receiptData);
    // Generate ID if not provided
    const receipt = {
      ...receiptData,
      id: receiptData.id || generateId(),
      createdAt: receiptData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    console.log('Saving receipt to SQLite database:', receipt);
    // Save to SQLite database
    const savedReceipt = await saveReceipt(receipt);
    
    console.log('Updating cache with receipts');
    // Update cache
    await setCachedData('receipts', await getReceipts());
    
    console.log('Receipt saved successfully:', savedReceipt);
    return savedReceipt;
  } catch (error) {
    console.error('Error saving receipt offline:', error);
    throw error;
  }
};

export const updateReceiptOffline = async (id, updates) => {
  try {
    // Update in SQLite database
    const updatedReceipt = await updateReceipt(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
    
    // Update cache
    await setCachedData('receipts', await getReceipts());
    
    return updatedReceipt;
  } catch (error) {
    console.error('Error updating receipt offline:', error);
    throw error;
  }
};

export const deleteReceiptOffline = async (id) => {
  try {
    // Mark as deleted in SQLite database
    await deleteReceipt(id);
    
    // Update cache
    await setCachedData('receipts', await getReceipts());
    
    return id;
  } catch (error) {
    console.error('Error deleting receipt offline:', error);
    throw error;
  }
};

export const getReceiptsOffline = async () => {
  try {
    // Try to get from cache first
    const cachedReceipts = await getCachedData('receipts');
    
    if (cachedReceipts) {
      return cachedReceipts;
    }
    
    // Get from SQLite database
    const receipts = await getReceipts();
    
    // Update cache
    await setCachedData('receipts', receipts);
    
    return receipts;
  } catch (error) {
    console.error('Error getting receipts offline:', error);
    throw error;
  }
};

export const getReceiptByIdOffline = async (id) => {
  try {
    // Try to get from cache first
    const cachedReceipts = await getCachedData('receipts');
    
    if (cachedReceipts) {
      const receipt = cachedReceipts.find(r => r.id === id);
      if (receipt) {
        return receipt;
      }
    }
    
    // Get from SQLite database
    return await getReceiptById(id);
  } catch (error) {
    console.error('Error getting receipt by ID offline:', error);
    throw error;
  }
};

// Batch operations for efficiency
export const batchSaveReceipts = async (receipts) => {
  try {
    const savedReceipts = [];
    
    for (const receipt of receipts) {
      const savedReceipt = await saveReceiptOffline(receipt);
      savedReceipts.push(savedReceipt);
    }
    
    return savedReceipts;
  } catch (error) {
    console.error('Error batch saving receipts:', error);
    throw error;
  }
};

export const batchDeleteReceipts = async (ids) => {
  try {
    const deletedIds = [];
    
    for (const id of ids) {
      await deleteReceiptOffline(id);
      deletedIds.push(id);
    }
    
    return deletedIds;
  } catch (error) {
    console.error('Error batch deleting receipts:', error);
    throw error;
  }
};

// Data persistence across app sessions
export const persistAppState = async (state) => {
  try {
    await AsyncStorage.setItem('appState', JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Error persisting app state:', error);
    throw error;
  }
};

export const restoreAppState = async () => {
  try {
    const state = await AsyncStorage.getItem('appState');
    return state ? JSON.parse(state) : null;
  } catch (error) {
    console.error('Error restoring app state:', error);
    return null;
  }
};

export default {
  initOfflineStorage,
  getCachedData,
  setCachedData,
  clearCache,
  optimizeStorage,
  getStorageUsage,
  migrateData,
  saveReceiptOffline,
  updateReceiptOffline,
  deleteReceiptOffline,
  getReceiptsOffline,
  getReceiptByIdOffline,
  batchSaveReceipts,
  batchDeleteReceipts,
  persistAppState,
  restoreAppState,
};