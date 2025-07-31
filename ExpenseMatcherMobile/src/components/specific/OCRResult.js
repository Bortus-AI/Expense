import React from 'react';
import {View, Text, StyleSheet, FlatList} from 'react-native';
import {useTheme} from '../../contexts/ThemeContext';

const OCRResult = ({data, style}) => {
  const {theme} = useTheme();

  const styles = StyleSheet.create({
    container: {
      ...style,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 10,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    label: {
      fontSize: 16,
      color: theme.colors.text,
      fontWeight: '500',
    },
    value: {
      fontSize: 16,
      color: theme.colors.text,
    },
    itemsContainer: {
      marginTop: 10,
    },
    itemRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 6,
    },
    itemLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    itemValue: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
  });

  const renderItem = ({item}) => (
    <View style={styles.itemRow}>
      <Text style={styles.itemLabel}>{item.name}</Text>
      <Text style={styles.itemValue}>{item.price}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Receipt Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Merchant:</Text>
          <Text style={styles.value}>{data.merchant}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{data.date}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Amount:</Text>
          <Text style={styles.value}>{data.amount}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Items</Text>
        <View style={styles.itemsContainer}>
          <FlatList
            data={data.items}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
          />
        </View>
      </View>
    </View>
  );
};

export default OCRResult;