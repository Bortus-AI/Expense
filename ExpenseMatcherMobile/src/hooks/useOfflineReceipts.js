/**
 * Custom hook for handling offline receipt operations
 */

import { useState, useCallback } from 'react';
import { saveReceiptOffline, updateReceiptOffline, deleteReceiptOffline, getReceiptsOffline } from '../services/offlineStorageService';
import Toast from 'react-native-toast-message';

export const useOfflineReceipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load receipts from offline storage
  const loadReceipts = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const storedReceipts = await getReceiptsOffline();
      setReceipts(storedReceipts || []);
      return storedReceipts || [];
    } catch (err) {
      console.error('Error loading receipts:', err);
      setError('Failed to load receipts');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load receipts',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Save a new receipt
  const saveReceipt = useCallback(async (receiptData) => {
    setLoading(true);
    setError(null);
    
    try {
      const savedReceipt = await saveReceiptOffline(receiptData);
      
      // Update local state
      setReceipts(prevReceipts => {
        // Check if receipt already exists
        const existingIndex = prevReceipts.findIndex(r => r.id === savedReceipt.id);
        if (existingIndex >= 0) {
          // Update existing receipt
          const updatedReceipts = [...prevReceipts];
          updatedReceipts[existingIndex] = savedReceipt;
          return updatedReceipts;
        } else {
          // Add new receipt
          return [...prevReceipts, savedReceipt];
        }
      });
      
      Toast.show({
        type: 'success',
        text1: 'Receipt Saved',
        text2: 'Your receipt has been saved successfully',
      });
      
      return savedReceipt;
    } catch (err) {
      console.error('Error saving receipt:', err);
      setError('Failed to save receipt');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save receipt',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update an existing receipt
  const updateReceipt = useCallback(async (id, updates) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedReceipt = await updateReceiptOffline(id, updates);
      
      // Update local state
      setReceipts(prevReceipts => {
        const index = prevReceipts.findIndex(r => r.id === id);
        if (index >= 0) {
          const updatedReceipts = [...prevReceipts];
          updatedReceipts[index] = { ...updatedReceipt, ...updates };
          return updatedReceipts;
        }
        return prevReceipts;
      });
      
      Toast.show({
        type: 'success',
        text1: 'Receipt Updated',
        text2: 'Your receipt has been updated successfully',
      });
      
      return updatedReceipt;
    } catch (err) {
      console.error('Error updating receipt:', err);
      setError('Failed to update receipt');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to update receipt',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete a receipt
  const deleteReceipt = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    
    try {
      await deleteReceiptOffline(id);
      
      // Update local state
      setReceipts(prevReceipts => prevReceipts.filter(r => r.id !== id));
      
      Toast.show({
        type: 'success',
        text1: 'Receipt Deleted',
        text2: 'Your receipt has been deleted successfully',
      });
      
      return id;
    } catch (err) {
      console.error('Error deleting receipt:', err);
      setError('Failed to delete receipt');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to delete receipt',
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    receipts,
    loading,
    error,
    loadReceipts,
    saveReceipt,
    updateReceipt,
    deleteReceipt,
  };
};

export default useOfflineReceipts;