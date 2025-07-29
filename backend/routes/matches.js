const express = require('express');
const router = express.Router();
const db = require('../database/init');
const moment = require('moment');
const { authenticateToken, getUserCompanies, requireCompanyAccess, addUserTracking } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticateToken);
router.use(getUserCompanies);
router.use(requireCompanyAccess);
router.use(addUserTracking);

// Matching algorithm function
const findPotentialMatches = (receipt, transactions) => {
  const matches = [];
  
  if (!receipt.extracted_amount || !transactions || transactions.length === 0) {
    return matches;
  }

  transactions.forEach(transaction => {
    let confidence = 0;
    const reasons = [];

    // Amount matching (most important factor)
    const amountDiff = Math.abs(Math.abs(transaction.amount) - receipt.extracted_amount);
    if (amountDiff === 0) {
      confidence += 60;
      reasons.push('Exact amount match');
    } else if (amountDiff <= 1) {
      confidence += 40;
      reasons.push('Very close amount match');
    } else if (amountDiff <= 5) {
      confidence += 20;
      reasons.push('Close amount match');
    } else if (amountDiff <= 10) {
      confidence += 10;
      reasons.push('Approximate amount match');
    }

    // Date matching
    if (receipt.extracted_date && transaction.transaction_date) {
      const receiptDate = moment(receipt.extracted_date, ['MM/DD/YYYY', 'MM/DD/YY', 'M/D/YYYY', 'M/D/YY']);
      const transactionDate = moment(transaction.transaction_date);
      
      if (receiptDate.isValid() && transactionDate.isValid()) {
        const daysDiff = Math.abs(receiptDate.diff(transactionDate, 'days'));
        
        if (daysDiff === 0) {
          confidence += 25;
          reasons.push('Same date');
        } else if (daysDiff <= 1) {
          confidence += 15;
          reasons.push('Within 1 day');
        } else if (daysDiff <= 3) {
          confidence += 5;
          reasons.push('Within 3 days');
        }
      }
    }

    // Merchant/description matching
    if (receipt.extracted_merchant && transaction.description) {
      const merchantWords = receipt.extracted_merchant.toLowerCase().split(/\s+/);
      const descriptionLower = transaction.description.toLowerCase();
      
      let wordMatches = 0;
      let significantWordMatches = 0;
      
      merchantWords.forEach(word => {
        // Skip common words like "llc", "inc", "corp", etc.
        if (word.length > 2 && !['llc', 'inc', 'corp', 'ltd', 'company', 'co'].includes(word)) {
          if (descriptionLower.includes(word)) {
            wordMatches++;
            // Give extra credit for longer, more specific words
            if (word.length >= 5) {
              significantWordMatches++;
            }
          }
        }
      });
      
      if (wordMatches > 0) {
        // Base match percentage
        const baseMatchPercent = (wordMatches / merchantWords.filter(w => 
          w.length > 2 && !['llc', 'inc', 'corp', 'ltd', 'company', 'co'].includes(w)
        ).length) * 15;
        
        // Bonus for significant word matches (like "openai")
        const bonusPoints = significantWordMatches * 5;
        
        const totalMerchantPoints = Math.min(baseMatchPercent + bonusPoints, 20); // Cap at 20 points
        confidence += totalMerchantPoints;
        reasons.push(`Merchant keywords match (${wordMatches} words, ${significantWordMatches} significant)`);
      }
    }

    // Only include if confidence is above threshold
    if (confidence >= 10) {
      matches.push({
        transaction,
        confidence: Math.round(confidence),
        reasons,
        amountDiff
      });
    }
  });

  // Sort by confidence descending
  return matches.sort((a, b) => b.confidence - a.confidence);
};

