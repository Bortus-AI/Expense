# Deployment Guide for Bunny.net

This guide will help you deploy your Expense Matcher application to bunny.net.

## Prerequisites

1. A bunny.net account
2. Your GitHub repository connected to bunny.net
3. Environment variables configured

## Deployment Configuration

### Bunny.net Settings

Based on the image you provided, configure your bunny.net deployment with these settings:

- **Publish Branch**: `main`
- **Project Preset**: `Custom`
- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Entry File**: `server.js`

### Environment Variables

You'll need to set up these environment variables in your bunny.net dashboard:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=your_jwt_secret_here
DATABASE_URL=your_database_url_here
```

## Deployment Steps

### 1. Connect GitHub Repository

1. Go to your bunny.net dashboard
2. Create a new application
3. Connect your GitHub repository
4. Select the `main` branch

### 2. Configure Build Settings

In the bunny.net deployment settings:

- **Install Command**: `npm install`
- **Build Command**: `npm run build`
- **Entry File**: `server.js`

### 3. Set Environment Variables

Add these environment variables in your bunny.net application settings:

- `NODE_ENV=production`
- `PORT=3000`
- `JWT_SECRET` (your secret key)
- Any other environment variables your app needs

### 4. Deploy

1. Push your code to the `main` branch
2. bunny.net will automatically trigger a deployment
3. Monitor the deployment logs for any issues

## File Structure

The deployment will create this structure:

```
/
├── server.js (main entry point)
├── package.json (dependencies)
├── public/ (React build files)
├── routes/ (API routes)
├── middleware/ (Express middleware)
├── services/ (Business logic)
└── database/ (Database files)
```

## Troubleshooting

### Common Issues

1. **Build Failures**: Check that all dependencies are properly listed in `package.json`
2. **Port Issues**: Ensure your app listens on `process.env.PORT`
3. **Environment Variables**: Verify all required env vars are set in bunny.net
4. **Database Connection**: Ensure your database is accessible from bunny.net servers

### Logs

Check the deployment logs in your bunny.net dashboard for detailed error messages.

## Manual Deployment

If you prefer to create the workflow file manually:

1. Check the "I will create the GitHub workflow file myself" option
2. Use the provided `.github/workflows/deploy.yml` file
3. Configure your GitHub secrets for bunny.net API access

## Support

For issues with bunny.net deployment, check:
- bunny.net documentation
- GitHub Actions logs
- Application logs in bunny.net dashboard 