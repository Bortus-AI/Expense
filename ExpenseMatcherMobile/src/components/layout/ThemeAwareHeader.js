import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeAwareHeader = ({ title, style, children }) => {
  const { theme, isDarkMode } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      backgroundColor: theme.colors.primary,
      ...style,
    },
    leftContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backIcon: {
      fontSize: 24,
      color: '#FFFFFF',
      marginRight: 10,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    rightContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
  });

  return (
    <>
      <StatusBar
        backgroundColor={theme.colors.primary}
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
      />
      <View style={styles.container}>
        <View style={styles.leftContainer}>
          {children}
        </View>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.rightContainer} />
      </View>
    </>
  );
};

export default ThemeAwareHeader;