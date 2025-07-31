import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

const Button = ({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary', // primary, secondary, danger, outline, text
  style,
  textStyle,
}) => {
  const {theme} = useTheme();

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

    if (disabled) {
      return {
        button: {
          ...baseStyles,
          backgroundColor: theme.colors.surfaceVariant,
          opacity: 0.6,
        },
        text: {
          ...textBaseStyles,
          color: theme.colors.textDisabled,
        },
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          button: {
            ...baseStyles,
            backgroundColor: theme.colors.secondary,
          },
          text: {
            ...textBaseStyles,
            color: '#FFFFFF',
          },
        };
      case 'danger':
        return {
          button: {
            ...baseStyles,
            backgroundColor: theme.colors.error,
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
            borderColor: theme.colors.primary,
          },
          text: {
            ...textBaseStyles,
            color: theme.colors.primary,
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
            color: theme.colors.primary,
          },
        };
      default:
        return {
          button: {
            ...baseStyles,
            backgroundColor: theme.colors.primary,
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
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={text.color} />
      ) : (
        <Text style={[text, textStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;