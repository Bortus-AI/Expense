import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialIcons';

const CameraPreview = ({onCapture, onGallery, style}) => {
  const {theme} = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      ...style,
    },
    cameraContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    placeholderText: {
      fontSize: 18,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 20,
    },
    captureButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 50,
      width: 70,
      height: 70,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 5,
      shadowColor: '#000',
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    galleryButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 50,
      width: 60,
      height: 60,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    icon: {
      fontSize: 30,
      color: '#FFFFFF',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <Text style={styles.placeholderText}>
          Align receipt in frame and capture
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.galleryButton} onPress={onGallery}>
          <Icon name="folder" style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.captureButton} onPress={onCapture}>
          <Icon name="camera" style={styles.icon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.galleryButton} onPress={onGallery}>
          <Icon name="image" style={styles.icon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CameraPreview;