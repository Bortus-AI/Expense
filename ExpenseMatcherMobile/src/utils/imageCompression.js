/**
 * Image compression utility functions using react-native-compressor
 */

import { Image as ImageCompressor } from 'react-native-compressor';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance monitoring storage keys
const COMPRESSION_STATS_KEY = 'compression_stats';

/**
 * Compress an image with optimized settings for different image types
 * @param {string} imageUri - The URI of the image to compress
 * @param {Object} options - Compression options
 * @param {number} options.quality - Compression quality (0-1)
 * @param {number} options.maxWidth - Maximum width for the compressed image
 * @param {number} options.maxHeight - Maximum height for the compressed image
 * @param {string} options.imageType - Type of image (receipt, document, etc.)
 * @returns {Promise<string>} - URI of the compressed image
 */
export const compressImage = async (imageUri, options = {}) => {
  const {
    quality = 0.8,
    maxWidth = 1000,
    maxHeight = 1000,
    imageType = 'receipt'
  } = options;

  // Optimize settings based on image type
  const optimizedOptions = getOptimizedCompressionSettings(imageType, {
    quality,
    maxWidth,
    maxHeight
  });

  try {
    // Record start time for performance monitoring
    const startTime = Date.now();
    
    // Compress the image using react-native-compressor
    const compressedUri = await ImageCompressor.compress(imageUri, {
      compressionMethod: 'manual',
      ...optimizedOptions
    });
    
    // Record end time and calculate duration
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Store performance stats
    await storeCompressionStats({
      originalUri: imageUri,
      compressedUri,
      duration,
      ...optimizedOptions
    });
    
    console.log(`Image compressed successfully in ${duration}ms`);
    return compressedUri;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error(`Failed to compress image: ${error.message}`);
  }
};

/**
 * Get optimized compression settings based on image type
 * @param {string} imageType - Type of image (receipt, document, etc.)
 * @param {Object} baseOptions - Base compression options
 * @returns {Object} - Optimized compression options
 */
const getOptimizedCompressionSettings = (imageType, baseOptions) => {
  const { quality, maxWidth, maxHeight } = baseOptions;
  
  switch (imageType) {
    case 'receipt':
      // Receipts need to be clear for OCR but can be compressed more aggressively
      return {
        quality: Math.min(quality, 0.7),
        maxWidth: Math.min(maxWidth, 800),
        maxHeight: Math.min(maxHeight, 800)
      };
    case 'document':
      // Documents need to maintain quality for readability
      return {
        quality: Math.max(quality, 0.8),
        maxWidth: Math.min(maxWidth, 1200),
        maxHeight: Math.min(maxHeight, 1200)
      };
    default:
      // Default settings for other image types
      return {
        quality,
        maxWidth,
        maxHeight
      };
  }
};

/**
 * Get image dimensions
 * @param {string} imageUri - The URI of the image
 * @returns {Promise<Object>} - Object containing width and height
 */
export const getImageDimensions = async (imageUri) => {
  try {
    // Using react-native-compressor's getImageMetaData function
    const metaData = await ImageCompressor.getImageMetaData(imageUri);
    return {
      width: metaData.width,
      height: metaData.height
    };
  } catch (error) {
    console.error('Failed to get image dimensions:', error);
    throw new Error(`Failed to get image dimensions: ${error.message}`);
  }
};

/**
 * Get file size of an image
 * @param {string} imageUri - The URI of the image
 * @returns {Promise<number>} - File size in bytes
 */
export const getFileSize = async (imageUri) => {
  try {
    // Using react-native-compressor's getImageMetaData function
    const metaData = await ImageCompressor.getImageMetaData(imageUri);
    return metaData.size;
  } catch (error) {
    console.error('Failed to get file size:', error);
    throw new Error(`Failed to get file size: ${error.message}`);
  }
};

/**
 * Store compression performance stats
 * @param {Object} stats - Compression statistics
 */
const storeCompressionStats = async (stats) => {
  try {
    const existingStats = await AsyncStorage.getItem(COMPRESSION_STATS_KEY);
    const statsArray = existingStats ? JSON.parse(existingStats) : [];
    
    // Add new stats
    statsArray.push({
      ...stats,
      timestamp: new Date().toISOString()
    });
    
    // Keep only the last 100 stats to prevent storage bloat
    const recentStats = statsArray.slice(-100);
    
    await AsyncStorage.setItem(COMPRESSION_STATS_KEY, JSON.stringify(recentStats));
  } catch (error) {
    console.warn('Failed to store compression stats:', error);
  }
};

/**
 * Get compression performance stats
 * @returns {Promise<Array>} - Array of compression statistics
 */
export const getCompressionStats = async () => {
  try {
    const stats = await AsyncStorage.getItem(COMPRESSION_STATS_KEY);
    return stats ? JSON.parse(stats) : [];
  } catch (error) {
    console.warn('Failed to retrieve compression stats:', error);
    return [];
  }
};

/**
 * Clear compression performance stats
 */
export const clearCompressionStats = async () => {
  try {
    await AsyncStorage.removeItem(COMPRESSION_STATS_KEY);
  } catch (error) {
    console.warn('Failed to clear compression stats:', error);
  }
};

export default {
  compressImage,
  getImageDimensions,
  getFileSize,
  getCompressionStats,
  clearCompressionStats
};