import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { COLORS } from '../../constants';

const AccuracyMetricsCard = ({ title, metrics, style }) => {
  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{metric.label}:</Text>
            <Text style={[styles.metricValue, 
              metric.value >= 0.9 ? styles.highAccuracy : 
              metric.value >= 0.7 ? styles.mediumAccuracy : 
              styles.lowAccuracy]}>
              {typeof metric.value === 'number' ? `${(metric.value * 100).toFixed(1)}%` : metric.value}
            </Text>
          </View>
        ))}
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
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: COLORS.PRIMARY,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  highAccuracy: {
    color: COLORS.SUCCESS, // Green for high accuracy
  },
  mediumAccuracy: {
    color: COLORS.WARNING, // Yellow for medium accuracy
  },
  lowAccuracy: {
    color: COLORS.ERROR, // Red for low accuracy
  },
});

export default AccuracyMetricsCard;