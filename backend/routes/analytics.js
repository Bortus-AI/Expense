const express = require('express');
const router = express.Router();
const db = require('../database/init');
const moment = require('moment');
const { authenticateToken, getUserCompanies, requireCompanyAccess, addUserTracking } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);
router.use(getUserCompanies);
router.use(requireCompanyAccess);
router.use(addUserTracking);

// Dashboard analytics endpoint
router.get('/dashboard', (req, res) => {
  // Both admins and regular users can access basic analytics
  // Admins see all company data, users see only their own data

  const companyId = req.companyId;
  const currentDate = moment();
  const startOfMonth = currentDate.clone().startOf('month');
  const startOfYear = currentDate.clone().startOf('year');
  const startOfWeek = currentDate.clone().startOf('week');

  // Get financial summary
  const getFinancialSummary = () => {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          SUM(ABS(t.amount)) as total_expenses,
          SUM(CASE WHEN m.id IS NOT NULL THEN ABS(t.amount) ELSE 0 END) as matched_expenses,
          SUM(CASE WHEN m.id IS NULL THEN ABS(t.amount) ELSE 0 END) as unmatched_expenses,
          COUNT(DISTINCT t.id) as total_transactions,
          COUNT(DISTINCT CASE WHEN m.id IS NOT NULL THEN t.id END) as matched_transactions,
          AVG(ABS(t.amount)) as avg_transaction_amount
        FROM transactions t
        LEFT JOIN matches m ON t.id = m.transaction_id AND m.user_confirmed = 1
        WHERE t.company_id = ? AND t.transaction_date >= ?
      `;
      
      let queryParams = [companyId, startOfYear.format('YYYY-MM-DD')];
      
      // If user is not admin, only show their own transactions
      if (req.user.currentRole !== 'admin') {
        query += ' AND t.created_by = ?';
        queryParams.push(req.user.id);
      }

      db.get(query, queryParams, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            totalExpenses: row.total_expenses || 0,
            matchedExpenses: row.matched_expenses || 0,
            unmatchedExpenses: row.unmatched_expenses || 0,
            totalTransactions: row.total_transactions || 0,
            matchedTransactions: row.matched_transactions || 0,
            avgTransactionAmount: row.avg_transaction_amount || 0,
            matchRate: row.total_transactions > 0 ? 
              Math.round((row.matched_transactions / row.total_transactions) * 100) : 0
          });
        }
      });
    });
  };

  // Get missing fields summary
  const getMissingFieldsSummary = () => {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          COUNT(*) as total_transactions,
          COUNT(CASE WHEN description IS NULL OR description = '' THEN 1 END) as missing_description,
          COUNT(CASE WHEN category IS NULL OR category = '' THEN 1 END) as missing_category,
          COUNT(CASE WHEN job_number IS NULL OR job_number = '' THEN 1 END) as missing_job_number,
          COUNT(CASE WHEN cost_code IS NULL OR cost_code = '' THEN 1 END) as missing_cost_code,
          COUNT(CASE WHEN 
            (description IS NULL OR description = '') OR 
            (category IS NULL OR category = '') OR 
            (job_number IS NULL OR job_number = '') OR 
            (cost_code IS NULL OR cost_code = '')
            THEN 1 END) as incomplete_transactions,
          COUNT(CASE WHEN 
            (description IS NOT NULL AND description != '') AND 
            (category IS NOT NULL AND category != '') AND 
            (job_number IS NOT NULL AND job_number != '') AND 
            (cost_code IS NOT NULL AND cost_code != '')
            THEN 1 END) as complete_transactions
        FROM transactions t
        WHERE t.company_id = ?
      `;
      
      let queryParams = [companyId];
      
      // If user is not admin, only show their own transactions
      if (req.user.currentRole !== 'admin') {
        query += ' AND t.created_by = ?';
        queryParams.push(req.user.id);
      }

      db.get(query, queryParams, (err, row) => {
        if (err) {
          reject(err);
        } else {
          const totalTransactions = row.total_transactions || 0;
          const incompleteTransactions = row.incomplete_transactions || 0;
          const completeTransactions = row.complete_transactions || 0;
          
          resolve({
            totalTransactions,
            missingDescription: row.missing_description || 0,
            missingCategory: row.missing_category || 0,
            missingJobNumber: row.missing_job_number || 0,
            missingCostCode: row.missing_cost_code || 0,
            missingDescriptionPercentage: totalTransactions > 0 ? Math.round(((row.missing_description || 0) / totalTransactions) * 100) : 0,
            missingCategoryPercentage: totalTransactions > 0 ? Math.round(((row.missing_category || 0) / totalTransactions) * 100) : 0,
            missingJobNumberPercentage: totalTransactions > 0 ? Math.round(((row.missing_job_number || 0) / totalTransactions) * 100) : 0,
            missingCostCodePercentage: totalTransactions > 0 ? Math.round(((row.missing_cost_code || 0) / totalTransactions) * 100) : 0,
            incompleteTransactions,
            completeTransactions,
            completionRate: totalTransactions > 0 ? 
              Math.round((completeTransactions / totalTransactions) * 100) : 0,
            incompleteRate: totalTransactions > 0 ? 
              Math.round((incompleteTransactions / totalTransactions) * 100) : 0
          });
        }
      });
    });
  };

  // Get top spending categories
  const getTopCategories = () => {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          t.category,
          SUM(ABS(t.amount)) as total_amount,
          COUNT(*) as transaction_count,
          AVG(ABS(t.amount)) as avg_amount
        FROM transactions t
        WHERE t.company_id = ? AND t.transaction_date >= ?
      `;
      
      let queryParams = [companyId, startOfYear.format('YYYY-MM-DD')];
      
      // If user is not admin, only show their own transactions
      if (req.user.currentRole !== 'admin') {
        query += ' AND t.created_by = ?';
        queryParams.push(req.user.id);
      }
      
      query += `
        GROUP BY t.category
        HAVING t.category IS NOT NULL AND t.category != ''
        ORDER BY total_amount DESC
        LIMIT 10
      `;

      db.all(query, queryParams, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  };

  // Get monthly spending trends
  const getMonthlyTrends = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          strftime('%Y-%m', t.transaction_date) as month,
          SUM(ABS(t.amount)) as total_expenses,
          COUNT(*) as transaction_count,
          COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END) as matched_count
        FROM transactions t
        LEFT JOIN matches m ON t.id = m.transaction_id AND m.user_confirmed = 1
        WHERE t.company_id = ? AND t.transaction_date >= ?
        GROUP BY strftime('%Y-%m', t.transaction_date)
        ORDER BY month DESC
        LIMIT 12
      `;

      db.all(query, [companyId, startOfYear.format('YYYY-MM-DD')], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  };

  // Get user activity summary
  const getUserActivity = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          u.first_name,
          u.last_name,
          u.email,
          COUNT(DISTINCT t.id) as transaction_count,
          COUNT(DISTINCT r.id) as receipt_count,
          COUNT(DISTINCT m.id) as match_count,
          MAX(t.created_at) as last_transaction,
          MAX(r.created_at) as last_receipt,
          SUM(ABS(t.amount)) as total_amount
        FROM users u
        LEFT JOIN user_companies uc ON u.id = uc.user_id
        LEFT JOIN transactions t ON u.id = t.created_by AND t.company_id = ?
        LEFT JOIN receipts r ON u.id = r.created_by AND r.company_id = ?
        LEFT JOIN matches m ON (u.id = m.created_by OR u.id = m.updated_by) AND m.id IN (
          SELECT m2.id FROM matches m2 
          JOIN transactions t2 ON m2.transaction_id = t2.id 
          WHERE t2.company_id = ?
        )
        WHERE uc.company_id = ? AND uc.status = 'active'
        GROUP BY u.id, u.first_name, u.last_name, u.email
        ORDER BY transaction_count DESC, receipt_count DESC
      `;

      db.all(query, [companyId, companyId, companyId, companyId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  };

  // Get processing efficiency metrics
  const getProcessingMetrics = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_receipts,
          COUNT(CASE WHEN r.processing_status = 'completed' THEN 1 END) as processed_receipts,
          COUNT(CASE WHEN m.id IS NOT NULL THEN 1 END) as matched_receipts,
          COUNT(CASE WHEN m.user_confirmed = 1 THEN 1 END) as confirmed_matches,
          AVG(CASE WHEN r.extracted_amount IS NOT NULL THEN r.extracted_amount END) as avg_amount,
          COUNT(CASE WHEN r.created_at >= datetime('now', '-7 days') THEN 1 END) as receipts_this_week,
          COUNT(CASE WHEN r.created_at >= datetime('now', '-30 days') THEN 1 END) as receipts_this_month,
          AVG(CASE WHEN r.file_size IS NOT NULL THEN r.file_size END) as avg_file_size,
          COUNT(CASE WHEN r.processing_status = 'failed' THEN 1 END) as failed_receipts,
          COUNT(CASE WHEN r.processing_status = 'processing' THEN 1 END) as processing_receipts
        FROM receipts r
        LEFT JOIN matches m ON r.id = m.receipt_id
        WHERE r.company_id = ?
      `;

      db.get(query, [companyId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          const totalReceipts = row.total_receipts || 0;
          const processedReceipts = row.processed_receipts || 0;
          const matchedReceipts = row.matched_receipts || 0;
          
          resolve({
            totalReceipts,
            processedReceipts,
            matchedReceipts,
            confirmedMatches: row.confirmed_matches || 0,
            avgAmount: row.avg_amount || 0,
            receiptsThisWeek: row.receipts_this_week || 0,
            receiptsThisMonth: row.receipts_this_month || 0,
            avgFileSize: row.avg_file_size || 0,
            failedReceipts: row.failed_receipts || 0,
            processingReceipts: row.processing_receipts || 0,
            processingRate: totalReceipts > 0 ? 
              Math.round((processedReceipts / totalReceipts) * 100) : 0,
            matchRate: totalReceipts > 0 ? 
              Math.round((matchedReceipts / totalReceipts) * 100) : 0,
            successRate: totalReceipts > 0 ? 
              Math.round(((totalReceipts - row.failed_receipts) / totalReceipts) * 100) : 0
          });
        }
      });
    });
  };

  // Get recent activity with more details
  const getRecentActivity = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          'transaction' as type,
          t.created_at as timestamp,
          u.first_name || ' ' || u.last_name as user_name,
          'Imported ' || COUNT(*) || ' transactions' as description,
          t.created_by as user_id,
          SUM(ABS(t.amount)) as total_amount
        FROM transactions t
        JOIN users u ON t.created_by = u.id
        WHERE t.company_id = ? AND t.created_at >= datetime('now', '-7 days')
        GROUP BY DATE(t.created_at), t.created_by
        UNION ALL
        SELECT 
          'receipt' as type,
          r.created_at as timestamp,
          u.first_name || ' ' || u.last_name as user_name,
          'Uploaded ' || COUNT(*) || ' receipts' as description,
          r.created_by as user_id,
          SUM(r.extracted_amount) as total_amount
        FROM receipts r
        JOIN users u ON r.created_by = u.id
        WHERE r.company_id = ? AND r.created_at >= datetime('now', '-7 days')
        GROUP BY DATE(r.created_at), r.created_by
        UNION ALL
        SELECT 
          'match' as type,
          m.created_at as timestamp,
          u.first_name || ' ' || u.last_name as user_name,
          CASE 
            WHEN m.user_confirmed = 1 THEN 'Confirmed match'
            ELSE 'Auto-matched receipt'
          END as description,
          COALESCE(m.created_by, m.updated_by) as user_id,
          m.match_confidence as total_amount
        FROM matches m
        JOIN users u ON COALESCE(m.created_by, m.updated_by) = u.id
        JOIN transactions t ON m.transaction_id = t.id
        WHERE t.company_id = ? AND m.created_at >= datetime('now', '-7 days')
        ORDER BY timestamp DESC
        LIMIT 20
      `;

      db.all(query, [companyId, companyId, companyId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  };

  // Get system performance metrics
  const getSystemPerformance = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(DISTINCT t.id) as total_transactions,
          COUNT(DISTINCT r.id) as total_receipts,
          COUNT(DISTINCT m.id) as total_matches,
          COUNT(DISTINCT CASE WHEN m.user_confirmed = 1 THEN m.id END) as confirmed_matches,
          COUNT(DISTINCT CASE WHEN m.user_confirmed = 0 AND m.match_confidence >= 80 THEN m.id END) as high_confidence_matches,
          COUNT(DISTINCT CASE WHEN m.user_confirmed = 0 AND m.match_confidence < 80 THEN m.id END) as low_confidence_matches,
          AVG(m.match_confidence) as avg_confidence,
          COUNT(DISTINCT CASE WHEN r.processing_status = 'failed' THEN r.id END) as failed_processing,
          COUNT(DISTINCT CASE WHEN r.processing_status = 'processing' THEN r.id END) as currently_processing
        FROM transactions t
        LEFT JOIN receipts r ON t.company_id = r.company_id
        LEFT JOIN matches m ON t.id = m.transaction_id
        WHERE t.company_id = ?
      `;

      db.get(query, [companyId], (err, row) => {
        if (err) {
          reject(err);
        } else {
          const totalMatches = row.total_matches || 0;
          const confirmedMatches = row.confirmed_matches || 0;
          
          resolve({
            totalTransactions: row.total_transactions || 0,
            totalReceipts: row.total_receipts || 0,
            totalMatches,
            confirmedMatches,
            highConfidenceMatches: row.high_confidence_matches || 0,
            lowConfidenceMatches: row.low_confidence_matches || 0,
            avgConfidence: row.avg_confidence || 0,
            failedProcessing: row.failed_processing || 0,
            currentlyProcessing: row.currently_processing || 0,
            confirmationRate: totalMatches > 0 ? 
              Math.round((confirmedMatches / totalMatches) * 100) : 0,
            highConfidenceRate: totalMatches > 0 ? 
              Math.round((row.high_confidence_matches / totalMatches) * 100) : 0
          });
        }
      });
    });
  };

  // Execute all queries
  Promise.all([
    getFinancialSummary(),
    getMissingFieldsSummary(),
    getTopCategories(),
    getMonthlyTrends(),
    getUserActivity(),
    getProcessingMetrics(),
    getRecentActivity(),
    getSystemPerformance()
  ])
  .then(([financial, missingFields, categories, trends, users, processing, activity, performance]) => {
    res.json({
      financial,
      missingFields,
      categories,
      trends,
      users,
      processing,
      activity,
      performance,
      generatedAt: new Date().toISOString()
    });
  })
  .catch((error) => {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Error generating analytics' });
  });
});

