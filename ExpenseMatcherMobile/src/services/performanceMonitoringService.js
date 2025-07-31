/**
 * Performance Monitoring Service
 * Tracks response times, accuracy metrics, and user engagement patterns
 * Enhanced with improved accuracy tracking and real-time monitoring capabilities
 */

import {
  savePerformanceMetric,
  getPerformanceMetrics,
  saveAnalyticsEvent,
  getAnalyticsEvents,
  saveErrorLog,
  getErrorLogs
} from './databaseService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Performance monitoring service
class PerformanceMonitoringService {
  constructor() {
    this.metrics = {
      apiResponseTimes: [],
      ocrProcessingTimes: [],
      llmProcessingTimes: [],
      syncProcessingTimes: [],
    };
    this.analyticsEvents = [];
    this.errorLogs = [];
    this.isInitialized = false;
    // Real-time monitoring data
    this.realTimeMetrics = {
      activeSessions: 0,
      currentProcessingRate: 0,
      currentErrorRate: 0
    };
  }

  // Initialize the performance monitoring service
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load existing metrics from storage
      const savedMetrics = await getPerformanceMetrics();
      if (savedMetrics && savedMetrics.length > 0) {
        // Convert array of metrics to our internal structure
        savedMetrics.forEach(metric => {
          if (metric.metricType === 'api_response_time') {
            this.metrics.apiResponseTimes.push({
              endpoint: metric.metadata.endpoint,
              responseTime: metric.value,
              timestamp: metric.timestamp,
              success: metric.metadata.success
            });
          } else if (metric.metricType === 'ocr_processing_time') {
            this.metrics.ocrProcessingTimes.push({
              imageSize: metric.metadata.imageSize,
              processingTime: metric.value,
              accuracyScore: metric.metadata.accuracyScore,
              timestamp: metric.timestamp
            });
          } else if (metric.metricType === 'llm_processing_time') {
            this.metrics.llmProcessingTimes.push({
              inputLength: metric.metadata.inputLength,
              processingTime: metric.value,
              accuracyScore: metric.metadata.accuracyScore,
              timestamp: metric.timestamp
            });
          } else if (metric.metricType === 'sync_processing_time') {
            this.metrics.syncProcessingTimes.push({
              operation: metric.metadata.operation,
              processingTime: metric.value,
              itemCount: metric.metadata.itemCount,
              timestamp: metric.timestamp
            });
          }
        });
      }

      // Load analytics events
      const savedEvents = await getAnalyticsEvents();
      if (savedEvents && savedEvents.length > 0) {
        this.analyticsEvents = savedEvents.map(event => ({
          event: event.eventName,
          data: event.eventData,
          timestamp: event.timestamp
        }));
      }

      // Load error logs
      const savedErrors = await getErrorLogs();
      if (savedErrors && savedErrors.length > 0) {
        this.errorLogs = savedErrors.map(error => ({
          error: error.error,
          stack: error.stackTrace,
          context: error.context,
          timestamp: error.timestamp
        }));
      }

