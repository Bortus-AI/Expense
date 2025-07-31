# Expense Matcher Mobile App

A React Native mobile application for capturing and processing receipts using OCR technology.

## Features

- Camera-based receipt capture
- Gallery image selection
- OCR text recognition for receipt data extraction
- Expense categorization
- Dark mode support
- Cross-platform support (iOS and Android)
- Comprehensive theme system with customizable colors

## Project Structure

```
ExpenseMatcherMobile/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── assets/                  # Images, icons, fonts
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Generic components (buttons, inputs, etc.)
│   │   ├── layout/          # Layout components (headers, footers, etc.)
│   │   └── specific/        # Feature-specific components
│   ├── screens/             # Screen components
│   │   ├── auth/            # Authentication screens
│   │   ├── camera/          # Camera and OCR screens
│   │   ├── receipts/        # Receipts management screens
│   │   ├── dashboard/       # Dashboard and home screens
│   │   ├── settings/        # Settings screens
│   │   └── profile/         # User profile screens
│   ├── navigation/          # Navigation configuration
│   ├── services/            # API and business logic services
│   ├── contexts/            # React Context providers
│   ├── hooks/               # Custom hooks
│   ├── utils/               # Utility functions
│   ├── constants/           # Application constants
│   └── themes/              # Theme configuration
├── App.js                   # Main application component
├── index.js                 # Entry point
└── react-native.config.js   # React Native configuration
```

## Dependencies

### Core Dependencies

- `@react-navigation/native` - Navigation library
- `@react-navigation/native-stack` - Stack navigator
- `@react-navigation/bottom-tabs` - Bottom tab navigator
- `react-native-image-picker` - Image picker for camera/gallery
- `react-native-permissions` - Permission handling
- `react-native-async-storage` - Local data storage
- `react-native-netinfo` - Network information
- `react-native-toast-message` - Toast notifications
- `react-native-vision-camera` - Camera functionality
- `react-native-ocr` - OCR processing
- `react-native-paper` - Material Design components

## Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. For iOS, run `cd ios && pod install`
4. Run `npx react-native run-android` or `npx react-native run-ios`

## Architecture

The app follows a modular architecture with clear separation of concerns:

- **Components**: Reusable UI elements
- **Screens**: Full-screen components for each view
- **Navigation**: React Navigation for routing
- **Contexts**: Global state management
- **Services**: Business logic and API calls
- **Utils**: Helper functions

## Theme System

The app features a comprehensive theme system with full dark mode support:
- Light, dark, and AMOLED dark themes
- System-aware theme detection
- Customizable primary and accent colors
- Theme export/import functionality
- Smooth theme transition animations
- Accessibility considerations for contrast ratios

For detailed information about the theme system, see [THEME_SYSTEM_README.md](THEME_SYSTEM_README.md).

## Camera and OCR Flow

1. User opens camera screen
2. Grant camera permissions
3. Capture image or select from gallery
4. Image is processed with OCR
5. Extracted data is displayed for review
6. User can edit or save the receipt data

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.