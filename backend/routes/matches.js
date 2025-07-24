const express = require('express');
const router = express.Router();
const db = require('../database/init');
const { findPotentialMatches } = require('../utils/matchHelper');

// Get all matches
router.get('/', (req, res) => {
  const query = `
    SELECT m.*, 
           t.transaction_date, t.description, t.amount as transaction_amount, t.category,
           r.original_filename, r.extracted_amount, r.extracted_date, r.extracted_merchant
    FROM matches m
    JOIN transactions t ON m.transaction_id = t.id
    JOIN receipts r ON m.receipt_id = r.id
    ORDER BY m.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get pending matches (not confirmed by user)
router.get('/pending', (req, res) => {
  const query = `
    SELECT m.*, 
           t.transaction_date, t.description, t.amount as transaction_amount, t.category,
           r.original_filename, r.extracted_amount, r.extracted_date, r.extracted_merchant, r.file_path
    FROM matches m
    JOIN transactions t ON m.transaction_id = t.id
    JOIN receipts r ON m.receipt_id = r.id
    WHERE m.user_confirmed = FALSE
    ORDER BY m.match_confidence DESC, m.created_at DESC
  `;

  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Find matches for a specific receipt
router.post('/find/:receiptId', (req, res) => {
  // Get receipt details
  db.get('SELECT * FROM receipts WHERE id = ?', [req.params.receiptId], (err, receipt) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    // Get unmatched transactions (transactions without confirmed matches)
    const transactionQuery = `
      SELECT t.* FROM transactions t
      WHERE t.id NOT IN (
        SELECT transaction_id FROM matches WHERE user_confirmed = 1
      )
      ORDER BY t.transaction_date DESC
      LIMIT 100
    `;

    db.all(transactionQuery, [], (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const potentialMatches = findPotentialMatches(receipt, transactions);
      
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

// Auto-match all receipts
router.post('/auto-match', (req, res) => {
  const confidenceThreshold = req.body.threshold || 70;

  // Get all unmatched receipts
  const receiptQuery = `
    SELECT * FROM receipts r
    WHERE r.id NOT IN (
      SELECT receipt_id FROM matches WHERE user_confirmed = 1
    )
    AND r.processing_status = 'completed'
    AND r.extracted_amount IS NOT NULL
  `;

  db.all(receiptQuery, [], (err, receipts) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get unmatched transactions
    const transactionQuery = `
      SELECT t.* FROM transactions t
      WHERE t.id NOT IN (
        SELECT transaction_id FROM matches WHERE user_confirmed = 1
      )
    `;

    db.all(transactionQuery, [], (err, transactions) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      let autoMatched = 0;
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO matches 
        (transaction_id, receipt_id, match_confidence, match_status, user_confirmed)
        VALUES (?, ?, ?, 'auto_matched', 0)
      `);

      receipts.forEach(receipt => {
        const matches = findPotentialMatches(receipt, transactions);
        
        // Auto-match if confidence is high enough
        if (matches.length > 0 && matches[0].confidence >= confidenceThreshold) {
          stmt.run([
            matches[0].transaction.id,
            receipt.id,
            matches[0].confidence
          ], (err) => {
            if (!err) {
              autoMatched++;
            }
          });
        }
      });

      stmt.finalize((err) => {
        if (err) {
          return res.status(500).json({ error: 'Error completing auto-match' });
        }
        
        res.json({
          message: 'Auto-matching completed',
          matched: autoMatched,
          totalReceipts: receipts.length,
          threshold: confidenceThreshold
        });
      });
    });
  });
});

// Get match statistics
router.get('/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as total_matches FROM matches',
    'SELECT COUNT(*) as confirmed_matches FROM matches WHERE user_confirmed = 1',
    'SELECT COUNT(*) as pending_matches FROM matches WHERE user_confirmed = 0',
    'SELECT COUNT(*) as unmatched_receipts FROM receipts WHERE id NOT IN (SELECT receipt_id FROM matches WHERE user_confirmed = 1)',
    'SELECT COUNT(*) as unmatched_transactions FROM transactions WHERE id NOT IN (SELECT transaction_id FROM matches WHERE user_confirmed = 1)'
  ];

  const stats = {};
  let completed = 0;

  queries.forEach((query, index) => {
    db.get(query, [], (err, row) => {
      if (!err) {
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

module.exports = router; 