const express = require('express');
const router = express.Router();
const { authenticateToken, getUserCompanies } = require('../middleware/auth');
const intelligentCategorizationService = require('../services/intelligentCategorizationService');

const duplicateDetectionService = require('../services/duplicateDetectionService');
const advancedMatchingService = require('../services/advancedMatchingService');
const llmService = require('../services/llmService');
const db = require('../database/init');

// Apply middleware to all AI routes
router.use(authenticateToken);
router.use(getUserCompanies);

// Intelligent Categorization Routes

// Categorize a transaction using ML
router.post('/categorize/transaction/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found in user session' });
    }

    // Get transaction details
    const transaction = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', 
        [transactionId, companyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await intelligentCategorizationService.categorizeTransaction(transaction, companyId);
    
    res.json({
      success: true,
      categorization: result
    });
  } catch (error) {
    console.error('Error in transaction categorization:', error);
    res.status(500).json({ error: 'Failed to categorize transaction' });
  }
});

// Provide feedback on categorization
router.post('/categorize/feedback', async (req, res) => {
  try {
    const { transactionId, actualCategoryId, predictedCategoryId, confidence } = req.body;
    
    await intelligentCategorizationService.learnFromFeedback(
      transactionId, 
      actualCategoryId, 
      predictedCategoryId, 
      confidence
    );
    
    res.json({ success: true, message: 'Feedback recorded successfully' });
  } catch (error) {
    console.error('Error recording categorization feedback:', error);
    res.status(500).json({ error: 'Failed to record feedback' });
  }
});

// Get categorization statistics
router.get('/categorize/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const stats = await intelligentCategorizationService.getCategorizationStats(companyId);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting categorization stats:', error);
    res.status(500).json({ error: 'Failed to get categorization statistics' });
  }
});



// Duplicate Detection Routes

// Check for duplicate transactions
router.post('/duplicates/check/transaction/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found in user session' });
    }

    // Get transaction details
    const transaction = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', 
        [transactionId, companyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await duplicateDetectionService.detectDuplicateTransactions(transaction, companyId);
    
    res.json({
      success: true,
      duplicateAnalysis: result
    });
  } catch (error) {
    console.error('Error in duplicate detection:', error);
    res.status(500).json({ error: 'Failed to check for duplicates' });
  }
});

// Check for duplicate receipts
router.post('/duplicates/check/receipt/:id', async (req, res) => {
  try {
    const receiptId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found in user session' });
    }

    // Get receipt details
    const receipt = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM receipts WHERE id = ? AND company_id = ?', 
        [receiptId, companyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const result = await duplicateDetectionService.detectDuplicateReceipts(receipt, companyId);
    
    res.json({
      success: true,
      duplicateAnalysis: result
    });
  } catch (error) {
    console.error('Error in receipt duplicate detection:', error);
    res.status(500).json({ error: 'Failed to check for receipt duplicates' });
  }
});

// Get duplicate groups
router.get('/duplicates/groups', async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const status = req.query.status || 'pending';
    
    const groups = await duplicateDetectionService.getDuplicateGroups(companyId, status);
    
    res.json({
      success: true,
      duplicateGroups: groups
    });
  } catch (error) {
    console.error('Error getting duplicate groups:', error);
    res.status(500).json({ error: 'Failed to get duplicate groups' });
  }
});

// Get transactions in a duplicate group
router.get('/duplicates/groups/:groupId/transactions', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    
    const transactions = await duplicateDetectionService.getDuplicateGroupTransactions(groupId, companyId);
    
    res.json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error('Error getting duplicate group transactions:', error);
    res.status(500).json({ error: 'Failed to get duplicate group transactions' });
  }
});

// Update duplicate group status
router.put('/duplicates/groups/:groupId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { status } = req.body;
    
    await duplicateDetectionService.updateDuplicateGroup(groupId, status);
    
    res.json({ success: true, message: 'Duplicate group updated successfully' });
  } catch (error) {
    console.error('Error updating duplicate group:', error);
    res.status(500).json({ error: 'Failed to update duplicate group' });
  }
});

// Remove transaction from duplicate group
router.delete('/duplicates/groups/:groupId/transactions/:transactionId', async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const transactionId = req.params.transactionId;
    
    await duplicateDetectionService.removeTransactionFromGroup(groupId, transactionId);
    
    res.json({ success: true, message: 'Transaction removed from duplicate group' });
  } catch (error) {
    console.error('Error removing transaction from duplicate group:', error);
    res.status(500).json({ error: 'Failed to remove transaction from duplicate group' });
  }
});

