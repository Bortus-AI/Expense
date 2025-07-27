const bcrypt = require('bcryptjs');
const db = require('./database/init');

// Default admin user credentials
const DEFAULT_ADMIN = {
  email: 'admin@company.com',
  password: 'admin123!',
  firstName: 'Admin',
  lastName: 'User',
  companyName: 'Default Company'
};

const createAdminUser = async () => {
  console.log('🚀 Creating initial admin user...\n');

  try {
    // Check if any users already exist
    const existingUsers = await new Promise((resolve, reject) => {
      db.get('SELECT COUNT(*) as count FROM users', [], (err, row) => {
        if (err) reject(err);
        else resolve(row.count);
      });
    });

    if (existingUsers > 0) {
      console.log('❌ Users already exist in the database.');
      console.log('   This script should only be run on a fresh deployment.\n');
      
      // Show existing users
      const users = await new Promise((resolve, reject) => {
        db.all(`
          SELECT u.email, u.first_name, u.last_name, c.name as company_name, uc.role
          FROM users u
          LEFT JOIN user_companies uc ON u.id = uc.user_id
          LEFT JOIN companies c ON uc.company_id = c.id
        `, [], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      console.log('📋 Existing users:');
      users.forEach(user => {
        console.log(`   • ${user.email} (${user.first_name} ${user.last_name}) - ${user.role} at ${user.company_name}`);
      });
      
      process.exit(1);
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, saltRounds);

    // Start transaction
    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Create user
        db.run(`
          INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
          VALUES (?, ?, ?, ?, ?)
        `, [
          DEFAULT_ADMIN.email,
          passwordHash,
          DEFAULT_ADMIN.firstName,
          DEFAULT_ADMIN.lastName,
          true // Pre-verify admin email
        ], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const userId = this.lastID;

          // Create company
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

            // Link user to company as admin
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
                  resolve({ userId, companyId });
                }
              });
            });
          });
        });
      });
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('📧 Login Credentials:');
    console.log(`   Email:    ${DEFAULT_ADMIN.email}`);
    console.log(`   Password: ${DEFAULT_ADMIN.password}`);
    console.log(`   Company:  ${DEFAULT_ADMIN.companyName}`);
    console.log(`   Role:     admin\n`);
    
    console.log('🔐 Security Note:');
    console.log('   Please change the admin password after your first login!');
    console.log('   Go to Profile → Change Password in the web interface.\n');
    
    console.log('🌐 Access your application at:');
    console.log('   Frontend: http://localhost:3000');
    console.log('   Backend:  http://localhost:5000\n');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }

  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    process.exit(0);
  });
};

// Allow running with custom credentials via command line
if (process.argv.length > 2) {
  const email = process.argv[2];
  const password = process.argv[3] || DEFAULT_ADMIN.password;
  const firstName = process.argv[4] || DEFAULT_ADMIN.firstName;
  const lastName = process.argv[5] || DEFAULT_ADMIN.lastName;
  const companyName = process.argv[6] || DEFAULT_ADMIN.companyName;

  if (email) {
    DEFAULT_ADMIN.email = email;
    DEFAULT_ADMIN.password = password;
    DEFAULT_ADMIN.firstName = firstName;
    DEFAULT_ADMIN.lastName = lastName;
    DEFAULT_ADMIN.companyName = companyName;
  }
}

// Run the script
createAdminUser(); 