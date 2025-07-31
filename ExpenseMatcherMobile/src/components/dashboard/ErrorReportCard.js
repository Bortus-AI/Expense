import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card, Button } from 'react-native-paper';
import { COLORS } from '../../constants';

const ErrorReportCard = ({ title, errors, onClearErrors, style }) => {
  const renderErrorItem = ({ item }) => (
    <View style={styles.errorItem}>
      <View style={styles.errorHeader}>
        <Text style={styles.errorType}>{item.error.split(':')[0] || 'Unknown Error'}</Text>
        <Text style={styles.errorTimestamp}>{new Date(item.timestamp).toLocaleString()}</Text>
      </View>
      <Text style={styles.errorMessage} numberOfLines={2}>{item.error}</Text>
      {item.context && Object.keys(item.context).length > 0 && (
        <View style={styles.contextContainer}>
          <Text style={styles.contextLabel}>Context:</Text>
          {Object.entries(item.context).map(([key, value]) => (
            <Text key={key} style={styles.contextItem}>
              {key}: {JSON.stringify(value)}
            </Text>
          ))}
        </View>
      )}
    </View>
  );

  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {errors.length > 0 && (
            <Button 
              mode="outlined" 
              onPress={onClearErrors}
              compact
              textColor={COLORS.ERROR}
            >
              Clear All
            </Button>
          )}
        </View>
        {errors.length > 0 ? (
          <FlatList
            data={errors}
            renderItem={renderErrorItem}
            keyExtractor={(item, index) => index.toString()}
            style={styles.errorList}
          />
        ) : (
          <Text style={styles.noErrors}>No errors to display</Text>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  errorList: {
    maxHeight: 300,
  },
  errorItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  errorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  errorType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.ERROR,
  },
  errorTimestamp: {
    fontSize: 12,
    color: '#999',
  },
  errorMessage: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  contextContainer: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
  },
  contextLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  contextItem: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  noErrors: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    padding: 16,
  },
});

export default ErrorReportCard;