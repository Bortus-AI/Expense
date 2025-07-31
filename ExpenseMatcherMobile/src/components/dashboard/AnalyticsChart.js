import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { COLORS } from '../../constants';

// Simple bar chart component for analytics data
const BarChart = ({ data, style }) => {
  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(item => item.value), 1);
  
  return (
    <View style={[styles.chartContainer, style]}>
      {data.map((item, index) => (
        <View key={index} style={styles.barContainer}>
          <View style={styles.barWrapper}>
            <View 
              style={[
                styles.bar, 
                { 
                  height: `${(item.value / maxValue) * 100}%`,
                  backgroundColor: item.color || COLORS.PRIMARY
                }
              ]} 
            />
          </View>
          <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
          <Text style={styles.barValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

const AnalyticsChart = ({ title, chartData, style }) => {
  return (
    <Card style={[styles.card, style]}>
      <Card.Content>
        <Text style={styles.title}>{title}</Text>
        <BarChart data={chartData} />
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
    marginBottom: 16,
    color: COLORS.PRIMARY,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 200,
    marginVertical: 16,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  barLabel: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    color: '#666',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 4,
    color: '#333',
  },
});

export default AnalyticsChart;