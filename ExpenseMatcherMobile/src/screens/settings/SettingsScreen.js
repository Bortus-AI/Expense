import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const {
    theme,
    themeOption,
    isDarkMode,
    changeTheme,
    THEME_OPTIONS
  } = useTheme();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [ocrEnabled, setOcrEnabled] = useState(true);

  const handleThemeChange = useCallback((newThemeOption) => {
    changeTheme(newThemeOption);
  }, [changeTheme]);

  const showThemeOptions = () => {
    Alert.alert(
      'Select Theme',
      'Choose your preferred theme',
      [
        {
          text: 'Light',
          onPress: () => handleThemeChange(THEME_OPTIONS.LIGHT),
        },
        {
          text: 'Dark',
          onPress: () => handleThemeChange(THEME_OPTIONS.DARK),
        },
        {
          text: 'AMOLED Dark',
          onPress: () => handleThemeChange(THEME_OPTIONS.AMOLED),
        },
        {
          text: 'System',
          onPress: () => handleThemeChange(THEME_OPTIONS.SYSTEM),
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 20,
      backgroundColor: theme.colors.primary,
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    section: {
      marginTop: 20,
      backgroundColor: theme.colors.surface,
      padding: 15,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    settingText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    versionContainer: {
      alignItems: 'center',
      padding: 30,
    },
    versionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={showThemeOptions}
        >
          <Text style={styles.settingText}>Theme Mode</Text>
          <Text style={[styles.settingText, { color: theme.colors.textSecondary }]}>
            {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('ThemeCustomization')}
        >
          <Text style={styles.settingText}>Customize Theme</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Enable Notifications</Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{false: '#767577', true: theme.colors.primary}}
            thumbColor={notificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receipt Processing</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Enable OCR</Text>
          <Switch
            value={ocrEnabled}
            onValueChange={setOcrEnabled}
            trackColor={{false: '#767577', true: theme.colors.primary}}
            thumbColor={ocrEnabled ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingText}>Auto-match Receipts</Text>
          <Switch
            value={true}
            onValueChange={() => {}}
            trackColor={{false: '#767577', true: theme.colors.primary}}
            thumbColor={'#FFFFFF'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        <TouchableOpacity
          style={styles.settingItem}
          onPress={() => navigation.navigate('StorageSettings')}
        >
          <Text style={styles.settingText}>Storage Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Export Data</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingItem}>
          <Text style={styles.settingText}>Clear Cache</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Expense Matcher v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default SettingsScreen;