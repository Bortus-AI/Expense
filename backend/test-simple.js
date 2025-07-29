const db = require('./database/init');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test basic database query
    const result = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM transactions', [], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    console.log('Database connection successful. Transaction count:', result.count);
    
    // Test if AI tables exist
    const tables = await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('Available tables:', tables.map(t => t.name));
    
    // Check if AI tables exist
    const aiTables = ['categorization_patterns', 'fraud_alerts', 'duplicate_groups', 'ml_models', 'ml_predictions'];
    for (const table of aiTables) {
      const exists = tables.some(t => t.name === table);
      console.log(`${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }
    
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDatabase();