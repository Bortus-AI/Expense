const express = require('express');
const moment = require('moment');
const db = require('../database/init');
const { authenticateToken, getUserCompanies, requireCompanyAccess, addUserTracking } = require('../middleware/auth');
const pdfService = require('../services/pdfService');
const excelService = require('../services/excelService');

const router = express.Router();

// Apply basic authentication to all routes
router.use(authenticateToken);
router.use(getUserCompanies);

// Get available export options (no company access required)
router.get('/options', (req, res) => {
  res.json({
    formats: ['pdf', 'excel'],
    reportTypes: [
      {
        id: 'transactions',
        name: 'Transaction Reports',
        description: 'Export transaction data with matching information',
        options: {
          dateRange: true,
          includeMatched: true,
          includeUnmatched: true
        }
      },
      {
        id: 'receipts',
        name: 'Receipt Reports',
        description: 'Export receipt data and OCR results',
        options: {
          dateRange: true,
          groupBy: ['date', 'merchant', 'amount'],
          includeOCRData: true,
          includeMatched: true,
          includeUnmatched: true,
          maxPagesPerReceipt: true
        }
      },
      {
        id: 'reconciliation',
        name: 'Reconciliation Reports',
        description: 'Export matching status and unmatched items',
        options: {
          dateRange: true
        }
      },
      {
        id: 'analytics',
        name: 'Analytics Reports',
        description: 'Export expense analytics and trends',
        options: {
          dateRange: true,
          categories: true,
          trends: true
        }
      }
    ]
  });
});

// Apply company access middleware to all other routes
router.use(requireCompanyAccess);
router.use(addUserTracking);

