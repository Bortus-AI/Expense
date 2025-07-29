const db = require('../database/init');
const moment = require('moment');

class FraudDetectionService {
  constructor() {
    this.riskThresholds = {
      unusual_amount: 0.7,
      suspicious_merchant: 0.6,
      time_anomaly: 0.5,
      location_anomaly: 0.8,
      duplicate_risk: 0.9
    };
    
    this.amountThresholds = {
      high_amount: 1000,
      very_high_amount: 5000,
      extreme_amount: 10000
    };
  }

  // Main fraud detection entry point
  async analyzeTransaction(transaction, companyId) {
    try {
      const alerts = [];
      let maxRiskScore = 0;

      // 1. Unusual amount detection
      const amountAlert = await this.detectUnusualAmount(transaction, companyId);
      if (amountAlert) {
        alerts.push(amountAlert);
        maxRiskScore = Math.max(maxRiskScore, amountAlert.risk_score);
      }

      // 2. Suspicious merchant detection
      const merchantAlert = await this.detectSuspiciousMerchant(transaction, companyId);
      if (merchantAlert) {
        alerts.push(merchantAlert);
        maxRiskScore = Math.max(maxRiskScore, merchantAlert.risk_score);
      }

      // 3. Time anomaly detection
      const timeAlert = await this.detectTimeAnomaly(transaction, companyId);
      if (timeAlert) {
        alerts.push(timeAlert);
        maxRiskScore = Math.max(maxRiskScore, timeAlert.risk_score);
      }

      // 4. Duplicate transaction detection
      const duplicateAlert = await this.detectDuplicateTransaction(transaction, companyId);
      if (duplicateAlert) {
        alerts.push(duplicateAlert);
        maxRiskScore = Math.max(maxRiskScore, duplicateAlert.risk_score);
      }

      // 5. Pattern-based fraud detection
      const patternAlert = await this.detectFraudPatterns(transaction, companyId);
      if (patternAlert) {
        alerts.push(patternAlert);
        maxRiskScore = Math.max(maxRiskScore, patternAlert.risk_score);
      }

      // Store alerts in database
      for (const alert of alerts) {
        await this.createFraudAlert(companyId, transaction.id, null, alert.alert_type, alert.risk_score, alert.description);
      }

      return {
        riskScore: maxRiskScore,
        alerts: alerts,
        requiresReview: maxRiskScore >= 0.5
      };

    } catch (error) {
      console.error('Error in fraud detection:', error);
      return { riskScore: 0, alerts: [], requiresReview: false };
    }
  }

  // Analyze receipt for fraud indicators
  async analyzeReceipt(receipt, companyId) {
    try {
      const alerts = [];
      let maxRiskScore = 0;

      // 1. Receipt validation fraud indicators
      const validationAlert = await this.detectReceiptValidationFraud(receipt);
      if (validationAlert) {
        alerts.push(validationAlert);
        maxRiskScore = Math.max(maxRiskScore, validationAlert.risk_score);
      }

      // 2. OCR inconsistency detection
      const ocrAlert = await this.detectOCRInconsistencies(receipt);
      if (ocrAlert) {
        alerts.push(ocrAlert);
        maxRiskScore = Math.max(maxRiskScore, ocrAlert.risk_score);
      }

      // 3. Duplicate receipt detection
      const duplicateAlert = await this.detectDuplicateReceipt(receipt, companyId);
      if (duplicateAlert) {
        alerts.push(duplicateAlert);
        maxRiskScore = Math.max(maxRiskScore, duplicateAlert.risk_score);
      }

      // Store alerts in database
      for (const alert of alerts) {
        await this.createFraudAlert(companyId, null, receipt.id, alert.alert_type, alert.risk_score, alert.description);
      }

      return {
        riskScore: maxRiskScore,
        alerts: alerts,
        requiresReview: maxRiskScore >= 0.5
      };

    } catch (error) {
      console.error('Error in receipt fraud detection:', error);
      return { riskScore: 0, alerts: [], requiresReview: false };
    }
  }

