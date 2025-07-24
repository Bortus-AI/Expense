const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'expense_matcher.db');

// Create database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Create tables
const initDatabase = () => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email_verified BOOLEAN DEFAULT FALSE,
      reset_token TEXT,
      reset_token_expires DATETIME,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
    }
  });

  // Companies table
  db.run(`
    CREATE TABLE IF NOT EXISTS companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      domain TEXT,
      plan_type TEXT DEFAULT 'basic',
      settings TEXT, -- JSON string for company settings
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating companies table:', err.message);
    }
  });

  // User-Company relationships
  db.run(`
    CREATE TABLE IF NOT EXISTS user_companies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      company_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'user', -- admin, manager, user
      status TEXT NOT NULL DEFAULT 'active', -- active, inactive, pending
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (company_id) REFERENCES companies(id),
      UNIQUE(user_id, company_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating user_companies table:', err.message);
    }
  });

  // Transactions table (updated with company_id and user tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      transaction_date DATE NOT NULL,
      description TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      card_last_four TEXT,
      category TEXT,
      chase_transaction_id TEXT,
      external_transaction_id TEXT,
      sales_tax DECIMAL(10,2),
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id),
      UNIQUE(company_id, chase_transaction_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating transactions table:', err.message);
    } else {
      // Add new columns if they don't exist (for existing databases)
      db.run(`ALTER TABLE transactions ADD COLUMN company_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding company_id column:', err.message);
        }
      });
      
      db.run(`ALTER TABLE transactions ADD COLUMN external_transaction_id TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding external_transaction_id column:', err.message);
        }
      });
      
      db.run(`ALTER TABLE transactions ADD COLUMN sales_tax DECIMAL(10,2)`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding sales_tax column:', err.message);
        }
      });

      db.run(`ALTER TABLE transactions ADD COLUMN created_by INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding created_by column:', err.message);
        }
      });

      db.run(`ALTER TABLE transactions ADD COLUMN updated_by INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding updated_by column:', err.message);
        }
      });
    }
  });

  // Receipts table (updated with company_id and user tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS receipts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      ocr_text TEXT,
      extracted_amount DECIMAL(10,2),
      extracted_date DATE,
      extracted_merchant TEXT,
      processing_status TEXT DEFAULT 'pending',
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating receipts table:', err.message);
    } else {
      // Add new columns if they don't exist (for existing databases)
      db.run(`ALTER TABLE receipts ADD COLUMN company_id INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding company_id column to receipts:', err.message);
        }
      });

      db.run(`ALTER TABLE receipts ADD COLUMN created_by INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding created_by column to receipts:', err.message);
        }
      });

      db.run(`ALTER TABLE receipts ADD COLUMN updated_by INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding updated_by column to receipts:', err.message);
        }
      });
    }
  });

  // Matches table (links receipts to transactions) with user tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      receipt_id INTEGER NOT NULL,
      match_confidence DECIMAL(5,2),
      match_status TEXT DEFAULT 'pending',
      user_confirmed BOOLEAN DEFAULT FALSE,
      confirmed_by INTEGER,
      created_by INTEGER,
      updated_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (confirmed_by) REFERENCES users(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (updated_by) REFERENCES users(id),
      UNIQUE(transaction_id, receipt_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating matches table:', err.message);
    } else {
      // Add new columns if they don't exist (for existing databases)
      db.run(`ALTER TABLE matches ADD COLUMN confirmed_by INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding confirmed_by column to matches:', err.message);
        }
      });

      db.run(`ALTER TABLE matches ADD COLUMN created_by INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding created_by column to matches:', err.message);
        }
      });

      db.run(`ALTER TABLE matches ADD COLUMN updated_by INTEGER`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding updated_by column to matches:', err.message);
        }
      });
    }
  });

  console.log('Database tables created/verified');
};

// Initialize database on module load
initDatabase();

module.exports = db; 