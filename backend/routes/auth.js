const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const db = require('../database/init');
const { generateTokens, authenticateToken, refreshAccessToken } = require('../middleware/auth');

const router = express.Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration endpoint
router.post('/register', authLimiter, async (req, res) => {
  const { email, password, firstName, lastName, companyName } = req.body;

  // Validation
  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ 
      error: 'Email, password, first name, and last name are required' 
    });
  }

  if (password.length < 8) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    // Check if user already exists
    db.get('SELECT id FROM users WHERE email = ?', [email.toLowerCase()], async (err, existingUser) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Registration failed' });
      }

      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Start transaction
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Create user
        db.run(`
          INSERT INTO users (email, password_hash, first_name, last_name, email_verified)
          VALUES (?, ?, ?, ?, ?)
        `, [email.toLowerCase(), passwordHash, firstName, lastName, false], function(err) {
          if (err) {
            console.error('Error creating user:', err);
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Registration failed' });
          }

          const userId = this.lastID;

          // Create company if provided, or default company
          const finalCompanyName = companyName || `${firstName}'s Company`;
          
          db.run(`
            INSERT INTO companies (name, plan_type)
            VALUES (?, ?)
          `, [finalCompanyName, 'basic'], function(err) {
            if (err) {
              console.error('Error creating company:', err);
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Registration failed' });
            }

            const companyId = this.lastID;

            // Link user to company as user (not admin)
            db.run(`
              INSERT INTO user_companies (user_id, company_id, role, status)
              VALUES (?, ?, ?, ?)
            `, [userId, companyId, 'user', 'active'], function(err) {
              if (err) {
                console.error('Error linking user to company:', err);
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Registration failed' });
              }

              db.run('COMMIT', (err) => {
                if (err) {
                  console.error('Transaction commit error:', err);
                  return res.status(500).json({ error: 'Registration failed' });
                }

                // Generate tokens
                const user = {
                  id: userId,
                  email: email.toLowerCase(),
                  first_name: firstName,
                  last_name: lastName
                };

                const { accessToken, refreshToken } = generateTokens(user);

                res.status(201).json({
                  message: 'Registration successful',
                  user: {
                    id: userId,
                    email: email.toLowerCase(),
                    firstName,
                    lastName,
                    emailVerified: false
                  },
                  company: {
                    id: companyId,
                    name: finalCompanyName,
                    role: 'user'
                  },
                  accessToken,
                  refreshToken
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login endpoint
router.post('/login', authLimiter, (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Get user with company information
  const query = `
    SELECT u.*, c.id as company_id, c.name as company_name, uc.role as company_role
    FROM users u
    LEFT JOIN user_companies uc ON u.id = uc.user_id AND uc.status = 'active'
    LEFT JOIN companies c ON uc.company_id = c.id
    WHERE u.email = ?
    ORDER BY c.name
  `;

  db.all(query, [email.toLowerCase()], async (err, rows) => {
    if (err) {
      console.error('Login database error:', err);
      return res.status(500).json({ error: 'Login failed' });
    }

    if (!rows || rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    try {
      // Verify password
      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user);

      // Format companies data
      const companies = rows
        .filter(row => row.company_id)
        .map(row => ({
          id: row.company_id,
          name: row.company_name,
          role: row.company_role
        }));

      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified,
          lastLogin: user.last_login
        },
        companies,
        accessToken,
        refreshToken
      });

    } catch (error) {
      console.error('Password comparison error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });
});

// Token refresh endpoint
router.post('/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  refreshAccessToken(refreshToken)
    .then(newAccessToken => {
      res.json({ accessToken: newAccessToken });
    })
    .catch(error => {
      console.error('Token refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    });
});

// Logout endpoint (client-side token removal, but we can blacklist if needed)
router.post('/logout', authenticateToken, (req, res) => {
  // In a more sophisticated setup, you might want to blacklist the token
  // For now, we rely on client-side token removal
  res.json({ message: 'Logout successful' });
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, email, first_name, last_name, email_verified, last_login, created_at FROM users WHERE id = ?', 
    [req.user.id], (err, user) => {
      if (err) {
        console.error('Profile fetch error:', err);
        return res.status(500).json({ error: 'Failed to fetch profile' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          memberSince: user.created_at
        }
      });
    });
});

// Update user profile
router.put('/profile', authenticateToken, (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  db.run(`
    UPDATE users 
    SET first_name = ?, last_name = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `, [firstName, lastName, req.user.id], function(err) {
    if (err) {
      console.error('Profile update error:', err);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Profile updated successfully',
      user: {
        firstName,
        lastName
      }
    });
  });
});

// Change password
router.put('/password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }

  try {
    // Get current password hash
    db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id], async (err, user) => {
      if (err) {
        console.error('Password change error:', err);
        return res.status(500).json({ error: 'Password change failed' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // Update password
      db.run(`
        UPDATE users 
        SET password_hash = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [newPasswordHash, req.user.id], function(err) {
        if (err) {
          console.error('Password update error:', err);
          return res.status(500).json({ error: 'Password change failed' });
        }

        res.json({ message: 'Password changed successfully' });
      });
    });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Password change failed' });
  }
});

module.exports = router; 