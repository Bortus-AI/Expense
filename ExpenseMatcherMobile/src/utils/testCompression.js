/**
 * Test script for image compression functionality
 * This script can be used to verify compression quality and performance
 */

import { compressImage, getCompressionStats, clearCompressionStats } from './imageCompression';

/**
 * Test compression with different settings
 * @param {string} imageUri - URI of the image to compress
 * @param {Array} testCases - Array of compression settings to test
 */
export const testCompressionPerformance = async (imageUri, testCases) => {
  console.log('Starting compression performance tests...');
  
  // Clear previous stats
  await clearCompressionStats();
  
  const results = [];
  
  for (const testCase of testCases) {
    try {
      console.log(`Testing compression with settings:`, testCase);
      
      const startTime = Date.now();
      const compressedUri = await compressImage(imageUri, testCase);
      const endTime = Date.now();
      
      const duration = endTime - startTime;
      console.log(`Compression completed in ${duration}ms`);
      
      results.push({
        ...testCase,
        duration,
        compressedUri,
        success: true
      });
    } catch (error) {
      console.error(`Compression failed for settings:`, testCase, error);
      results.push({
        ...testCase,
        error: error.message,
        success: false
      });
    }
  }
  
  // Get compression stats
  const stats = await getCompressionStats();
  
  console.log('Compression test results:', results);
  console.log('Performance stats:', stats);
  
  return { results, stats };
};

/**
 * Test different image types
 * @param {Array} images - Array of image objects with uri and type
 */
export const testImageTypes = async (images) => {
  console.log('Testing compression for different image types...');
  
  const results = [];
  
  for (const image of images) {
    try {
      console.log(`Testing compression for ${image.type}:`, image.uri);
      
      const compressedUri = await compressImage(image.uri, {
        imageType: image.type,
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000
      });
      
      console.log(`Compression successful for ${image.type}`);
      
      results.push({
        type: image.type,
        originalUri: image.uri,
        compressedUri,
        success: true
      });
    } catch (error) {
      console.error(`Compression failed for ${image.type}:`, error);
      results.push({
        type: image.type,
        error: error.message,
        success: false
      });
    }
  }
  
  console.log('Image type test results:', results);
  return results;
};

// Example usage:
/*
const testCases = [
  { quality: 0.9, maxWidth: 1200, maxHeight: 1200, imageType: 'receipt' },
  { quality: 0.7, maxWidth: 800, maxHeight: 800, imageType: 'receipt' },
  { quality: 0.5, maxWidth: 600, maxHeight: 600, imageType: 'receipt' },
  { quality: 0.8, maxWidth: 1500, maxHeight: 1500, imageType: 'document' },
];

testCompressionPerformance('file://path/to/test/image.jpg', testCases);

const images = [
  { uri: 'file://path/to/receipt.jpg', type: 'receipt' },
  { uri: 'file://path/to/document.png', type: 'document' },
];

testImageTypes(images);
*/

export default {
  testCompressionPerformance,
  testImageTypes
};