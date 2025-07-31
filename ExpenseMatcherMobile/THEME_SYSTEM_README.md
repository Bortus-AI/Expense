# Expense Matcher Mobile Theme System

## Overview

The Expense Matcher Mobile app features a comprehensive theme system with full dark mode support, following Material Design guidelines. This system provides users with a personalized experience while maintaining accessibility standards and performance optimization.

## Features

### 1. Theme Management System

- **Enhanced ThemeContext**: System theme detection with light, dark, and system theme options
- **Dynamic Theme Switching**: Immediate UI updates when changing themes
- **Persistent Theme Preferences**: Theme settings saved across app sessions
- **Theme Change Event Handling**: Proper propagation of theme changes throughout the app

### 2. Material Design Implementation

- **Professional Color Palette**: Following Material Design guidelines for consistent, accessible colors
- **Typography System**: Consistent text scaling and hierarchy
- **Elevation System**: Depth perception through shadows and layers
- **Iconography Consistency**: Unified icon styling across all components

### 3. Dark Mode Support

- **System-Aware Dark Mode**: Respects device settings automatically
- **Custom Dark Mode Palette**: Optimized for readability and reduced eye strain
- **AMOLED-Friendly Variants**: Special themes for OLED screens to save battery
- **Accessibility Considerations**: Proper contrast ratios for all theme variants

### 4. Theme Customization

- **Primary Color Customization**: Personalize the main accent color
- **Accent Color Customization**: Customize secondary colors
- **Theme Preview Functionality**: Real-time preview of changes
- **Reset to Default**: One-click reset to default theme
- **Export/Import Themes**: Share theme configurations between devices

### 5. Component-Level Theme Integration

- **Consistent Styling**: All UI components adapt to the current theme
- **Theme-Aware Navigation**: Navigation elements that respond to theme changes
- **Adaptive Icons and Images**: Visual elements that work in all themes
- **Dynamic Status Bar**: Status bar colors that match the theme

### 6. Performance Optimizations

- **Efficient Context Updates**: Theme changes without unnecessary re-renders
- **Cached Theme Values**: Quick access to theme properties
- **Lazy Loading**: Theme resources loaded only when needed
- **Memory-Efficient Storage**: Optimized storage for theme preferences

## Implementation Details

### Theme Context

The theme system is built around a React Context provider that manages:

- Current theme selection (light, dark, system, AMOLED)
- Custom color overrides
- Theme change handlers
- System theme detection

### Theme Definitions

Themes are defined with comprehensive color palettes that include:

- Primary and secondary colors
- Background and surface colors
- Text colors for various states
- Status colors (error, success, warning)
- Border and divider colors
- Overlay colors for modals and dialogs

### Component Integration

All components in the app use the theme context to:

- Access current color values
- Apply appropriate typography
- Use theme-appropriate shadows and elevations
- Adapt to system theme changes

## Usage

### Changing Themes

Users can change themes through the Settings screen:

1. Navigate to Profile > Settings
2. Select "Theme Mode" to choose between Light, Dark, AMOLED Dark, or System
3. For System mode, the app will automatically switch based on device settings

### Customizing Colors

Users can customize colors through the Settings screen:

1. Navigate to Profile > Settings > Customize Theme
2. Select primary and accent colors from predefined options or create custom colors
3. Preview changes in real-time
4. Save changes to apply them permanently

### Exporting and Importing Themes

Users can save their theme configurations:

1. Navigate to Profile > Settings > Customize Theme
2. Select "Export" to save the current theme configuration
3. Select "Import" to load a previously saved theme
4. Use "Reset to Default" to restore original theme settings

## Accessibility

The theme system maintains proper contrast ratios for all text and UI elements, following WCAG guidelines for accessibility. Dark mode variants are optimized for readability and reduced eye strain during extended use.

## Performance

The theme system is optimized to:

- Minimize re-renders when themes change
- Cache frequently accessed theme values
- Load theme resources efficiently
- Store theme preferences with minimal storage impact

## Future Enhancements

Planned improvements to the theme system include:

- Biometric authentication for theme security
- Push notifications for theme updates
- Advanced analytics for theme usage patterns
- Additional theme customization options