// Get all matches
router.get('/', (req, res) => {
  // If user is not admin, show matches where they own either the transaction or receipt
  let whereClause = 'WHERE t.company_id = ? AND r.company_id = ?';
  let queryParams = [req.companyId, req.companyId];

  if (req.user && req.user.currentRole !== 'admin') {
    // Show matches where user created either the transaction OR the receipt
    whereClause += ' AND (t.created_by = ? OR r.created_by = ?)';
    queryParams.push(req.user.id, req.user.id);
  }

  const query = `
    SELECT m.*, 
           t.transaction_date, t.description, t.amount as transaction_amount, t.category,
           r.original_filename, r.extracted_amount, r.extracted_date, r.extracted_merchant
    FROM matches m
    JOIN transactions t ON m.transaction_id = t.id
    JOIN receipts r ON m.receipt_id = r.id
    ${whereClause}
    ORDER BY m.created_at DESC
  `;

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get pending matches (not confirmed by user)
router.get('/pending', (req, res) => {
  // If user is not admin, show pending matches where they own either the transaction or receipt
  let whereClause = 'WHERE m.user_confirmed = FALSE AND t.company_id = ? AND r.company_id = ?';
  let queryParams = [req.companyId, req.companyId];

  if (req.user && req.user.currentRole !== 'admin') {
    // Show matches where user created either the transaction OR the receipt
    whereClause += ' AND (t.created_by = ? OR r.created_by = ?)';
    queryParams.push(req.user.id, req.user.id);
  }

  const query = `
    SELECT m.*, 
           t.transaction_date, t.description, t.amount as transaction_amount, t.category,
           r.original_filename, r.extracted_amount, r.extracted_date, r.extracted_merchant, r.file_path
    FROM matches m
    JOIN transactions t ON m.transaction_id = t.id
    JOIN receipts r ON m.receipt_id = r.id
    ${whereClause}
    ORDER BY m.match_confidence DESC, m.created_at DESC
  `;

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Find matches for a specific receipt
router.post('/find/:receiptId', (req, res) => {
  const receiptId = req.params.receiptId;

  // Get receipt details with company check
  const receiptQuery = `
    SELECT * FROM receipts 
    WHERE id = ? AND company_id = ?
    ${req.user && req.user.currentRole !== 'admin' ? 'AND created_by = ?' : ''}
  `;
  
  const receiptParams = [receiptId, req.companyId];
  if (req.user && req.user.currentRole !== 'admin') {
    receiptParams.push(req.user.id);
  }

  db.get(receiptQuery, receiptParams, (err, receipt) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found or access denied' });
    }

    // Get unmatched transactions with proper filtering
    let transactionFilter = 'WHERE t.company_id = ?';
    let transactionParams = [req.companyId];

    if (req.user && req.user.currentRole !== 'admin') {
      transactionFilter += ' AND t.created_by = ?';
      transactionParams.push(req.user.id);
    }

    const transactionQuery = `
      SELECT t.* FROM transactions t
      ${transactionFilter}
      AND t.id NOT IN (
        SELECT transaction_id FROM matches WHERE user_confirmed = 1
      )
      ORDER BY t.transaction_date DESC
      LIMIT 100
    `;

    console.log('Finding matches for receipt:', receiptId);
    console.log('Transaction query:', transactionQuery);
    console.log('Transaction params:', transactionParams);

    db.all(transactionQuery, transactionParams, (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      console.log(`Found ${transactions.length} transactions to match against`);
      const potentialMatches = findPotentialMatches(receipt, transactions);
      console.log(`Found ${potentialMatches.length} potential matches`);
      
      res.json({
        receipt,
        potentialMatches: potentialMatches.slice(0, 10) // Top 10 matches
      });
    });
  });
});

// Create a match
router.post('/', (req, res) => {
  const { transaction_id, receipt_id, match_confidence, auto_confirm = false } = req.body;

  if (!transaction_id || !receipt_id) {
    return res.status(400).json({ error: 'transaction_id and receipt_id are required' });
  }

  const query = `
    INSERT OR REPLACE INTO matches 
    (transaction_id, receipt_id, match_confidence, match_status, user_confirmed)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(query, [
    transaction_id, 
    receipt_id, 
    match_confidence || 0, 
    auto_confirm ? 'confirmed' : 'pending',
    auto_confirm ? 1 : 0
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    res.json({
      message: 'Match created successfully',
      matchId: this.lastID,
      confirmed: auto_confirm
    });
  });
});

// Confirm a match
router.put('/:id/confirm', (req, res) => {
  const query = `
    UPDATE matches 
    SET user_confirmed = 1, match_status = 'confirmed', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ message: 'Match confirmed successfully' });
  });
});

