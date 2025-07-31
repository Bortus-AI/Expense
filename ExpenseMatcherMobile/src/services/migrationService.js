/**
 * Migration Service for handling database schema updates
 */

import { initDatabase, saveSetting, getSetting } from './databaseService';

// Current database version
const CURRENT_VERSION = 2;

// Migration functions
const migrations = {
  1: async () => {
    // Initial migration - create tables
    console.log('Running migration to version 1');
    await initDatabase();
  },
  
  2: async () => {
    // Migration to version 2
    console.log('Running migration to version 2');
    // Add new columns, tables, etc.
    // For example, add a 'tags' column to receipts table
    // This would be implemented with raw SQL or database-specific methods
  },
};

// Run all pending migrations
export const runMigrations = async () => {
  try {
    // Get current database version
    let currentVersion = await getSetting('databaseVersion');
    currentVersion = currentVersion ? parseInt(currentVersion, 10) : 0;
    
    console.log(`Current database version: ${currentVersion}, target version: ${CURRENT_VERSION}`);
    
    // Run migrations in order
    for (let version = currentVersion + 1; version <= CURRENT_VERSION; version++) {
      if (migrations[version]) {
        console.log(`Running migration ${version}`);
        await migrations[version]();
        
        // Update version in settings
        await saveSetting('databaseVersion', version.toString());
      } else {
        console.warn(`No migration found for version ${version}`);
      }
    }
    
    console.log('All migrations completed successfully');
    return true;
  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  }
};

// Initialize database with migrations
export const initDatabaseWithMigrations = async () => {
  try {
    console.log('Initializing database with migrations');
    await runMigrations();
    return true;
  } catch (error) {
    console.error('Error initializing database with migrations:', error);
    throw error;
  }
};

export default {
  runMigrations,
  initDatabaseWithMigrations,
};