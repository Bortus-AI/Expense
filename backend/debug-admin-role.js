const db = require('./database/init');

console.log('🔍 Debugging Admin User Role and Data Access...\n');

// Check admin user details
const checkAdminUser = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT u.id, u.email, u.first_name, u.last_name,
             c.id as company_id, c.name as company_name,
             uc.role, uc.status
      FROM users u
      JOIN user_companies uc ON u.id = uc.user_id
      JOIN companies c ON uc.company_id = c.id
      WHERE u.email LIKE '%admin%' OR uc.role = 'admin'
      ORDER BY u.id
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Check transaction data
const checkTransactionData = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as total_transactions,
             COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company,
             COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as with_creator,
             COUNT(CASE WHEN company_id IS NOT NULL AND created_by IS NOT NULL THEN 1 END) as fully_associated
      FROM transactions
    `;

    db.get(query, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Check receipt data
const checkReceiptData = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT COUNT(*) as total_receipts,
             COUNT(CASE WHEN company_id IS NOT NULL THEN 1 END) as with_company,
             COUNT(CASE WHEN created_by IS NOT NULL THEN 1 END) as with_creator,
             COUNT(CASE WHEN company_id IS NOT NULL AND created_by IS NOT NULL THEN 1 END) as fully_associated
      FROM receipts
    `;

    db.get(query, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Run all checks
async function runDebug() {
  try {
    console.log('👤 Admin Users:');
    const adminUsers = await checkAdminUser();
    adminUsers.forEach(user => {
      console.log(`   • ${user.email} (ID: ${user.id})`);
      console.log(`     Company: ${user.company_name} (ID: ${user.company_id})`);
      console.log(`     Role: ${user.role}, Status: ${user.status}\n`);
    });

    console.log('📊 Transaction Data:');
    const txnData = await checkTransactionData();
    console.log(`   • Total Transactions: ${txnData.total_transactions}`);
    console.log(`   • With Company ID: ${txnData.with_company}`);
    console.log(`   • With Creator ID: ${txnData.with_creator}`);
    console.log(`   • Fully Associated: ${txnData.fully_associated}\n`);

    console.log('🧾 Receipt Data:');
    const receiptData = await checkReceiptData();
    console.log(`   • Total Receipts: ${receiptData.total_receipts}`);
    console.log(`   • With Company ID: ${receiptData.with_company}`);
    console.log(`   • With Creator ID: ${receiptData.with_creator}`);
    console.log(`   • Fully Associated: ${receiptData.fully_associated}\n`);

    // Sample data query
    console.log('📋 Sample Transactions:');
    db.all(`
      SELECT id, transaction_date, description, amount, company_id, created_by
      FROM transactions 
      ORDER BY id DESC 
      LIMIT 5
    `, [], (err, rows) => {
      if (err) {
        console.error('Error fetching sample transactions:', err);
      } else {
        rows.forEach(txn => {
          console.log(`   • ID ${txn.id}: ${txn.description} ($${txn.amount}) - Company: ${txn.company_id}, Creator: ${txn.created_by}`);
        });
      }

      console.log('\n📋 Sample Receipts:');
      db.all(`
        SELECT id, original_filename, extracted_amount, company_id, created_by
        FROM receipts 
        ORDER BY id DESC 
        LIMIT 5
      `, [], (err, rows) => {
        if (err) {
          console.error('Error fetching sample receipts:', err);
        } else {
          rows.forEach(receipt => {
            console.log(`   • ID ${receipt.id}: ${receipt.original_filename} ($${receipt.extracted_amount}) - Company: ${receipt.company_id}, Creator: ${receipt.created_by}`);
          });
        }

        // Close database connection
        db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          }
          process.exit(0);
        });
      });
    });

  } catch (error) {
    console.error('❌ Debug error:', error);
    process.exit(1);
  }
}

runDebug(); 