  // Detect unusual amounts based on historical patterns
  async detectUnusualAmount(transaction, companyId) {
    return new Promise((resolve, reject) => {
      const amount = Math.abs(transaction.amount);
      
      // Get historical spending patterns
      db.all(`
        SELECT 
          AVG(ABS(amount)) as avg_amount,
          MAX(ABS(amount)) as max_amount,
          MIN(ABS(amount)) as min_amount,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE company_id = ? 
        AND created_at >= date('now', '-90 days')
        AND id != ?
      `, [companyId, transaction.id || 0], (err, stats) => {
        if (err) {
          reject(err);
          return;
        }

        if (!stats[0] || stats[0].transaction_count < 10) {
          resolve(null); // Not enough data
          return;
        }

        const avgAmount = stats[0].avg_amount;
        const maxAmount = stats[0].max_amount;
        let riskScore = 0;
        let description = '';

        // Check for extremely high amounts
        if (amount > this.amountThresholds.extreme_amount) {
          riskScore = 0.9;
          description = `Extremely high amount: $${amount} (threshold: $${this.amountThresholds.extreme_amount})`;
        } else if (amount > this.amountThresholds.very_high_amount) {
          riskScore = 0.7;
          description = `Very high amount: $${amount} (threshold: $${this.amountThresholds.very_high_amount})`;
        } else if (amount > this.amountThresholds.high_amount) {
          riskScore = 0.5;
          description = `High amount: $${amount} (threshold: $${this.amountThresholds.high_amount})`;
        }

        // Check against historical patterns
        if (avgAmount > 0) {
          const deviationRatio = amount / avgAmount;
          if (deviationRatio > 10) {
            riskScore = Math.max(riskScore, 0.8);
            description = `Amount ${deviationRatio.toFixed(1)}x higher than average ($${avgAmount.toFixed(2)})`;
          } else if (deviationRatio > 5) {
            riskScore = Math.max(riskScore, 0.6);
            description = `Amount ${deviationRatio.toFixed(1)}x higher than average ($${avgAmount.toFixed(2)})`;
          } else if (deviationRatio > 3) {
            riskScore = Math.max(riskScore, 0.4);
            description = `Amount ${deviationRatio.toFixed(1)}x higher than average ($${avgAmount.toFixed(2)})`;
          }
        }

        if (riskScore >= this.riskThresholds.unusual_amount) {
          resolve({
            alert_type: 'unusual_amount',
            risk_score: riskScore,
            description: description
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Detect suspicious merchants
  async detectSuspiciousMerchant(transaction, companyId) {
    return new Promise((resolve, reject) => {
      const description = transaction.description.toLowerCase();
      
      // Suspicious patterns
      const suspiciousPatterns = [
        { pattern: /cash\s*advance/i, risk: 0.9, desc: 'Cash advance transaction' },
        { pattern: /atm\s*withdrawal/i, risk: 0.7, desc: 'ATM withdrawal' },
        { pattern: /money\s*transfer/i, risk: 0.8, desc: 'Money transfer service' },
        { pattern: /bitcoin|crypto|btc|eth/i, risk: 0.8, desc: 'Cryptocurrency transaction' },
        { pattern: /gambling|casino|poker|lottery/i, risk: 0.9, desc: 'Gambling-related transaction' },
        { pattern: /adult|xxx|escort/i, risk: 0.9, desc: 'Adult services transaction' },
        { pattern: /unknown\s*merchant/i, risk: 0.6, desc: 'Unknown merchant' },
        { pattern: /temp\s*auth/i, risk: 0.5, desc: 'Temporary authorization' }
      ];

      let maxRisk = 0;
      let alertDescription = '';

      for (const { pattern, risk, desc } of suspiciousPatterns) {
        if (pattern.test(description)) {
          if (risk > maxRisk) {
            maxRisk = risk;
            alertDescription = desc;
          }
        }
      }

      // Check for unusual merchant patterns
      db.get(`
        SELECT COUNT(*) as merchant_count
        FROM transactions 
        WHERE company_id = ? 
        AND LOWER(description) LIKE ?
        AND created_at >= date('now', '-365 days')
      `, [companyId, `%${description.substring(0, 20)}%`], (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        // New merchant with high amount
        if (result.merchant_count === 1 && Math.abs(transaction.amount) > this.amountThresholds.high_amount) {
          maxRisk = Math.max(maxRisk, 0.6);
          alertDescription = alertDescription || 'New merchant with high amount';
        }

        if (maxRisk >= this.riskThresholds.suspicious_merchant) {
          resolve({
            alert_type: 'suspicious_merchant',
            risk_score: maxRisk,
            description: alertDescription
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Detect time-based anomalies
  async detectTimeAnomaly(transaction, companyId) {
    return new Promise((resolve, reject) => {
      const transactionDate = moment(transaction.transaction_date);
      const hour = transactionDate.hour();
      const dayOfWeek = transactionDate.day();
      
      // Get historical time patterns
      db.all(`
        SELECT 
          strftime('%H', transaction_date) as hour,
          strftime('%w', transaction_date) as day_of_week,
          COUNT(*) as frequency
        FROM transactions 
        WHERE company_id = ? 
        AND created_at >= date('now', '-90 days')
        AND id != ?
        GROUP BY strftime('%H', transaction_date), strftime('%w', transaction_date)
        ORDER BY frequency DESC
      `, [companyId, transaction.id || 0], (err, patterns) => {
        if (err) {
          reject(err);
          return;
        }

        if (patterns.length < 5) {
          resolve(null); // Not enough data
          return;
        }

        let riskScore = 0;
        let description = '';

        // Check for unusual hours (very late night or very early morning)
        if (hour >= 23 || hour <= 5) {
          riskScore = 0.6;
          description = `Transaction at unusual hour: ${hour}:00`;
        }

        // Check for weekend transactions if company typically doesn't have weekend activity
        const weekendTransactions = patterns.filter(p => p.day_of_week === '0' || p.day_of_week === '6');
        const totalWeekendFreq = weekendTransactions.reduce((sum, p) => sum + p.frequency, 0);
        const totalFreq = patterns.reduce((sum, p) => sum + p.frequency, 0);
        
        if ((dayOfWeek === 0 || dayOfWeek === 6) && totalWeekendFreq / totalFreq < 0.1) {
          riskScore = Math.max(riskScore, 0.4);
          description = description || 'Weekend transaction (unusual for this company)';
        }

        // Check for holiday transactions
        if (this.isHoliday(transactionDate)) {
          riskScore = Math.max(riskScore, 0.3);
          description = description || 'Holiday transaction';
        }

        if (riskScore >= this.riskThresholds.time_anomaly) {
          resolve({
            alert_type: 'time_anomaly',
            risk_score: riskScore,
            description: description
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Detect duplicate transactions
  async detectDuplicateTransaction(transaction, companyId) {
    return new Promise((resolve, reject) => {
      const amount = transaction.amount;
      const date = moment(transaction.transaction_date);
      const description = transaction.description;

      // Look for potential duplicates within 7 days
      db.all(`
        SELECT id, description, amount, transaction_date,
               ABS(julianday(?) - julianday(transaction_date)) as date_diff
        FROM transactions 
        WHERE company_id = ? 
        AND id != ?
        AND ABS(amount - ?) < 0.01
        AND ABS(julianday(?) - julianday(transaction_date)) <= 7
        ORDER BY date_diff ASC
        LIMIT 5
      `, [date.format('YYYY-MM-DD'), companyId, transaction.id || 0, amount, date.format('YYYY-MM-DD')], (err, duplicates) => {
        if (err) {
          reject(err);
          return;
        }

        if (duplicates.length === 0) {
          resolve(null);
          return;
        }

        let highestRisk = 0;
        let bestMatch = null;

        for (const dup of duplicates) {
          let riskScore = 0;
          
          // Exact amount match
          if (Math.abs(dup.amount - amount) < 0.01) {
            riskScore += 0.4;
          }

          // Similar description
          const similarity = this.calculateStringSimilarity(description, dup.description);
          riskScore += similarity * 0.4;

          // Time proximity (higher risk for closer times)
          const daysDiff = dup.date_diff;
          if (daysDiff < 1) {
            riskScore += 0.3;
          } else if (daysDiff < 3) {
            riskScore += 0.2;
          } else {
            riskScore += 0.1;
          }

          if (riskScore > highestRisk) {
            highestRisk = riskScore;
            bestMatch = dup;
          }
        }

        if (highestRisk >= this.riskThresholds.duplicate_risk) {
          resolve({
            alert_type: 'duplicate_transaction',
            risk_score: highestRisk,
            description: `Potential duplicate of transaction from ${moment(bestMatch.transaction_date).format('MM/DD/YYYY')}`
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Detect fraud patterns based on ML
  async detectFraudPatterns(transaction, companyId) {
    try {
      // This would integrate with more sophisticated ML models
      // For now, implement rule-based pattern detection
      
      const patterns = await this.getKnownFraudPatterns(companyId);
      let maxRisk = 0;
      let description = '';

      for (const pattern of patterns) {
        const risk = this.evaluateTransactionAgainstPattern(transaction, pattern);
        if (risk > maxRisk) {
          maxRisk = risk;
          description = `Matches fraud pattern: ${pattern.description}`;
        }
      }

      if (maxRisk >= 0.5) {
        return {
          alert_type: 'fraud_pattern',
          risk_score: maxRisk,
          description: description
        };
      }

      return null;
    } catch (error) {
      console.error('Error in pattern-based fraud detection:', error);
      return null;
    }
  }

  // Detect receipt validation fraud
  async detectReceiptValidationFraud(receipt) {
    let riskScore = 0;
    const alerts = [];

    // Check for missing or suspicious OCR data
    if (!receipt.ocr_text || receipt.ocr_text.length < 50) {
      riskScore = Math.max(riskScore, 0.6);
      alerts.push('Receipt has insufficient OCR text');
    }

    // Check for amount extraction issues
    if (!receipt.extracted_amount || receipt.extracted_amount <= 0) {
      riskScore = Math.max(riskScore, 0.5);
      alerts.push('Could not extract valid amount from receipt');
    }

    // Check for date extraction issues
    if (!receipt.extracted_date) {
      riskScore = Math.max(riskScore, 0.4);
      alerts.push('Could not extract date from receipt');
    }

    // Check for very old receipts
    if (receipt.extracted_date) {
      const receiptDate = moment(receipt.extracted_date);
      const daysDiff = moment().diff(receiptDate, 'days');
      
      if (daysDiff > 365) {
        riskScore = Math.max(riskScore, 0.7);
        alerts.push(`Receipt is ${daysDiff} days old`);
      } else if (daysDiff > 90) {
        riskScore = Math.max(riskScore, 0.4);
        alerts.push(`Receipt is ${daysDiff} days old`);
      }
    }

    if (riskScore >= 0.4) {
      return {
        alert_type: 'receipt_validation',
        risk_score: riskScore,
        description: alerts.join('; ')
      };
    }

    return null;
  }

  // Detect OCR inconsistencies
  async detectOCRInconsistencies(receipt) {
    if (!receipt.ocr_text) return null;

    let riskScore = 0;
    const alerts = [];

    // Check for suspicious text patterns
    const suspiciousPatterns = [
      /photoshop|edited|modified/i,
      /copy|duplicate|reprint/i,
      /void|cancelled|refund/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(receipt.ocr_text)) {
        riskScore = Math.max(riskScore, 0.8);
        alerts.push(`Suspicious text detected: ${pattern.source}`);
      }
    }

    // Check for amount inconsistencies
    const amounts = this.extractAmountsFromText(receipt.ocr_text);
    if (amounts.length > 1) {
      const uniqueAmounts = [...new Set(amounts)];
      if (uniqueAmounts.length > 1 && receipt.extracted_amount) {
        const hasMatchingAmount = uniqueAmounts.some(amt => Math.abs(amt - receipt.extracted_amount) < 0.01);
        if (!hasMatchingAmount) {
          riskScore = Math.max(riskScore, 0.6);
          alerts.push('Extracted amount does not match amounts found in OCR text');
        }
      }
    }

    if (riskScore >= 0.5) {
      return {
        alert_type: 'ocr_inconsistency',
        risk_score: riskScore,
        description: alerts.join('; ')
      };
    }

    return null;
  }

  // Detect duplicate receipts
  async detectDuplicateReceipt(receipt, companyId) {
    return new Promise((resolve, reject) => {
      if (!receipt.extracted_amount || !receipt.extracted_date) {
        resolve(null);
        return;
      }

      db.all(`
        SELECT id, filename, extracted_amount, extracted_date, extracted_merchant
        FROM receipts 
        WHERE company_id = ? 
        AND id != ?
        AND ABS(extracted_amount - ?) < 0.01
        AND ABS(julianday(?) - julianday(extracted_date)) <= 30
        LIMIT 5
      `, [companyId, receipt.id || 0, receipt.extracted_amount, receipt.extracted_date], (err, duplicates) => {
        if (err) {
          reject(err);
          return;
        }

        if (duplicates.length === 0) {
          resolve(null);
          return;
        }

        let highestRisk = 0;
        let bestMatch = null;

        for (const dup of duplicates) {
          let riskScore = 0;
          
          // Exact amount match
          riskScore += 0.4;

          // Merchant similarity
          if (receipt.extracted_merchant && dup.extracted_merchant) {
            const similarity = this.calculateStringSimilarity(receipt.extracted_merchant, dup.extracted_merchant);
            riskScore += similarity * 0.4;
          }

          // Date proximity
          const daysDiff = Math.abs(moment(receipt.extracted_date).diff(moment(dup.extracted_date), 'days'));
          if (daysDiff === 0) {
            riskScore += 0.3;
          } else if (daysDiff <= 1) {
            riskScore += 0.2;
          } else {
            riskScore += 0.1;
          }

          if (riskScore > highestRisk) {
            highestRisk = riskScore;
            bestMatch = dup;
          }
        }

        if (highestRisk >= 0.7) {
          resolve({
            alert_type: 'duplicate_receipt',
            risk_score: highestRisk,
            description: `Potential duplicate of receipt ${bestMatch.filename}`
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  // Helper methods
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  levenshteinDistance(str1, str2) {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  extractAmountsFromText(text) {
    const amountRegex = /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g;
    const amounts = [];
    let match;
    
    while ((match = amountRegex.exec(text)) !== null) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (amount > 0) {
        amounts.push(amount);
      }
    }
    
    return amounts;
  }

  isHoliday(date) {
    // Simple holiday detection - can be expanded
    const month = date.month() + 1;
    const day = date.date();
    
    const holidays = [
      { month: 1, day: 1 },   // New Year's Day
      { month: 7, day: 4 },   // Independence Day
      { month: 12, day: 25 }, // Christmas
      { month: 11, day: 11 }  // Veterans Day
    ];
    
    return holidays.some(h => h.month === month && h.day === day);
  }

  async getKnownFraudPatterns(companyId) {
    // This would typically load from a database of known fraud patterns
    // For now, return some basic patterns
    return [
      {
        description: 'Round number transactions',
        pattern: { type: 'amount', condition: 'round_number' },
        risk: 0.3
      },
      {
        description: 'Multiple transactions same merchant same day',
        pattern: { type: 'frequency', condition: 'same_merchant_same_day' },
        risk: 0.6
      }
    ];
  }

  evaluateTransactionAgainstPattern(transaction, pattern) {
    // Simple pattern evaluation - would be more sophisticated in practice
    if (pattern.pattern.type === 'amount' && pattern.pattern.condition === 'round_number') {
      const amount = Math.abs(transaction.amount);
      if (amount % 100 === 0 && amount >= 500) {
        return pattern.risk;
      }
    }
    
    return 0;
  }

  // Create fraud alert in database
  async createFraudAlert(companyId, transactionId, receiptId, alertType, riskScore, description) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO fraud_alerts 
        (company_id, transaction_id, receipt_id, alert_type, risk_score, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [companyId, transactionId, receiptId, alertType, riskScore, description], 
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Get fraud alerts for review
  async getFraudAlerts(companyId, status = 'pending') {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT fa.*, t.description as transaction_description, t.amount, t.transaction_date,
               r.filename as receipt_filename, r.extracted_amount
        FROM fraud_alerts fa
        LEFT JOIN transactions t ON fa.transaction_id = t.id
        LEFT JOIN receipts r ON fa.receipt_id = r.id
        WHERE fa.company_id = ? AND fa.status = ?
        ORDER BY fa.risk_score DESC, fa.created_at DESC
      `, [companyId, status], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Update fraud alert status
  async updateFraudAlertStatus(alertId, status, reviewedBy) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE fraud_alerts 
        SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, reviewedBy, alertId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Get fraud detection statistics
  async getFraudStats(companyId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          alert_type,
          COUNT(*) as alert_count,
          AVG(risk_score) as avg_risk_score,
          COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_count,
          COUNT(CASE WHEN status = 'dismissed' THEN 1 END) as dismissed_count
        FROM fraud_alerts 
        WHERE company_id = ?
        GROUP BY alert_type
        ORDER BY alert_count DESC
      `, [companyId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = new FraudDetectionService();
