const db = require('./database/init');

// Quick cleanup script
setTimeout(() => {
  console.log('🧹 Quick cleanup of incorrectly imported data...\n');
  
  const companyId = 1; // Chasco Constructors
  
  // Clear cost codes
  db.run('DELETE FROM cost_codes WHERE company_id = ?', [companyId], function(err) {
    if (err) {
      console.error('Error clearing cost codes:', err);
    } else {
      console.log(`✅ Cleared ${this.changes} cost codes`);
    }
    
    // Clear categories
    db.run('DELETE FROM categories WHERE company_id = ?', [companyId], function(err) {
      if (err) {
        console.error('Error clearing categories:', err);
      } else {
        console.log(`✅ Cleared ${this.changes} categories`);
      }
      
      console.log('\n🎉 Ready for fresh import!\n');
      
      // Close database
      db.close();
      process.exit(0);
    });
  });
}, 1000);