// Export transactions as PDF
router.post('/pdf/transactions', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      includeMatched = true,
      includeUnmatched = true,
      title = 'Transaction Summary Report'
    } = req.body;

    // Debug logging
    console.log('=== PDF TRANSACTIONS EXPORT DEBUG ===');
    console.log('User:', req.user?.email);
    console.log('Company ID:', req.companyId);
    console.log('Current Company:', req.user?.currentCompany?.name);
    console.log('Request body:', { startDate, endDate, includeMatched, includeUnmatched, title });

    if (!req.companyId) {
      console.error('No company ID found in request');
      return res.status(400).json({ error: 'Company context required' });
    }

    // Build query with company scoping, date filtering, and match status filtering
    let query = `
      SELECT t.*, 
             COUNT(m.id) as receipt_count,
             GROUP_CONCAT(r.original_filename) as receipt_filenames
      FROM transactions t
      LEFT JOIN matches m ON t.id = m.transaction_id AND m.match_status = 'confirmed'
      LEFT JOIN receipts r ON m.receipt_id = r.id
      WHERE t.company_id = ?
    `;
    
    const params = [req.companyId];

    // Apply match status filtering
    if (includeMatched && !includeUnmatched) {
      // Only matched transactions
      query += ' AND m.id IS NOT NULL';
      console.log('Filtering for MATCHED transactions only');
    } else if (!includeMatched && includeUnmatched) {
      // Only unmatched transactions
      query += ' AND m.id IS NULL';
      console.log('Filtering for UNMATCHED transactions only');
    } else {
      console.log('Including both MATCHED and UNMATCHED transactions');
    }
    // If both includeMatched and includeUnmatched are true, include all (no additional filter)

    if (startDate) {
      query += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY t.id ORDER BY t.transaction_date DESC';

    console.log('Final query:', query);
    console.log('Query params:', params);

    db.all(query, params, async (err, transactions) => {
      if (err) {
        console.error('Error fetching transactions for export:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      console.log(`Found ${transactions.length} transactions for export`);
      if (transactions.length > 0) {
        console.log('Sample transaction:', {
          id: transactions[0].id,
          date: transactions[0].transaction_date,
          description: transactions[0].description,
          amount: transactions[0].amount,
          company_id: transactions[0].company_id
        });
      }

      try {
        const pdfDoc = await pdfService.generateTransactionReport(transactions, {
          companyName: req.user.currentCompany.name,
          startDate,
          endDate,
          title,
          includeMatched,
          includeUnmatched
        });

        // Set response headers for PDF download
        const filename = `transactions_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Pipe PDF to response
        pdfDoc.pipe(res);
        pdfDoc.end();

      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        res.status(500).json({ error: 'Failed to generate PDF report' });
      }
    });

  } catch (error) {
    console.error('Export transactions PDF error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Export transactions as Excel
router.post('/excel/transactions', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      includeMatched = true,
      includeUnmatched = true
    } = req.body;

    // Build query with company scoping, date filtering, and match status filtering
    let query = `
      SELECT t.*, 
             COUNT(m.id) as receipt_count,
             GROUP_CONCAT(r.original_filename) as receipt_filenames
      FROM transactions t
      LEFT JOIN matches m ON t.id = m.transaction_id AND m.match_status = 'confirmed'
      LEFT JOIN receipts r ON m.receipt_id = r.id
      WHERE t.company_id = ?
    `;
    
    const params = [req.companyId];

    // Apply match status filtering
    if (includeMatched && !includeUnmatched) {
      // Only matched transactions
      query += ' AND m.id IS NOT NULL';
    } else if (!includeMatched && includeUnmatched) {
      // Only unmatched transactions
      query += ' AND m.id IS NULL';
    }
    // If both includeMatched and includeUnmatched are true, include all (no additional filter)

    if (startDate) {
      query += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      query += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }

    query += ' GROUP BY t.id ORDER BY t.transaction_date DESC';

    db.all(query, params, async (err, transactions) => {
      if (err) {
        console.error('Error fetching transactions for export:', err);
        return res.status(500).json({ error: 'Failed to fetch transactions' });
      }

      try {
        const workbook = await excelService.generateTransactionsExport(transactions, {
          companyName: req.user.currentCompany.name,
          startDate,
          endDate,
          includeMatched,
          includeUnmatched
        });

        // Set response headers for Excel download
        const filename = `transactions_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Write Excel to response
        await workbook.xlsx.write(res);
        res.end();

      } catch (excelError) {
        console.error('Excel generation error:', excelError);
        res.status(500).json({ error: 'Failed to generate Excel report' });
      }
    });

  } catch (error) {
    console.error('Export transactions Excel error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Export receipts as PDF
router.post('/pdf/receipts', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      groupBy = 'date',
      title = 'Receipt Gallery Report',
      includeMatched = true,
      includeUnmatched = true,
      maxPagesPerReceipt = null
    } = req.body;

    if (!req.companyId) {
      return res.status(400).json({ error: 'Company context required' });
    }

    // Build query with company scoping, date filtering, and match status filtering
    let query = `
      SELECT r.*, m.match_status 
      FROM receipts r
      LEFT JOIN matches m ON r.id = m.receipt_id AND m.match_status = 'confirmed'
      WHERE r.company_id = ?
    `;
    
    const params = [req.companyId];

    // Apply match status filtering
    if (includeMatched && !includeUnmatched) {
      // Only matched receipts
      query += ' AND m.id IS NOT NULL';
    } else if (!includeMatched && includeUnmatched) {
      // Only unmatched receipts
      query += ' AND m.id IS NULL';
    }
    // If both includeMatched and includeUnmatched are true, include all (no additional filter)

    // Date filtering with flexible date handling
    if (startDate) {
      // Handle both MM/DD/YYYY and YYYY-MM-DD date formats
      query += ` AND (
        (r.extracted_date >= ? OR r.extracted_date >= ?) OR 
        (r.extracted_date IS NULL AND r.upload_date >= ?)
      )`;
      const startDateMDY = moment(startDate).format('MM/DD/YYYY');
      params.push(startDate);      // YYYY-MM-DD format
      params.push(startDateMDY);   // MM/DD/YYYY format  
      params.push(startDate);      // For upload_date
    }

    if (endDate) {
      // Handle both MM/DD/YYYY and YYYY-MM-DD date formats
      query += ` AND (
        (r.extracted_date <= ? OR r.extracted_date <= ?) OR 
        (r.extracted_date IS NULL AND r.upload_date <= ?)
      )`;
      const endDateMDY = moment(endDate).format('MM/DD/YYYY');
      params.push(endDate);        // YYYY-MM-DD format
      params.push(endDateMDY);     // MM/DD/YYYY format
      params.push(endDate);        // For upload_date
    }

    query += ' ORDER BY COALESCE(r.extracted_date, r.upload_date) DESC';

    db.all(query, params, async (err, receipts) => {
      if (err) {
        console.error('Error fetching receipts for export:', err);
        return res.status(500).json({ error: 'Failed to fetch receipts' });
      }

      try {
        const pdfDoc = await pdfService.generateReceiptGalleryReport(receipts, {
          companyName: req.user.currentCompany.name,
          title,
          groupBy,
          includeMatched,
          includeUnmatched,
          maxPagesPerReceipt
        });

        // Set response headers for PDF download
        const filename = `receipts_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Check if this is a stream (from PDF embedding) or PDFKit document
        if (pdfDoc.end && typeof pdfDoc.end === 'function') {
          // This is a PDFKit document
          pdfDoc.pipe(res);
          pdfDoc.end();
        } else {
          // This is a readable stream from PDF embedding
          pdfDoc.pipe(res);
        }

      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        res.status(500).json({ error: 'Failed to generate PDF report' });
      }
    });

  } catch (error) {
    console.error('Export receipts PDF error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Export receipts as Excel
router.post('/excel/receipts', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      includeOCRData = true,
      includeMatched = true,
      includeUnmatched = true
    } = req.body;

    if (!req.companyId) {
      return res.status(400).json({ error: 'Company context required' });
    }

    // Build query with company scoping, date filtering, and match status filtering
    let query = `
      SELECT r.*, m.match_status 
      FROM receipts r
      LEFT JOIN matches m ON r.id = m.receipt_id AND m.match_status = 'confirmed'
      WHERE r.company_id = ?
    `;
    
    const params = [req.companyId];

    // Apply match status filtering
    if (includeMatched && !includeUnmatched) {
      // Only matched receipts
      query += ' AND m.id IS NOT NULL';
    } else if (!includeMatched && includeUnmatched) {
      // Only unmatched receipts
      query += ' AND m.id IS NULL';
    }
    // If both includeMatched and includeUnmatched are true, include all (no additional filter)

    // Date filtering with flexible date handling
    if (startDate) {
      // Handle both MM/DD/YYYY and YYYY-MM-DD date formats
      query += ` AND (
        (r.extracted_date >= ? OR r.extracted_date >= ?) OR 
        (r.extracted_date IS NULL AND r.upload_date >= ?)
      )`;
      const startDateMDY = moment(startDate).format('MM/DD/YYYY');
      params.push(startDate);      // YYYY-MM-DD format
      params.push(startDateMDY);   // MM/DD/YYYY format  
      params.push(startDate);      // For upload_date
    }

    if (endDate) {
      // Handle both MM/DD/YYYY and YYYY-MM-DD date formats
      query += ` AND (
        (r.extracted_date <= ? OR r.extracted_date <= ?) OR 
        (r.extracted_date IS NULL AND r.upload_date <= ?)
      )`;
      const endDateMDY = moment(endDate).format('MM/DD/YYYY');
      params.push(endDate);        // YYYY-MM-DD format
      params.push(endDateMDY);     // MM/DD/YYYY format
      params.push(endDate);        // For upload_date
    }

    query += ' ORDER BY COALESCE(r.extracted_date, r.upload_date) DESC';

    db.all(query, params, async (err, receipts) => {
      if (err) {
        console.error('Error fetching receipts for export:', err);
        return res.status(500).json({ error: 'Failed to fetch receipts' });
      }

      try {
        const workbook = await excelService.generateReceiptsExport(receipts, {
          companyName: req.user.currentCompany.name,
          includeOCRData,
          includeMatched,
          includeUnmatched
        });

        // Set response headers for Excel download
        const filename = `receipts_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

        // Write Excel to response
        await workbook.xlsx.write(res);
        res.end();

      } catch (excelError) {
        console.error('Excel generation error:', excelError);
        res.status(500).json({ error: 'Failed to generate Excel report' });
      }
    });

  } catch (error) {
    console.error('Export receipts Excel error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Export reconciliation report as PDF
router.post('/pdf/reconciliation', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      title = 'Reconciliation Report'
    } = req.body;

    // Get reconciliation data
    const reconciliationData = await getReconciliationData(req.companyId, startDate, endDate);

    try {
      const pdfDoc = await pdfService.generateReconciliationReport(reconciliationData, {
        companyName: req.user.currentCompany.name,
        title,
        period: startDate && endDate ? 
          `${moment(startDate).format('MM/DD/YYYY')} - ${moment(endDate).format('MM/DD/YYYY')}` : 
          'All Time'
      });

      // Set response headers for PDF download
      const filename = `reconciliation_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Pipe PDF to response
      pdfDoc.pipe(res);
      pdfDoc.end();

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }

  } catch (error) {
    console.error('Export reconciliation PDF error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Export reconciliation report as Excel
router.post('/excel/reconciliation', async (req, res) => {
  try {
    const {
      startDate,
      endDate
    } = req.body;

    // Get reconciliation data
    const reconciliationData = await getReconciliationData(req.companyId, startDate, endDate);

    try {
      const workbook = await excelService.generateReconciliationExport(reconciliationData, {
        companyName: req.user.currentCompany.name,
        period: startDate && endDate ? 
          `${moment(startDate).format('MM/DD/YYYY')} - ${moment(endDate).format('MM/DD/YYYY')}` : 
          'All Time'
      });

      // Set response headers for Excel download
      const filename = `reconciliation_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Write Excel to response
      await workbook.xlsx.write(res);
      res.end();

    } catch (excelError) {
      console.error('Excel generation error:', excelError);
      res.status(500).json({ error: 'Failed to generate Excel report' });
    }

  } catch (error) {
    console.error('Export reconciliation Excel error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});

// Generate company analytics report
router.post('/pdf/analytics', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      title = 'Expense Analytics Report'
    } = req.body;

    // Get analytics data
    const analyticsData = await getAnalyticsData(req.companyId, startDate, endDate);

    try {
      const pdfDoc = await pdfService.generateAnalyticsReport(analyticsData, {
        companyName: req.user.currentCompany.name,
        title
      });

      // Set response headers for PDF download
      const filename = `analytics_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      // Pipe PDF to response
      pdfDoc.pipe(res);
      pdfDoc.end();

    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }

  } catch (error) {
    console.error('Export analytics PDF error:', error);
    res.status(500).json({ error: 'Export failed' });
  }
});



// Helper function to get reconciliation data
async function getReconciliationData(companyId, startDate, endDate) {
  return new Promise((resolve, reject) => {
    // Get matched items
    let matchedQuery = `
      SELECT m.*, t.description as transaction_description, t.amount, t.transaction_date,
             r.original_filename as receipt_filename, r.extracted_amount, r.extracted_date
      FROM matches m
      JOIN transactions t ON m.transaction_id = t.id
      JOIN receipts r ON m.receipt_id = r.id
      WHERE t.company_id = ? AND m.match_status = 'confirmed'
    `;
    
    let unmatchedTxnQuery = `
      SELECT t.* FROM transactions t
      LEFT JOIN matches m ON t.id = m.transaction_id AND m.match_status = 'confirmed'
      WHERE t.company_id = ? AND m.id IS NULL
    `;
    
    let unmatchedReceiptsQuery = `
      SELECT r.* FROM receipts r
      LEFT JOIN matches m ON r.id = m.receipt_id AND m.match_status = 'confirmed'
      WHERE r.company_id = ? AND m.id IS NULL
    `;

    const params = [companyId];

    if (startDate) {
      matchedQuery += ' AND t.transaction_date >= ?';
      unmatchedTxnQuery += ' AND t.transaction_date >= ?';
      unmatchedReceiptsQuery += ' AND r.extracted_date >= ?';
    }

    if (endDate) {
      matchedQuery += ' AND t.transaction_date <= ?';
      unmatchedTxnQuery += ' AND t.transaction_date <= ?';
      unmatchedReceiptsQuery += ' AND r.extracted_date <= ?';
    }

    // Execute all queries
    Promise.all([
      new Promise((res, rej) => {
        const queryParams = [...params];
        if (startDate) queryParams.push(startDate);
        if (endDate) queryParams.push(endDate);
        db.all(matchedQuery, queryParams, (err, data) => err ? rej(err) : res(data));
      }),
      new Promise((res, rej) => {
        const queryParams = [...params];
        if (startDate) queryParams.push(startDate);
        if (endDate) queryParams.push(endDate);
        db.all(unmatchedTxnQuery, queryParams, (err, data) => err ? rej(err) : res(data));
      }),
      new Promise((res, rej) => {
        const queryParams = [...params];
        if (startDate) queryParams.push(startDate);
        if (endDate) queryParams.push(endDate);
        db.all(unmatchedReceiptsQuery, queryParams, (err, data) => err ? rej(err) : res(data));
      })
    ]).then(([matched, unmatchedTransactions, unmatchedReceipts]) => {
      const totalItems = matched.length + unmatchedTransactions.length + unmatchedReceipts.length;
      const matchRate = totalItems > 0 ? Math.round((matched.length / totalItems) * 100) : 0;

      resolve({
        matched,
        unmatchedTransactions,
        unmatchedReceipts,
        matchRate
      });
    }).catch(reject);
  });
}

// Helper function to get analytics data
async function getAnalyticsData(companyId, startDate, endDate) {
  return new Promise((resolve, reject) => {
    // Get basic analytics
    let analyticsQuery = `
      SELECT 
        COUNT(DISTINCT t.id) as transactionCount,
        COUNT(DISTINCT r.id) as receiptCount,
        COUNT(DISTINCT m.id) as matchCount,
        SUM(t.amount) as totalExpenses,
        AVG(t.amount) as averageTransaction,
        MAX(t.amount) as highestTransaction
      FROM transactions t
      LEFT JOIN receipts r ON r.company_id = t.company_id
      LEFT JOIN matches m ON (m.transaction_id = t.id OR m.receipt_id = r.id) AND m.match_status = 'confirmed'
      WHERE t.company_id = ?
    `;

    const params = [companyId];

    if (startDate) {
      analyticsQuery += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }

    if (endDate) {
      analyticsQuery += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }

    db.get(analyticsQuery, params, (err, analytics) => {
      if (err) {
        reject(err);
        return;
      }

      // Calculate match rate
      const matchRate = analytics.transactionCount > 0 ? 
        Math.round((analytics.matchCount / analytics.transactionCount) * 100) : 0;

      resolve({
        ...analytics,
        matchRate,
        categories: [], // Could be expanded with category analysis
        trends: [], // Could be expanded with trend analysis
        recommendations: [
          analytics.matchRate < 80 ? 'Consider improving receipt collection to increase match rate' : null,
          analytics.averageTransaction > 100 ? 'Review high-value transactions for proper documentation' : null,
          'Regular reconciliation helps maintain accurate expense records'
        ].filter(Boolean)
      });
    });
  });
}

module.exports = router; 