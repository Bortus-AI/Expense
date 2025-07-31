import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';
import {useOfflineReceipts} from '../../hooks/useOfflineReceipts';
import Toast from 'react-native-toast-message';

const ReceiptEditScreen = ({route, navigation}) => {
  const {receipt} = route.params || {};
  const {theme} = useTheme();
  const {saveReceipt, updateReceipt, loading} = useOfflineReceipts();
  const [merchant, setMerchant] = useState(receipt?.merchant || '');
  const [date, setDate] = useState(receipt?.date || '');
  const [amount, setAmount] = useState(receipt?.amount || '');
  const [items, setItems] = useState(receipt?.items || []);

  const handleSave = async () => {
    if (!merchant || !date || !amount) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      const receiptData = {
        merchant,
        date,
        amount: parseFloat(amount) || 0,
        items,
        status: 'pending',
        isSynced: false,
      };

      if (receipt && receipt.id) {
        // Update existing receipt
        await updateReceipt(receipt.id, receiptData);
      } else {
        // Create new receipt
        await saveReceipt(receiptData);
      }

      // Show success message and navigate back
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Receipt saved successfully!',
      });
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving receipt:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save receipt',
      });
    }
  };

  const handleAddItem = () => {
    setItems([...items, {name: '', price: ''}]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

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
    },
    formContainer: {
      padding: 20,
    },
    input: {
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 15,
      marginBottom: 15,
      fontSize: 16,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    label: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginTop: 20,
      marginBottom: 15,
    },
    itemRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    itemInput: {
      flex: 1,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      color: theme.colors.text,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginRight: 10,
    },
    removeButton: {
      backgroundColor: theme.colors.error,
      borderRadius: 8,
      padding: 10,
      justifyContent: 'center',
    },
    removeButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
    },
    addButton: {
      backgroundColor: theme.colors.secondary,
      borderRadius: 8,
      padding: 15,
      alignItems: 'center',
      marginTop: 10,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    saveButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      padding: 15,
      margin: 20,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Edit Receipt</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.label}>Merchant</Text>
        <TextInput
          style={styles.input}
          value={merchant}
          onChangeText={setMerchant}
          placeholder="Enter merchant name"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={theme.colors.textSecondary}
        />

        <Text style={styles.label}>Amount</Text>
        <TextInput
          style={styles.input}
          value={amount}
          onChangeText={setAmount}
          placeholder="$0.00"
          placeholderTextColor={theme.colors.textSecondary}
          keyboardType="decimal-pad"
        />

        <Text style={styles.sectionTitle}>Items</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <TextInput
              style={styles.itemInput}
              value={item.name}
              onChangeText={(value) => handleItemChange(index, 'name', value)}
              placeholder="Item name"
              placeholderTextColor={theme.colors.textSecondary}
            />
            <TextInput
              style={styles.itemInput}
              value={item.price}
              onChangeText={(value) => handleItemChange(index, 'price', value)}
              placeholder="$0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => handleRemoveItem(index)}>
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.addButton} onPress={handleAddItem}>
          <Text style={styles.addButtonText}>Add Item</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
          <Text style={styles.saveButtonText}>
            {loading ? 'Saving...' : 'Save Receipt'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ReceiptEditScreen;