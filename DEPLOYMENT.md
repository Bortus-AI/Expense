# 🚀 Expense Matcher - Deployment Guide

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

# This runs the same script as above
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

### 3. Check Logs
```bash
# Backend logs
cd backend
npm start

# Look for:
# ✅ Database tables created/verified
# ✅ Default admin user created successfully!
# 🌐 Server running on port 5000
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

## Support

If you encounter issues during deployment:

1. Check the console logs for detailed error messages
2. Verify all dependencies are installed
3. Ensure proper file permissions
4. Check that ports 3000 and 5000 are available
5. Verify your `.env` configuration

Need help? Check the application logs for specific error messages. 