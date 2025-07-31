/**
 * Analytics Service
 * Comprehensive analytics tracking for user engagement patterns and feature usage
 */

import {
  saveAnalyticsEvent,
  getAnalyticsEvents,
  saveSetting,
  getSetting
} from './databaseService';
import { trackUserEngagement, logError } from './performanceMonitoringService';

// Constants for analytics
const ANALYTICS_EVENTS_KEY = 'analytics_events';
const USER_PREFERENCES_KEY = 'user_preferences';
const FEATURE_USAGE_KEY = 'feature_usage';

// Analytics service class
class AnalyticsService {
  constructor() {
    this.events = [];
    this.userPreferences = {};
    this.featureUsage = {};
    this.sessionStartTime = null;
    this.isInitialized = false;
  }

  // Initialize the analytics service
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Load existing analytics data from storage
      const savedEvents = await getAnalyticsEvents();
      if (savedEvents && savedEvents.length > 0) {
        this.events = savedEvents.map(event => ({
          name: event.eventName,
          data: event.eventData,
          timestamp: event.timestamp
        }));
      }

      const savedPreferences = await getSetting(USER_PREFERENCES_KEY);
      if (savedPreferences) {
        this.userPreferences = savedPreferences;
      }

      const savedFeatureUsage = await getSetting(FEATURE_USAGE_KEY);
      if (savedFeatureUsage) {
        this.featureUsage = savedFeatureUsage;
      }

      // Set session start time
      this.sessionStartTime = new Date().toISOString();