// Batch process duplicates
router.post('/duplicates/batch-process', async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const limit = req.body.limit || 100;
    
    const results = await duplicateDetectionService.batchProcessDuplicates(companyId, limit);
    
    res.json({
      success: true,
      results: results
    });
  } catch (error) {
    console.error('Error in batch duplicate processing:', error);
    res.status(500).json({ error: 'Failed to batch process duplicates' });
  }
});

// Get duplicate statistics
router.get('/duplicates/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const stats = await duplicateDetectionService.getDuplicateStats(companyId);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting duplicate stats:', error);
    res.status(500).json({ error: 'Failed to get duplicate statistics' });
  }
});

// Advanced Matching Routes

// Analyze transaction splitting
router.post('/matching/split/analyze/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const { receiptIds } = req.body;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found in user session' });
    }

    // Get transaction details
    const transaction = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', 
        [transactionId, companyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await advancedMatchingService.analyzeTransactionSplitting(transaction, receiptIds, companyId);
    
    res.json({
      success: true,
      splitAnalysis: result
    });
  } catch (error) {
    console.error('Error in transaction splitting analysis:', error);
    res.status(500).json({ error: 'Failed to analyze transaction splitting' });
  }
});

// Create transaction split
router.post('/matching/split/create/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found in user session' });
    }

    // Get transaction details
    const transaction = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', 
        [transactionId, companyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const { splits } = req.body;
    const result = await advancedMatchingService.createTransactionSplit(transaction, splits, companyId);
    
    res.json({
      success: true,
      splitResult: result
    });
  } catch (error) {
    console.error('Error creating transaction split:', error);
    res.status(500).json({ error: 'Failed to create transaction split' });
  }
});

// Get transaction splits
router.get('/matching/split/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    
    const splits = await advancedMatchingService.getTransactionSplits(transactionId, companyId);
    
    res.json({
      success: true,
      splits: splits
    });
  } catch (error) {
    console.error('Error getting transaction splits:', error);
    res.status(500).json({ error: 'Failed to get transaction splits' });
  }
});

// Analyze recurring patterns
router.post('/matching/recurring/analyze/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const userId = req.user.id;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found in user session' });
    }

    // Get transaction details
    const transaction = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', 
        [transactionId, companyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await advancedMatchingService.analyzeRecurringPatterns(transaction, companyId);
    
    res.json({
      success: true,
      recurringAnalysis: result
    });
  } catch (error) {
    console.error('Error in recurring pattern analysis:', error);
    res.status(500).json({ error: 'Failed to analyze recurring patterns' });
  }
});

// Get recurring patterns
router.get('/matching/recurring/patterns', async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const isActive = req.query.active !== 'false';
    
    const patterns = await advancedMatchingService.getRecurringPatterns(companyId, isActive);
    
    res.json({
      success: true,
      patterns: patterns
    });
  } catch (error) {
    console.error('Error getting recurring patterns:', error);
    res.status(500).json({ error: 'Failed to get recurring patterns' });
  }
});

// Analyze calendar correlation
router.post('/matching/calendar/analyze/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const userId = req.user.id;

    if (!companyId) {
      return res.status(400).json({ error: 'Company ID not found in user session' });
    }

    // Get transaction details
    const transaction = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', 
        [transactionId, companyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const result = await advancedMatchingService.analyzeCalendarCorrelation(transaction, companyId, userId);
    
    res.json({
      success: true,
      calendarAnalysis: result
    });
  } catch (error) {
    console.error('Error in calendar correlation analysis:', error);
    res.status(500).json({ error: 'Failed to analyze calendar correlation' });
  }
});

// Get calendar correlations
router.get('/matching/calendar/correlations', async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const userId = req.query.userId || req.user.id;
    
    const correlations = await advancedMatchingService.getCalendarCorrelations(companyId, userId);
    
    res.json({
      success: true,
      correlations: correlations
    });
  } catch (error) {
    console.error('Error getting calendar correlations:', error);
    res.status(500).json({ error: 'Failed to get calendar correlations' });
  }
});

