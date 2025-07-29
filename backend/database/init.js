const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'expense_matcher.db');

// Create database connection with better error handling
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
    // Enable foreign key constraints
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('Error enabling foreign keys:', err.message);
      } else {
        console.log('Foreign key constraints enabled');
      }
    });
    
    // Set journal mode for better performance and reliability
    db.run('PRAGMA journal_mode = WAL', (err) => {
      if (err) {
        console.error('Error setting journal mode:', err.message);
      }
    });
  }
});

// Handle database errors
db.on('error', (err) => {
  console.error('Database error:', err);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

// Default admin user for fresh deployments
const DEFAULT_ADMIN = {
  email: 'admin@company.com',
  password: 'admin123!',
  firstName: 'Admin',
  lastName: 'User',
  companyName: 'Default Company'
};

// Function to create default admin user if none exist
const createDefaultAdminIfNeeded = async () => {
  try {
    // Check if any users exist
    const userCount = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (userCount === 0) {
      console.log('🚀 No users found - creating default admin user...');
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

      // Create admin user in transaction
      await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run('BEGIN TRANSACTION');

          db.run(`
            INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
            VALUES (?, ?, ?, ?, ?)
          `, [
            DEFAULT_ADMIN.email,
            passwordHash,
            DEFAULT_ADMIN.firstName,
            DEFAULT_ADMIN.lastName,
            true
          ], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            const userId = this.lastID;

            db.run(`
              INSERT INTO companies (name, plan_type)
              VALUES (?, ?)
            `, [DEFAULT_ADMIN.companyName, 'basic'], function(err) {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              const companyId = this.lastID;

              db.run(`
                INSERT INTO user_companies (user_id, company_id, role, status)
                VALUES (?, ?, ?, ?)
              `, [userId, companyId, 'admin', 'active'], function(err) {
                if (err) {
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                db.run('COMMIT', (err) => {
                  if (err) {
                    reject(err);
                  } else {
                    resolve();
                  }
                });
              });
            });
          });
        });
      });

      console.log('✅ Default admin user created successfully!');
      console.log('📧 Login with:');
      console.log(`   Email:    ${DEFAULT_ADMIN.email}`);
      console.log(`   Password: ${DEFAULT_ADMIN.password}`);
      console.log('🔐 Please change the password after first login!');
    }
  } catch (error) {
    console.error('❌ Error creating default admin user:', error);
  }
};

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
      job_number TEXT,
      cost_code TEXT,
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

      db.run(`ALTER TABLE transactions ADD COLUMN job_number TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding job_number column:', err.message);
        }
      });

      db.run(`ALTER TABLE transactions ADD COLUMN cost_code TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding cost_code column:', err.message);
        }
      });
    }
  });

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      UNIQUE(company_id, name)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating categories table:', err.message);
    }
  });

  // Job Numbers table
  db.run(`
    CREATE TABLE IF NOT EXISTS job_numbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      UNIQUE(company_id, name)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating job_numbers table:', err.message);
    }
  });

  // Cost Codes table
  db.run(`
    CREATE TABLE IF NOT EXISTS cost_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      category_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      UNIQUE(company_id, name)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating cost_codes table:', err.message);
    }
  });

  // Add new foreign key columns to transactions table
  db.run(`ALTER TABLE transactions ADD COLUMN category_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding category_id column to transactions:', err.message);
    }
  });
  db.run(`ALTER TABLE transactions ADD COLUMN job_number_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding job_number_id column to transactions:', err.message);
    }
  });
  db.run(`ALTER TABLE transactions ADD COLUMN cost_code_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding cost_code_id column to transactions:', err.message);
    }
  });

  // Add category_id to cost_codes table for cost code-category relationship
  db.run(`ALTER TABLE cost_codes ADD COLUMN category_id INTEGER`, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Error adding category_id column to cost_codes:', err.message);
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
      extracted_description TEXT,
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

      db.run(`ALTER TABLE receipts ADD COLUMN extracted_description TEXT`, (err) => {
        if (err && !err.message.includes('duplicate column name')) {
          console.error('Error adding extracted_description column to receipts:', err.message);
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

  // ML and AI Enhancement Tables
  
  // Vendor database for merchant recognition
  db.run(`
    CREATE TABLE IF NOT EXISTS vendors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      aliases TEXT, -- JSON array of alternative names
      category_id INTEGER,
      tax_id TEXT,
      address TEXT,
      phone TEXT,
      website TEXT,
      confidence_score DECIMAL(5,2) DEFAULT 0.0,
      is_verified BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating vendors table:', err.message);
    }
  });

  // ML categorization patterns
  db.run(`
    CREATE TABLE IF NOT EXISTS categorization_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      pattern_type TEXT NOT NULL, -- 'merchant', 'description', 'amount_range'
      pattern_value TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      confidence_score DECIMAL(5,2) DEFAULT 0.0,
      usage_count INTEGER DEFAULT 0,
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating categorization_patterns table:', err.message);
    }
  });

  // Duplicate detection records
  db.run(`
    CREATE TABLE IF NOT EXISTS duplicate_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      group_hash TEXT NOT NULL,
      primary_transaction_id INTEGER,
      duplicate_count INTEGER DEFAULT 1,
      confidence_score DECIMAL(5,2) DEFAULT 0.0,
      status TEXT DEFAULT 'pending', -- pending, confirmed, dismissed
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (primary_transaction_id) REFERENCES transactions(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating duplicate_groups table:', err.message);
    }
  });

  // Duplicate transaction mappings
  db.run(`
    CREATE TABLE IF NOT EXISTS duplicate_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      duplicate_group_id INTEGER NOT NULL,
      transaction_id INTEGER NOT NULL,
      is_primary BOOLEAN DEFAULT FALSE,
      similarity_score DECIMAL(5,2) DEFAULT 0.0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (duplicate_group_id) REFERENCES duplicate_groups(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      UNIQUE(duplicate_group_id, transaction_id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating duplicate_transactions table:', err.message);
    }
  });



  // Receipt validation results
  db.run(`
    CREATE TABLE IF NOT EXISTS receipt_validations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER NOT NULL,
      validation_type TEXT NOT NULL, -- 'amount_check', 'date_check', 'merchant_check', 'format_check'
      is_valid BOOLEAN NOT NULL,
      confidence_score DECIMAL(5,2) DEFAULT 0.0,
      validation_details TEXT, -- JSON with specific validation results
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (receipt_id) REFERENCES receipts(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating receipt_validations table:', err.message);
    }
  });

  // Multi-receipt transaction splits
  db.run(`
    CREATE TABLE IF NOT EXISTS transaction_splits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id INTEGER NOT NULL,
      split_group_id TEXT NOT NULL,
      receipt_id INTEGER NOT NULL,
      split_amount DECIMAL(10,2) NOT NULL,
      split_percentage DECIMAL(5,2),
      description TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (receipt_id) REFERENCES receipts(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating transaction_splits table:', err.message);
    }
  });

  // Recurring expense patterns
  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      pattern_name TEXT NOT NULL,
      merchant_pattern TEXT,
      amount_pattern TEXT, -- 'exact', 'range', 'variable'
      frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
      expected_amount DECIMAL(10,2),
      amount_tolerance DECIMAL(10,2) DEFAULT 0.0,
      category_id INTEGER,
      is_active BOOLEAN DEFAULT TRUE,
      last_occurrence DATE,
      next_expected DATE,
      occurrence_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating recurring_patterns table:', err.message);
    }
  });

  // Recurring pattern matches
  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_id INTEGER NOT NULL,
      transaction_id INTEGER NOT NULL,
      match_confidence DECIMAL(5,2) NOT NULL,
      variance_amount DECIMAL(10,2) DEFAULT 0.0,
      variance_days INTEGER DEFAULT 0,
      is_confirmed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (pattern_id) REFERENCES recurring_patterns(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating recurring_matches table:', err.message);
    }
  });

  // Calendar integration events
  db.run(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      event_id TEXT NOT NULL, -- External calendar event ID
      title TEXT NOT NULL,
      description TEXT,
      start_date DATETIME NOT NULL,
      end_date DATETIME,
      location TEXT,
      attendees TEXT, -- JSON array
      estimated_cost DECIMAL(10,2),
      category_id INTEGER,
      calendar_provider TEXT, -- 'google', 'outlook', 'apple'
      sync_status TEXT DEFAULT 'active', -- active, disabled, error
      last_synced DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (company_id) REFERENCES companies(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating calendar_events table:', err.message);
    }
  });

  // Calendar-transaction correlations
  db.run(`
    CREATE TABLE IF NOT EXISTS calendar_correlations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      calendar_event_id INTEGER NOT NULL,
      transaction_id INTEGER NOT NULL,
      correlation_score DECIMAL(5,2) NOT NULL,
      correlation_type TEXT NOT NULL, -- 'location', 'time', 'merchant', 'amount'
      is_confirmed BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (calendar_event_id) REFERENCES calendar_events(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating calendar_correlations table:', err.message);
    }
  });

  // ML model metadata and performance tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS ml_models (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      model_type TEXT NOT NULL, -- 'categorization', 'fraud_detection', 'duplicate_detection'
      version TEXT NOT NULL,
      accuracy_score DECIMAL(5,2),
      training_data_count INTEGER,
      last_trained DATETIME,
      is_active BOOLEAN DEFAULT TRUE,
      model_parameters TEXT, -- JSON with model configuration
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Error creating ml_models table:', err.message);
    }
  });

  // ML prediction logs for performance tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS ml_predictions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_id INTEGER NOT NULL,
      transaction_id INTEGER,
      receipt_id INTEGER,
      prediction_type TEXT NOT NULL,
      predicted_value TEXT NOT NULL,
      confidence_score DECIMAL(5,2) NOT NULL,
      actual_value TEXT,
      is_correct BOOLEAN,
      feedback_provided BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (model_id) REFERENCES ml_models(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (receipt_id) REFERENCES receipts(id)
    )
  `, (err) => {
    if (err) {
      console.error('Error creating ml_predictions table:', err.message);
    }
  });

  console.log('Database tables created/verified (including ML/AI enhancement tables)');
  
  // Create default admin user if needed (run after a short delay to ensure tables are ready)
  setTimeout(() => {
    createDefaultAdminIfNeeded();
  }, 1000);
};

// Initialize database on module load
initDatabase();

module.exports = db;