// Reject a match
router.put('/:id/reject', (req, res) => {
  const query = `
    UPDATE matches 
    SET user_confirmed = 0, match_status = 'rejected', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ message: 'Match rejected successfully' });
  });
});

// Delete a match
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM matches WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    res.json({ message: 'Match deleted successfully' });
  });
});

router.post('/auto-match', (req, res) => {
  const confidenceThreshold = req.body.threshold || 70;

  // Apply the same filtering as other endpoints
  let receiptFilter = 'WHERE r.company_id = ?';
  let transactionFilter = 'WHERE t.company_id = ?';
  let receiptParams = [req.companyId];
  let transactionParams = [req.companyId];

  // If user is not admin, only match their own data
  if (req.user && req.user.currentRole !== 'admin') {
    console.log('Applying user-level filtering for auto-match');
    receiptFilter += ' AND r.created_by = ?';
    transactionFilter += ' AND t.created_by = ?';
    receiptParams.push(req.user.id);
    transactionParams.push(req.user.id);
  } else {
    console.log('Admin user - auto-matching all company data');
  }

  // Get unmatched receipts with filtering
  const receiptQuery = `
    SELECT * FROM receipts r
    ${receiptFilter}
    AND r.id NOT IN (
      SELECT receipt_id FROM matches WHERE user_confirmed = 1
    )
    AND r.processing_status = 'completed'
    AND r.extracted_amount IS NOT NULL
  `;

  db.all(receiptQuery, receiptParams, (err, receipts) => {
    if (err) {
      console.error('Error fetching receipts for auto-match:', err);
      return res.status(500).json({ error: err.message });
    }

    // Get unmatched transactions with filtering
    const transactionQuery = `
      SELECT t.* FROM transactions t
      ${transactionFilter}
      AND t.id NOT IN (
        SELECT transaction_id FROM matches WHERE user_confirmed = 1
      )
    `;

    db.all(transactionQuery, transactionParams, (err, transactions) => {
      if (err) {
        console.error('Error fetching transactions for auto-match:', err);
        return res.status(500).json({ error: err.message });
      }

      let autoMatched = 0;
      let matchDetails = [];

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO matches 
        (transaction_id, receipt_id, match_confidence, match_status, user_confirmed, created_by, updated_by)
        VALUES (?, ?, ?, 'auto_matched', 0, ?, ?)
      `);

      receipts.forEach(receipt => {
        const matches = findPotentialMatches(receipt, transactions);
        
        // Auto-match if confidence is high enough
        if (matches.length > 0 && matches[0].confidence >= confidenceThreshold) {
          const bestMatch = matches[0];
          
          stmt.run([
            bestMatch.transaction.id,
            receipt.id,
            bestMatch.confidence,
            req.user.id, // created_by
            req.user.id  // updated_by
          ], (err) => {
            if (!err) {
              autoMatched++;
              matchDetails.push({
                receiptId: receipt.id,
                transactionId: bestMatch.transaction.id,
                confidence: bestMatch.confidence,
                receiptFile: receipt.original_filename,
                transactionDesc: bestMatch.transaction.description
              });
            } else {
              console.error('Error creating auto-match:', err);
            }
          });
        }
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Error finalizing auto-match:', err);
          return res.status(500).json({ error: 'Error completing auto-match' });
        }
        
        res.json({
          message: 'Auto-matching completed',
          matched: autoMatched,
          totalReceipts: receipts.length,
          totalTransactions: transactions.length,
          threshold: confidenceThreshold,
          details: matchDetails
        });
      });
    });
  });
});

router.get('/stats', (req, res) => {

  // Apply the same filtering logic as other match endpoints
  let matchesFilter = 'WHERE t.company_id = ? AND r.company_id = ?';
  let receiptsFilter = 'WHERE r.company_id = ?';
  let transactionsFilter = 'WHERE t.company_id = ?';
  let queryParams = [req.companyId, req.companyId];
  let receiptsParams = [req.companyId];
  let transactionsParams = [req.companyId];

  // If user is not admin, only show their own data
  if (req.user && req.user.currentRole !== 'admin') {
    // Show matches where user created either the transaction OR the receipt
    matchesFilter += ' AND (t.created_by = ? OR r.created_by = ?)';
    receiptsFilter += ' AND r.created_by = ?';
    transactionsFilter += ' AND t.created_by = ?';
    queryParams.push(req.user.id, req.user.id);
    receiptsParams.push(req.user.id);
    transactionsParams.push(req.user.id);
  }

  const queries = [
    {
      query: `
        SELECT COUNT(*) as total_matches 
        FROM matches m
        JOIN transactions t ON m.transaction_id = t.id
        JOIN receipts r ON m.receipt_id = r.id
        ${matchesFilter}
      `,
      params: queryParams
    },
    {
      query: `
        SELECT COUNT(*) as confirmed_matches 
        FROM matches m
        JOIN transactions t ON m.transaction_id = t.id
        JOIN receipts r ON m.receipt_id = r.id
        ${matchesFilter} AND m.user_confirmed = 1
      `,
      params: queryParams
    },
    {
      query: `
        SELECT COUNT(*) as pending_matches 
        FROM matches m
        JOIN transactions t ON m.transaction_id = t.id
        JOIN receipts r ON m.receipt_id = r.id
        ${matchesFilter} AND m.user_confirmed = 0
      `,
      params: queryParams
    },
    {
      query: `
        SELECT COUNT(*) as unmatched_receipts 
        FROM receipts r
        ${receiptsFilter} AND r.id NOT IN (
          SELECT m.receipt_id 
          FROM matches m
          JOIN transactions t ON m.transaction_id = t.id
          JOIN receipts r2 ON m.receipt_id = r2.id
          ${matchesFilter.replace('r.company_id', 'r2.company_id')} AND m.user_confirmed = 1
        )
      `,
      params: receiptsParams
    },
    {
      query: `
        SELECT COUNT(*) as unmatched_transactions 
        FROM transactions t
        ${transactionsFilter} AND t.id NOT IN (
          SELECT m.transaction_id 
          FROM matches m
          JOIN transactions t2 ON m.transaction_id = t2.id
          JOIN receipts r ON m.receipt_id = r.id
          ${matchesFilter.replace('t.company_id', 't2.company_id')} AND m.user_confirmed = 1
        )
      `,
      params: transactionsParams
    }
  ];

  const stats = {};
  let completed = 0;

  queries.forEach(({ query, params }, index) => {
    db.get(query, params, (err, row) => {
      if (err) {
        console.error(`Stats query ${index} error:`, err);
      } else {
        const key = Object.keys(row)[0];
        stats[key] = row[key];
      }
      
      completed++;
      if (completed === queries.length) {
        res.json(stats);
      }
    });
  });
});

