# Expense Matcher Mobile App - Deployment Guide

## Overview
This guide provides instructions for deploying the Expense Matcher mobile app to production environments.

## Prerequisites
- Node.js (v16 or higher)
- React Native CLI
- Android Studio (for Android deployment)
- Xcode (for iOS deployment)
- Valid developer accounts for app stores

## Environment Setup

### 1. Install Dependencies
```bash
cd ExpenseMatcherMobile
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory with the following variables:
```
API_URL=https://your-api-url.com
OCR_API_KEY=your-ocr-api-key
ENCRYPTION_KEY=your-encryption-key
```

## Building for Android

### 1. Generate Signed APK
1. Generate a signing key:
```bash
keytool -genkeypair -v -storetype PKCS12 -keystore my-upload-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

2. Place the keystore file in `android/app` directory

3. Edit `android/gradle.properties` and add:
```
MYAPP_UPLOAD_STORE_FILE=my-upload-key.keystore
MYAPP_UPLOAD_KEY_ALIAS=my-key-alias
MYAPP_UPLOAD_STORE_PASSWORD=*****
MYAPP_UPLOAD_KEY_PASSWORD=*****
```

4. Edit `android/app/build.gradle`:
```gradle
signingConfigs {
    release {
        if (project.hasProperty('MYAPP_UPLOAD_STORE_FILE')) {
            storeFile file(MYAPP_UPLOAD_STORE_FILE)
            storePassword MYAPP_UPLOAD_STORE_PASSWORD
            keyAlias MYAPP_UPLOAD_KEY_ALIAS
            keyPassword MYAPP_UPLOAD_KEY_PASSWORD
        }
    }
}
```

### 2. Build Release APK
```bash
cd android
./gradlew assembleRelease
```

The APK will be located at `android/app/build/outputs/apk/release/app-release.apk`

## Building for iOS

### 1. Configure Xcode Project
1. Open `ios/ExpenseMatcherMobile.xcworkspace` in Xcode
2. Configure bundle identifier in project settings
3. Set up code signing with your Apple Developer account

### 2. Build Archive
1. Select "Generic iOS Device" as target
2. Go to Product > Archive
3. Follow Xcode prompts to upload to App Store

## Backend Deployment

### 1. API Server
Deploy the backend server using your preferred method (Docker, cloud provider, etc.)

### 2. Database
Set up a PostgreSQL database and configure connection settings in the backend.

### 3. OCR Service
Configure access to your chosen OCR service (Google Vision, AWS Textract, etc.)

## Configuration

### 1. App Configuration
Update `src/config/index.js` with production API endpoints and settings.

### 2. Security Settings
- Update encryption keys
- Configure secure storage settings
- Set up proper authentication flows

## Testing Checklist

### Pre-Deployment
- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] Performance benchmarks meet requirements
- [ ] Security audit completed
- [ ] Cross-platform compatibility verified
- [ ] App store guidelines compliance checked

### Post-Deployment
- [ ] Monitor app performance and crashes
- [ ] Verify user authentication flows
- [ ] Check data synchronization
- [ ] Validate OCR processing accuracy
- [ ] Confirm offline functionality

## Rollout Strategy

### 1. Staged Rollout
1. Deploy to small percentage of users (1-5%)
2. Monitor key metrics and user feedback
3. Gradually increase rollout percentage
4. Full deployment after validation

### 2. Rollback Plan
- Maintain previous version for quick rollback
- Monitor crash reports and user feedback
- Prepare communication plan for users if issues arise

## Maintenance

### 1. Regular Updates
- Security patches and updates
- Performance optimizations
- Feature enhancements based on user feedback

### 2. Monitoring
- App performance monitoring
- Crash reporting and analysis
- User engagement metrics
- Database performance monitoring

### 3. Backup and Recovery
- Regular database backups
- User data export functionality
- Disaster recovery procedures

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Node.js version compatibility and dependency conflicts
2. **Deployment Errors**: Verify signing configurations and certificates
3. **Runtime Crashes**: Check crash reports and logs for error patterns
4. **Performance Issues**: Monitor resource usage and optimize accordingly

### Support
- Maintain detailed documentation
- Provide user support channels
- Establish bug reporting process
- Plan for regular maintenance windows

## Conclusion

Following this deployment guide will help ensure a smooth and successful launch of the Expense Matcher mobile app. Regular monitoring and maintenance will be key to providing a quality user experience and addressing any issues that may arise.