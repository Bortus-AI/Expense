import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import ThemePreview from '../../components/common/ThemePreview';
import ColorPicker from '../../components/common/ColorPicker';
import Button from '../../components/common/Button';
import ThemeExportImport from '../../components/common/ThemeExportImport';

const ThemeCustomizationScreen = ({ navigation }) => {
  const {
    theme,
    themeOption,
    setCustomPrimaryColor,
    setCustomAccentColor,
    resetCustomColors,
    THEME_OPTIONS
  } = useTheme();
  
  const [primaryColor, setPrimaryColor] = useState(theme.colors.primary);
  const [accentColor, setAccentColor] = useState(theme.colors.secondary);

  const handleSaveCustomization = useCallback(() => {
    setCustomPrimaryColor(primaryColor);
    setCustomAccentColor(accentColor);
    
    Alert.alert(
      'Theme Customized',
      'Your theme has been customized successfully!',
      [{ text: 'OK' }]
    );
  }, [primaryColor, accentColor, setCustomPrimaryColor, setCustomAccentColor]);

  const handleResetCustomization = useCallback(() => {
    Alert.alert(
      'Reset Theme',
      'Are you sure you want to reset to the default theme?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetCustomColors();
            setPrimaryColor(theme.colors.primary);
            setAccentColor(theme.colors.secondary);
          }
        }
      ]
    );
  }, [resetCustomColors, theme]);

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
      textAlign: 'center',
    },
    content: {
      padding: 20,
    },
    section: {
      backgroundColor: theme.colors.surface,
      padding: 15,
      borderRadius: 8,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 15,
    },
    previewContainer: {
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    resetButton: {
      flex: 1,
      marginRight: 10,
      backgroundColor: theme.colors.error,
    },
    saveButton: {
      flex: 1,
      marginLeft: 10,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Theme Customization</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.previewContainer}>
          <ThemePreview theme={theme} />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customize Colors</Text>
          
          <ColorPicker
            title="Primary Color"
            selectedColor={primaryColor}
            onColorChange={setPrimaryColor}
            colors={theme.colors}
          />
          
          <ColorPicker
            title="Accent Color"
            selectedColor={accentColor}
            onColorChange={setAccentColor}
            colors={theme.colors}
          />
        </View>
        
        <ThemeExportImport />
        
        <View style={styles.buttonContainer}>
          <Button
            title="Reset"
            onPress={handleResetCustomization}
            style={styles.resetButton}
          />
          <Button
            title="Save Changes"
            onPress={handleSaveCustomization}
            style={styles.saveButton}
          />
        </View>
      </View>
    </ScrollView>
  );
};

export default ThemeCustomizationScreen;