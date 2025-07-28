const db = require('./database/init');

console.log('🗑️  Clear Cost Codes Script');
console.log('This script will delete ALL cost codes for your company.\n');

// Function to clear cost codes for a company
const clearCostCodes = (companyId) => {
  return new Promise((resolve, reject) => {
    // First, get count of cost codes to be deleted
    db.get(
      'SELECT COUNT(*) as count FROM cost_codes WHERE company_id = ?',
      [companyId],
      (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        const count = row.count;
        console.log(`Found ${count} cost codes for company ID ${companyId}`);

        if (count === 0) {
          console.log('No cost codes to delete.');
          resolve(0);
          return;
        }

        // Delete all cost codes for the company
        db.run(
          'DELETE FROM cost_codes WHERE company_id = ?',
          [companyId],
          function(err) {
            if (err) {
              reject(err);
            } else {
              console.log(`✅ Successfully deleted ${this.changes} cost codes`);
              resolve(this.changes);
            }
          }
        );
      }
    );
  });
};

// Function to list companies to help identify the correct one
const listCompanies = () => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, name FROM companies ORDER BY name', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        console.log('📋 Available Companies:');
        rows.forEach(company => {
          console.log(`   ID: ${company.id} - Name: ${company.name}`);
        });
        resolve(rows);
      }
    });
  });
};

// Main execution
async function main() {
  try {
    // List companies first
    await listCompanies();
    
    console.log('\n🔍 To delete cost codes, you need to specify a company ID.');
    console.log('Usage: node clear-cost-codes.js <company_id>');
    console.log('Example: node clear-cost-codes.js 1\n');

    // Get company ID from command line argument
    const companyId = process.argv[2];
    
    if (!companyId) {
      console.log('❌ Please provide a company ID as an argument.');
      process.exit(1);
    }

    if (isNaN(companyId)) {
      console.log('❌ Company ID must be a number.');
      process.exit(1);
    }

    // Verify company exists
    const company = await new Promise((resolve, reject) => {
      db.get('SELECT id, name FROM companies WHERE id = ?', [companyId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!company) {
      console.log(`❌ Company with ID ${companyId} not found.`);
      process.exit(1);
    }

    console.log(`\n🏢 Clearing cost codes for: ${company.name} (ID: ${company.id})`);
    
    // Clear cost codes
    const deletedCount = await clearCostCodes(parseInt(companyId));
    
    if (deletedCount > 0) {
      console.log(`\n🎉 Successfully cleared ${deletedCount} cost codes!`);
      console.log('You can now re-import your cost codes with the correct data.\n');
    } else {
      console.log('\n📝 No cost codes were found to delete.\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    process.exit(0);
  });
}

// Run the script
main();