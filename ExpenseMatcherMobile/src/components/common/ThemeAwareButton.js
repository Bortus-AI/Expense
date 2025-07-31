import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeAwareButton = ({ 
  title, 
  onPress, 
  variant = 'primary', 
  disabled = false, 
  style,
  textStyle 
}) => {
  const { theme } = useTheme();

  const getButtonStyles = () => {
    const baseStyles = {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    };

    const textBaseStyles = {
      fontSize: 16,
      fontWeight: '600',
    };

    switch (variant) {
      case 'primary':
        return {
          button: {
            ...baseStyles,
            backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.primary,
          },
          text: {
            ...textBaseStyles,
            color: '#FFFFFF',
          },
        };
      case 'secondary':
        return {
          button: {
            ...baseStyles,
            backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.secondary,
          },
          text: {
            ...textBaseStyles,
            color: '#FFFFFF',
          },
        };
      case 'outline':
        return {
          button: {
            ...baseStyles,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: disabled ? theme.colors.textDisabled : theme.colors.primary,
          },
          text: {
            ...textBaseStyles,
            color: disabled ? theme.colors.textDisabled : theme.colors.primary,
          },
        };
      case 'text':
        return {
          button: {
            ...baseStyles,
            backgroundColor: 'transparent',
          },
          text: {
            ...textBaseStyles,
            color: disabled ? theme.colors.textDisabled : theme.colors.primary,
          },
        };
      default:
        return {
          button: {
            ...baseStyles,
            backgroundColor: disabled ? theme.colors.textDisabled : theme.colors.primary,
          },
          text: {
            ...textBaseStyles,
            color: '#FFFFFF',
          },
        };
    }
  };

  const { button, text } = getButtonStyles();

  return (
    <TouchableOpacity
      style={[button, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

export default ThemeAwareButton;