// Comprehensive AI Analysis Route
router.post('/analyze/comprehensive/:id', async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId || req.user.currentCompany?.id;
    const userId = req.user.id;

    console.log(`Starting comprehensive AI analysis for transaction ${transactionId}, company ${companyId}, user ${userId}`);
    console.log('User object:', req.user);

    if (!companyId) {
      console.error('No company ID found in user object');
      return res.status(400).json({ error: 'Company ID not found in user session' });
    }

    // Get transaction details
    const transaction = await new Promise((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ? AND company_id = ?', 
        [transactionId, companyId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
    });

    if (!transaction) {
      console.log(`Transaction ${transactionId} not found for company ${companyId}`);
      return res.status(404).json({ error: 'Transaction not found' });
    }

    console.log(`Found transaction: ${transaction.description}, amount: ${transaction.amount}`);

    // Run all AI analyses in parallel with individual error handling
    const results = {
      categorization: null,
      duplicateAnalysis: null,
      recurringAnalysis: null,
      calendarAnalysis: null
    };

    try {
      console.log('Running categorization analysis...');
      results.categorization = await intelligentCategorizationService.categorizeTransaction(transaction, companyId);
      console.log('Categorization completed successfully');
    } catch (error) {
      console.error('Error in categorization:', error);
      results.categorization = { error: 'Categorization failed', details: error.message };
    }



    try {
      console.log('Running duplicate analysis...');
      results.duplicateAnalysis = await duplicateDetectionService.detectDuplicateTransactions(transaction, companyId);
      console.log('Duplicate analysis completed successfully');
    } catch (error) {
      console.error('Error in duplicate analysis:', error);
      results.duplicateAnalysis = { error: 'Duplicate analysis failed', details: error.message };
    }

    try {
      console.log('Running recurring pattern analysis...');
      results.recurringAnalysis = await advancedMatchingService.analyzeRecurringPatterns(transaction, companyId);
      console.log('Recurring pattern analysis completed successfully');
    } catch (error) {
      console.error('Error in recurring pattern analysis:', error);
      results.recurringAnalysis = { error: 'Recurring pattern analysis failed', details: error.message };
    }

    try {
      console.log('Running calendar correlation analysis...');
      results.calendarAnalysis = await advancedMatchingService.analyzeCalendarCorrelation(transaction, companyId, userId);
      console.log('Calendar correlation analysis completed successfully');
    } catch (error) {
      console.error('Error in calendar correlation analysis:', error);
      results.calendarAnalysis = { error: 'Calendar correlation analysis failed', details: error.message };
    }

    console.log('All AI analyses completed');

    res.json({
      success: true,
      analysis: results
    });
  } catch (error) {
    console.error('Error in comprehensive AI analysis:', error);
    res.status(500).json({ error: 'Failed to perform comprehensive analysis', details: error.message });
  }
});

// AI Dashboard Statistics
router.get('/dashboard/stats', async (req, res) => {
  try {
    const companyId = req.user.companyId || req.user.currentCompany?.id;

    // Get all statistics in parallel
    const [
      categorizationStats,
      duplicateStats
    ] = await Promise.all([
      intelligentCategorizationService.getCategorizationStats(companyId),
      duplicateDetectionService.getDuplicateStats(companyId)
    ]);

    res.json({
      success: true,
      dashboard: {
        categorization: categorizationStats,
        duplicates: duplicateStats
      }
    });
  } catch (error) {
    console.error('Error getting AI dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

// LLM Service Health Check
router.get('/llm/health', async (req, res) => {
  try {
    const health = await llmService.healthCheck();
    res.json({
      success: true,
      llm: health,
      message: health.status === 'healthy' ? 'LLM service is healthy' : 'LLM service has issues'
    });
  } catch (error) {
    console.error('LLM health check error:', error);
    res.status(500).json({
      success: false,
      error: 'LLM health check failed',
      details: error.message
    });
  }
});

// Test LLM categorization
router.post('/llm/test-categorization', async (req, res) => {
  try {
    const { description, amount, companyId } = req.body;
    
    if (!description) {
      return res.status(400).json({
        success: false,
        error: 'Description is required'
      });
    }

    const transaction = {
      description,
      amount: amount || 0,
      transaction_date: new Date().toISOString().split('T')[0]
    };

    const companyContext = await intelligentCategorizationService.getCompanyContext(companyId);
    const result = await llmService.categorizeTransaction(transaction, companyContext, req.user.currentCompany?.id);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('LLM test categorization error:', error);
    res.status(500).json({
      success: false,
      error: 'LLM test categorization failed',
      details: error.message
    });
  }
});

// Test LLM OCR processing
router.post('/llm/test-ocr', async (req, res) => {
  try {
    const { ocrText, receiptData } = req.body;
    
    if (!ocrText) {
      return res.status(400).json({
        success: false,
        error: 'OCR text is required'
      });
    }

    const result = await llmService.processOCRText(ocrText, receiptData || {}, req.user.currentCompany?.id);
    
    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('LLM test OCR error:', error);
    res.status(500).json({
      success: false,
      error: 'LLM test OCR failed',
      details: error.message
    });
  }
});

module.exports = router;