      this.isInitialized = true;
      console.log('Analytics service initialized');
    } catch (error) {
      console.error('Error initializing analytics service:', error);
      logError(error, { context: 'AnalyticsService.initialize' });
    }
  }

  // Track screen views
  trackScreenView(screenName, additionalData = {}) {
    const eventData = {
      screen: screenName,
      ...additionalData,
    };

    this.trackEvent('screen_view', eventData);
  }

  // Track button clicks
  trackButtonClick(buttonName, screenName, additionalData = {}) {
    const eventData = {
      button: buttonName,
      screen: screenName,
      ...additionalData,
    };

    this.trackEvent('button_click', eventData);
  }

  // Track feature usage
  trackFeatureUsage(featureName, additionalData = {}) {
    const eventData = {
      feature: featureName,
      ...additionalData,
    };

    this.trackEvent('feature_usage', eventData);

    // Update feature usage statistics
    if (!this.featureUsage[featureName]) {
      this.featureUsage[featureName] = { count: 0, lastUsed: null };
    }

    this.featureUsage[featureName].count += 1;
    this.featureUsage[featureName].lastUsed = new Date().toISOString();

    // Save to storage
    this.saveFeatureUsage();
  }

  // Track user preferences
  trackUserPreference(preferenceName, value) {
    this.userPreferences[preferenceName] = value;

    // Save to storage
    this.saveUserPreferences();

    // Track as an event
    this.trackEvent('preference_change', {
      preference: preferenceName,
      value: value,
    });
  }

  // Track general events
  trackEvent(eventName, eventData = {}) {
    const event = {
      name: eventName,
      data: eventData,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);

    // Keep only the last 1000 entries to prevent memory issues
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    // Save to storage
    this.saveEvents();
    
    // Save to database
    saveAnalyticsEvent(eventName, eventData);

    // Also track in performance monitoring service
    trackUserEngagement(eventName, eventData);
  }

  // Track session duration
  trackSessionDuration() {
    if (!this.sessionStartTime) {
      return;
    }

    const sessionEndTime = new Date().toISOString();
    const duration = new Date(sessionEndTime) - new Date(this.sessionStartTime);

    this.trackEvent('session_end', {
      duration: duration,
      startTime: this.sessionStartTime,
      endTime: sessionEndTime,
    });
  }

  // Track user flow (navigation between screens)
  trackUserFlow(fromScreen, toScreen, action = null) {
    this.trackEvent('user_flow', {
      from: fromScreen,
      to: toScreen,
      action: action,
    });
  }

  // Track form interactions
  trackFormInteraction(formName, fieldName, interactionType, additionalData = {}) {
    this.trackEvent('form_interaction', {
      form: formName,
      field: fieldName,
      interaction: interactionType,
      ...additionalData,
    });
  }

  // Track search queries
  trackSearch(query, resultsCount = 0, additionalData = {}) {
    this.trackEvent('search', {
      query: query,
      resultsCount: resultsCount,
      ...additionalData,
    });
  }

  // Track errors
  trackError(error, context = {}) {
    this.trackEvent('error', {
      error: error.message || error,
      stack: error.stack || '',
      context: context,
    });

    // Also log in performance monitoring service
    logError(error, context);
  }

  // Save events to storage
  async saveEvents() {
    try {
      // We're now saving events directly to the database, so this function can be empty
      // or used for any additional local storage needs
    } catch (error) {
      console.error('Error saving analytics events:', error);
      logError(error, { context: 'AnalyticsService.saveEvents' });
    }
  }

  // Save user preferences to storage
  async saveUserPreferences() {
    try {
      await saveSetting(USER_PREFERENCES_KEY, this.userPreferences);
    } catch (error) {
      console.error('Error saving user preferences:', error);
      logError(error, { context: 'AnalyticsService.saveUserPreferences' });
    }
  }

  // Save feature usage to storage
  async saveFeatureUsage() {
    try {
      await saveSetting(FEATURE_USAGE_KEY, this.featureUsage);
    } catch (error) {
      console.error('Error saving feature usage:', error);
      logError(error, { context: 'AnalyticsService.saveFeatureUsage' });
    }
  }

  // Get analytics summary
  getAnalyticsSummary() {
    const summary = {
      totalEvents: this.events.length,
      eventDistribution: this.getEventDistribution(),
      featureUsage: this.featureUsage,
      userPreferences: this.userPreferences,
      sessionInfo: this.getSessionInfo(),
    };

    return summary;
  }

  // Get event distribution
  getEventDistribution() {
    const distribution = {};

    this.events.forEach(event => {
      if (!distribution[event.name]) {
        distribution[event.name] = 0;
      }
      distribution[event.name] += 1;
    });

    return distribution;
  }

  // Get session information
  getSessionInfo() {
    if (!this.sessionStartTime) {
      return { sessionCount: 0, averageSessionDuration: 0 };
    }

    const sessionEndTime = new Date().toISOString();
    const duration = new Date(sessionEndTime) - new Date(this.sessionStartTime);

    return {
      sessionStartTime: this.sessionStartTime,
      sessionEndTime: sessionEndTime,
      currentSessionDuration: duration,
      sessionCount: this.events.filter(e => e.name === 'session_end').length + 1, // +1 for current session
    };
  }

  // Get feature usage statistics
  getFeatureUsageStats() {
    return this.featureUsage;
  }

  // Get user preferences
  getUserPreferences() {
    return this.userPreferences;
  }

  // Clear all analytics data
  async clearAnalyticsData() {
    this.events = [];
    this.userPreferences = {};
    this.featureUsage = {};

    try {
      // In a real implementation, you might want to clear the database tables as well
      await saveSetting(USER_PREFERENCES_KEY, this.userPreferences);
      await saveSetting(FEATURE_USAGE_KEY, this.featureUsage);
    } catch (error) {
      console.error('Error clearing analytics data:', error);
      logError(error, { context: 'AnalyticsService.clearAnalyticsData' });
    }
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();

// Export functions for easy usage
export const initializeAnalytics = () => analyticsService.initialize();
export const trackScreenView = (screenName, additionalData = {}) => 
  analyticsService.trackScreenView(screenName, additionalData);
export const trackButtonClick = (buttonName, screenName, additionalData = {}) => 
  analyticsService.trackButtonClick(buttonName, screenName, additionalData);
export const trackFeatureUsage = (featureName, additionalData = {}) => 
  analyticsService.trackFeatureUsage(featureName, additionalData);
export const trackUserPreference = (preferenceName, value) => 
  analyticsService.trackUserPreference(preferenceName, value);
export const trackEvent = (eventName, eventData = {}) => 
  analyticsService.trackEvent(eventName, eventData);
export const trackSessionDuration = () => 
  analyticsService.trackSessionDuration();
export const trackUserFlow = (fromScreen, toScreen, action = null) => 
  analyticsService.trackUserFlow(fromScreen, toScreen, action);
export const trackFormInteraction = (formName, fieldName, interactionType, additionalData = {}) => 
  analyticsService.trackFormInteraction(formName, fieldName, interactionType, additionalData);
export const trackSearch = (query, resultsCount = 0, additionalData = {}) => 
  analyticsService.trackSearch(query, resultsCount, additionalData);
export const trackError = (error, context = {}) => 
  analyticsService.trackError(error, context);
export const getAnalyticsSummary = () => 
  analyticsService.getAnalyticsSummary();
export const getFeatureUsageStats = () => 
  analyticsService.getFeatureUsageStats();
export const getUserPreferences = () => 
  analyticsService.getUserPreferences();
export const clearAnalyticsData = () => 
  analyticsService.clearAnalyticsData();

export default analyticsService;