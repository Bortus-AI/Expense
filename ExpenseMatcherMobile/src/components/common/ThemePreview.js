import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const ThemePreview = ({ theme, style }) => {
  const styles = StyleSheet.create({
    previewContainer: {
      padding: 20,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      ...style,
    },
    previewHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
    },
    previewTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    previewButton: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 15,
      paddingVertical: 8,
      borderRadius: 4,
    },
    previewButtonText: {
      color: '#FFFFFF',
      fontWeight: 'bold',
    },
    previewContent: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    previewText: {
      flex: 1,
      fontSize: 14,
      color: theme.colors.textSecondary,
      lineHeight: 20,
    },
    previewIcon: {
      width: 40,
      height: 40,
      backgroundColor: theme.colors.primary,
      borderRadius: 20,
      marginRight: 15,
    },
  });

  return (
    <View style={styles.previewContainer}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>Theme Preview</Text>
        <View style={styles.previewButton}>
          <Text style={styles.previewButtonText}>Action</Text>
        </View>
      </View>
      <View style={styles.previewContent}>
        <View style={styles.previewIcon} />
        <Text style={styles.previewText}>
          This is how your app will look with the selected theme. 
          Notice the colors, contrast, and overall appearance.
        </Text>
      </View>
    </View>
  );
};

export default ThemePreview;