import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {launchImageLibrary} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Button from '../../components/common/Button';
import {requestStoragePermission} from '../../utils/permissions';
import {compressImage} from '../../utils/imageCompression';
import {COLORS, MESSAGES} from '../../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const {width} = Dimensions.get('window');

const GalleryScreen = ({navigation}) => {
  const [selectedImages, setSelectedImages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadQueue, setUploadQueue] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [hasStoragePermission, setHasStoragePermission] = useState(false);
  const [cachedThumbnails, setCachedThumbnails] = useState({});
  const {theme} = useTheme();

  useEffect(() => {
    requestStoragePermissionHandler();
  }, []);

  const requestStoragePermissionHandler = async () => {
    const hasPermission = await requestStoragePermission();
    setHasStoragePermission(hasPermission);
    if (!hasPermission) {
      Alert.alert('Permission Required', MESSAGES.STORAGE_PERMISSION_DENIED);
    }
  };

  const selectFromGallery = async () => {
    if (!hasStoragePermission) {
      Alert.alert('Permission Required', MESSAGES.STORAGE_PERMISSION_DENIED);
      return;
    }

    const options = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 10, // Allow multiple selection
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.error) {
        console.log('ImagePicker Error: ', response.error);
        Alert.alert('Error', MESSAGES.IMAGE_SELECT_ERROR);
      } else {
        const assets = response.assets || [];
        const validAssets = assets.filter(asset => asset.uri);
        
        // Validate file types and sizes
        const validatedAssets = validAssets.filter(asset => {
          const fileType = asset.fileName?.split('.').pop().toLowerCase();
          const validTypes = ['jpg', 'jpeg', 'png', 'pdf'];
          const maxSize = 10 * 1024 * 1024; // 10MB limit
          
          if (!validTypes.includes(fileType)) {
            Alert.alert('Invalid File Type', 'Only JPEG, PNG, and PDF files are allowed');
            return false;
          }
          
          if (asset.fileSize > maxSize) {
            Alert.alert('File Too Large', 'File size exceeds 10MB limit');
            return false;
          }
          
          return true;
        });
        
        // Add to selected images
        const newImages = validatedAssets.map(asset => ({
          id: asset.uri,
          uri: asset.uri,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          isSelected: false,
        }));
        
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    });
  };

  const selectFromFileSystem = async () => {
    if (!hasStoragePermission) {
      Alert.alert('Permission Required', MESSAGES.STORAGE_PERMISSION_DENIED);
      return;
    }

    // For file system browsing, we can use the same image picker but with different options
    const options = {
      mediaType: 'any', // Allow any file type for file system browsing
      quality: 0.8,
      selectionLimit: 10, // Allow multiple selection
      includeBase64: false,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel) {
        console.log('User cancelled file picker');
      } else if (response.error) {
        console.log('FilePicker Error: ', response.error);
        Alert.alert('Error', MESSAGES.IMAGE_SELECT_ERROR);
      } else {
        const assets = response.assets || [];
        const validAssets = assets.filter(asset => asset.uri);
        
        // Validate file types and sizes
        const validatedAssets = validAssets.filter(asset => {
          const fileType = asset.fileName?.split('.').pop().toLowerCase();
          const validTypes = ['jpg', 'jpeg', 'png', 'pdf'];
          const maxSize = 10 * 1024 * 1024; // 10MB limit
          
          if (!validTypes.includes(fileType)) {
            Alert.alert('Invalid File Type', 'Only JPEG, PNG, and PDF files are allowed');
            return false;
          }
          
          if (asset.fileSize > maxSize) {
            Alert.alert('File Too Large', 'File size exceeds 10MB limit');
            return false;
          }
          
          return true;
        });
        
        // Add to selected images
        const newImages = validatedAssets.map(asset => ({
          id: asset.uri,
          uri: asset.uri,
          fileName: asset.fileName,
          fileSize: asset.fileSize,
          type: asset.type,
          width: asset.width,
          height: asset.height,
          isSelected: false,
        }));
        
        setSelectedImages(prev => [...prev, ...newImages]);
      }
    });
  };

  const selectFromCloudStorage = async () => {
    // Placeholder for cloud storage integration
    // In a real implementation, you would integrate with services like Google Drive, Dropbox, etc.
    Alert.alert(
      'Cloud Storage Integration',
      'Cloud storage integration would be implemented here. For now, please use the gallery or file system options.',
      [{text: 'OK'}]
    );
  };

  const toggleImageSelection = (imageId) => {
    setSelectedImages(prev => prev.map(img => 
      img.id === imageId ? {...img, isSelected: !img.isSelected} : img
    ));
  };

  const selectAllImages = () => {
    setSelectedImages(prev => prev.map(img => ({...img, isSelected: true})));
  };

  const deselectAllImages = () => {
    setSelectedImages(prev => prev.map(img => ({...img, isSelected: false})));
  };

  const removeSelectedImages = () => {
    setSelectedImages(prev => prev.filter(img => !img.isSelected));
  };

  const cacheThumbnail = async (imageUri, thumbnailUri) => {
    try {
      const cacheKey = `thumbnail_${imageUri}`;
      await AsyncStorage.setItem(cacheKey, thumbnailUri);
      setCachedThumbnails(prev => ({
        ...prev,
        [imageUri]: thumbnailUri,
      }));
    } catch (error) {
      console.warn('Failed to cache thumbnail:', error);
    }
  };

  const getCachedThumbnail = async (imageUri) => {
    try {
      // Check memory cache first
      if (cachedThumbnails[imageUri]) {
        return cachedThumbnails[imageUri];
      }
      
      // Check AsyncStorage
      const cacheKey = `thumbnail_${imageUri}`;
      const cachedUri = await AsyncStorage.getItem(cacheKey);
      if (cachedUri) {
        setCachedThumbnails(prev => ({
          ...prev,
          [imageUri]: cachedUri,
        }));
        return cachedUri;
      }
      
      return null;
    } catch (error) {
      console.warn('Failed to get cached thumbnail:', error);
      return null;
    }
  };

  const compressReceiptImage = async (imageUri) => {
    // Use our utility function for compression
    return await compressImage(imageUri);
  };

  const uploadImage = async (image) => {
    // Simulate upload process
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/failure
        if (Math.random() > 0.2) {
          resolve({success: true, imageUrl: 'https://example.com/uploaded-image.jpg'});
        } else {
          reject(new Error('Upload failed'));
        }
      }, 2000);
    });
  };

  const processUploadQueue = async () => {
    if (selectedImages.filter(img => img.isSelected).length === 0) {
      Alert.alert('No Images Selected', 'Please select at least one image to upload');
      return;
    }

    setIsProcessing(true);
    
    // Get selected images
    const imagesToUpload = selectedImages.filter(img => img.isSelected);
    
    // Initialize upload progress
    const initialProgress = {};
    imagesToUpload.forEach(img => {
      initialProgress[img.id] = {status: 'pending', progress: 0};
    });
    setUploadProgress(initialProgress);
    
    // Process uploads with retry mechanism
    const uploadPromises = imagesToUpload.map(async (image) => {
      let retries = 3;
      while (retries >= 0) {
        try {
          // Update progress to processing
          setUploadProgress(prev => ({
            ...prev,
            [image.id]: {status: 'processing', progress: 0}
          }));
          
          // Check for duplicates before uploading
          const isDuplicate = await checkDuplicate(image.uri);
          if (isDuplicate) {
            // Update progress to duplicate
            setUploadProgress(prev => ({
              ...prev,
              [image.id]: {status: 'duplicate', progress: 100}
            }));
            // Skip this image
            return {imageId: image.id, result: {duplicate: true}};
          }
          
          // Compress image if needed
          const compressedUri = await compressReceiptImage(image.uri);
          
          // Upload image
          const result = await uploadImage({...image, uri: compressedUri});
          
          // Update progress to success
          setUploadProgress(prev => ({
            ...prev,
            [image.id]: {status: 'success', progress: 100}
          }));
          
          return {imageId: image.id, result};
        } catch (error) {
          if (retries > 0) {
            retries--;
            // Update progress to retrying
            setUploadProgress(prev => ({
              ...prev,
              [image.id]: {status: 'retrying', progress: 0}
            }));
          } else {
            // Update progress to failed
            setUploadProgress(prev => ({
              ...prev,
              [image.id]: {status: 'failed', progress: 0}
            }));
            throw error;
          }
        }
      }
    });
    
    try {
      const results = await Promise.allSettled(uploadPromises);
      
      // Show results
      const successfulUploads = results.filter(result => result.status === 'fulfilled').length;
      const failedUploads = results.filter(result => result.status === 'rejected').length;
      
      if (failedUploads > 0) {
        Alert.alert(
          'Upload Complete',
          `${successfulUploads} receipts uploaded successfully, ${failedUploads} failed.`
        );
      } else {
        Alert.alert('Upload Complete', 'All receipts uploaded successfully!');
      }
      
      // Remove successfully uploaded images from selection
      const successfulImageIds = results
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value.imageId);
      
      setSelectedImages(prev => prev.filter(img => !successfulImageIds.includes(img.id)));
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Error', 'An error occurred during upload. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processSelectedOCR = async () => {
    if (selectedImages.filter(img => img.isSelected).length === 0) {
      Alert.alert('No Images Selected', 'Please select at least one image to process');
      return;
    }

    // For now, we'll just process the first selected image
    // In a real implementation, you might want to process all selected images
    // or allow the user to select which one to process
    const selectedImage = selectedImages.find(img => img.isSelected);
    
    if (selectedImage) {
      // Navigate to OCR review screen with the selected image
      // This assumes you have an OCR processing function similar to the CameraScreen
      navigation.navigate('Camera', {
        screen: 'OCRReview',
        params: {
          imageUri: selectedImage.uri,
          ocrResult: {
            amount: '$0.00',
            date: new Date().toISOString().split('T')[0],
            merchant: 'Unknown',
            items: [],
          },
        },
      });
    }
  };

  const checkDuplicate = async (imageUri) => {
    // In a real implementation, you would check against existing receipts
    // For now, we'll just return false
    // This could be implemented by:
    // 1. Hashing the image file content
    // 2. Checking the hash against a database of already uploaded receipts
    // 3. Returning true if a duplicate is found
    
    // Mock implementation - in a real app, you would:
    // - Generate a hash of the image file
    // - Query your backend/database for existing receipts with the same hash
    // - Return true if found, false otherwise
    
    console.log('Checking for duplicate:', imageUri);
    return false; // Always return false for this mock implementation
  };

  const renderImageItem = ({item}) => {
    const progress = uploadProgress[item.id] || {status: 'pending', progress: 0};
    
    // For lazy loading, we can use a lower quality thumbnail initially
    // and load the full image when needed
    const imageSource = {uri: item.uri};
    
    return (
      <TouchableOpacity
        style={[
          styles.imageContainer,
          item.isSelected && styles.selectedImageContainer,
          progress.status === 'processing' && styles.processingImageContainer,
          progress.status === 'success' && styles.successImageContainer,
          progress.status === 'failed' && styles.failedImageContainer,
        ]}
        onPress={() => toggleImageSelection(item.id)}
        accessibilityLabel={`Receipt image ${item.fileName || 'unknown'}`}
        accessibilityHint="Double-tap to select or deselect this receipt image"
        accessibilityRole="image"
      >
        <Image
          source={imageSource}
          style={styles.image}
          resizeMode="cover"
          // Add lazy loading props
          fadeDuration={300}
        />
        <View style={styles.imageOverlay}>
          {item.isSelected && (
            <View style={styles.checkmarkContainer}>
              <Icon name="check-circle" size={24} color={COLORS.SUCCESS} />
            </View>
          )}
          {progress.status === 'processing' && (
            <View style={styles.progressContainer}>
              <ActivityIndicator size="small" color="#FFFFFF" />
            </View>
          )}
          {progress.status === 'success' && (
            <View style={styles.successContainer}>
              <Icon name="check" size={24} color="#FFFFFF" />
            </View>
          )}
          {progress.status === 'failed' && (
            <View style={styles.failedContainer}>
              <Icon name="error" size={24} color="#FFFFFF" />
            </View>
          )}
          {progress.status === 'duplicate' && (
            <View style={styles.duplicateContainer}>
              <Icon name="content-copy" size={24} color="#FFFFFF" />
            </View>
          )}
        </View>
        <View style={styles.imageInfo}>
          <Text style={styles.imageName} numberOfLines={1}>
            {item.fileName || 'Unknown'}
          </Text>
          <Text style={styles.imageSize}>
            {item.fileSize ? `${(item.fileSize / 1024 / 1024).toFixed(2)} MB` : 'Unknown size'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSelectedCount = () => {
    const selectedCount = selectedImages.filter(img => img.isSelected).length;
    return (
      <View style={styles.selectedCountContainer}>
        <Text style={styles.selectedCountText}>
          {selectedCount} of {selectedImages.length} selected
        </Text>
      </View>
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
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    content: {
      flex: 1,
      padding: 10,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: 10,
      marginBottom: 10,
    },
    actionButton: {
      flex: 1,
      marginHorizontal: 5,
    },
    imageGrid: {
      flex: 1,
    },
    imageContainer: {
      width: (width - 30) / 3,
      height: (width - 30) / 3,
      margin: 5,
      borderRadius: 8,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    selectedImageContainer: {
      borderColor: theme.colors.primary,
    },
    processingImageContainer: {
      opacity: 0.7,
    },
    successImageContainer: {
      borderColor: COLORS.SUCCESS,
    },
    failedImageContainer: {
      borderColor: COLORS.ERROR,
    },
    image: {
      width: '100%',
      height: '100%',
      resizeMode: 'cover',
    },
    imageOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      padding: 5,
    },
    checkmarkContainer: {
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 12,
    },
    progressContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 12,
      padding: 2,
    },
    successContainer: {
      backgroundColor: COLORS.SUCCESS,
      borderRadius: 12,
      padding: 2,
    },
    failedContainer: {
      backgroundColor: COLORS.ERROR,
      borderRadius: 12,
      padding: 2,
    },
    duplicateContainer: {
      backgroundColor: COLORS.WARNING,
      borderRadius: 12,
      padding: 2,
    },
    imageInfo: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 5,
    },
    imageName: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
    },
    imageSize: {
      color: '#CCCCCC',
      fontSize: 8,
    },
    selectedCountContainer: {
      padding: 10,
      alignItems: 'center',
    },
    selectedCountText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: 'bold',
    },
    processingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    processingText: {
      color: '#FFFFFF',
      fontSize: 18,
      marginTop: 10,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText} accessibilityRole="header">Receipt Gallery</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Gallery"
          onPress={selectFromGallery}
          style={styles.actionButton}
          disabled={isProcessing}
          accessibilityLabel="Select images from gallery"
          accessibilityHint="Opens gallery to select receipt images"
        />
        <Button
          title="Files"
          onPress={selectFromFileSystem}
          style={styles.actionButton}
          disabled={isProcessing}
          accessibilityLabel="Select files from file system"
          accessibilityHint="Opens file system to select receipt files"
        />
        <Button
          title="Cloud"
          onPress={selectFromCloudStorage}
          style={styles.actionButton}
          disabled={isProcessing}
          accessibilityLabel="Select files from cloud storage"
          accessibilityHint="Opens cloud storage to select receipt files"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Upload Selected"
          onPress={processUploadQueue}
          style={styles.actionButton}
          disabled={isProcessing || selectedImages.filter(img => img.isSelected).length === 0}
          accessibilityLabel="Upload selected images"
          accessibilityHint="Uploads selected receipt images to the server"
        />
        <Button
          title="Process OCR"
          onPress={processSelectedOCR}
          style={styles.actionButton}
          disabled={isProcessing || selectedImages.filter(img => img.isSelected).length === 0}
          accessibilityLabel="Process OCR on selected images"
          accessibilityHint="Processes OCR on selected receipt images"
        />
        <Button
          title="Select All"
          onPress={selectAllImages}
          style={styles.actionButton}
          disabled={isProcessing || selectedImages.length === 0}
          accessibilityLabel="Select all images"
          accessibilityHint="Selects all receipt images"
        />
      </View>
      
      <View style={styles.buttonContainer}>
        <Button
          title="Clear"
          onPress={removeSelectedImages}
          style={styles.actionButton}
          disabled={isProcessing || selectedImages.filter(img => img.isSelected).length === 0}
          accessibilityLabel="Clear selected images"
          accessibilityHint="Removes selected receipt images"
        />
        <Button
          title="Deselect All"
          onPress={deselectAllImages}
          style={styles.actionButton}
          disabled={isProcessing || selectedImages.filter(img => img.isSelected).length === 0}
          accessibilityLabel="Deselect all images"
          accessibilityHint="Deselects all receipt images"
        />
        <View style={styles.actionButton} />
      </View>
      
      {selectedImages.length > 0 && renderSelectedCount()}
      
      {selectedImages.length > 0 ? (
        <FlatList
          data={selectedImages}
          renderItem={renderImageItem}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.imageGrid}
        />
      ) : (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20}}>
          <Icon name="photo-library" size={64} color={theme.colors.textSecondary} />
          <Text style={{fontSize: 18, color: theme.colors.textSecondary, marginTop: 20, textAlign: 'center'}}>
            No images selected. Tap "Gallery", "Files", or "Cloud" to choose receipts.
          </Text>
        </View>
      )}
      
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.processingText}>Processing uploads...</Text>
        </View>
      )}
      
      <Toast />
    </View>
  );
};

export default GalleryScreen;