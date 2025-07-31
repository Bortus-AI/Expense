import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeAwareCard = ({ 
  children, 
  title, 
  style,
  contentStyle,
  titleStyle,
  elevation = 'medium'
}) => {
  const { theme } = useTheme();

  const styles = StyleSheet.create({
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 20,
      marginVertical: 8,
      marginHorizontal: 16,
      ...theme.elevation[elevation],
      ...style,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
      ...titleStyle,
    },
    content: {
      ...contentStyle,
    },
  });

  return (
    <View style={styles.card}>
      {title && <Text style={styles.title}>{title}</Text>}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

export default ThemeAwareCard;