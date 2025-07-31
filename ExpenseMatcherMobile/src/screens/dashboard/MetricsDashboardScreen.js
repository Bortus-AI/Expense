import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Appbar, Text } from 'react-native-paper';
import PerformanceMetricsCard from '../../components/dashboard/PerformanceMetricsCard';
import AnalyticsChart from '../../components/dashboard/AnalyticsChart';
import ErrorReportCard from '../../components/dashboard/ErrorReportCard';
import AccuracyMetricsCard from '../../components/dashboard/AccuracyMetricsCard';
import RealTimeMonitoringCard from '../../components/dashboard/RealTimeMonitoringCard';
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
  const [accuracyMetrics, setAccuracyMetrics] = useState({});
  const [realTimeMetrics, setRealTimeMetrics] = useState({});

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
      
      // Get accuracy metrics
      setAccuracyMetrics(analytics.accuracyMetrics || {});
      
      // Get real-time metrics
      setRealTimeMetrics(perfMetrics.realTime || {});
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

  // Prepare accuracy trend data
  const prepareAccuracyTrendData = () => {
    // This is a simplified example - in a real implementation, you would have historical data
    const trendData = [];
    if (accuracyMetrics.ocrAccuracyHistory && accuracyMetrics.ocrAccuracyHistory.length > 0) {
      accuracyMetrics.ocrAccuracyHistory.slice(-5).forEach((entry, index) => {
        trendData.push({
          label: `OCR ${index + 1}`,
          value: entry.accuracyScore * 100,
          color: COLORS.SUCCESS
        });
      });
    }
    if (accuracyMetrics.llmAccuracyHistory && accuracyMetrics.llmAccuracyHistory.length > 0) {
      accuracyMetrics.llmAccuracyHistory.slice(-5).forEach((entry, index) => {
        trendData.push({
          label: `LLM ${index + 1}`,
          value: entry.accuracyScore * 100,
          color: COLORS.INFO
        });
      });
    }
    return trendData;
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
        {/* Real-time Monitoring */}
        <RealTimeMonitoringCard 
          title="Real-time Monitoring" 
          metrics={[
            { label: 'Active Sessions', value: realTimeMetrics.activeSessions || 0 },
            { label: 'Processing Rate', value: realTimeMetrics.currentProcessingRate || 0, unit: 'items/min' },
            { label: 'Error Rate', value: realTimeMetrics.currentErrorRate?.toFixed(2) || 0, unit: '%', 
              threshold: { warning: 2, critical: 5 } }
          ]}
        />
        
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
        
        {/* Accuracy Metrics */}
        <AccuracyMetricsCard 
          title="Accuracy Metrics" 
          metrics={[
            { label: 'Overall Accuracy', value: accuracyMetrics.overallAccuracyScore || 0 },
            { label: 'OCR Trend', value: accuracyMetrics.ocrAccuracyTrend || 'N/A' },
            { label: 'LLM Trend', value: accuracyMetrics.llmAccuracyTrend || 'N/A' },
          ]}
        />
        
        {/* Accuracy Trend Chart */}
        <AnalyticsChart 
          title="Accuracy Trend" 
          chartData={prepareAccuracyTrendData()}
          chartType="line"
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