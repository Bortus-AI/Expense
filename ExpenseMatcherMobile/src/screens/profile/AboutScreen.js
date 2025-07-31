import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

const AboutScreen = () => {
  const {theme} = useTheme();

  const handlePressLink = (url) => {
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      padding: 30,
      alignItems: 'center',
      backgroundColor: theme.colors.primary,
    },
    appIcon: {
      width: 100,
      height: 100,
      borderRadius: 20,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 20,
    },
    appIconText: {
      fontSize: 60,
      color: theme.colors.primary,
    },
    appName: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 10,
    },
    appVersion: {
      fontSize: 16,
      color: '#FFFFFF',
    },
    content: {
      padding: 20,
    },
    section: {
      marginBottom: 30,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    paragraph: {
      fontSize: 16,
      color: theme.colors.text,
      lineHeight: 24,
      marginBottom: 15,
    },
    link: {
      fontSize: 16,
      color: theme.colors.primary,
      textDecorationLine: 'underline',
      marginBottom: 10,
    },
    copyright: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 30,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.appIcon}>
          <Text style={styles.appIconText}>🧾</Text>
        </View>
        <Text style={styles.appName}>Expense Matcher</Text>
        <Text style={styles.appVersion}>Version 1.0.0</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This App</Text>
          <Text style={styles.paragraph}>
            Expense Matcher helps you easily track and manage your expenses by 
            capturing receipts with your camera and automatically extracting 
            the relevant information using advanced OCR technology.
          </Text>
          <Text style={styles.paragraph}>
            Simply take a photo of your receipt, and our app will extract the 
            merchant name, date, total amount, and itemized details for you.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <Text style={styles.paragraph}>
            • Camera-based receipt capture
          </Text>
          <Text style={styles.paragraph}>
            • Automatic OCR data extraction
          </Text>
          <Text style={styles.paragraph}>
            • Expense categorization
          </Text>
          <Text style={styles.paragraph}>
            • Export capabilities
          </Text>
          <Text style={styles.paragraph}>
            • Dark mode support
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <TouchableOpacity onPress={() => handlePressLink('mailto:support@expensematcher.com')}>
            <Text style={styles.link}>support@expensematcher.com</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handlePressLink('https://expensematcher.com')}>
            <Text style={styles.link}>expensematcher.com</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.copyright}>
          © 2023 Expense Matcher. All rights reserved.
        </Text>
      </View>
    </ScrollView>
  );
};

export default AboutScreen;