/**
 * Application constants
 */

export const APP_NAME = 'Expense Matcher';

export const PERMISSIONS = {
  CAMERA: 'camera',
  STORAGE: 'storage',
};

export const OCR_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCESS: 'success',
  ERROR: 'error',
};

export const COLORS = {
  PRIMARY: '#2196F3',
  SECONDARY: '#FF9800',
  SUCCESS: '#4CAF50',
  ERROR: '#F44336',
  WARNING: '#FFC107',
  INFO: '#2196F3',
};

export const MESSAGES = {
  CAMERA_PERMISSION_DENIED: 'Camera permission is required to capture receipts',
  STORAGE_PERMISSION_DENIED: 'Storage permission is required to save receipts',
  OCR_PROCESSING_ERROR: 'Failed to process image. Please try again.',
  IMAGE_CAPTURE_ERROR: 'Failed to capture image',
  IMAGE_SELECT_ERROR: 'Failed to select image',
};

export default {
  APP_NAME,
  PERMISSIONS,
  OCR_STATUS,
  COLORS,
  MESSAGES,
};