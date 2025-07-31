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

const ReceiptDetailScreen = ({route}) => {
  const {receipt} = route.params;
  const {theme} = useTheme();

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
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    label: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    value: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 10,
    },
    itemsContainer: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 15,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
    },
    itemLabel: {
      fontSize: 14,
      color: theme.colors.text,
    },
    itemValue: {
      fontSize: 14,
      color: theme.colors.text,
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

  // Mock items data
  const items = [
    {name: 'Coffee', price: '$3.50'},
    {name: 'Pastry', price: '$2.75'},
    {name: 'Tax', price: '$0.33'},
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{uri: receipt.imageUri}} style={styles.receiptImage} />
      </View>

      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Merchant:</Text>
          <Text style={styles.value}>{receipt.merchant}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{receipt.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>{receipt.amount}</Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.itemsContainer}>
          {items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <Text style={styles.itemLabel}>{item.name}</Text>
              <Text style={styles.itemValue}>{item.price}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
          <Text style={styles.buttonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Save</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ReceiptDetailScreen;