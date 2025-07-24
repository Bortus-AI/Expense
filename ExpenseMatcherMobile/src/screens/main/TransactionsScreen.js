import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const TransactionsScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>💳 Transactions</Text>
      <Text style={styles.subtitle}>Transaction list coming soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default TransactionsScreen; 