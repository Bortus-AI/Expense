# 📱 Expense Matcher Mobile App Setup Guide

## 🎯 Overview
This guide will help you run the React Native mobile app (not the web version in Chrome).

## 🔄 Web App vs Mobile App

### What you're seeing in Chrome:
- **Location**: `frontend` folder
- **Type**: React web application
- **Access**: Browser on any device
- **Features**: Basic responsive design

### What we built in Phase 3:
- **Location**: `ExpenseMatcherMobile` folder  
- **Type**: React Native mobile application
- **Access**: Native app installed on phone
- **Features**: Camera, offline sync, dark mode, native UI

## 🚀 Setup Options

### Option 1: Android Emulator (Recommended for Testing)

#### Prerequisites:
1. **Install Android Studio**
   ```
   Download: https://developer.android.com/studio
   ```

2. **Setup Android SDK**
   - During Android Studio installation, install Android SDK
   - Install Android 13 (API 33) or later
   - Install Android Emulator

3. **Create Virtual Device**
   - Open Android Studio
   - Go to Tools → AVD Manager
   - Create Virtual Device → Choose Pixel 6 or similar
   - Download system image and create AVD

#### Run the App:
```bash
# Start Metro bundler
npm start

# In another terminal, run Android app
npx react-native run-android
```

### Option 2: Physical Android Device

#### Prerequisites:
1. **Enable Developer Options** on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

2. **Connect via USB**
   - Connect phone to computer with USB cable
   - Allow USB debugging when prompted

#### Run the App:
```bash
# Start Metro bundler
npm start

# In another terminal, run on connected device
npx react-native run-android
```

### Option 3: Expo Go (Easiest for Quick Testing)

If you want the easiest setup, we can convert to Expo:

```bash
# Install Expo CLI
npm install -g @expo/cli

# Initialize Expo in existing project
npx create-expo-app --template bare-minimum
```

Then install Expo Go app on your phone and scan QR code.

## 🛠️ Troubleshooting

### Common Issues:

1. **"No Android devices connected"**
   - Make sure USB debugging is enabled
   - Try different USB cable
   - Run `adb devices` to check connection

2. **"SDK not found"**
   - Set ANDROID_HOME environment variable
   - Add Android SDK tools to PATH

3. **Metro bundler issues**
   - Close all terminals
   - Run `npx react-native start --reset-cache`

4. **App won't install**
   - Uninstall previous version
   - Clean build: `cd android && ./gradlew clean`

## 📱 Using the Mobile App

Once installed, the mobile app features:

### 📷 **Camera Screen**
- Tap camera tab → Take photo or select from gallery
- OCR automatically extracts amount and details
- Review and edit before uploading

### 🧾 **Receipts Screen**  
- View all receipts in grid layout
- Search by amount, description, or date
- Tap receipt for full-screen view

### ⚙️ **Settings Screen**
- Toggle dark/light mode
- Manage cache and offline data
- View app information

### 🏠 **Dashboard**
- Quick stats overview
- Access to all features
- Settings button (gear icon)

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npx react-native run-android

# Run on iOS (Mac only)
npx react-native run-ios

# Build for production
cd android && ./gradlew assembleRelease
```

## 📞 Need Help?

If you encounter issues:
1. Check React Native documentation: https://reactnative.dev/docs/environment-setup
2. Android Studio setup: https://developer.android.com/studio/install
3. Run `npx react-native doctor` to check environment

## 🎯 Quick Start for Testing

**Easiest path to see the mobile app:**

1. Install Android Studio
2. Create an Android emulator
3. Run these commands:
   ```bash
   npm start
   # In new terminal:
   npx react-native run-android
   ```

The app will install on the emulator and you can test all the mobile features we built!