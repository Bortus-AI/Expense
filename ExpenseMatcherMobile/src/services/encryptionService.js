/**
 * Encryption Service for securing sensitive data
 * Uses react-native-sensitive-info for secure storage
 */

import SInfo from 'react-native-sensitive-info';

// Simple encryption using base64 for demonstration
// In a production app, you would use a proper encryption library
const encrypt = (text) => {
  try {
    return Buffer.from(text).toString('base64');
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw error;
  }
};

const decrypt = (encryptedText) => {
  try {
    return Buffer.from(encryptedText, 'base64').toString('utf8');
  } catch (error) {
    console.error('Error decrypting text:', error);
    throw error;
  }
};

// Secure storage service
export const saveSecureItem = async (key, value, options = {}) => {
  try {
    const encryptedValue = encrypt(JSON.stringify(value));
    await SInfo.setItem(key, encryptedValue, {
      sharedPreferencesName: 'expenseMatcherPrefs',
      keychainService: 'expenseMatcherKeychain',
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Error saving secure item:', error);
    throw error;
  }
};

export const getSecureItem = async (key, options = {}) => {
  try {
    const encryptedValue = await SInfo.getItem(key, {
      sharedPreferencesName: 'expenseMatcherPrefs',
      keychainService: 'expenseMatcherKeychain',
      ...options,
    });
    
    if (encryptedValue) {
      const decryptedValue = decrypt(encryptedValue);
      return JSON.parse(decryptedValue);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting secure item:', error);
    throw error;
  }
};

export const deleteSecureItem = async (key, options = {}) => {
  try {
    await SInfo.deleteItem(key, {
      sharedPreferencesName: 'expenseMatcherPrefs',
      keychainService: 'expenseMatcherKeychain',
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Error deleting secure item:', error);
    throw error;
  }
};

// For non-sensitive data that still needs some obfuscation
export const obfuscateData = (data) => {
  try {
    return encrypt(JSON.stringify(data));
  } catch (error) {
    console.error('Error obfuscating data:', error);
    throw error;
  }
};

export const deobfuscateData = (obfuscatedData) => {
  try {
    const decrypted = decrypt(obfuscatedData);
    return JSON.parse(decrypted);
  } catch (error) {
    console.error('Error deobfuscating data:', error);
    throw error;
  }
};

// Generate a unique ID for records
export const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Hash function for creating unique identifiers
export const simpleHash = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
};

export default {
  saveSecureItem,
  getSecureItem,
  deleteSecureItem,
  obfuscateData,
  deobfuscateData,
  generateId,
  simpleHash,
};