# Bunny.net Deployment Steps

Based on your bunny.net deployment settings image, here are the exact steps to deploy your Expense Matcher app:

## 🚀 Quick Deployment Setup

### 1. Bunny.net Configuration

In your bunny.net deployment settings, use these exact values:

- **Publish Branch**: `main`
- **Project Preset**: `Custom`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Entry File**: `server.js`

### 2. Environment Variables

Set these environment variables in your bunny.net dashboard:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_super_secure_jwt_secret_here
DATABASE_PATH=./database/expense_matcher.db
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads
FRONTEND_URL=https://your-app-name.bunny.net
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000
DEFAULT_COMPANY_PLAN=basic
AUTO_MATCH_THRESHOLD=70
```

### 3. GitHub Repository Setup

1. Push all the deployment files to your GitHub repository
2. Ensure your repository is connected to bunny.net
3. The deployment will trigger automatically on pushes to `main`

## 📁 Files Created for Deployment

The following files have been created for your bunny.net deployment:

- `server.js` - Main entry point for bunny.net
- `deploy.sh` - Linux/macOS deployment script
- `deploy.bat` - Windows deployment script
- `scripts/prepare-deployment.js` - Node.js deployment preparation
- `.github/workflows/deploy.yml` - GitHub Actions workflow
- `bunny.json` - Bunny.net configuration
- `bunny-deploy.json` - Alternative bunny.net config
- `script.ts` - Bunny Edge Scripting file for performance and security
- `DEPLOYMENT.md` - Detailed deployment guide

## 🔧 Build Process

When bunny.net runs the build, it will:

1. **Install Dependencies**: `npm install`
2. **Build Frontend**: `npm run build` (builds React app)
3. **Prepare Deployment**: Creates deployment structure
4. **Deploy Edge Script**: Uploads TypeScript edge script for optimization
5. **Start Server**: Uses `server.js` as entry point

## 📋 Deployment Checklist

Before deploying, ensure:

- [ ] All files are committed to GitHub
- [ ] Environment variables are set in bunny.net
- [ ] GitHub secret `BUNNY_API_KEY` is configured for Edge Scripting
- [ ] Database will be created automatically on first run
- [ ] Default admin user will be created automatically

## 🎯 Default Admin User

After deployment, the app will automatically create a default admin user:

- **Email**: `admin@company.com`
- **Password**: `admin123!`

**⚠️ IMPORTANT**: Change these credentials immediately after first login!

## 🔍 Testing Your Deployment

1. **Health Check**: Visit `https://your-app.bunny.net/api/health`
2. **Admin Login**: Go to your app URL and login with default credentials
3. **Upload Test**: Try uploading a receipt to test file handling
4. **Database Test**: Check if transactions can be imported

## 🛠️ Troubleshooting

### Common Issues:

1. **Build Fails**: Check that all dependencies are in `package.json`
2. **Port Issues**: Ensure app listens on `process.env.PORT`
3. **Database Errors**: SQLite database will be created automatically
4. **File Upload Issues**: Check upload directory permissions

### Logs:

- Check bunny.net deployment logs for build errors
- Check application logs for runtime errors
- Monitor the `/api/health` endpoint

## 📞 Support

If you encounter issues:

1. Check bunny.net deployment logs
2. Verify environment variables are set correctly
3. Ensure all files are properly committed to GitHub
4. Test the health endpoint: `/api/health`

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ Build completes without errors
- ✅ Health endpoint returns `{"status": "healthy"}`
- ✅ You can login with default admin credentials
- ✅ You can upload receipts and import transactions
- ✅ All API endpoints respond correctly

---

**Ready to deploy?** Just push your code to the `main` branch and bunny.net will handle the rest! 