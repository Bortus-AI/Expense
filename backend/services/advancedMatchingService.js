const db = require('../database/init');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

class AdvancedMatchingService {
  constructor() {
    this.splitTolerancePercent = 0.05; // 5% tolerance for splits
    this.recurringTolerancePercent = 0.1; // 10% tolerance for recurring patterns
    this.calendarCorrelationWindow = 3; // days
  }

  // Multi-receipt transaction splitting
  async analyzeTransactionSplitting(transaction, receipts, companyId) {
    try {
      if (!receipts || receipts.length < 2) {
        return { canSplit: false, splits: [], confidence: 0 };
      }

      // Calculate total receipt amounts
      const totalReceiptAmount = receipts.reduce((sum, receipt) => 
        sum + (receipt.extracted_amount || 0), 0);
      
      const transactionAmount = Math.abs(transaction.amount);
      const amountDifference = Math.abs(totalReceiptAmount - transactionAmount);
      const toleranceAmount = transactionAmount * this.splitTolerancePercent;

      // Check if receipts can reasonably split the transaction
      if (amountDifference > toleranceAmount) {
        return { canSplit: false, splits: [], confidence: 0 };
      }

      // Generate split proposals
      const splits = this.generateSplitProposals(transaction, receipts);
      const confidence = this.calculateSplitConfidence(transaction, receipts, splits);

      return {
        canSplit: confidence > 0.7,
        splits: splits,
        confidence: confidence,
        totalReceiptAmount: totalReceiptAmount,
        transactionAmount: transactionAmount,
        amountDifference: amountDifference
      };

    } catch (error) {
      console.error('Error in transaction splitting analysis:', error);
      return { canSplit: false, splits: [], confidence: 0 };
    }
  }

  // Generate split proposals
  generateSplitProposals(transaction, receipts) {
    const transactionAmount = Math.abs(transaction.amount);
    const totalReceiptAmount = receipts.reduce((sum, receipt) => 
      sum + (receipt.extracted_amount || 0), 0);

    const splits = receipts.map(receipt => {
      const receiptAmount = receipt.extracted_amount || 0;
      const percentage = totalReceiptAmount > 0 ? (receiptAmount / totalReceiptAmount) * 100 : 0;
      const allocatedAmount = (receiptAmount / totalReceiptAmount) * transactionAmount;

      return {
        receipt_id: receipt.id,
        receipt_filename: receipt.filename,
        receipt_amount: receiptAmount,
        split_amount: allocatedAmount,
        split_percentage: percentage,
        description: `Split for ${receipt.filename} (${percentage.toFixed(1)}%)`
      };
    });

    return splits;
  }

  // Calculate confidence for split proposal
  calculateSplitConfidence(transaction, receipts, splits) {
    let confidence = 0;

    // Amount matching confidence (40%)
    const totalReceiptAmount = receipts.reduce((sum, receipt) => 
      sum + (receipt.extracted_amount || 0), 0);
    const transactionAmount = Math.abs(transaction.amount);
    const amountDifference = Math.abs(totalReceiptAmount - transactionAmount);
    const amountRatio = 1 - (amountDifference / transactionAmount);
    confidence += Math.max(0, amountRatio) * 0.4;

    // Date proximity confidence (30%)
    const transactionDate = moment(transaction.transaction_date);
    let avgDateDifference = 0;
    let validDates = 0;

    receipts.forEach(receipt => {
      if (receipt.extracted_date) {
        const receiptDate = moment(receipt.extracted_date);
        const daysDiff = Math.abs(transactionDate.diff(receiptDate, 'days'));
        avgDateDifference += daysDiff;
        validDates++;
      }
    });

    if (validDates > 0) {
      avgDateDifference /= validDates;
      const dateConfidence = Math.max(0, 1 - (avgDateDifference / 7)); // 7 days max
      confidence += dateConfidence * 0.3;
    }

    // Merchant consistency confidence (20%)
    const merchants = receipts
      .map(r => r.extracted_merchant)
      .filter(m => m && m.trim().length > 0);
    
    if (merchants.length > 0) {
      const uniqueMerchants = [...new Set(merchants.map(m => m.toLowerCase()))];
      const merchantConsistency = uniqueMerchants.length === 1 ? 1 : 0.5;
      confidence += merchantConsistency * 0.2;
    }

    // Number of receipts confidence (10%)
    const receiptCountConfidence = Math.min(1, receipts.length / 5); // Optimal around 2-5 receipts
    confidence += receiptCountConfidence * 0.1;

    return Math.min(1, confidence);
  }

