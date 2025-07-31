import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {useNavigation} from '@react-navigation/native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import CameraPreview from '../../components/specific/CameraPreview';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { compressImage } from '../../utils/imageCompression';

const CameraScreen = ({navigation}) => {
  const [imageUri, setImageUri] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const {theme} = useTheme();
  const cameraRef = useRef(null);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs access to your camera to capture receipts',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasCameraPermission(true);
        } else {
          Alert.alert(
            'Permission Denied',
            'Camera permission is required to capture receipts',
          );
        }
      } catch (err) {
        console.warn(err);
      }
    } else {
      // iOS permission handling
      const result = await request(PERMISSIONS.IOS.CAMERA);
      if (result === RESULTS.GRANTED) {
        setHasCameraPermission(true);
      } else {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to capture receipts',
        );
      }
    }
  };

  const captureImage = () => {
    if (!hasCameraPermission) {
      Alert.alert(
        'Permission Required',
        'Please grant camera permission to use this feature',
      );
      return;
    }

    console.log('Attempting to capture image with camera');
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchCamera(options, response => {
      console.log('Camera response received:', response);
      if (response.didCancel) {
        console.log('User cancelled camera');
      } else if (response.error) {
        console.log('Camera Error: ', response.error);
        Alert.alert('Error', 'Failed to capture image');
      } else {
        const uri = response.assets?.[0]?.uri;
        console.log('Image captured successfully:', uri);
        if (uri) {
          setImageUri(uri);
        }
      }
    });
  };

  const selectFromGallery = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1000,
      maxHeight: 1000,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', 'Failed to select image');
      } else {
        const uri = response.assets?.[0]?.uri;
        if (uri) {
          setImageUri(uri);
        }
      }
    });
  };

  const processOCR = async () => {
    if (!imageUri) {
      Alert.alert('Error', 'Please capture or select an image first');
      return;
    }

    console.log('Starting OCR processing for image:', imageUri);
    setIsProcessing(true);
    try {
      // Compress the image before processing to optimize file size
      console.log('Compressing image for optimized processing...');
      const compressedImageUri = await compressImage(imageUri, {
        quality: 0.8,
        maxWidth: 1000,
        maxHeight: 1000,
        imageType: 'receipt'
      });
      
      console.log('Image compressed successfully:', compressedImageUri);
      
      // Simulate OCR processing
      // In a real implementation, you would use an OCR library like react-native-mlkit
      // or call your backend API to process the image
      console.log('Simulating OCR processing delay...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR result
      const mockOCRResult = {
        amount: '$42.50',
        date: '2023-06-15',
        merchant: 'Starbucks',
        items: [
          {name: 'Coffee', price: '$3.50'},
          {name: 'Pastry', price: '$2.75'},
          {name: 'Tax', price: '$0.33'},
        ],
      };
      
      console.log('OCR processing completed, navigating to review screen');
      // Navigate to OCR review screen with the result
      navigation.navigate('OCRReview', {imageUri: compressedImageUri, ocrResult: mockOCRResult});
    } catch (error) {
      console.error('OCR Processing Error:', error);
      Alert.alert('Error', `Failed to process image: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
    imagePreview: {
      width: 300,
      height: 300,
      resizeMode: 'contain',
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 20,
    },
    bottomButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 15,
      margin: 5,
      alignItems: 'center',
      flex: 1,
    },
    secondaryButton: {
      backgroundColor: theme.colors.secondary,
    },
    bottomButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    processingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    processingText: {
      fontSize: 18,
      color: theme.colors.text,
      marginTop: 20,
    },
  });

  if (isProcessing) {
    return (
      <View style={[styles.container, styles.processingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.processingText}>Processing receipt...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        {imageUri ? (
          <Image source={{uri: imageUri}} style={styles.imagePreview} />
        ) : (
          <Text style={styles.placeholderText}>
            Capture or select an image to process
          </Text>
        )}
      </View>

      <CameraPreview
        onCapture={captureImage}
        onGallery={selectFromGallery}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.bottomButton, styles.secondaryButton]}
          onPress={() => navigation.navigate('Receipts', {screen: 'Gallery'})}
        >
          <Text style={styles.bottomButtonText}>Gallery</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomButton}
          onPress={processOCR}
          disabled={!imageUri || isProcessing}
        >
          <Text style={styles.bottomButtonText}>
            {imageUri ? 'Process Receipt' : 'Process Image'}
          </Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </View>
  );
};

export default CameraScreen;