// Export analytics data
router.get('/export', (req, res) => {
  // Only admins can export analytics
  if (req.user.currentRole !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  const { format = 'json', startDate, endDate } = req.query;
  const companyId = req.companyId;

  // Get comprehensive analytics data
  const getAnalyticsData = () => {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          t.transaction_date,
          t.description,
          t.amount,
          t.category,
          t.created_by,
          u.first_name || ' ' || u.last_name as user_name,
          r.original_filename,
          r.extracted_amount,
          r.extracted_merchant,
          r.processing_status,
          r.file_size,
          m.match_confidence,
          m.user_confirmed,
          m.created_at as match_created_at,
          m.updated_at as match_updated_at
        FROM transactions t
        LEFT JOIN users u ON t.created_by = u.id
        LEFT JOIN matches m ON t.id = m.transaction_id
        LEFT JOIN receipts r ON m.receipt_id = r.id
        WHERE t.company_id = ?
        ${startDate ? 'AND t.transaction_date >= ?' : ''}
        ${endDate ? 'AND t.transaction_date <= ?' : ''}
        ORDER BY t.transaction_date DESC
      `;

      const params = [companyId];
      if (startDate) params.push(startDate);
      if (endDate) params.push(endDate);

      db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  };

  getAnalyticsData()
    .then((data) => {
      if (format === 'csv') {
        // Generate CSV
        const csvHeaders = [
          'Transaction Date',
          'Description',
          'Amount',
          'Category',
          'User',
          'Receipt File',
          'Extracted Amount',
          'Merchant',
          'Processing Status',
          'File Size (bytes)',
          'Match Confidence',
          'Confirmed',
          'Match Created',
          'Match Updated'
        ];

        const csvData = data.map(row => [
          row.transaction_date,
          row.description,
          row.amount,
          row.category,
          row.user_name,
          row.original_filename,
          row.extracted_amount,
          row.extracted_merchant,
          row.processing_status,
          row.file_size,
          row.match_confidence,
          row.user_confirmed ? 'Yes' : 'No',
          row.match_created_at,
          row.match_updated_at
        ]);

        const csvContent = [csvHeaders, ...csvData]
          .map(row => row.map(cell => `"${cell || ''}"`).join(','))
          .join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="analytics-export.csv"');
        res.send(csvContent);
      } else {
        // Return JSON
        res.json({
          data,
          summary: {
            totalTransactions: data.length,
            totalAmount: data.reduce((sum, row) => sum + (row.amount || 0), 0),
            matchedTransactions: data.filter(row => row.match_confidence).length,
            confirmedMatches: data.filter(row => row.user_confirmed).length,
            avgMatchConfidence: data.filter(row => row.match_confidence).length > 0 ? 
              data.filter(row => row.match_confidence)
                .reduce((sum, row) => sum + (row.match_confidence || 0), 0) / 
              data.filter(row => row.match_confidence).length : 0
          },
          generatedAt: new Date().toISOString()
        });
      }
    })
    .catch((error) => {
      console.error('Analytics export error:', error);
      res.status(500).json({ error: 'Error exporting analytics' });
    });
});

module.exports = router; 