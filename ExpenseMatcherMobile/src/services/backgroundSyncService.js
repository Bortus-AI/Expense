/**
 * Background Sync Service for handling automatic data synchronization
 */

import { useEffect } from 'react';
import { useNetwork } from '../contexts/NetworkContext';
import { processSyncQueue } from './syncService';
import { useOfflineReceipts } from '../hooks/useOfflineReceipts';

// Sync interval in milliseconds (30 seconds)
const SYNC_INTERVAL = 30000;

export const useBackgroundSync = () => {
  const { isConnected, isInternetReachable } = useNetwork();
  const { loadReceipts } = useOfflineReceipts();

  // Background sync when app is in foreground
  useEffect(() => {
    let syncInterval;

    if (isConnected && isInternetReachable) {
      // Start background sync
      syncInterval = setInterval(async () => {
        try {
          console.log('Running background sync');
          await processSyncQueue();
          // Refresh receipts after sync
          await loadReceipts();
        } catch (error) {
          console.error('Background sync error:', error);
        }
      }, SYNC_INTERVAL);
    }

    // Cleanup interval on unmount or when connection changes
    return () => {
      if (syncInterval) {
        clearInterval(syncInterval);
      }
    };
  }, [isConnected, isInternetReachable, loadReceipts]);

  // Sync when connection is restored
  useEffect(() => {
    const syncOnConnectionRestore = async () => {
      if (isConnected && isInternetReachable) {
        try {
          console.log('Connection restored, running sync');
          await processSyncQueue();
          // Refresh receipts after sync
          await loadReceipts();
        } catch (error) {
          console.error('Sync on connection restore error:', error);
        }
      }
    };

    syncOnConnectionRestore();
  }, [isConnected, isInternetReachable, loadReceipts]);
};

export default useBackgroundSync;