# 🚀 Expense Matcher - Deployment Guide

## Overview
This guide provides comprehensive deployment instructions for the Expense Matcher application, which includes advanced AI/ML features powered by Ollama local LLM integration.

## ✅ Current Implementation Status

### Fully Implemented Features
- **Core Application**: Complete user management, transaction processing, receipt handling
- **AI/ML Integration**: Ollama LLM with llama3.1:8b and llama3.2:3b models
- **Intelligent Features**: Categorization, duplicate detection, advanced matching
- **Mobile App Basic Structure**: React Native with authentication and navigation
- **Production Ready**: Security, performance, error handling

### AI/ML Capabilities
- **LLM Integration**: Local Ollama server with configurable models
- **Intelligent Categorization**: ML-based transaction categorization
- **Duplicate Detection**: Advanced duplicate detection and management
- **Advanced Matching**: Smart transaction-receipt matching
- **Transaction Splitting**: Multi-receipt transaction splitting
- **Pattern Recognition**: Recurring pattern detection
- **Calendar Correlation**: Event-based transaction correlation

### Mobile App Status
- **✅ Implemented**: Authentication, navigation, basic structure
- **🔄 Pending**: Camera functionality, receipt capture, core features
- **📱 Current**: Basic React Native app with login/logout

## Fresh Deployment Setup

### Quick Start (Automatic Admin Creation)

When you deploy this application to a fresh server, it will **automatically create a default admin user** when you start the backend for the first time.

#### 1. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend (in another terminal)
cd frontend
npm install
```

#### 2. Environment Setup
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit your .env file with your specific settings
nano backend/.env
```

#### 3. Start the Application
```bash
# Start backend (will auto-create admin user)
cd backend
npm start

# Start frontend (in another terminal)
cd frontend
npm start
```

#### 4. Default Login Credentials

When you see this message in your backend logs:
```
✅ Default admin user created successfully!
📧 Login with:
   Email:    admin@company.com
   Password: admin123!
🔐 Please change the password after first login!
```

You can now login at `http://localhost:3000` with:
- **Email:** `admin@company.com`  
- **Password:** `admin123!`

**🔐 IMPORTANT:** Change this password immediately after your first login!

---

## AI/ML Setup (Optional but Recommended)

### Ollama Installation
For AI/ML features, install Ollama:

```bash
# Install Ollama (follow instructions at https://ollama.ai)
curl -fsSL https://ollama.ai/install.sh | sh

# Start Ollama service
ollama serve

# Download LLM models (in another terminal)
ollama pull llama3.1:8b
ollama pull llama3.2:3b
```

### Environment Configuration for AI
Add these to your `.env` file for AI features:

```bash
# AI/ML Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b

# AI Processing Settings
AI_ENABLED=true
AUTO_CATEGORIZATION=true
DUPLICATE_DETECTION=true
```

---

## Manual Admin User Creation

If you need to create an admin user manually or with custom credentials:

### Option 1: Using the Setup Script
```bash
cd backend

# Create default admin user
npm run setup

# Or create with custom credentials:
node create-admin-user.js your@email.com yourpassword "First" "Last" "Your Company"
```

### Option 2: Using Package Script
```bash
cd backend
npm run create-admin
```

---

## Production Deployment

### 1. Environment Variables
Create a production `.env` file:

```bash
# Environment
NODE_ENV=production

# Server
PORT=5000

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-super-long-random-jwt-secret-key-here
JWT_REFRESH_SECRET=your-super-long-random-refresh-secret-key-here

# Database
DATABASE_PATH=./database/expense_matcher.db

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# CORS (your frontend URL)
FRONTEND_URL=https://your-domain.com

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# Company Settings
DEFAULT_COMPANY_PLAN=basic
AUTO_MATCH_THRESHOLD=70

# AI/ML Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b
AI_ENABLED=true
AUTO_CATEGORIZATION=true
DUPLICATE_DETECTION=true
```

### 2. Build Frontend
```bash
cd frontend
npm run build
```

### 3. Deploy with Process Manager (PM2)
```bash
# Install PM2 globally
npm install -g pm2

# Start backend with PM2
cd backend
pm2 start server.js --name="expense-matcher-backend"

# Serve frontend with PM2 (or use nginx)
pm2 serve frontend/build 3000 --name="expense-matcher-frontend"

# Save PM2 configuration
pm2 save
pm2 startup
```

### 4. Nginx Configuration (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Database Management

### Backup Database
```bash
# Copy the SQLite database file
cp backend/database/expense_matcher.db backup_$(date +%Y%m%d_%H%M%S).db
```

### Reset Database (⚠️ DANGER!)
```bash
# This will delete all data!
rm backend/database/expense_matcher.db

# Restart backend to recreate with default admin
cd backend
npm start
```

---

## Security Best Practices