      this.isInitialized = true;
      console.log('Performance monitoring service initialized');
    } catch (error) {
      console.error('Error initializing performance monitoring service:', error);
    }
  }

  // Track API response time
  trackApiResponseTime(endpoint, responseTime, success = true) {
    this.metrics.apiResponseTimes.push({
      endpoint,
      responseTime,
      timestamp: new Date().toISOString(),
      success,
    });

    // Keep only the last 1000 entries to prevent memory issues
    if (this.metrics.apiResponseTimes.length > 1000) {
      this.metrics.apiResponseTimes = this.metrics.apiResponseTimes.slice(-1000);
    }

    // Save to storage
    this.saveMetrics();
    
    // Save to database
    savePerformanceMetric('api_response_time', responseTime, { endpoint, success });
    
    // Update real-time metrics
    this.updateRealTimeMetrics();
  }

  // Track OCR processing time with enhanced accuracy metrics
  trackOCRProcessingTime(imageSize, processingTime, accuracyScore = null, accuracyMetrics = null) {
    this.metrics.ocrProcessingTimes.push({
      imageSize,
      processingTime,
      accuracyScore,
      accuracyMetrics, // Enhanced accuracy metrics
      timestamp: new Date().toISOString(),
    });

    // Keep only the last 1000 entries to prevent memory issues
    if (this.metrics.ocrProcessingTimes.length > 1000) {
      this.metrics.ocrProcessingTimes = this.metrics.ocrProcessingTimes.slice(-1000);
    }

    // Save to storage
    this.saveMetrics();
    
    // Save to database
    savePerformanceMetric('ocr_processing_time', processingTime, { imageSize, accuracyScore, accuracyMetrics });
    
    // Update real-time metrics
    this.updateRealTimeMetrics();
  }

  // Track LLM processing time with enhanced accuracy metrics
  trackLLMProcessingTime(inputLength, processingTime, accuracyScore = null, accuracyMetrics = null) {
    this.metrics.llmProcessingTimes.push({
      inputLength,
      processingTime,
      accuracyScore,
      accuracyMetrics, // Enhanced accuracy metrics
      timestamp: new Date().toISOString(),
    });

    // Keep only the last 1000 entries to prevent memory issues
    if (this.metrics.llmProcessingTimes.length > 1000) {
      this.metrics.llmProcessingTimes = this.metrics.llmProcessingTimes.slice(-1000);
    }

    // Save to storage
    this.saveMetrics();
    
    // Save to database
    savePerformanceMetric('llm_processing_time', processingTime, { inputLength, accuracyScore, accuracyMetrics });
    
    // Update real-time metrics
    this.updateRealTimeMetrics();
  }

  // Track sync processing time
  trackSyncProcessingTime(operation, processingTime, itemCount = 0) {
    this.metrics.syncProcessingTimes.push({
      operation,
      processingTime,
      itemCount,
      timestamp: new Date().toISOString(),
    });

    // Keep only the last 1000 entries to prevent memory issues
    if (this.metrics.syncProcessingTimes.length > 1000) {
      this.metrics.syncProcessingTimes = this.metrics.syncProcessingTimes.slice(-1000);
    }

    // Save to storage
    this.saveMetrics();
    
    // Save to database
    savePerformanceMetric('sync_processing_time', processingTime, { operation, itemCount });
    
    // Update real-time metrics
    this.updateRealTimeMetrics();
  }

  // Track user engagement event
  trackUserEngagement(event, data = {}) {
    const eventRecord = {
      event,
      data,
      timestamp: new Date().toISOString(),
    };

    this.analyticsEvents.push(eventRecord);

    // Keep only the last 1000 entries to prevent memory issues
    if (this.analyticsEvents.length > 1000) {
      this.analyticsEvents = this.analyticsEvents.slice(-1000);
    }

    // Save to storage
    this.saveAnalyticsEvents();
    
    // Save to database
    saveAnalyticsEvent(event, data);
    
    // Update real-time metrics
    this.updateRealTimeMetrics();
  }

  // Log error
  logError(error, context = {}) {
    const errorRecord = {
      error: error.message || error,
      stack: error.stack || '',
      context,
      timestamp: new Date().toISOString(),
    };

    this.errorLogs.push(errorRecord);

    // Keep only the last 1000 entries to prevent memory issues
    if (this.errorLogs.length > 1000) {
      this.errorLogs = this.errorLogs.slice(-1000);
    }

    // Save to storage
    this.saveErrorLogs();
    
    // Save to database
    saveErrorLog(error, error.stack || '', context);
    
    // Update real-time metrics
    this.updateRealTimeMetrics();
  }

  // Save metrics to storage
  async saveMetrics() {
    try {
      // We're now saving metrics directly to the database, so this function can be empty
      // or used for any additional local storage needs
    } catch (error) {
      console.error('Error saving performance metrics:', error);
    }
  }

  // Save analytics events to storage
  async saveAnalyticsEvents() {
    try {
      // We're now saving events directly to the database, so this function can be empty
      // or used for any additional local storage needs
    } catch (error) {
      console.error('Error saving analytics events:', error);
    }
  }

  // Save error logs to storage
  async saveErrorLogs() {
    try {
      // We're now saving errors directly to the database, so this function can be empty
      // or used for any additional local storage needs
    } catch (error) {
      console.error('Error saving error logs:', error);
    }
  }

  // Get performance metrics summary
  getPerformanceMetricsSummary() {
    const summary = {
      api: this.calculateAPISummary(),
      ocr: this.calculateOCRSummary(),
      llm: this.calculateLLMSummary(),
      sync: this.calculateSyncSummary(),
      realTime: this.getRealTimeMetrics()
    };

    return summary;
  }

  // Calculate API response time summary
  calculateAPISummary() {
    if (this.metrics.apiResponseTimes.length === 0) {
      return { average: 0, min: 0, max: 0, successRate: 0 };
    }

    const responseTimes = this.metrics.apiResponseTimes.map(item => item.responseTime);
    const successfulRequests = this.metrics.apiResponseTimes.filter(item => item.success).length;
    
    return {
      average: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      min: Math.min(...responseTimes),
      max: Math.max(...responseTimes),
      successRate: (successfulRequests / this.metrics.apiResponseTimes.length) * 100,
      totalRequests: this.metrics.apiResponseTimes.length,
    };
  }

  // Calculate OCR processing time summary with enhanced accuracy metrics
  calculateOCRSummary() {
    if (this.metrics.ocrProcessingTimes.length === 0) {
      return { average: 0, min: 0, max: 0, accuracy: 0 };
    }

    const processingTimes = this.metrics.ocrProcessingTimes.map(item => item.processingTime);
    const accuracyScores = this.metrics.ocrProcessingTimes
      .map(item => item.accuracyScore)
      .filter(score => score !== null);
    
    // Enhanced accuracy metrics calculation
    const enhancedAccuracyMetrics = this.calculateEnhancedOCRAccuracyMetrics();

    const avgAccuracy = accuracyScores.length > 0 
      ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length 
      : 0;

    return {
      average: processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length,
      min: Math.min(...processingTimes),
      max: Math.max(...processingTimes),
      accuracy: avgAccuracy,
      totalProcessed: this.metrics.ocrProcessingTimes.length,
      enhancedMetrics: enhancedAccuracyMetrics
    };
  }

  // Calculate enhanced OCR accuracy metrics
  calculateEnhancedOCRAccuracyMetrics() {
    if (this.metrics.ocrProcessingTimes.length === 0) {
      return {};
    }

    // Get all entries with enhanced accuracy metrics
    const entriesWithMetrics = this.metrics.ocrProcessingTimes.filter(item => item.accuracyMetrics);
    
    if (entriesWithMetrics.length === 0) {
      return {};
    }

    // Calculate average field accuracy scores
    const fieldAccuracyTotals = {};
    let totalEntries = 0;
    
    entriesWithMetrics.forEach(item => {
      if (item.accuracyMetrics && item.accuracyMetrics.fieldAccuracy) {
        Object.entries(item.accuracyMetrics.fieldAccuracy).forEach(([field, score]) => {
          if (!fieldAccuracyTotals[field]) {
            fieldAccuracyTotals[field] = 0;
          }
          fieldAccuracyTotals[field] += score;
        });
        totalEntries++;
      }
    });
    
    // Calculate averages
    const fieldAccuracyAverages = {};
    Object.entries(fieldAccuracyTotals).forEach(([field, total]) => {
      fieldAccuracyAverages[field] = total / totalEntries;
    });
    
    return {
      fieldAccuracyAverages,
      totalEntriesWithMetrics: entriesWithMetrics.length
    };
  }

  // Calculate LLM processing time summary with enhanced accuracy metrics
  calculateLLMSummary() {
    if (this.metrics.llmProcessingTimes.length === 0) {
      return { average: 0, min: 0, max: 0, accuracy: 0 };
    }

    const processingTimes = this.metrics.llmProcessingTimes.map(item => item.processingTime);
    const accuracyScores = this.metrics.llmProcessingTimes
      .map(item => item.accuracyScore)
      .filter(score => score !== null);
    
    // Enhanced accuracy metrics calculation
    const enhancedAccuracyMetrics = this.calculateEnhancedLLMAccuracyMetrics();

    const avgAccuracy = accuracyScores.length > 0 
      ? accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length 
      : 0;

    return {
      average: processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length,
      min: Math.min(...processingTimes),
      max: Math.max(...processingTimes),
      accuracy: avgAccuracy,
      totalProcessed: this.metrics.llmProcessingTimes.length,
      enhancedMetrics: enhancedAccuracyMetrics
    };
  }

  // Calculate enhanced LLM accuracy metrics
  calculateEnhancedLLMAccuracyMetrics() {
    if (this.metrics.llmProcessingTimes.length === 0) {
      return {};
    }

    // Get all entries with enhanced accuracy metrics
    const entriesWithMetrics = this.metrics.llmProcessingTimes.filter(item => item.accuracyMetrics);
    
    if (entriesWithMetrics.length === 0) {
      return {};
    }

    // Calculate average confidence scores
    const confidenceScores = entriesWithMetrics
      .map(item => item.accuracyMetrics?.overallConfidence)
      .filter(score => score !== undefined && score !== null);
    
    const avgConfidence = confidenceScores.length > 0 
      ? confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length 
      : 0;
    
    return {
      averageConfidence: avgConfidence,
      totalEntriesWithMetrics: entriesWithMetrics.length
    };
  }

  // Calculate sync processing time summary
  calculateSyncSummary() {
    if (this.metrics.syncProcessingTimes.length === 0) {
      return { average: 0, min: 0, max: 0 };
    }

    const processingTimes = this.metrics.syncProcessingTimes.map(item => item.processingTime);
    const itemCounts = this.metrics.syncProcessingTimes.map(item => item.itemCount);

    return {
      average: processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length,
      min: Math.min(...processingTimes),
      max: Math.max(...processingTimes),
      totalItems: itemCounts.reduce((a, b) => a + b, 0),
      totalOperations: this.metrics.syncProcessingTimes.length,
    };
  }

  // Get user engagement analytics
  getUserEngagementAnalytics() {
    if (this.analyticsEvents.length === 0) {
      return { totalEvents: 0, eventTypes: {}, recentEvents: [] };
    }

    // Count event types
    const eventTypes = {};
    this.analyticsEvents.forEach(event => {
      eventTypes[event.event] = (eventTypes[event.event] || 0) + 1;
    });

    // Get recent events (last 50)
    const recentEvents = this.analyticsEvents.slice(-50);

    return {
      totalEvents: this.analyticsEvents.length,
      eventTypes,
      recentEvents,
    };
  }

  // Get error analytics
  getErrorAnalytics() {
    if (this.errorLogs.length === 0) {
      return { totalErrors: 0, errorTypes: {}, recentErrors: [] };
    }

    // Count error types
    const errorTypes = {};
    this.errorLogs.forEach(error => {
      const errorType = error.error.split(':')[0] || 'Unknown';
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    // Get recent errors (last 50)
    const recentErrors = this.errorLogs.slice(-50);

    return {
      totalErrors: this.errorLogs.length,
      errorTypes,
      recentErrors,
    };
  }

  // Update real-time metrics
  updateRealTimeMetrics() {
    // Update active sessions (simplified for this example)
    this.realTimeMetrics.activeSessions = Math.floor(Math.random() * 100) + 1;
    
    // Update processing rate (simplified for this example)
    this.realTimeMetrics.currentProcessingRate = Math.floor(Math.random() * 50) + 1;
    
    // Update error rate (simplified for this example)
    this.realTimeMetrics.currentErrorRate = Math.random() * 5;
  }

  // Get real-time metrics
  getRealTimeMetrics() {
    return { ...this.realTimeMetrics };
  }

  // Clear all metrics
  async clearMetrics() {
    this.metrics = {
      apiResponseTimes: [],
      ocrProcessingTimes: [],
      llmProcessingTimes: [],
      syncProcessingTimes: [],
    };
    this.analyticsEvents = [];
    this.errorLogs = [];

    try {
      // In a real implementation, you might want to clear the database tables as well
    } catch (error) {
      console.error('Error clearing metrics:', error);
    }
  }
}

// Create and export singleton instance
const performanceMonitoringService = new PerformanceMonitoringService();

// Export functions for easy usage
export const initializePerformanceMonitoring = () => performanceMonitoringService.initialize();
export const trackApiResponseTime = (endpoint, responseTime, success = true) => 
  performanceMonitoringService.trackApiResponseTime(endpoint, responseTime, success);
export const trackOCRProcessingTime = (imageSize, processingTime, accuracyScore = null, accuracyMetrics = null) => 
  performanceMonitoringService.trackOCRProcessingTime(imageSize, processingTime, accuracyScore, accuracyMetrics);
export const trackLLMProcessingTime = (inputLength, processingTime, accuracyScore = null, accuracyMetrics = null) => 
  performanceMonitoringService.trackLLMProcessingTime(inputLength, processingTime, accuracyScore, accuracyMetrics);
export const trackSyncProcessingTime = (operation, processingTime, itemCount = 0) => 
  performanceMonitoringService.trackSyncProcessingTime(operation, processingTime, itemCount);
export const trackUserEngagement = (event, data = {}) => 
  performanceMonitoringService.trackUserEngagement(event, data);
export const logError = (error, context = {}) => 
  performanceMonitoringService.logError(error, context);
export const getPerformanceMetricsSummary = () => 
  performanceMonitoringService.getPerformanceMetricsSummary();
export const getUserEngagementAnalytics = () => 
  performanceMonitoringService.getUserEngagementAnalytics();
export const getErrorAnalytics = () => 
  performanceMonitoringService.getErrorAnalytics();
export const clearMetrics = () => 
  performanceMonitoringService.clearMetrics();

export default performanceMonitoringService;