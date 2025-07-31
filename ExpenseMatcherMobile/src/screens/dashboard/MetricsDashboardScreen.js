import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import PerformanceMetricsCard from '../../components/dashboard/PerformanceMetricsCard';
import AnalyticsChart from '../../components/dashboard/AnalyticsChart';
import ErrorReportCard from '../../components/dashboard/ErrorReportCard';
import { 
  getPerformanceMetricsSummary, 
  getUserEngagementAnalytics, 
  getErrorAnalytics 
} from '../../services/performanceMonitoringService';
import { getAnalyticsSummary } from '../../services/analyticsService';
import { COLORS } from '../../constants';

const MetricsDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [errorData, setErrorData] = useState({});

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // Get performance metrics
      const perfMetrics = getPerformanceMetricsSummary();
      setPerformanceMetrics(perfMetrics);
      
      // Get analytics data
      const analytics = getAnalyticsSummary();
      setAnalyticsData(analytics);
      
      // Get error data
      const errors = getErrorAnalytics();
      setErrorData(errors);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMetrics();
    setRefreshing(false);
  };

  const clearErrors = () => {
    // In a real implementation, you would clear errors from the database
    setErrorData({ totalErrors: 0, errorTypes: {}, recentErrors: [] });
  };

  // Prepare data for charts
  const prepareChartData = (data, labelKey, valueKey) => {
    return Object.entries(data).map(([key, value]) => ({
      label: key,
      value: value[valueKey] || value,
      color: COLORS.PRIMARY
    }));
  };

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.Content title="Performance Dashboard" />
      </Appbar.Header>
      <ScrollView 
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* API Response Times */}
        <PerformanceMetricsCard 
          title="API Response Times" 
          metrics={[
            { label: 'Average', value: `${performanceMetrics.api?.average?.toFixed(2) || 0}ms` },
            { label: 'Min', value: `${performanceMetrics.api?.min?.toFixed(2) || 0}ms` },
            { label: 'Max', value: `${performanceMetrics.api?.max?.toFixed(2) || 0}ms` },
            { label: 'Success Rate', value: `${performanceMetrics.api?.successRate?.toFixed(2) || 0}%` },
          ]}
        />
        
        {/* OCR Processing Times */}
        <PerformanceMetricsCard 
          title="OCR Processing Times" 
          metrics={[
            { label: 'Average', value: `${performanceMetrics.ocr?.average?.toFixed(2) || 0}ms` },
            { label: 'Min', value: `${performanceMetrics.ocr?.min?.toFixed(2) || 0}ms` },
            { label: 'Max', value: `${performanceMetrics.ocr?.max?.toFixed(2) || 0}ms` },
            { label: 'Accuracy', value: `${performanceMetrics.ocr?.accuracy?.toFixed(2) || 0}%` },
          ]}
        />
        
        {/* LLM Processing Times */}
        <PerformanceMetricsCard 
          title="LLM Processing Times" 
          metrics={[
            { label: 'Average', value: `${performanceMetrics.llm?.average?.toFixed(2) || 0}ms` },
            { label: 'Min', value: `${performanceMetrics.llm?.min?.toFixed(2) || 0}ms` },
            { label: 'Max', value: `${performanceMetrics.llm?.max?.toFixed(2) || 0}ms` },
            { label: 'Accuracy', value: `${performanceMetrics.llm?.accuracy?.toFixed(2) || 0}%` },
          ]}
        />
        
        {/* Sync Processing Times */}
        <PerformanceMetricsCard 
          title="Sync Processing Times" 
          metrics={[
            { label: 'Average', value: `${performanceMetrics.sync?.average?.toFixed(2) || 0}ms` },
            { label: 'Min', value: `${performanceMetrics.sync?.min?.toFixed(2) || 0}ms` },
            { label: 'Max', value: `${performanceMetrics.sync?.max?.toFixed(2) || 0}ms` },
            { label: 'Total Items', value: performanceMetrics.sync?.totalItems || 0 },
          ]}
        />
        
        {/* Feature Usage Chart */}
        <AnalyticsChart 
          title="Feature Usage" 
          chartData={prepareChartData(analyticsData.featureUsage || {}, 'feature', 'count')}
        />
        
        {/* Event Distribution Chart */}
        <AnalyticsChart 
          title="Event Distribution" 
          chartData={prepareChartData(analyticsData.eventDistribution || {}, 'event', '')}
        />
        
        {/* Error Report */}
        <ErrorReportCard 
          title="Recent Errors" 
          errors={errorData.recentErrors || []}
          onClearErrors={clearErrors}
        />
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Last updated: {new Date().toLocaleString()}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default MetricsDashboardScreen;