import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { COLORS } from '../../constants';

const RealTimeMonitoringCard = ({ title, metrics, style }) => {
  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
        {metrics.map((metric, index) => (
          <View key={index} style={styles.metricRow}>
            <Text style={styles.metricLabel}>{metric.label}:</Text>
            <Text style={[styles.metricValue, getMetricStyle(metric.value, metric.threshold)]}>
              {metric.value}
              {metric.unit ? ` ${metric.unit}` : ''}
            </Text>
          </View>
        ))}
      </Card.Content>
    </Card>
  );
};

// Helper function to determine metric style based on thresholds
const getMetricStyle = (value, threshold) => {
  if (!threshold) return styles.normalValue;
  
  if (value > threshold.critical) {
    return styles.criticalValue;
  } else if (value > threshold.warning) {
    return styles.warningValue;
  } else {
    return styles.normalValue;
  }
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
  normalValue: {
    color: COLORS.SUCCESS, // Green for normal values
  },
  warningValue: {
    color: COLORS.WARNING, // Yellow for warning values
  },
  criticalValue: {
    color: COLORS.ERROR, // Red for critical values
  },
});

export default RealTimeMonitoringCard;