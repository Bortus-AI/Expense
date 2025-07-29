const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const intelligentCategorizationService = require('../services/intelligentCategorizationService');
const fraudDetectionService = require('../services/fraudDetectionService');
const duplicateDetectionService = require('../services/duplicateDetectionService');
const advancedMatchingService = require('../services/advancedMatchingService');
const db = require('../database/init');

// Intelligent Categorization Routes

// Categorize a transaction using ML
router.post('/categorize/transaction/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId;

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
router.post('/categorize/feedback', authenticateToken, async (req, res) => {
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
router.get('/categorize/stats', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
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

// Fraud Detection Routes

// Analyze transaction for fraud
router.post('/fraud/analyze/transaction/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId;

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

    const result = await fraudDetectionService.analyzeTransaction(transaction, companyId);
    
    res.json({
      success: true,
      fraudAnalysis: result
    });
  } catch (error) {
    console.error('Error in fraud analysis:', error);
    res.status(500).json({ error: 'Failed to analyze transaction for fraud' });
  }
});

// Analyze receipt for fraud
router.post('/fraud/analyze/receipt/:id', authenticateToken, async (req, res) => {
  try {
    const receiptId = req.params.id;
    const companyId = req.user.companyId;

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

    const result = await fraudDetectionService.analyzeReceipt(receipt, companyId);
    
    res.json({
      success: true,
      fraudAnalysis: result
    });
  } catch (error) {
    console.error('Error in receipt fraud analysis:', error);
    res.status(500).json({ error: 'Failed to analyze receipt for fraud' });
  }
});

// Get fraud alerts
router.get('/fraud/alerts', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const status = req.query.status || 'pending';
    
    const alerts = await fraudDetectionService.getFraudAlerts(companyId, status);
    
    res.json({
      success: true,
      alerts: alerts
    });
  } catch (error) {
    console.error('Error getting fraud alerts:', error);
    res.status(500).json({ error: 'Failed to get fraud alerts' });
  }
});

// Update fraud alert status
router.put('/fraud/alerts/:id', authenticateToken, async (req, res) => {
  try {
    const alertId = req.params.id;
    const { status } = req.body;
    const reviewedBy = req.user.id;
    
    await fraudDetectionService.updateFraudAlertStatus(alertId, status, reviewedBy);
    
    res.json({ success: true, message: 'Alert status updated successfully' });
  } catch (error) {
    console.error('Error updating fraud alert:', error);
    res.status(500).json({ error: 'Failed to update alert status' });
  }
});

// Get fraud detection statistics
router.get('/fraud/stats', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    const stats = await fraudDetectionService.getFraudStats(companyId);
    
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting fraud stats:', error);
    res.status(500).json({ error: 'Failed to get fraud statistics' });
  }
});

// Duplicate Detection Routes

// Check transaction for duplicates
router.post('/duplicates/check/transaction/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId;

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

// Check receipt for duplicates
router.post('/duplicates/check/receipt/:id', authenticateToken, async (req, res) => {
  try {
    const receiptId = req.params.id;
    const companyId = req.user.companyId;

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
    res.status(500).json({ error: 'Failed to check receipt for duplicates' });
  }
});

// Get duplicate groups
router.get('/duplicates/groups', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
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

// Get transactions in duplicate group
router.get('/duplicates/groups/:id/transactions', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    
    const transactions = await duplicateDetectionService.getDuplicateGroupTransactions(groupId);
    
    res.json({
      success: true,
      transactions: transactions
    });
  } catch (error) {
    console.error('Error getting duplicate group transactions:', error);
    res.status(500).json({ error: 'Failed to get group transactions' });
  }
});

// Update duplicate group status
router.put('/duplicates/groups/:id', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.id;
    const { status } = req.body;
    
    await duplicateDetectionService.updateDuplicateGroupStatus(groupId, status);
    
    res.json({ success: true, message: 'Duplicate group status updated successfully' });
  } catch (error) {
    console.error('Error updating duplicate group:', error);
    res.status(500).json({ error: 'Failed to update duplicate group status' });
  }
});

