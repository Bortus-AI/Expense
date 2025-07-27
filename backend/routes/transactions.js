const express = require('express');
const router = express.Router();
const db = require('../database/init');
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const moment = require('moment');
const { authenticateToken, getUserCompanies, requireCompanyAccess, addUserTracking } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(getUserCompanies);
router.use(requireCompanyAccess);
router.use(addUserTracking);

// Helper function to find user by first and last name within the company
const findUserByName = async (firstName, lastName, companyId) => {
  return new Promise((resolve, reject) => {
    if (!firstName || !lastName) {
      resolve(null);
      return;
    }

    const query = `
      SELECT u.id, u.first_name, u.last_name, u.email
      FROM users u
      JOIN user_companies uc ON u.id = uc.user_id
      WHERE uc.company_id = ? 
      AND uc.status = 'active'
      AND LOWER(TRIM(u.first_name)) = LOWER(TRIM(?))
      AND LOWER(TRIM(u.last_name)) = LOWER(TRIM(?))
      LIMIT 1
    `;

    db.get(query, [companyId, firstName, lastName], (err, user) => {
      if (err) {
        console.error('Error finding user by name:', err);
        reject(err);
      } else {
        resolve(user);
      }
    });
  });
};

// Configure multer for CSV file uploads
const csvStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const csvDir = path.join(__dirname, '../uploads/csv');
    if (!fs.existsSync(csvDir)) {
      fs.mkdirSync(csvDir, { recursive: true });
    }
    cb(null, csvDir);
  },
  filename: (req, file, cb) => {
    cb(null, `transactions_${Date.now()}.csv`);
  }
});

const csvUpload = multer({ 
  storage: csvStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Get all transactions
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const offset = (page - 1) * limit;

  // DEBUG: Log user information for admin role debugging
  console.log('=== TRANSACTION ROUTE DEBUG ===');
  console.log('User:', {
    id: req.user?.id,
    email: req.user?.email,
    currentRole: req.user?.currentRole,
    currentCompany: req.user?.currentCompany?.name,
    companyId: req.companyId
  });

  // Build query with proper user/admin filtering
  let whereClause = 'WHERE t.company_id = ?';
  let queryParams = [req.companyId];
  let countParams = [req.companyId];

  // If user is not admin, only show their own transactions
  // Add safety check for req.user and currentRole
  if (req.user && req.user.currentRole !== 'admin') {
    console.log('Applying user-level filtering (not admin)');
    whereClause += ' AND t.created_by = ?';
    queryParams.push(req.user.id);
    countParams.push(req.user.id);
  } else {
    console.log('Admin user - showing all company transactions');
  }

  const query = `
    SELECT t.*, 
           COUNT(m.id) as receipt_count,
           GROUP_CONCAT(r.original_filename) as receipts
    FROM transactions t
    LEFT JOIN matches m ON t.id = m.transaction_id AND m.user_confirmed = 1
    LEFT JOIN receipts r ON m.receipt_id = r.id
    ${whereClause}
    GROUP BY t.id
    ORDER BY t.transaction_date DESC
    LIMIT ? OFFSET ?
  `;

  // Add limit and offset to params
  queryParams.push(limit, offset);

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get total count with same filtering
    const countQuery = `SELECT COUNT(*) as total FROM transactions t ${whereClause}`;
    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        transactions: rows,
        pagination: {
          page,
          limit,
          total: countRow.total,
          pages: Math.ceil(countRow.total / limit)
        }
      });
    });
  });
});

// Get single transaction
router.get('/:id', (req, res) => {
  // Build query with proper user/admin filtering
  let whereClause = 'WHERE t.id = ? AND t.company_id = ?';
  let queryParams = [req.params.id, req.companyId];

  // If user is not admin, only show their own transactions
  // Add safety check for req.user and currentRole
  if (req.user && req.user.currentRole !== 'admin') {
    whereClause += ' AND t.created_by = ?';
    queryParams.push(req.user.id);
  }

  const query = `
    SELECT t.*, 
           GROUP_CONCAT(r.original_filename) as receipts,
           GROUP_CONCAT(r.id) as receipt_ids
    FROM transactions t
    LEFT JOIN matches m ON t.id = m.transaction_id AND m.user_confirmed = 1
    LEFT JOIN receipts r ON m.receipt_id = r.id
    ${whereClause}
    GROUP BY t.id
  `;

  db.get(query, queryParams, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(row);
  });
});

