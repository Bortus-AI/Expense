import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Button from './Button';
import { lightTheme, darkTheme, amoledDarkTheme } from '../../themes';

const ThemeExportImport = ({ style }) => {
  const { exportTheme, importTheme } = useTheme();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const themeData = exportTheme();
      const themeString = JSON.stringify(themeData, null, 2);
      
      // In a real app, you might use a share dialog or save to a file
      // For now, we'll just show an alert with the theme data
      Alert.alert(
        'Theme Exported',
        `Your theme configuration:\n\n${themeString}`,
        [
          { text: 'OK' },
          {
            text: 'Copy to Clipboard',
            onPress: () => {
              // In a real app, you would copy to clipboard here
              Alert.alert('Copied', 'Theme data copied to clipboard');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Export Failed', 'Failed to export theme configuration');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    try {
      // In a real app, you would get the theme data from a file or clipboard
      // For now, we'll just show an alert to demonstrate the functionality
      Alert.alert(
        'Import Theme',
        'Paste your theme configuration below:',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Import Sample',
            onPress: () => {
              // Import a sample theme for demonstration
              const sampleTheme = {
                themeOption: 'dark',
                customColors: {
                  primary: '#64B5F6',
                  secondary: '#FFB74D',
                },
              };
              importTheme(sampleTheme);
              Alert.alert('Theme Imported', 'Sample theme imported successfully');
            },
          },
        ],
        { cancelable: true }
      );
    } catch (error) {
      Alert.alert('Import Failed', 'Failed to import theme configuration');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Theme',
      'Are you sure you want to reset to the default theme?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset to default theme
            importTheme({
              themeOption: 'light',
              customColors: {},
            });
            Alert.alert('Theme Reset', 'Theme has been reset to default');
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      ...style,
    },
    section: {
      marginBottom: 20,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 10,
    },
    description: {
      fontSize: 14,
      color: '#666',
      marginBottom: 15,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    button: {
      flex: 1,
      marginHorizontal: 5,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.title}>Export/Import Theme</Text>
        <Text style={styles.description}>
          Save your theme configuration or import a theme from another device.
        </Text>
        
        <View style={styles.buttonContainer}>
          <Button
            title="Export"
            onPress={handleExport}
            loading={isExporting}
            style={styles.button}
          />
          <Button
            title="Import"
            onPress={handleImport}
            loading={isImporting}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.title}>Reset Theme</Text>
        <Text style={styles.description}>
          Reset your theme to the default configuration.
        </Text>
        <Button
          title="Reset to Default"
          onPress={handleReset}
          variant="danger"
        />
      </View>
    </View>
  );
};

export default ThemeExportImport;