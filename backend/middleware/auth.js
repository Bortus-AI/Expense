const jwt = require('jsonwebtoken');
const db = require('../database/init');

// JWT Secret - in production this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production';

// Generate JWT tokens
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

  return { accessToken, refreshToken };
};

// Middleware to authenticate JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('No auth token provided for:', req.method, req.path);
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed for:', req.path, '-', err.name);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(403).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  });
};

// Middleware to get user's companies and current company context
const getUserCompanies = (req, res, next) => {
  if (!req.user) {
    return next();
  }

  const query = `
    SELECT c.*, uc.role, uc.status
    FROM companies c
    JOIN user_companies uc ON c.id = uc.company_id
    WHERE uc.user_id = ? AND uc.status = 'active'
    ORDER BY c.name
  `;

  db.all(query, [req.user.id], (err, companies) => {
    if (err) {
      console.error('Error fetching user companies:', err);
      return res.status(500).json({ error: 'Error fetching companies' });
    }

    req.user.companies = companies;
    
    // Set current company from header or use first company
    const companyId = req.headers['x-company-id'];
    if (companyId) {
      const currentCompany = companies.find(c => c.id === parseInt(companyId));
      if (currentCompany) {
        req.user.currentCompany = currentCompany;
        req.user.currentRole = currentCompany.role;
      } else {
        return res.status(403).json({ error: 'Access denied to specified company' });
      }
    } else if (companies.length > 0) {
      // Default to first company if no company specified
      req.user.currentCompany = companies[0];
      req.user.currentRole = companies[0].role;
    }

    next();
  });
};

// Middleware to require a specific role
const requireRole = (minimumRole) => {
  const roleHierarchy = { user: 1, manager: 2, admin: 3 };
  
  return (req, res, next) => {
    if (!req.user.currentRole) {
      return res.status(403).json({ error: 'No company context found' });
    }

    const userRoleLevel = roleHierarchy[req.user.currentRole] || 0;
    const requiredRoleLevel = roleHierarchy[minimumRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${minimumRole}, your role: ${req.user.currentRole}` 
      });
    }

    next();
  };
};

// Middleware to ensure user has access to a company
const requireCompanyAccess = (req, res, next) => {
  if (!req.user.currentCompany) {
    return res.status(403).json({ error: 'Company access required' });
  }
  next();
};

// Middleware to add user tracking to database operations
const addUserTracking = (req, res, next) => {
  // Add user ID to request for database operations
  if (req.user) {
    req.userId = req.user.id;
    req.companyId = req.user.currentCompany?.id;
  }
  next();
};

// Utility function to refresh access token
const refreshAccessToken = (refreshToken) => {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
      if (err) {
        reject(err);
        return;
      }

      // Get user data and generate new access token
      db.get('SELECT * FROM users WHERE id = ?', [decoded.id], (err, user) => {
        if (err || !user) {
          reject(new Error('User not found'));
          return;
        }

        const newAccessToken = jwt.sign({
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        }, JWT_SECRET, { expiresIn: '15m' });

        resolve(newAccessToken);
      });
    });
  });
};

module.exports = {
  generateTokens,
  authenticateToken,
  getUserCompanies,
  requireRole,
  requireCompanyAccess,
  addUserTracking,
  refreshAccessToken,
  JWT_SECRET,
  JWT_REFRESH_SECRET
}; 