// Import transactions from Chase CSV
router.post('/import', csvUpload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No CSV file uploaded' });
  }

  const transactions = [];
  let importCount = 0;
  let skipCount = 0;

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => {
      // Debug: Log CSV columns for the first row
      if (transactions.length === 0) {
        console.log('=== CSV IMPORT DEBUG ===');
        console.log('CSV columns found:', Object.keys(row));
        console.log('Sample row data:', row);
      }
      // Enhanced CSV format: Transaction Date, Description, Category, Type, Amount, Memo
      // Additional fields: Post Date, Transaction ID, First Name, Last Name (for user matching)
      // Parse date without timezone conversion to avoid day shifts
      let transactionDate;
      try {
        const dateStr = row['Transaction Date'];
        if (!dateStr) {
          console.warn('Missing transaction date in CSV row');
          return;
        }
        
        // Simple string-based parsing to avoid timezone issues
        // Expected format: MM/DD/YYYY or M/D/YYYY
        const dateMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (dateMatch) {
          const [, month, day, year] = dateMatch;
                     // Convert to YYYY-MM-DD format with zero-padding
           transactionDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
           
           // Debug logging for date conversion
           if (dateStr.includes('7/22/2025') || dateStr.includes('07/22/2025')) {
             console.log(`DEBUG: Date conversion - CSV: "${dateStr}" -> Database: "${transactionDate}"`);
           }
           
           // Validate the date is reasonable
           const testDate = new Date(transactionDate);
           if (isNaN(testDate.getTime())) {
             console.warn(`Invalid date parsed from CSV: "${dateStr}" -> "${transactionDate}"`);
             return;
           }
        } else {
          console.warn(`Date format not recognized in CSV: "${dateStr}"`);
          return;
        }
      } catch (error) {
        console.warn(`Date parsing error for: "${row['Transaction Date']}", error: ${error.message}`);
        return;
      }
      const description = row['Description'] || '';
      const amount = parseFloat(row['Amount']) || 0;
      const category = row['Category'] || '';
      
      // Extract additional fields if available - try multiple column name variants
      let externalTransactionId = 
        row['Transaction ID'] || 
        row['Reference Number'] || 
        row['Reference ID'] || 
        row['Transaction Number'] || 
        row['Confirmation Number'] || 
        row['Auth Code'] || 
        row['Authorization Code'] || 
        row['ID'] || 
        row['Ref'] || 
        row['Ref Number'] || 
        row['Ref#'] || '';

      // If no standard ID found, look for any column that might contain ID-like values
      if (!externalTransactionId) {
        const columnKeys = Object.keys(row);
        for (const key of columnKeys) {
          const value = row[key];
          // Look for columns with ID-like patterns (alphanumeric strings 4+ chars)
          if (value && typeof value === 'string' && 
              /^[A-Z0-9]{4,}$/i.test(value.trim()) && 
              key.toLowerCase().includes('id')) {
            externalTransactionId = value.trim();
            console.log(`Found Transaction ID in column "${key}": ${externalTransactionId}`);
            break;
          }
        }
      }
        
      const salesTax = parseFloat(
        row['Tax Amount'] || 
        row['Sales Tax'] || 
        row['Tax'] || 
        row['GST'] || 
        row['VAT'] || 
        row['State Tax'] || 
        row['Local Tax'] || 
        '' 
      ) || null;

      // Extract user names for matching - try multiple column name variants
      const firstName = (
        row['First Name'] || 
        row['FirstName'] || 
        row['first_name'] || 
        row['Employee First Name'] || 
        row['User First Name'] || 
        row['Name'] || // Could be "John Doe" format
        ''
      ).trim();
      
      const lastName = (
        row['Last Name'] || 
        row['LastName'] || 
        row['last_name'] || 
        row['Employee Last Name'] || 
        row['User Last Name'] || 
        row['Surname'] ||
        ''
      ).trim();

      // Handle "Name" column that might contain "First Last" format
      let finalFirstName = firstName;
      let finalLastName = lastName;
      if (!firstName && !lastName && row['Name']) {
        const nameParts = row['Name'].trim().split(/\s+/);
        if (nameParts.length >= 2) {
          finalFirstName = nameParts[0];
          finalLastName = nameParts.slice(1).join(' '); // Handle middle names
        }
      }
      
      // Debug: Log user name detection for first few rows
      if (transactions.length < 3) {
        console.log(`Row ${transactions.length + 1} processing:`, {
          'Available columns': Object.keys(row),
          'Transaction ID': row['Transaction ID'],
          'Reference Number': row['Reference Number'], 
          'ID': row['ID'],
          'Final Transaction ID': externalTransactionId,
          'Name columns': {
            'First Name': row['First Name'],
            'Last Name': row['Last Name'],
            'Name': row['Name'],
            'Final firstName': finalFirstName,
            'Final lastName': finalLastName
          },
          'Sales Tax sources': {
            'Tax Amount': row['Tax Amount'],
            'Sales Tax': row['Sales Tax'],
            'Final tax': salesTax
          }
        });
      }
      
      // Create a unique identifier from the transaction data
      const chaseTransactionId = `${transactionDate}_${description}_${Math.abs(amount)}`.replace(/[^a-zA-Z0-9]/g, '_');

      transactions.push({
        transaction_date: transactionDate,
        description: description,
        amount: amount,
        category: category,
        chase_transaction_id: chaseTransactionId,
        external_transaction_id: externalTransactionId,
        sales_tax: salesTax,
        first_name: finalFirstName,
        last_name: finalLastName
      });
    })
    .on('end', async () => {
      console.log(`\n=== PROCESSING ${transactions.length} TRANSACTIONS FOR USER MATCHING ===`);
      
      // Process transactions with user matching
      const processedTransactions = [];
      const userMatchResults = {
        matched: 0,
        unmatched: 0,
        adminAssigned: 0,
        details: []
      };

      for (let i = 0; i < transactions.length; i++) {
        const transaction = transactions[i];
        let assignedUserId = req.userId; // Default to admin user
        let assignedUserInfo = `Admin (${req.user.email})`;
        let matchStatus = 'admin_default';

        // Try to match user by name if names are provided
        if (transaction.first_name && transaction.last_name) {
          try {
            const matchedUser = await findUserByName(transaction.first_name, transaction.last_name, req.companyId);
            
            if (matchedUser) {
              assignedUserId = matchedUser.id;
              assignedUserInfo = `${matchedUser.first_name} ${matchedUser.last_name} (${matchedUser.email})`;
              matchStatus = 'name_matched';
              userMatchResults.matched++;
              
              console.log(`✅ Transaction ${i + 1}: Matched "${transaction.first_name} ${transaction.last_name}" → User ID ${matchedUser.id} (${matchedUser.email})`);
            } else {
              userMatchResults.unmatched++;
              matchStatus = 'no_match_found';
              console.log(`❌ Transaction ${i + 1}: No match found for "${transaction.first_name} ${transaction.last_name}" → Assigned to Admin`);
            }
          } catch (error) {
            console.error(`❌ Transaction ${i + 1}: Error matching user "${transaction.first_name} ${transaction.last_name}":`, error);
            userMatchResults.unmatched++;
            matchStatus = 'match_error';
          }
        } else {
          userMatchResults.adminAssigned++;
          matchStatus = 'no_names_provided';
          if (transactions.length <= 10) { // Only log for small imports to avoid spam
            console.log(`ℹ️  Transaction ${i + 1}: No names provided → Assigned to Admin`);
          }
        }

        // Track assignment details
        userMatchResults.details.push({
          row: i + 1,
          description: transaction.description.substring(0, 50),
          providedName: transaction.first_name && transaction.last_name ? 
            `${transaction.first_name} ${transaction.last_name}` : 'None',
          assignedTo: assignedUserInfo,
          status: matchStatus
        });

        processedTransactions.push({
          ...transaction,
          assignedUserId,
          assignedUserInfo,
          matchStatus
        });
      }

      console.log(`\n📊 USER MATCHING SUMMARY:`);
      console.log(`   • Successfully matched: ${userMatchResults.matched}`);
      console.log(`   • No match found: ${userMatchResults.unmatched}`);
      console.log(`   • Assigned to admin: ${userMatchResults.adminAssigned}`);
      console.log(`   • Total processed: ${transactions.length}\n`);

      // Insert transactions into database with user assignments
      const stmt = db.prepare(`
        INSERT OR IGNORE INTO transactions 
        (transaction_date, description, amount, category, chase_transaction_id, external_transaction_id, sales_tax, company_id, created_by, updated_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      processedTransactions.forEach((transaction) => {
        stmt.run([
          transaction.transaction_date,
          transaction.description,
          transaction.amount,
          transaction.category,
          transaction.chase_transaction_id,
          transaction.external_transaction_id,
          transaction.sales_tax,
          req.companyId,                    // company_id
          transaction.assignedUserId,       // created_by (matched user or admin)
          req.userId                        // updated_by (always the admin who imported)
        ], function(err) {
          if (err) {
            console.error('Error inserting transaction:', err);
            skipCount++;
          } else {
            if (this.changes > 0) {
              importCount++;
            } else {
              skipCount++;
            }
          }
        });
      });

      stmt.finalize((err) => {
        if (err) {
          return res.status(500).json({ error: 'Error finalizing import' });
        }

        // Clean up uploaded file
        fs.unlinkSync(req.file.path);

        res.json({
          message: 'Import completed with user matching',
          imported: importCount,
          skipped: skipCount,
          total: transactions.length,
          userMatching: {
            matched: userMatchResults.matched,
            unmatched: userMatchResults.unmatched,
            adminAssigned: userMatchResults.adminAssigned,
            details: userMatchResults.details.slice(0, 20) // Limit details to first 20 for response size
          }
        });
      });
    })
    .on('error', (err) => {
      res.status(500).json({ error: 'Error processing CSV file: ' + err.message });
    });
});

// Update transaction
router.put('/:id', (req, res) => {
  const { description, amount, category } = req.body;
  
  const query = `
    UPDATE transactions 
    SET description = ?, amount = ?, category = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [description, amount, category, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction updated successfully' });
  });
});

// Delete transaction
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM transactions WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ message: 'Transaction deleted successfully' });
  });
});

module.exports = router; 