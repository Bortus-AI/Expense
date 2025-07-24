const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database/expense_matcher.db');
console.log('Database path:', dbPath);

const fs = require('fs');
if (fs.existsSync(dbPath)) {
  console.log('Database file exists');
  console.log('File size:', fs.statSync(dbPath).size, 'bytes');
} else {
  console.log('Database file does NOT exist');
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  console.log('Database connection successful');
  
  // Check tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, tables) => {
    if (err) {
      console.error('Error listing tables:', err);
      return;
    }
    console.log('Tables in database:', tables.map(t => t.name));
    
    // Check transactions count
    db.get('SELECT COUNT(*) as count FROM transactions', [], (err, result) => {
      if (err) {
        console.error('Error counting transactions:', err);
      } else {
        console.log('Total transactions:', result.count);
      }
      
      // Check users count
      db.get('SELECT COUNT(*) as count FROM users', [], (err, result) => {
        if (err) {
          console.error('Error counting users:', err);
        } else {
          console.log('Total users:', result.count);
        }
        
        // Check companies count
        db.get('SELECT COUNT(*) as count FROM companies', [], (err, result) => {
          if (err) {
            console.error('Error counting companies:', err);
          } else {
            console.log('Total companies:', result.count);
          }
          
          db.close();
          console.log('Debug complete');
        });
      });
    });
  });
}); 