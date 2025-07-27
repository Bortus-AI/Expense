const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import database
const db = require('./database/init');

// Import routes
const authRoutes = require('./routes/auth');
const companyRoutes = require('./routes/companies');
const transactionRoutes = require('./routes/transactions');
const receiptRoutes = require('./routes/receipts');
const matchRoutes = require('./routes/matches');
const exportRoutes = require('./routes/exports');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Disable for development
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
const getAllowedOrigins = () => {
  const origins = [];
  
  // Always allow localhost for development
  origins.push('http://localhost:3000', 'http://localhost:3001');
  
  // Add custom frontend URL from environment variable
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Add deployed frontend IP (temporary fix)
  origins.push('http://66.23.193.169:3000');
  
  // Production domains
  if (process.env.NODE_ENV === 'production') {
    // Add your production domains here
    origins.push('https://yourdomain.com');
  }
  
  console.log('Allowed CORS origins:', origins);
  return origins;
};

const corsOptions = {
  origin: getAllowedOrigins(),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-company-id']
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve static files (uploaded receipts)
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/exports', exportRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Expense Receipt Matcher API is running',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    features: [
      'User Authentication',
      'Multi-Company Support',
      'Receipt OCR',
      'Transaction Matching',
      'Role-Based Access Control'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found` 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log('Features enabled:');
  console.log('  ✅ User Authentication (JWT)');
  console.log('  ✅ Multi-Company Support');
  console.log('  ✅ Role-Based Access Control');
  console.log('  ✅ Rate Limiting & Security');
  console.log('  ✅ Receipt OCR & Matching');
}); 