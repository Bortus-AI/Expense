import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { launchImagePicker, launchCamera } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const CameraScreen = ({ navigation }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [uploading, setUploading] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const { uploadReceipt } = useAuth();

  const checkCameraPermission = async () => {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.CAMERA 
      : PERMISSIONS.ANDROID.CAMERA;
    
    const result = await check(permission);
    if (result === RESULTS.DENIED) {
      const requestResult = await request(permission);
      return requestResult === RESULTS.GRANTED;
    }
    return result === RESULTS.GRANTED;
  };

  const imagePickerOptions = {
    mediaType: 'photo',
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1920,
    includeBase64: false,
    storageOptions: {
      skipBackup: true,
      path: 'images',
    },
  };

  const handleTakePhoto = useCallback(async () => {
    const hasPermission = await checkCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Camera Permission Required',
        'Please grant camera permission to capture receipts.',
        [{ text: 'OK' }]
      );
      return;
    }

    launchCamera(imagePickerOptions, (response) => {
      if (response.didCancel || response.error) {
        return;
      }
      
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'receipt.jpg',
          size: asset.fileSize,
        });
        
        // Auto-process with OCR for amount extraction
        processImageWithOCR(asset);
      }
    });
  }, []);

  const handleSelectFromGallery = useCallback(() => {
    launchImagePicker(imagePickerOptions, (response) => {
      if (response.didCancel || response.error) {
        return;
      }
      
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedImage({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'receipt.jpg',
          size: asset.fileSize,
        });
        
        // Auto-process with OCR for amount extraction
        processImageWithOCR(asset);
      }
    });
  }, []);

  const processImageWithOCR = async (asset) => {
    setProcessingOCR(true);
    try {
      // Here you would integrate with your OCR service
      // For now, we'll simulate OCR processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock OCR results - in real implementation, this would come from your OCR service
      const mockOCRResults = {
        amount: '25.99',
        merchant: 'Sample Store',
        date: new Date().toISOString().split('T')[0],
      };
      
      setAmount(mockOCRResults.amount);
      setDescription(`Receipt from ${mockOCRResults.merchant}`);
      
      Toast.show({
        type: 'success',
        text1: 'OCR Processing Complete',
        text2: 'Amount and details extracted from receipt',
      });
    } catch (error) {
      console.error('OCR processing error:', error);
      Toast.show({
        type: 'info',
        text1: 'OCR Processing',
        text2: 'Please enter details manually',
      });
    } finally {
      setProcessingOCR(false);
    }
  };

  const handleUploadReceipt = async () => {
    if (!selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    if (!amount.trim()) {
      Alert.alert('Error', 'Please enter the receipt amount');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('receipt', {
        uri: selectedImage.uri,
        type: selectedImage.type,
        name: selectedImage.name,
      });
      formData.append('amount', amount.trim());
      formData.append('description', description.trim() || 'Mobile Receipt Upload');

      await uploadReceipt(formData);
      
      Toast.show({
        type: 'success',
        text1: 'Receipt Uploaded',
        text2: 'Receipt has been successfully uploaded and processed',
      });

      // Reset form
      setSelectedImage(null);
      setDescription('');
      setAmount('');
      
      // Navigate back to receipts or dashboard
      navigation.navigate('Receipts');
    } catch (error) {
      console.error('Upload error:', error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.message || 'Failed to upload receipt',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setDescription('');
    setAmount('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {!selectedImage ? (
        <View style={styles.captureContainer}>
          <View style={styles.iconContainer}>
            <Text style={styles.cameraIcon}>📷</Text>
          </View>
          
          <Text style={styles.title}>Capture Receipt</Text>
          <Text style={styles.subtitle}>
            Take a photo of your receipt or select from gallery
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={handleTakePhoto}
            >
              <Text style={styles.primaryButtonText}>📷 Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleSelectFromGallery}
            >
              <Text style={styles.secondaryButtonText}>🖼️ From Gallery</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.reviewContainer}>
          <Text style={styles.reviewTitle}>Review Receipt</Text>
          
          <View style={styles.imageContainer}>
            <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
            {processingOCR && (
              <View style={styles.ocrOverlay}>
                <ActivityIndicator size="large" color="#667eea" />
                <Text style={styles.ocrText}>Processing with OCR...</Text>
              </View>
            )}
          </View>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Amount *</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Enter receipt description (optional)"
                multiline
                numberOfLines={3}
                returnKeyType="done"
              />
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={handleRetake}
                disabled={uploading}
              >
                <Text style={styles.secondaryButtonText}>📷 Retake</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.primaryButton, uploading && styles.disabledButton]}
                onPress={handleUploadReceipt}
                disabled={uploading || !amount.trim()}
              >
                {uploading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>📤 Upload</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    flexGrow: 1,
  },
  captureContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f4f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  cameraIcon: {
    fontSize: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3748',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#718096',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: 30,
  },
  actionButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: '#718096',
    fontSize: 16,
    fontWeight: '500',
  },
  reviewContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 20,
  },
  reviewTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  previewImage: {
    width: width - 40,
    height: (width - 40) * 1.2,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  ocrOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ocrText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 10,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3748',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#ffffff',
    color: '#2d3748',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default CameraScreen; 