  // Create transaction split in database
  async createTransactionSplit(transactionId, splits, createdBy) {
    return new Promise((resolve, reject) => {
      const splitGroupId = uuidv4();
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        let completedSplits = 0;
        const totalSplits = splits.length;

        splits.forEach(split => {
          db.run(`
            INSERT INTO transaction_splits 
            (transaction_id, split_group_id, receipt_id, split_amount, split_percentage, description, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            transactionId, 
            splitGroupId, 
            split.receipt_id, 
            split.split_amount, 
            split.split_percentage, 
            split.description, 
            createdBy
          ], function(err) {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            completedSplits++;
            if (completedSplits === totalSplits) {
              db.run('COMMIT', (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(splitGroupId);
                }
              });
            }
          });
        });
      });
    });
  }

  // Recurring expense pattern recognition
  async analyzeRecurringPatterns(transaction, companyId) {
    try {
      const patterns = await this.findMatchingRecurringPatterns(transaction, companyId);
      
      if (patterns.length === 0) {
        // Try to create new pattern if this looks like a recurring expense
        const newPattern = await this.detectNewRecurringPattern(transaction, companyId);
        return newPattern;
      }

      // Score existing patterns
      const scoredPatterns = patterns.map(pattern => ({
        ...pattern,
        matchScore: this.calculateRecurringMatchScore(transaction, pattern),
        variance: this.calculateRecurringVariance(transaction, pattern)
      }));

      // Sort by match score
      scoredPatterns.sort((a, b) => b.matchScore - a.matchScore);

      const bestMatch = scoredPatterns[0];
      
      if (bestMatch.matchScore > 0.7) {
        // Update pattern with new occurrence
        await this.updateRecurringPattern(bestMatch.id, transaction);
        
        return {
          isRecurring: true,
          pattern: bestMatch,
          confidence: bestMatch.matchScore,
          variance: bestMatch.variance
        };
      }

      return { isRecurring: false, pattern: null, confidence: 0 };

    } catch (error) {
      console.error('Error in recurring pattern analysis:', error);
      return { isRecurring: false, pattern: null, confidence: 0 };
    }
  }

  // Find matching recurring patterns
  async findMatchingRecurringPatterns(transaction, companyId) {
    return new Promise((resolve, reject) => {
      const merchantKeywords = this.extractMerchantKeywords(transaction.description);
      const amount = Math.abs(transaction.amount);
      
      db.all(`
        SELECT rp.*, c.name as category_name
        FROM recurring_patterns rp
        LEFT JOIN categories c ON rp.category_id = c.id
        WHERE rp.company_id = ? 
        AND rp.is_active = 1
        AND (
          rp.merchant_pattern LIKE ? 
          OR rp.merchant_pattern LIKE ?
          OR (rp.expected_amount IS NOT NULL AND ABS(rp.expected_amount - ?) <= rp.amount_tolerance)
        )
        ORDER BY rp.occurrence_count DESC
      `, [
        companyId,
        `%${merchantKeywords[0] || ''}%`,
        `%${transaction.description.substring(0, 20)}%`,
        amount
      ], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Detect new recurring pattern
  async detectNewRecurringPattern(transaction, companyId) {
    return new Promise((resolve, reject) => {
      const merchantKeywords = this.extractMerchantKeywords(transaction.description);
      const amount = Math.abs(transaction.amount);
      
      // Look for similar historical transactions
      db.all(`
        SELECT 
          description, amount, transaction_date, category_id,
          COUNT(*) as frequency,
          AVG(ABS(amount)) as avg_amount,
          MIN(transaction_date) as first_occurrence,
          MAX(transaction_date) as last_occurrence
        FROM transactions 
        WHERE company_id = ? 
        AND (
          LOWER(description) LIKE ? 
          OR ABS(amount - ?) <= ?
        )
        AND transaction_date >= date('now', '-365 days')
        GROUP BY LOWER(SUBSTR(description, 1, 20)), ROUND(ABS(amount), 0)
        HAVING frequency >= 3
        ORDER BY frequency DESC
        LIMIT 5
      `, [
        companyId,
        `%${merchantKeywords[0] || transaction.description.substring(0, 10)}%`,
        amount,
        amount * 0.1
      ], async (err, candidates) => {
        if (err) {
          reject(err);
          return;
        }

        if (candidates.length === 0) {
          resolve({ isRecurring: false, pattern: null, confidence: 0 });
          return;
        }

        const bestCandidate = candidates[0];
        
        // Calculate frequency pattern
        const firstDate = moment(bestCandidate.first_occurrence);
        const lastDate = moment(bestCandidate.last_occurrence);
        const daysBetween = lastDate.diff(firstDate, 'days');
        const avgDaysBetween = daysBetween / (bestCandidate.frequency - 1);
        
        let frequency = 'monthly';
        if (avgDaysBetween <= 7) frequency = 'weekly';
        else if (avgDaysBetween <= 35) frequency = 'monthly';
        else if (avgDaysBetween <= 95) frequency = 'quarterly';
        else frequency = 'yearly';

        // Create new recurring pattern
        try {
          const patternId = await this.createRecurringPattern({
            company_id: companyId,
            pattern_name: `Auto-detected: ${transaction.description.substring(0, 30)}`,
            merchant_pattern: merchantKeywords[0] || transaction.description.substring(0, 20),
            amount_pattern: 'range',
            frequency: frequency,
            expected_amount: bestCandidate.avg_amount,
            amount_tolerance: bestCandidate.avg_amount * 0.1,
            category_id: bestCandidate.category_id,
            occurrence_count: bestCandidate.frequency
          });

          resolve({
            isRecurring: true,
            pattern: { id: patternId, frequency, expected_amount: bestCandidate.avg_amount },
            confidence: 0.8,
            isNewPattern: true
          });
        } catch (createError) {
          reject(createError);
        }
      });
    });
  }

  // Calculate recurring match score
  calculateRecurringMatchScore(transaction, pattern) {
    let score = 0;

    // Merchant pattern matching (40%)
    if (pattern.merchant_pattern) {
      const merchantMatch = transaction.description.toLowerCase()
        .includes(pattern.merchant_pattern.toLowerCase());
      if (merchantMatch) score += 0.4;
    }

    // Amount matching (35%)
    if (pattern.expected_amount && pattern.amount_tolerance) {
      const amountDiff = Math.abs(Math.abs(transaction.amount) - pattern.expected_amount);
      if (amountDiff <= pattern.amount_tolerance) {
        score += 0.35;
      } else if (amountDiff <= pattern.amount_tolerance * 2) {
        score += 0.2;
      }
    }

    // Frequency matching (25%)
    if (pattern.next_expected) {
      const transactionDate = moment(transaction.transaction_date);
      const expectedDate = moment(pattern.next_expected);
      const daysDiff = Math.abs(transactionDate.diff(expectedDate, 'days'));
      
      let frequencyDays = 30; // default monthly
      if (pattern.frequency === 'weekly') frequencyDays = 7;
      else if (pattern.frequency === 'quarterly') frequencyDays = 90;
      else if (pattern.frequency === 'yearly') frequencyDays = 365;
      
      const tolerance = frequencyDays * 0.2; // 20% tolerance
      if (daysDiff <= tolerance) {
        score += 0.25;
      } else if (daysDiff <= tolerance * 2) {
        score += 0.1;
      }
    }

    return score;
  }

  // Calculate variance for recurring pattern
  calculateRecurringVariance(transaction, pattern) {
    const variance = {
      amount: 0,
      days: 0
    };

    if (pattern.expected_amount) {
      variance.amount = Math.abs(Math.abs(transaction.amount) - pattern.expected_amount);
    }

    if (pattern.next_expected) {
      const transactionDate = moment(transaction.transaction_date);
      const expectedDate = moment(pattern.next_expected);
      variance.days = Math.abs(transactionDate.diff(expectedDate, 'days'));
    }

    return variance;
  }

  // Create recurring pattern
  async createRecurringPattern(patternData) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO recurring_patterns 
        (company_id, pattern_name, merchant_pattern, amount_pattern, frequency, 
         expected_amount, amount_tolerance, category_id, occurrence_count, last_occurrence, next_expected)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        patternData.company_id,
        patternData.pattern_name,
        patternData.merchant_pattern,
        patternData.amount_pattern,
        patternData.frequency,
        patternData.expected_amount,
        patternData.amount_tolerance,
        patternData.category_id,
        patternData.occurrence_count || 1,
        moment().format('YYYY-MM-DD'),
        this.calculateNextExpectedDate(patternData.frequency)
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Update recurring pattern with new occurrence
  async updateRecurringPattern(patternId, transaction) {
    return new Promise((resolve, reject) => {
      const nextExpected = this.calculateNextExpectedDate(null, transaction.transaction_date);
      
      db.run(`
        UPDATE recurring_patterns 
        SET occurrence_count = occurrence_count + 1,
            last_occurrence = ?,
            next_expected = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [transaction.transaction_date, nextExpected, patternId], function(err) {
        if (err) reject(err);
        else {
          // Create recurring match record
          db.run(`
            INSERT INTO recurring_matches 
            (pattern_id, transaction_id, match_confidence, variance_amount, variance_days)
            VALUES (?, ?, ?, ?, ?)
          `, [patternId, transaction.id, 0.8, 0, 0], (matchErr) => {
            if (matchErr) reject(matchErr);
            else resolve(this.changes);
          });
        }
      });
    });
  }

  // Calendar event correlation
  async analyzeCalendarCorrelation(transaction, companyId, userId) {
    try {
      const correlatedEvents = await this.findCorrelatedCalendarEvents(transaction, companyId, userId);
      
      if (correlatedEvents.length === 0) {
        return { hasCorrelation: false, events: [], confidence: 0 };
      }

      // Score correlations
      const scoredEvents = correlatedEvents.map(event => ({
        ...event,
        correlationScore: this.calculateCalendarCorrelationScore(transaction, event),
        correlationType: this.determineCorrelationType(transaction, event)
      }));

      // Sort by correlation score
      scoredEvents.sort((a, b) => b.correlationScore - a.correlationScore);

      const bestMatch = scoredEvents[0];
      
      if (bestMatch.correlationScore > 0.6) {
        // Create correlation record
        await this.createCalendarCorrelation(bestMatch.id, transaction.id, bestMatch.correlationScore, bestMatch.correlationType);
        
        return {
          hasCorrelation: true,
          events: scoredEvents,
          primaryEvent: bestMatch,
          confidence: bestMatch.correlationScore
        };
      }

      return { hasCorrelation: false, events: scoredEvents, confidence: bestMatch.correlationScore };

    } catch (error) {
      console.error('Error in calendar correlation analysis:', error);
      return { hasCorrelation: false, events: [], confidence: 0 };
    }
  }

  // Find correlated calendar events
  async findCorrelatedCalendarEvents(transaction, companyId, userId) {
    return new Promise((resolve, reject) => {
      const transactionDate = moment(transaction.transaction_date);
      const startDate = transactionDate.clone().subtract(this.calendarCorrelationWindow, 'days').format('YYYY-MM-DD HH:mm:ss');
      const endDate = transactionDate.clone().add(this.calendarCorrelationWindow, 'days').format('YYYY-MM-DD HH:mm:ss');
      
      db.all(`
        SELECT ce.*, c.name as category_name,
               ABS(julianday(?) - julianday(ce.start_date)) as date_diff_days
        FROM calendar_events ce
        LEFT JOIN categories c ON ce.category_id = c.id
        WHERE ce.company_id = ? 
        AND (ce.user_id = ? OR ce.user_id IS NULL)
        AND ce.sync_status = 'active'
        AND (
          (ce.start_date BETWEEN ? AND ?)
          OR (ce.end_date BETWEEN ? AND ?)
          OR (ce.start_date <= ? AND ce.end_date >= ?)
        )
        ORDER BY date_diff_days ASC
        LIMIT 10
      `, [
        transaction.transaction_date,
        companyId,
        userId,
        startDate, endDate,
        startDate, endDate,
        transaction.transaction_date, transaction.transaction_date
      ], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Calculate calendar correlation score
  calculateCalendarCorrelationScore(transaction, event) {
    let score = 0;

    // Time proximity (40%)
    const transactionDate = moment(transaction.transaction_date);
    const eventStartDate = moment(event.start_date);
    const daysDiff = Math.abs(transactionDate.diff(eventStartDate, 'days'));
    
    if (daysDiff === 0) score += 0.4;
    else if (daysDiff <= 1) score += 0.3;
    else if (daysDiff <= 2) score += 0.2;
    else if (daysDiff <= 3) score += 0.1;

    // Amount correlation (25%)
    if (event.estimated_cost) {
      const amountDiff = Math.abs(Math.abs(transaction.amount) - event.estimated_cost);
      const tolerance = event.estimated_cost * 0.2;
      
      if (amountDiff <= tolerance) score += 0.25;
      else if (amountDiff <= tolerance * 2) score += 0.15;
      else if (amountDiff <= tolerance * 3) score += 0.05;
    }

    // Location/merchant correlation (20%)
    if (event.location && transaction.description) {
      const locationKeywords = this.extractLocationKeywords(event.location);
      const descriptionLower = transaction.description.toLowerCase();
      
      for (const keyword of locationKeywords) {
        if (descriptionLower.includes(keyword.toLowerCase())) {
          score += 0.2;
          break;
        }
      }
    }

    // Title/description correlation (15%)
    if (event.title && transaction.description) {
      const titleKeywords = this.extractKeywords(event.title);
      const descriptionLower = transaction.description.toLowerCase();
      
      let keywordMatches = 0;
      for (const keyword of titleKeywords) {
        if (descriptionLower.includes(keyword.toLowerCase())) {
          keywordMatches++;
        }
      }
      
      if (keywordMatches > 0) {
        score += Math.min(0.15, (keywordMatches / titleKeywords.length) * 0.15);
      }
    }

    return Math.min(1, score);
  }

  // Determine correlation type
  determineCorrelationType(transaction, event) {
    const transactionDate = moment(transaction.transaction_date);
    const eventStartDate = moment(event.start_date);
    const daysDiff = Math.abs(transactionDate.diff(eventStartDate, 'days'));
    
    if (daysDiff === 0) return 'time';
    
    if (event.location && transaction.description) {
      const locationKeywords = this.extractLocationKeywords(event.location);
      const descriptionLower = transaction.description.toLowerCase();
      
      for (const keyword of locationKeywords) {
        if (descriptionLower.includes(keyword.toLowerCase())) {
          return 'location';
        }
      }
    }
    
    if (event.estimated_cost) {
      const amountDiff = Math.abs(Math.abs(transaction.amount) - event.estimated_cost);
      const tolerance = event.estimated_cost * 0.2;
      
      if (amountDiff <= tolerance) return 'amount';
    }
    
    return 'merchant';
  }

  // Create calendar correlation
  async createCalendarCorrelation(calendarEventId, transactionId, correlationScore, correlationType) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO calendar_correlations 
        (calendar_event_id, transaction_id, correlation_score, correlation_type)
        VALUES (?, ?, ?, ?)
      `, [calendarEventId, transactionId, correlationScore, correlationType], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Helper methods
  extractMerchantKeywords(description) {
    if (!description) return [];
    
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !/^\d+$/.test(word))
      .slice(0, 3);
  }

  extractLocationKeywords(location) {
    if (!location) return [];
    
    return location
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5);
  }

  extractKeywords(text) {
    if (!text) return [];
    
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .slice(0, 5);
  }

  calculateNextExpectedDate(frequency, fromDate = null) {
    const baseDate = fromDate ? moment(fromDate) : moment();
    
    switch (frequency) {
      case 'weekly':
        return baseDate.add(7, 'days').format('YYYY-MM-DD');
      case 'monthly':
        return baseDate.add(1, 'month').format('YYYY-MM-DD');
      case 'quarterly':
        return baseDate.add(3, 'months').format('YYYY-MM-DD');
      case 'yearly':
        return baseDate.add(1, 'year').format('YYYY-MM-DD');
      default:
        return baseDate.add(1, 'month').format('YYYY-MM-DD');
    }
  }

  // Get transaction splits
  async getTransactionSplits(transactionId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT ts.*, r.filename, r.original_filename, r.extracted_amount
        FROM transaction_splits ts
        JOIN receipts r ON ts.receipt_id = r.id
        WHERE ts.transaction_id = ?
        ORDER BY ts.split_amount DESC
      `, [transactionId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Get recurring patterns
  async getRecurringPatterns(companyId, isActive = true) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT rp.*, c.name as category_name
        FROM recurring_patterns rp
        LEFT JOIN categories c ON rp.category_id = c.id
        WHERE rp.company_id = ? AND rp.is_active = ?
        ORDER BY rp.occurrence_count DESC, rp.updated_at DESC
      `, [companyId, isActive ? 1 : 0], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Get calendar correlations
  async getCalendarCorrelations(companyId, userId = null) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT cc.*, ce.title, ce.start_date, ce.location, ce.estimated_cost,
               t.description, t.amount, t.transaction_date
        FROM calendar_correlations cc
        JOIN calendar_events ce ON cc.calendar_event_id = ce.id
        JOIN transactions t ON cc.transaction_id = t.id
        WHERE ce.company_id = ?
      `;
      
      const params = [companyId];
      
      if (userId) {
        query += ' AND ce.user_id = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY cc.correlation_score DESC, cc.created_at DESC';
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
}

module.exports = new AdvancedMatchingService();
