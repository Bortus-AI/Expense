/**
 * Custom hook for handling offline synchronization
 */

import { useState, useEffect, useCallback } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { processSyncQueue, backgroundSync, manualSync } from '../services/syncService';
import { getSecureItem, saveSecureItem } from '../services/encryptionService';

const SYNC_INTERVAL = 30000; // 30 seconds

export const useOfflineSync = () => {
  const { isConnected, isInternetReachable } = useNetwork();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  
  // Load last sync time from storage
  useEffect(() => {
    const loadLastSyncTime = async () => {
      try {
        const time = await getSecureItem('lastSyncTime');
        if (time) {
          setLastSyncTime(new Date(time));
        }
      } catch (error) {
        console.warn('Failed to load last sync time:', error);
      }
    };
    
    loadLastSyncTime();
  }, []);
  
  // Save last sync time to storage
  const saveLastSyncTime = useCallback(async (time) => {
    try {
      await saveSecureItem('lastSyncTime', time.toISOString());
      setLastSyncTime(time);
    } catch (error) {
      console.warn('Failed to save last sync time:', error);
    }
  }, []);
  
  // Process sync queue when online
  const processSync = useCallback(async () => {
    if (!isConnected || !isInternetReachable) {
      return;
    }
    
    if (isSyncing) {
      return;
    }
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const result = await processSyncQueue();
      await saveLastSyncTime(new Date());
      
      // Reset sync progress
      setSyncProgress(0);
      
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error.message || 'Failed to sync data');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, isInternetReachable, isSyncing, saveLastSyncTime]);
  
  // Background sync at regular intervals
  useEffect(() => {
    if (!isConnected || !isInternetReachable) {
      return;
    }
    
    const interval = setInterval(() => {
      backgroundSync()
        .then(result => {
          console.log('Background sync result:', result);
          saveLastSyncTime(new Date());
        })
        .catch(error => {
          console.error('Background sync error:', error);
        });
    }, SYNC_INTERVAL);
    
    return () => clearInterval(interval);
  }, [isConnected, isInternetReachable, saveLastSyncTime]);
  
  // Auto-sync when connection is restored
  useEffect(() => {
    if (isConnected && isInternetReachable && !isSyncing) {
      // Process sync queue when connection is restored
      processSync().catch(error => {
        console.error('Auto-sync failed:', error);
      });
    }
  }, [isConnected, isInternetReachable, isSyncing, processSync]);
  
  // Manual sync trigger
  const triggerManualSync = useCallback(async () => {
    if (isSyncing) {
      return;
    }
    
    setIsSyncing(true);
    setSyncError(null);
    
    try {
      const result = await manualSync();
      await saveLastSyncTime(new Date());
      return result;
    } catch (error) {
      console.error('Manual sync error:', error);
      setSyncError(error.message || 'Failed to sync data');
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, saveLastSyncTime]);
  
  // Update sync progress
  const updateSyncProgress = useCallback((progress) => {
    setSyncProgress(progress);
  }, []);
  
  return {
    isSyncing,
    lastSyncTime,
    syncError,
    syncProgress,
    isConnected,
    isInternetReachable,
    processSync,
    triggerManualSync,
    updateSyncProgress,
  };
};

export default useOfflineSync;