// Debug route to see all matches for troubleshooting
router.get('/debug', (req, res) => {
  console.log('=== MATCHES DEBUG ===');
  console.log('User:', {
    id: req.user?.id,
    email: req.user?.email,
    currentRole: req.user?.currentRole,
    companyId: req.companyId,
    currentCompany: req.user?.currentCompany
  });

  // First, let's check user's actual company association
  db.get(`
    SELECT uc.company_id, uc.role, c.name as company_name
    FROM user_companies uc
    JOIN companies c ON uc.company_id = c.id
    WHERE uc.user_id = ? AND uc.status = 'active'
    ORDER BY uc.company_id
    LIMIT 1
  `, [req.user.id], (err, userCompany) => {
    if (err) {
      console.error('Error checking user company:', err);
    } else {
      console.log('User company association:', userCompany);
    }

    // Get all matches with full details
    const query = `
      SELECT m.*, m.created_by as match_created_by, m.updated_by as match_updated_by,
             t.transaction_date, t.description, t.amount as transaction_amount, t.company_id as txn_company_id, t.created_by as txn_created_by,
             r.original_filename, r.extracted_amount, r.company_id as receipt_company_id, r.created_by as receipt_created_by
      FROM matches m
      JOIN transactions t ON m.transaction_id = t.id
      JOIN receipts r ON m.receipt_id = r.id
      ORDER BY m.created_at DESC
      LIMIT 20
    `;

    db.all(query, [], (err, matches) => {
      if (err) {
        console.error('Error fetching debug matches:', err);
        return res.status(500).json({ error: err.message });
      }

      console.log(`Found ${matches.length} total matches in database`);
      
      matches.forEach((match, index) => {
        console.log(`Match ${index + 1}:`, {
          id: match.id,
          confidence: match.match_confidence,
          status: match.match_status,
          user_confirmed: match.user_confirmed,
          match_created_by: match.match_created_by,
          txn_company_id: match.txn_company_id,
          txn_created_by: match.txn_created_by,
          receipt_company_id: match.receipt_company_id,
          receipt_created_by: match.receipt_created_by,
          transaction_desc: match.description?.substring(0, 50),
          receipt_file: match.original_filename
        });
      });

      // Now check what matches would be visible with current filtering
      let whereClause = 'WHERE t.company_id = ? AND r.company_id = ?';
      let queryParams = [req.companyId, req.companyId];

      if (req.user && req.user.currentRole !== 'admin') {
        whereClause += ' AND (t.created_by = ? OR r.created_by = ?)';
        queryParams.push(req.user.id, req.user.id);
      }

      const filteredQuery = `
        SELECT m.*, 
               t.transaction_date, t.description, t.amount as transaction_amount,
               r.original_filename, r.extracted_amount
        FROM matches m
        JOIN transactions t ON m.transaction_id = t.id
        JOIN receipts r ON m.receipt_id = r.id
        ${whereClause}
        ORDER BY m.created_at DESC
      `;

      console.log('Filtered query:', filteredQuery);
      console.log('Filtered params:', queryParams);

      db.all(filteredQuery, queryParams, (err, filteredMatches) => {
        if (err) {
          console.error('Error fetching filtered matches:', err);
        } else {
          console.log(`${filteredMatches.length} matches visible to current user`);
          if (filteredMatches.length > 0) {
            console.log('Sample visible match:', {
              id: filteredMatches[0].id,
              confidence: filteredMatches[0].match_confidence,
              transaction_desc: filteredMatches[0].description?.substring(0, 50),
              receipt_file: filteredMatches[0].original_filename
            });
          }
        }

        res.json({
          user: {
            id: req.user?.id,
            email: req.user?.email,
            role: req.user?.currentRole,
            companyId: req.companyId,
            actualCompany: userCompany
          },
          totalMatches: matches.length,
          visibleMatches: filteredMatches?.length || 0,
          allMatches: matches,
          visibleMatchesData: filteredMatches
        });
      });
    });
  });
});

module.exports = router;
