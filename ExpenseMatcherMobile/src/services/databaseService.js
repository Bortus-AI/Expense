import SQLite from 'react-native-sqlite-storage';

// Enable debugging in development
SQLite.DEBUG(true);
SQLite.enablePromise(true);

let db;

const initDB = async () => {
  try {
    db = await SQLite.openDatabase({
      name: 'ExpenseMatcher.db',
      location: 'default',
    });
    
    // Create tables
    await createTables();
    
    console.log('Database initialized successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

const createTables = async () => {
  try {
    // Create receipts table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS receipts (
        id TEXT PRIMARY KEY,
        merchant TEXT,
        date TEXT,
        amount REAL,
        category TEXT,
        status TEXT,
        imageUri TEXT,
        createdAt TEXT,
        updatedAt TEXT,
        isSynced INTEGER DEFAULT 0,
        syncAction TEXT,
        localPath TEXT
      )
    `);
    
    // Create categories table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE,
        color TEXT,
        icon TEXT,
        createdAt TEXT,
        updatedAt TEXT
      )
    `);
    
    // Create settings table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updatedAt TEXT
      )
    `);
    
    // Create sync queue table
    await db.executeSql(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tableName TEXT,
        recordId TEXT,
        action TEXT,
        data TEXT,
        timestamp TEXT,
        retryCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending'
      )
    `);
    
    console.log('Tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const getDB = async () => {
  if (!db) {
    await initDB();
  }
  return db;
};

// Receipt operations
export const saveReceipt = async (receipt) => {
  try {
    const database = await getDB();
    const { id, merchant, date, amount, category, status, imageUri, localPath } = receipt;
    
    await database.executeSql(
      `INSERT OR REPLACE INTO receipts 
       (id, merchant, date, amount, category, status, imageUri, localPath, createdAt, updatedAt, isSynced, syncAction) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        merchant,
        date,
        amount,
        category,
        status,
        imageUri,
        localPath,
        new Date().toISOString(),
        new Date().toISOString(),
        0, // isSynced
        'create' // syncAction
      ]
    );
    
    // Add to sync queue
    await addToSyncQueue('receipts', id, 'create', receipt);
    
    return receipt;
  } catch (error) {
    console.error('Error saving receipt:', error);
    throw error;
  }
};

export const updateReceipt = async (id, updates) => {
  try {
    const database = await getDB();
    
    // Build dynamic update query
    const fields = Object.keys(updates);
    const values = Object.values(updates);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    await database.executeSql(
      `UPDATE receipts SET ${setClause}, updatedAt = ? WHERE id = ?`,
      [...values, new Date().toISOString(), id]
    );
    
    // Add to sync queue
    await addToSyncQueue('receipts', id, 'update', updates);
    
    return { id, ...updates };
  } catch (error) {
    console.error('Error updating receipt:', error);
    throw error;
  }
};

export const deleteReceipt = async (id) => {
  try {
    const database = await getDB();
    
    // Instead of deleting, mark as deleted for sync purposes
    await database.executeSql(
      `UPDATE receipts SET status = 'deleted', updatedAt = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );
    
    // Add to sync queue
    await addToSyncQueue('receipts', id, 'delete', { id });
    
    return id;
  } catch (error) {
    console.error('Error deleting receipt:', error);
    throw error;
  }
};

export const getReceipts = async () => {
  try {
    const database = await getDB();
    const results = await database.executeSql('SELECT * FROM receipts WHERE status != "deleted" ORDER BY date DESC');
    
    const receipts = [];
    const rows = results[0].rows;
    
    for (let i = 0; i < rows.length; i++) {
      receipts.push(rows.item(i));
    }
    
    return receipts;
  } catch (error) {
    console.error('Error getting receipts:', error);
    throw error;
  }
};

export const getReceiptById = async (id) => {
  try {
    const database = await getDB();
    const results = await database.executeSql('SELECT * FROM receipts WHERE id = ? AND status != "deleted"', [id]);
    
    if (results[0].rows.length > 0) {
      return results[0].rows.item(0);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting receipt by ID:', error);
    throw error;
  }
};

// Category operations
export const saveCategory = async (category) => {
  try {
    const database = await getDB();
    const { id, name, color, icon } = category;
    
    await database.executeSql(
      `INSERT OR REPLACE INTO categories (id, name, color, icon, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, color, icon, new Date().toISOString(), new Date().toISOString()]
    );
    
    // Add to sync queue
    await addToSyncQueue('categories', id, 'create', category);
    
    return category;
  } catch (error) {
    console.error('Error saving category:', error);
    throw error;
  }
};

export const getCategories = async () => {
  try {
    const database = await getDB();
    const results = await database.executeSql('SELECT * FROM categories ORDER BY name');
    
    const categories = [];
    const rows = results[0].rows;
    
    for (let i = 0; i < rows.length; i++) {
      categories.push(rows.item(i));
    }
    
    return categories;
  } catch (error) {
    console.error('Error getting categories:', error);
    throw error;
  }
};

// Settings operations
export const saveSetting = async (key, value) => {
  try {
    const database = await getDB();
    
    await database.executeSql(
      `INSERT OR REPLACE INTO settings (key, value, updatedAt) VALUES (?, ?, ?)`,
      [key, JSON.stringify(value), new Date().toISOString()]
    );
    
    return { key, value };
  } catch (error) {
    console.error('Error saving setting:', error);
    throw error;
  }
};

export const getSetting = async (key) => {
  try {
    const database = await getDB();
    const results = await database.executeSql('SELECT value FROM settings WHERE key = ?', [key]);
    
    if (results[0].rows.length > 0) {
      return JSON.parse(results[0].rows.item(0).value);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting setting:', error);
    throw error;
  }
};

// Sync queue operations
export const addToSyncQueue = async (tableName, recordId, action, data) => {
  try {
    const database = await getDB();
    
    await database.executeSql(
      `INSERT INTO sync_queue (tableName, recordId, action, data, timestamp) VALUES (?, ?, ?, ?, ?)`,
      [tableName, recordId, action, JSON.stringify(data), new Date().toISOString()]
    );
    
    return true;
  } catch (error) {
    console.error('Error adding to sync queue:', error);
    throw error;
  }
};

export const getPendingSyncItems = async () => {
  try {
    const database = await getDB();
    const results = await database.executeSql(
      'SELECT * FROM sync_queue WHERE status = "pending" ORDER BY timestamp ASC'
    );
    
    const items = [];
    const rows = results[0].rows;
    
    for (let i = 0; i < rows.length; i++) {
      const item = rows.item(i);
      item.data = JSON.parse(item.data);
      items.push(item);
    }
    
    return items;
  } catch (error) {
    console.error('Error getting pending sync items:', error);
    throw error;
  }
};

export const updateSyncItemStatus = async (id, status) => {
  try {
    const database = await getDB();
    
    await database.executeSql(
      `UPDATE sync_queue SET status = ?, retryCount = retryCount + 1 WHERE id = ?`,
      [status, id]
    );
    
    return true;
  } catch (error) {
    console.error('Error updating sync item status:', error);
    throw error;
  }
};

export const removeSyncItem = async (id) => {
  try {
    const database = await getDB();
    
    await database.executeSql('DELETE FROM sync_queue WHERE id = ?', [id]);
    
    return true;
  } catch (error) {
    console.error('Error removing sync item:', error);
    throw error;
  }
};

export const markReceiptAsSynced = async (id) => {
  try {
    const database = await getDB();
    
    await database.executeSql(
      'UPDATE receipts SET isSynced = 1, syncAction = NULL WHERE id = ?',
      [id]
    );
    
    return true;
  } catch (error) {
    console.error('Error marking receipt as synced:', error);
    throw error;
  }
};

// Database initialization
export const initDatabase = async () => {
  try {
    await initDB();
    console.log('Database initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

export default {
  initDatabase,
  saveReceipt,
  updateReceipt,
  deleteReceipt,
  getReceipts,
  getReceiptById,
  saveCategory,
  getCategories,
  saveSetting,
  getSetting,
  addToSyncQueue,
  getPendingSyncItems,
  updateSyncItemStatus,
  removeSyncItem,
  markReceiptAsSynced,
};