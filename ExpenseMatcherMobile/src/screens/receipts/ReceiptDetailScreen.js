import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import { trackScreenView, trackButtonClick } from '../../services/analyticsService';

const ReceiptDetailScreen = ({route}) => {
  const {receipt} = route.params;
  const {theme} = useTheme();
  
  // Track screen view when component mounts
  React.useEffect(() => {
    trackScreenView('ReceiptDetailScreen', { receiptId: receipt.id });
  }, [receipt.id]);

  const handleEditPress = () => {
    trackButtonClick('EditReceipt', 'ReceiptDetailScreen', { receiptId: receipt.id });
    // Navigation logic would go here
    Alert.alert('Edit', 'Edit functionality would be implemented here');
  };

  const handleDeletePress = () => {
    trackButtonClick('DeleteReceipt', 'ReceiptDetailScreen', { receiptId: receipt.id });
    // Delete logic would go here
    Alert.alert('Delete', 'Delete functionality would be implemented here');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    imageContainer: {
      alignItems: 'center',
      padding: 20,
    },
    receiptImage: {
      width: 200,
      height: 200,
      resizeMode: 'contain',
      borderRadius: 8,
    },
    detailsContainer: {
      padding: 20,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    label: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    value: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      padding: 20,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 15,
      marginHorizontal: 10,
      alignItems: 'center',
      flex: 1,
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
      <View style={styles.imageContainer}>
        <Image source={{uri: receipt.imageUri}} style={styles.receiptImage} />
      </View>
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Merchant:</Text>
          <Text style={styles.value}>{receipt.merchant || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{receipt.date || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>{receipt.amount || 'N/A'}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Category:</Text>
          <Text style={styles.value}>{receipt.category || 'N/A'}</Text>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleEditPress}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleDeletePress}>
          <Text style={styles.buttonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ReceiptDetailScreen;