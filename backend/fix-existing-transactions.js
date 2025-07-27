const db = require('./database/init');

console.log('🔧 Fixing existing transactions without company/user associations...\n');

// First, get the default company and admin user
db.get('SELECT c.id as company_id, u.id as user_id FROM companies c, users u WHERE c.name LIKE "%Default%" OR c.name LIKE "%Chasco%" LIMIT 1', [], (err, defaultData) => {
  if (err) {
    console.error('❌ Error finding default company/user:', err);
    process.exit(1);
  }

  if (!defaultData) {
    console.error('❌ No company or user found. Please ensure you have data in the database.');
    process.exit(1);
  }

  console.log(`✅ Using Company ID: ${defaultData.company_id}, User ID: ${defaultData.user_id}\n`);

  // Count transactions that need fixing
  db.get('SELECT COUNT(*) as count FROM transactions WHERE company_id IS NULL OR created_by IS NULL', [], (err, countResult) => {
    if (err) {
      console.error('❌ Error counting transactions:', err);
      process.exit(1);
    }

    console.log(`📊 Found ${countResult.count} transactions that need fixing`);
    
    if (countResult.count === 0) {
      console.log('✅ All transactions already have proper associations!');
      process.exit(0);
    }

    // Update transactions
    db.run(`
      UPDATE transactions 
      SET company_id = ?, created_by = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP
      WHERE company_id IS NULL OR created_by IS NULL
    `, [defaultData.company_id, defaultData.user_id, defaultData.user_id], function(err) {
      if (err) {
        console.error('❌ Error updating transactions:', err);
        process.exit(1);
      }

      console.log(`\n✅ Successfully updated ${this.changes} transactions!`);
      console.log('🎉 Transactions should now be visible in your transaction list.\n');
      
      // Close database connection
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        }
        process.exit(0);
      });
    });
  });
}); 