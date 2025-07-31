import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import OCRResult from '../../components/specific/OCRResult';

const OCRReviewScreen = ({route, navigation}) => {
  const {imageUri, ocrResult} = route.params;
  const {theme} = useTheme();

  const handleSaveReceipt = () => {
    console.log('Saving receipt to backend');
    // In a real app, you would save the receipt to your backend
    alert('Receipt saved successfully!');
    navigation.navigate('Receipts');
  };

  const handleEditData = () => {
    // Allow user to edit the extracted data
    alert('Edit functionality would go here');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      resizeMode: 'contain',
      marginBottom: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 20,
    },
    button: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 15,
      marginHorizontal: 10,
      alignItems: 'center',
    },
    secondaryButton: {
      backgroundColor: theme.colors.secondary,
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Image source={{uri: imageUri}} style={styles.imagePreview} />
      
      <OCRResult data={ocrResult} style={{padding: 20}} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleEditData}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleSaveReceipt}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default OCRReviewScreen;