### 1. Change Default Credentials
- [ ] Login with default admin account
- [ ] Go to Profile → Change Password
- [ ] Change email if needed
- [ ] Create additional admin users if needed

### 2. Environment Security
- [ ] Use strong, unique JWT secrets
- [ ] Set appropriate CORS origins
- [ ] Configure rate limiting
- [ ] Use HTTPS in production

### 3. File Permissions
```bash
# Secure the database
chmod 600 backend/database/expense_matcher.db

# Secure upload directory
chmod 755 backend/uploads
```

### 4. AI/ML Verification (if you have AI features enabled)
- [ ] Configure Ollama for AI features
- [ ] Set up AI model configuration
- [ ] Test AI categorization features
- [ ] Verify duplicate detection
- [ ] Check advanced matching

### 5. Mobile App Setup (Optional)
- [ ] Install React Native development environment
- [ ] Configure mobile app API endpoints
- [ ] Test mobile authentication
- [ ] Verify mobile navigation

---

## Verification Steps

### 1. Check Backend Health
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 123.45
}
```

### 2. Test Admin Login
1. Go to `http://localhost:3000`
2. Login with admin credentials
3. Verify you can see the dashboard
4. Try uploading a receipt
5. Try importing transactions

### 3. Test AI Features
1. Go to AI Dashboard
2. Check if AI categorization works
3. Test duplicate detection
4. Verify advanced matching
5. Check LLM model configuration

### 4. Test Mobile App (Optional)
1. Install React Native development tools
2. Run `cd ExpenseMatcherMobile && npm install`
3. Start Metro bundler: `npm start`
4. Run on device/emulator: `npm run android` or `npm run ios`

### 5. Check Logs
```bash
# Backend logs
cd backend
npm start

# Look for:
# ✅ Database tables created/verified
# ✅ Default admin user created successfully!
# 🌐 Server running on port 5000
# 🤖 AI features initialized successfully
```

---

## Troubleshooting

### "Users already exist" Error
If you see this when running the setup script:
```
❌ Users already exist in the database.
   This script should only be run on a fresh deployment.
```

This means you already have users. Check existing users with:
```bash
cd backend
sqlite3 database/expense_matcher.db "SELECT email, first_name, last_name FROM users;"
```

### Cannot Connect to Database
- Check file permissions on the database directory
- Ensure SQLite3 is properly installed
- Check disk space

### Permission Denied Errors
```bash
# Fix upload directory permissions
mkdir -p backend/uploads/receipts
mkdir -p backend/uploads/csv
chmod -R 755 backend/uploads
```

### Port Already in Use
```bash
# Find process using port 5000
lsof -i :5000

# Kill the process (replace PID)
kill -9 PID
```

### AI Features Not Working
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# If not running, start Ollama
ollama serve

# Check available models
ollama list

# Download models if needed
ollama pull llama3.1:8b
ollama pull llama3.2:3b
```

### Mobile App Issues
```bash
# Check React Native environment
npx react-native doctor

# Clear Metro cache
cd ExpenseMatcherMobile
npx react-native start --reset-cache

# Reinstall dependencies
rm -rf node_modules && npm install
```

---

## Default User Information

| Field | Value |
|-------|-------|
| Email | `admin@company.com` |
| Password | `admin123!` |
| First Name | `Admin` |
| Last Name | `User` |
| Company | `Default Company` |
| Role | `admin` |

**⚠️ Change these credentials immediately after first login!**

---

## Feature Verification Checklist

### Core Features
- [ ] User authentication and login
- [ ] Multi-company support
- [ ] Transaction management
- [ ] Receipt upload and processing
- [ ] Manual transaction-receipt matching
- [ ] Export functionality (Excel, PDF)
- [ ] Basic analytics dashboard
- [ ] Master data management

### AI/ML Features
- [ ] LLM integration (Ollama)
- [ ] Intelligent categorization
- [ ] Duplicate detection
- [ ] Advanced matching
- [ ] Transaction splitting
- [ ] Pattern recognition
- [ ] Calendar correlation
- [ ] AI dashboard
- [ ] LLM model configuration

### Technical Features
- [ ] Error boundaries and handling
- [ ] Loading states and user feedback
- [ ] Responsive design
- [ ] File upload and processing
- [ ] Database operations
- [ ] API endpoints
- [ ] Security measures

### Mobile App Features (Basic)
- [ ] Authentication and login
- [ ] Navigation structure
- [ ] Basic dashboard
- [ ] API integration
- [ ] Error handling

---

## Support

If you encounter issues during deployment:

1. Check the console logs for detailed error messages
2. Verify all dependencies are installed
3. Ensure proper file permissions
4. Check that ports 3000 and 5000 are available
5. Verify your `.env` configuration
6. For AI features, ensure Ollama is running and models are downloaded
7. For mobile app, ensure React Native development environment is properly set up

Need help? Check the application logs for specific error messages. 