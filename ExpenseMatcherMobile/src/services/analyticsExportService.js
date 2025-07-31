/**
 * Analytics Export Service
 * Service for exporting analytics data in various formats
 */

import {
  getAnalyticsEvents,
  getPerformanceMetrics,
  getErrorLogs
} from './databaseService';
import { getAnalyticsSummary } from './analyticsService';

// Export analytics data in CSV format
export const exportAnalyticsToCSV = async () => {
  try {
    // Get all analytics data
    const analyticsData = await getAnalyticsSummary();
    const events = await getAnalyticsEvents();
    const metrics = await getPerformanceMetrics();
    const errors = await getErrorLogs();
    
    // Create CSV content
    let csvContent = 'Analytics Export Data\n';
    csvContent += `Exported on: ${new Date().toISOString()}\n\n`;
    
    // Add summary data
    csvContent += 'Summary Data:\n';
    csvContent += 'Metric,Value\n';
    csvContent += `Total Events,${analyticsData.totalEvents}\n`;
    csvContent += `Total Errors,${errors.length}\n`;
    csvContent += `Session Count,${analyticsData.sessionInfo?.sessionCount || 0}\n`;
    csvContent += `Overall Accuracy,${(analyticsData.accuracyMetrics?.overallAccuracyScore * 100).toFixed(2)}%\n`;
    csvContent += '\n';
    
    // Add event distribution
    csvContent += 'Event Distribution:\n';
    csvContent += 'Event,Count\n';
    Object.entries(analyticsData.eventDistribution || {}).forEach(([event, count]) => {
      csvContent += `${event},${count}\n`;
    });
    csvContent += '\n';
    
    // Add feature usage
    csvContent += 'Feature Usage:\n';
    csvContent += 'Feature,Count,Last Used\n';
    Object.entries(analyticsData.featureUsage || {}).forEach(([feature, data]) => {
      csvContent += `${feature},${data.count},${data.lastUsed || 'N/A'}\n`;
    });
    csvContent += '\n';
    
    // Add raw events data
    csvContent += 'Raw Events:\n';
    csvContent += 'Timestamp,Event Name,Event Data\n';
    events.forEach(event => {
      const eventData = JSON.stringify(event.eventData || {}).replace(/"/g, '""');
      csvContent += `"${event.timestamp}","${event.eventName}","${eventData}"\n`;
    });
    csvContent += '\n';
    
    // Add performance metrics
    csvContent += 'Performance Metrics:\n';
    csvContent += 'Timestamp,Metric Type,Value,Metadata\n';
    metrics.forEach(metric => {
      const metadata = JSON.stringify(metric.metadata || {}).replace(/"/g, '""');
      csvContent += `"${metric.timestamp}","${metric.metricType}","${metric.value}","${metadata}"\n`;
    });
    csvContent += '\n';
    
    // Add error logs
    csvContent += 'Error Logs:\n';
    csvContent += 'Timestamp,Error,Stack Trace,Context\n';
    errors.forEach(error => {
      const stackTrace = (error.stackTrace || '').replace(/"/g, '""');
      const context = JSON.stringify(error.context || {}).replace(/"/g, '""');
      csvContent += `"${error.timestamp}","${error.error}","${stackTrace}","${context}"\n`;
    });
    
    return csvContent;
  } catch (error) {
    console.error('Error exporting analytics to CSV:', error);
    throw new Error('Failed to export analytics data');
  }
};

// Export analytics data in JSON format
export const exportAnalyticsToJSON = async () => {
  try {
    // Get all analytics data
    const analyticsData = await getAnalyticsSummary();
    const events = await getAnalyticsEvents();
    const metrics = await getPerformanceMetrics();
    const errors = await getErrorLogs();
    
    // Create JSON object
    const exportData = {
      exportInfo: {
        exportedOn: new Date().toISOString(),
        format: 'JSON'
      },
      summary: analyticsData,
      events: events,
      performanceMetrics: metrics,
      errors: errors
    };
    
    return JSON.stringify(exportData, null, 2);
  } catch (error) {
    console.error('Error exporting analytics to JSON:', error);
    throw new Error('Failed to export analytics data');
  }
};

// Export analytics data in a simplified format for reporting
export const exportAnalyticsForReporting = async () => {
  try {
    // Get all analytics data
    const analyticsData = await getAnalyticsSummary();
    const events = await getAnalyticsEvents(100); // Limit to last 100 events
    const metrics = await getPerformanceMetrics(100); // Limit to last 100 metrics
    const errors = await getErrorLogs(50); // Limit to last 50 errors
    
    // Create simplified reporting object
    const reportData = {
      exportInfo: {
        exportedOn: new Date().toISOString(),
        format: 'Reporting'
      },
      summary: {
        totalEvents: analyticsData.totalEvents,
        totalErrors: errors.length,
        sessionCount: analyticsData.sessionInfo?.sessionCount || 0,
        overallAccuracy: (analyticsData.accuracyMetrics?.overallAccuracyScore * 100).toFixed(2) + '%',
        eventDistribution: analyticsData.eventDistribution,
        featureUsage: analyticsData.featureUsage,
        accuracyMetrics: {
          overallAccuracyScore: analyticsData.accuracyMetrics?.overallAccuracyScore,
          ocrAccuracyTrend: analyticsData.accuracyMetrics?.ocrAccuracyTrend,
          llmAccuracyTrend: analyticsData.accuracyMetrics?.llmAccuracyTrend
        }
      },
      recentEvents: events.map(event => ({
        timestamp: event.timestamp,
        eventName: event.eventName,
        eventData: event.eventData
      })),
      performanceMetrics: metrics.map(metric => ({
        timestamp: metric.timestamp,
        metricType: metric.metricType,
        value: metric.value,
        metadata: metric.metadata
      })),
      recentErrors: errors.map(error => ({
        timestamp: error.timestamp,
        error: error.error,
        context: error.context
      }))
    };
    
    return JSON.stringify(reportData, null, 2);
  } catch (error) {
    console.error('Error exporting analytics for reporting:', error);
    throw new Error('Failed to export analytics data');
  }
};

// Save exported data to a file (simulated)
export const saveExportedData = async (data, filename, format) => {
  try {
    // In a real implementation, you would use a library like react-native-fs
    // or react-native-share to save the file or share it with the user
    
    // For now, we'll just log the data and filename
    console.log(`Exported data to ${filename} in ${format} format`);
    console.log('Data:', data);
    
    // Return success message
    return {
      success: true,
      message: `Data exported successfully to ${filename}`,
      filename: filename,
      format: format
    };
  } catch (error) {
    console.error('Error saving exported data:', error);
    throw new Error('Failed to save exported data');
  }
};

export default {
  exportAnalyticsToCSV,
  exportAnalyticsToJSON,
  exportAnalyticsForReporting,
  saveExportedData
};