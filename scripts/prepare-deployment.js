const fs = require('fs');
const path = require('path');

console.log('Preparing deployment for bunny.net...');

// Create deployment directory
const deploymentDir = path.join(__dirname, '..', 'deployment');
if (!fs.existsSync(deploymentDir)) {
  fs.mkdirSync(deploymentDir, { recursive: true });
}

// Copy backend files
console.log('Copying backend files...');
const backendDir = path.join(__dirname, '..', 'backend');
const backendFiles = fs.readdirSync(backendDir);

backendFiles.forEach(file => {
  const sourcePath = path.join(backendDir, file);
  const destPath = path.join(deploymentDir, file);
  
  if (fs.statSync(sourcePath).isDirectory()) {
    // Copy directory
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    copyDirectory(sourcePath, destPath);
  } else {
    // Copy file
    fs.copyFileSync(sourcePath, destPath);
  }
});

// Build frontend first
console.log('Building frontend...');
const { execSync } = require('child_process');
try {
  execSync('cd frontend && npm run build', { 
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });
} catch (error) {
  console.error('Frontend build failed:', error.message);
  process.exit(1);
}

// Copy frontend build
console.log('Copying frontend build...');
const frontendBuildDir = path.join(__dirname, '..', 'frontend', 'build');
const publicDir = path.join(deploymentDir, 'public');

if (fs.existsSync(frontendBuildDir)) {
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  copyDirectory(frontendBuildDir, publicDir);
} else {
  console.warn('Frontend build directory not found. Build may have failed.');
}

// Create deployment server.js
console.log('Creating deployment server.js...');
const serverContent = `const express = require('express');
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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});`;

fs.writeFileSync(path.join(deploymentDir, 'server.js'), serverContent);

// Create deployment package.json
console.log('Creating deployment package.json...');
const packageContent = {
  name: "expense-matcher-deployment",
  version: "1.0.0",
  main: "server.js",
  scripts: {
    start: "node server.js"
  },
  dependencies: {
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
};

fs.writeFileSync(path.join(deploymentDir, 'package.json'), JSON.stringify(packageContent, null, 2));

console.log('Deployment preparation complete!');
console.log('The deployment directory is ready for bunny.net');

function copyDirectory(source, destination) {
  const files = fs.readdirSync(source);
  
  files.forEach(file => {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);
    
    if (fs.statSync(sourcePath).isDirectory()) {
      if (!fs.existsSync(destPath)) {
        fs.mkdirSync(destPath, { recursive: true });
      }
      copyDirectory(sourcePath, destPath);
    } else {
      fs.copyFileSync(sourcePath, destPath);
    }
  });
} 