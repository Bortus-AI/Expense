import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeAwareIcon = ({ 
  name, 
  size = 24, 
  color, 
  backgroundColor,
  style,
  ...props 
}) => {
  const { theme } = useTheme();

  // Default color based on theme if not provided
  const iconColor = color || theme.colors.iconActive;
  const bg = backgroundColor || 'transparent';

  const styles = StyleSheet.create({
    container: {
      backgroundColor: bg,
      borderRadius: size,
      width: size * 2,
      height: size * 2,
      alignItems: 'center',
      justifyContent: 'center',
      ...style,
    },
  });

  return (
    <View style={styles.container}>
      <Icon 
        name={name} 
        size={size} 
        color={iconColor} 
        {...props} 
      />
    </View>
  );
};

export default ThemeAwareIcon;