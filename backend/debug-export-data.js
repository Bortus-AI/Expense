const db = require('./database/init');

console.log('=== DEBUGGING EXPORT DATA ===');

// Check existing transactions
db.all('SELECT COUNT(*) as count FROM transactions', [], (err, result) => {
  if (err) {
    console.error('Error checking transactions:', err);
    return;
  }
  console.log('Total transactions in database:', result[0].count);
});

// Check transactions with company_id
db.all('SELECT COUNT(*) as count FROM transactions WHERE company_id IS NOT NULL', [], (err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Transactions with company_id:', result[0].count);
});

// Check receipts
db.all('SELECT COUNT(*) as count FROM receipts', [], (err, result) => {
  if (err) {
    console.error('Error checking receipts:', err);
    return;
  }
  console.log('Total receipts in database:', result[0].count);
});

// Check receipts with company_id
db.all('SELECT COUNT(*) as count FROM receipts WHERE company_id IS NOT NULL', [], (err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Receipts with company_id:', result[0].count);
});

// Check users and companies
db.all('SELECT u.email, c.name, uc.role, c.id as company_id FROM users u JOIN user_companies uc ON u.id = uc.user_id JOIN companies c ON uc.company_id = c.id', [], (err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('User-Company associations:');
  result.forEach(row => {
    console.log(`  ${row.email} -> ${row.name} (${row.role}) - Company ID: ${row.company_id}`);
  });
});

// Check companies
db.all('SELECT * FROM companies', [], (err, result) => {
  if (err) {
    console.error('Error:', err);
    return;
  }
  console.log('Companies:');
  result.forEach(company => {
    console.log(`  ID: ${company.id}, Name: ${company.name}`);
  });
  
  setTimeout(() => {
    console.log('=== DEBUG COMPLETE ===');
    process.exit(0);
  }, 1000);
}); 