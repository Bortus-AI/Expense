const intelligentCategorizationService = require('./services/intelligentCategorizationService');
const fraudDetectionService = require('./services/fraudDetectionService');
const duplicateDetectionService = require('./services/duplicateDetectionService');
const advancedMatchingService = require('./services/advancedMatchingService');
const db = require('./database/init');

async function testAIServices() {
  try {
    console.log('Testing AI Services...');
    
    // Test transaction data
    const testTransaction = {
      id: 1,
      description: 'Test transaction',
      amount: 100.00,
      transaction_date: '2024-01-01',
      company_id: 1
    };

    console.log('Testing Intelligent Categorization...');
    const categorization = await intelligentCategorizationService.categorizeTransaction(testTransaction, 1);
    console.log('Categorization result:', categorization);

    console.log('Testing Fraud Detection...');
    const fraudAnalysis = await fraudDetectionService.analyzeTransaction(testTransaction, 1);
    console.log('Fraud analysis result:', fraudAnalysis);

    console.log('Testing Duplicate Detection...');
    const duplicateAnalysis = await duplicateDetectionService.detectDuplicateTransactions(testTransaction, 1);
    console.log('Duplicate analysis result:', duplicateAnalysis);

    console.log('Testing Recurring Patterns...');
    const recurringAnalysis = await advancedMatchingService.analyzeRecurringPatterns(testTransaction, 1);
    console.log('Recurring analysis result:', recurringAnalysis);

    console.log('Testing Calendar Correlation...');
    const calendarAnalysis = await advancedMatchingService.analyzeCalendarCorrelation(testTransaction, 1, 1);
    console.log('Calendar analysis result:', calendarAnalysis);

    console.log('All AI services tested successfully!');
  } catch (error) {
    console.error('Error testing AI services:', error);
  }
}

testAIServices();