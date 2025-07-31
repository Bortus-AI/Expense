import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const ColorPicker = ({ selectedColor, onColorChange, colors, title }) => {
  const styles = StyleSheet.create({
    container: {
      marginVertical: 15,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: selectedColor?.text || '#000000',
      marginBottom: 10,
    },
    colorOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    colorOption: {
      width: 40,
      height: 40,
      borderRadius: 20,
      margin: 5,
      borderWidth: selectedColor === colors.primary ? 3 : 0,
      borderColor: '#FFFFFF',
      elevation: 2,
    },
    customColorOption: {
      width: 40,
      height: 40,
      borderRadius: 8,
      margin: 5,
      borderWidth: selectedColor === colors.primary ? 3 : 1,
      borderColor: '#CCCCCC',
      justifyContent: 'center',
      alignItems: 'center',
    },
    customColorText: {
      fontSize: 12,
      color: '#666666',
    },
  });

  // Predefined color options
  const predefinedColors = [
    '#2196F3', // Blue
    '#FF9800', // Orange
    '#4CAF50', // Green
    '#F44336', // Red
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#FFEB3B', // Yellow
    '#795548', // Brown
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.colorOptions}>
        {predefinedColors.map((color, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.colorOption,
              { backgroundColor: color },
            ]}
            onPress={() => onColorChange(color)}
          />
        ))}
        <TouchableOpacity
          style={styles.customColorOption}
          onPress={() => onColorChange('#FFFFFF')} // In a real app, this would open a color picker
        >
          <Text style={styles.customColorText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ColorPicker;