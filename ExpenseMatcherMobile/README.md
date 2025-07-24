# Expense Matcher Mobile

A React Native mobile application for capturing receipts and matching them with credit card transactions.

## Features

### ✅ Implemented (Phase 1)
- **🔐 Authentication**: Login system with secure token storage
- **📱 Navigation**: Tab-based navigation with authentication flow
- **📊 Dashboard**: Overview of stats and quick actions
- **🏗️ Infrastructure**: Complete app structure and service layers

### 🚧 Coming Soon
- **📷 Camera**: Receipt capture with image picker
- **💳 Transactions**: Browse and manage transaction data
- **🧾 Receipts**: View uploaded receipts and OCR results
- **🔗 Matches**: Review and confirm receipt matches
- **📱 Offline Support**: Work without internet connection
- **🔄 Sync**: Background synchronization with backend

## Technical Stack

- **Framework**: React Native 0.80.2
- **Navigation**: React Navigation v6
- **Authentication**: JWT tokens with secure keychain storage
- **HTTP Client**: Axios with automatic token refresh
- **UI Components**: React Native Paper
- **State Management**: React Context API
- **Storage**: AsyncStorage + Keychain Services
- **Notifications**: React Native Toast Message

## Project Structure

```
src/
├── contexts/           # React Context for state management
│   └── AuthContext.js  # Authentication state and methods
├── navigation/         # Navigation configuration
│   └── AppNavigator.js # Main navigation setup
├── screens/           # Screen components
│   ├── auth/          # Authentication screens
│   │   ├── LoginScreen.js
│   │   └── RegisterScreen.js
│   ├── main/          # Main app screens
│   │   ├── DashboardScreen.js
│   │   ├── TransactionsScreen.js
│   │   ├── ReceiptsScreen.js
│   │   ├── CameraScreen.js
│   │   ├── MatchesScreen.js
│   │   └── ProfileScreen.js
│   └── LoadingScreen.js
└── services/          # API and business logic
    └── authService.js # Authentication and API methods
```

## Setup Instructions

### Prerequisites
- Node.js (>=18)
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development)

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **iOS Setup** (iOS only):
   ```bash
   cd ios
   pod install
   cd ..
   ```

3. **Start Metro**:
   ```bash
   npm start
   ```

4. **Run the app**:
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

### Backend Configuration

Update the API URL in `src/services/authService.js`:

```javascript
const API_BASE_URL = __DEV__ 
  ? 'http://10.0.2.2:5000/api'  // Android emulator
  : 'https://your-production-api.com/api';
```

For iOS simulator, use `http://localhost:5000/api`.

## Authentication Flow

1. **Login**: User enters credentials
2. **Token Storage**: JWT tokens stored securely in Keychain
3. **Auto-refresh**: Tokens refreshed automatically on API calls
4. **Logout**: Tokens cleared from secure storage

## Development Notes

### Current Limitations
- Camera functionality is placeholder (needs implementation)
- Registration flow is simplified
- Offline support not yet implemented
- Push notifications not configured

### Next Steps
1. Implement camera capture with react-native-image-picker
2. Build out transaction and receipt list screens
3. Add offline data storage with SQLite
4. Implement background sync
5. Add push notifications for OCR completion

## API Integration

The mobile app integrates with the Expense Matcher backend API:

- **Authentication**: `/api/auth/login`, `/api/auth/refresh`
- **Receipts**: `/api/receipts/upload`, `/api/receipts`
- **Transactions**: `/api/transactions`
- **Matches**: `/api/matches`, `/api/matches/auto-match`

## Security Features

- **Secure Storage**: Sensitive data stored in Keychain (iOS) / Keystore (Android)
- **Token Refresh**: Automatic token refresh prevents expired sessions
- **API Security**: All requests include authentication headers
- **Error Handling**: Graceful handling of network and authentication errors

## Performance Considerations

- **Lazy Loading**: Screens loaded on-demand
- **Image Optimization**: Receipt images compressed before upload
- **Caching**: User data cached for offline access
- **Background Processing**: Non-blocking OCR processing

## Testing

```bash
# Run tests
npm test

# Run linter
npm run lint
```

## Contributing

1. Create feature branches for new functionality
2. Follow React Native best practices
3. Test on both iOS and Android
4. Update documentation for new features

## License

Private repository - All rights reserved.