// Remove transaction from duplicate group
router.delete('/duplicates/groups/:groupId/transactions/:transactionId', authenticateToken, async (req, res) => {
  try {
    const { groupId, transactionId } = req.params;
    
    const groupDeleted = await duplicateDetectionService.removeTransactionFromGroup(groupId, transactionId);
    
    res.json({ 
      success: true, 
      message: 'Transaction removed from duplicate group',
      groupDeleted: groupDeleted
    });
  } catch (error) {
    console.error('Error removing transaction from duplicate group:', error);
    res.status(500).json({ error: 'Failed to remove transaction from group' });
  }
});

// Get duplicate detection statistics
router.get('/duplicates/stats', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
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

// Batch process duplicates
router.post('/duplicates/batch-process', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
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

// Advanced Matching Routes

// Analyze transaction splitting
router.post('/matching/split/analyze/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId;
    const { receiptIds } = req.body;

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

    // Get receipt details
    const receipts = await new Promise((resolve, reject) => {
      const placeholders = receiptIds.map(() => '?').join(',');
      db.all(`SELECT * FROM receipts WHERE id IN (${placeholders}) AND company_id = ?`, 
        [...receiptIds, companyId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
    });

    const result = await advancedMatchingService.analyzeTransactionSplitting(transaction, receipts, companyId);
    
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
router.post('/matching/split/create/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const { splits } = req.body;
    const createdBy = req.user.id;
    
    const splitGroupId = await advancedMatchingService.createTransactionSplit(transactionId, splits, createdBy);
    
    res.json({ 
      success: true, 
      message: 'Transaction split created successfully',
      splitGroupId: splitGroupId
    });
  } catch (error) {
    console.error('Error creating transaction split:', error);
    res.status(500).json({ error: 'Failed to create transaction split' });
  }
});

// Get transaction splits
router.get('/matching/split/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    
    const splits = await advancedMatchingService.getTransactionSplits(transactionId);
    
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
router.post('/matching/recurring/analyze/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId;

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
router.get('/matching/recurring/patterns', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
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
router.post('/matching/calendar/analyze/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId;
    const userId = req.user.id;

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
router.get('/matching/calendar/correlations', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;
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
router.post('/analyze/comprehensive/:id', authenticateToken, async (req, res) => {
  try {
    const transactionId = req.params.id;
    const companyId = req.user.companyId;
    const userId = req.user.id;

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

    // Run all AI analyses in parallel
    const [
      categorization,
      fraudAnalysis,
      duplicateAnalysis,
      recurringAnalysis,
      calendarAnalysis
    ] = await Promise.all([
      intelligentCategorizationService.categorizeTransaction(transaction, companyId),
      fraudDetectionService.analyzeTransaction(transaction, companyId),
      duplicateDetectionService.detectDuplicateTransactions(transaction, companyId),
      advancedMatchingService.analyzeRecurringPatterns(transaction, companyId),
      advancedMatchingService.analyzeCalendarCorrelation(transaction, companyId, userId)
    ]);

    res.json({
      success: true,
      analysis: {
        categorization,
        fraudAnalysis,
        duplicateAnalysis,
        recurringAnalysis,
        calendarAnalysis
      }
    });
  } catch (error) {
    console.error('Error in comprehensive AI analysis:', error);
    res.status(500).json({ error: 'Failed to perform comprehensive analysis' });
  }
});

// AI Dashboard Statistics
router.get('/dashboard/stats', authenticateToken, async (req, res) => {
  try {
    const companyId = req.user.companyId;

    // Get all statistics in parallel
    const [
      categorizationStats,
      fraudStats,
      duplicateStats
    ] = await Promise.all([
      intelligentCategorizationService.getCategorizationStats(companyId),
      fraudDetectionService.getFraudStats(companyId),
      duplicateDetectionService.getDuplicateStats(companyId)
    ]);

    res.json({
      success: true,
      dashboard: {
        categorization: categorizationStats,
        fraud: fraudStats,
        duplicates: duplicateStats
      }
    });
  } catch (error) {
    console.error('Error getting AI dashboard stats:', error);
    res.status(500).json({ error: 'Failed to get dashboard statistics' });
  }
});

module.exports = router;
