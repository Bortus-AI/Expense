#!/bin/bash

# Deployment script for bunny.net
# This script will be run by bunny.net during deployment

echo "Starting deployment..."

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Create deployment structure
echo "Preparing deployment files..."
mkdir -p deployment
cp -r backend/* deployment/
cp -r frontend/build deployment/public
cp package.json deployment/

# Create deployment server.js
cat > deployment/server.js << 'EOF'
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/receipts', require('./routes/receipts'));
app.use('/api/matches', require('./routes/matches'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/masterdata', require('./routes/masterdata'));
app.use('/api/ai', require('./routes/ai'));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
EOF

# Create deployment package.json
cat > deployment/package.json << 'EOF'
{
  "name": "expense-matcher-deployment",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "archiver": "^7.0.1",
    "axios": "^1.11.0",
    "bcryptjs": "^3.0.2",
    "cors": "^2.8.5",
    "csv-parser": "^3.0.0",
    "dotenv": "^17.2.1",
    "exceljs": "^4.4.0",
    "express": "^4.18.2",
    "express-rate-limit": "^8.0.1",
    "helmet": "^8.1.0",
    "jsonwebtoken": "^9.0.2",
    "moment": "^2.30.1",
    "multer": "^1.4.5-lts.1",
    "pdf-lib": "^1.17.1",
    "pdf-parse": "^1.1.1",
    "pdf-poppler": "^0.2.1",
    "pdfkit": "^0.17.1",
    "sqlite3": "^5.1.6",
    "tesseract.js": "^5.0.4",
    "uuid": "^9.0.1"
  }
}
EOF

# Install deployment dependencies
echo "Installing deployment dependencies..."
cd deployment
npm install --production

echo "Deployment preparation complete!"
echo "The deployment directory is ready for bunny.net" 