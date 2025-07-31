import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity, StatusBar} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import ThemeAwareIcon from '../common/ThemeAwareIcon';

const Header = ({title, onBack, onSettings, style}) => {
  const {theme, isDarkMode} = useTheme();

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
          {onBack && (
            <TouchableOpacity onPress={onBack}>
              <ThemeAwareIcon name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <View style={styles.rightContainer}>
          {onSettings && (
            <TouchableOpacity onPress={onSettings}>
              <ThemeAwareIcon name="settings" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );
};

export default Header;