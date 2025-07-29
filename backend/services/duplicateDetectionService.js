const db = require('../database/init');
const moment = require('moment');
const llmService = require('./llmService');

class DuplicateDetectionService {
  constructor() {
    this.similarityThreshold = 0.8;
    this.amountTolerance = 0.05; // 5% tolerance for amount differences
  }

  // Main duplicate detection for transactions
  async detectDuplicateTransactions(transaction, companyId) {
    try {
      const duplicates = await this.findSimilarTransactions(transaction, companyId);
      
      if (duplicates.length === 0) {
        return { isDuplicate: false, duplicates: [], confidence: 0 };
      }

      // Calculate similarity scores
      const scoredDuplicates = duplicates.map(dup => ({
        ...dup,
        similarity: this.calculateTransactionSimilarity(transaction, dup),
        reasons: this.getTransactionSimilarityReasons(transaction, dup)
      }));

      // Sort by similarity score
      scoredDuplicates.sort((a, b) => b.similarity - a.similarity);

      const highestSimilarity = scoredDuplicates[0].similarity;
      const isDuplicate = highestSimilarity >= this.similarityThreshold;

      // Create duplicate group if high confidence
      if (isDuplicate && highestSimilarity >= 0.9) {
        await this.createDuplicateGroup(transaction, scoredDuplicates[0], companyId, highestSimilarity);
      }

      return {
        isDuplicate,
        duplicates: scoredDuplicates,
        confidence: highestSimilarity,
        primaryDuplicate: scoredDuplicates[0]
      };

    } catch (error) {
      console.error('Error in duplicate detection:', error);
      return { isDuplicate: false, duplicates: [], confidence: 0 };
    }
  }

  // Main duplicate detection for receipts
  async detectDuplicateReceipts(receipt, companyId) {
    try {
      const duplicates = await this.findSimilarReceipts(receipt, companyId);
      
      if (duplicates.length === 0) {
        return { isDuplicate: false, duplicates: [], confidence: 0 };
      }

      // Calculate similarity scores
      const scoredDuplicates = duplicates.map(dup => ({
        ...dup,
        similarity: this.calculateReceiptSimilarity(receipt, dup),
        reasons: this.getReceiptSimilarityReasons(receipt, dup)
      }));

      // Sort by similarity score
      scoredDuplicates.sort((a, b) => b.similarity - a.similarity);

      const highestSimilarity = scoredDuplicates[0].similarity;
      const isDuplicate = highestSimilarity >= this.similarityThreshold;

      return {
        isDuplicate,
        duplicates: scoredDuplicates,
        confidence: highestSimilarity,
        primaryDuplicate: scoredDuplicates[0]
      };

    } catch (error) {
      console.error('Error in receipt duplicate detection:', error);
      return { isDuplicate: false, duplicates: [], confidence: 0 };
    }
  }

  // Find similar transactions based on multiple criteria
  async findSimilarTransactions(transaction, companyId) {
    return new Promise((resolve, reject) => {
      const transactionDate = moment(transaction.transaction_date);
      const startDate = transactionDate.clone().subtract(this.timeWindowDays, 'days').format('YYYY-MM-DD');
      const endDate = transactionDate.clone().add(this.timeWindowDays, 'days').format('YYYY-MM-DD');

      db.all(`
        SELECT 
          id, description, amount, transaction_date, 
          chase_transaction_id, external_transaction_id,
          ABS(julianday(?) - julianday(transaction_date)) as date_diff_days,
          ABS(amount - ?) as amount_diff
        FROM transactions 
        WHERE company_id = ? 
        AND id != ?
        AND transaction_date BETWEEN ? AND ?
        AND (
          ABS(amount - ?) <= ? 
          OR LOWER(description) LIKE ?
          OR (chase_transaction_id IS NOT NULL AND chase_transaction_id = ?)
          OR (external_transaction_id IS NOT NULL AND external_transaction_id = ?)
        )
        ORDER BY date_diff_days ASC, amount_diff ASC
        LIMIT 20
      `, [
        transaction.transaction_date,
        transaction.amount,
        companyId,
        transaction.id || 0,
        startDate,
        endDate,
        transaction.amount,
        this.amountTolerance,
        `%${transaction.description.toLowerCase().substring(0, 15)}%`,
        transaction.chase_transaction_id || '',
        transaction.external_transaction_id || ''
      ], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Find similar receipts based on multiple criteria
  async findSimilarReceipts(receipt, companyId) {
    return new Promise((resolve, reject) => {
      if (!receipt.extracted_date || !receipt.extracted_amount) {
        resolve([]);
        return;
      }

      const receiptDate = moment(receipt.extracted_date);
      const startDate = receiptDate.clone().subtract(this.timeWindowDays, 'days').format('YYYY-MM-DD');
      const endDate = receiptDate.clone().add(this.timeWindowDays, 'days').format('YYYY-MM-DD');

      db.all(`
        SELECT 
          id, filename, original_filename, extracted_amount, extracted_date, 
          extracted_merchant, file_size, ocr_text,
          ABS(julianday(?) - julianday(extracted_date)) as date_diff_days,
          ABS(extracted_amount - ?) as amount_diff
        FROM receipts 
        WHERE company_id = ? 
        AND id != ?
        AND extracted_date BETWEEN ? AND ?
        AND ABS(extracted_amount - ?) <= ?
        ORDER BY date_diff_days ASC, amount_diff ASC
        LIMIT 10
      `, [
        receipt.extracted_date,
        receipt.extracted_amount,
        companyId,
        receipt.id || 0,
        startDate,
        endDate,
        receipt.extracted_amount,
        this.amountTolerance
      ], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }

  // Calculate similarity score between two transactions
  calculateTransactionSimilarity(trans1, trans2) {
    let score = 0;
    let maxScore = 0;

    // Amount similarity (40% weight)
    const amountWeight = 0.4;
    maxScore += amountWeight;
    const amountDiff = Math.abs(trans1.amount - trans2.amount);
    if (amountDiff <= this.amountTolerance) {
      score += amountWeight;
    } else if (amountDiff <= 1.0) {
      score += amountWeight * 0.8;
    } else if (amountDiff <= 5.0) {
      score += amountWeight * 0.5;
    }

    // Description similarity (30% weight)
    const descWeight = 0.3;
    maxScore += descWeight;
    const descSimilarity = this.calculateStringSimilarity(trans1.description, trans2.description);
    score += descSimilarity * descWeight;

    // Date similarity (20% weight)
    const dateWeight = 0.2;
    maxScore += dateWeight;
    const daysDiff = Math.abs(moment(trans1.transaction_date).diff(moment(trans2.transaction_date), 'days'));
    if (daysDiff === 0) {
      score += dateWeight;
    } else if (daysDiff <= 1) {
      score += dateWeight * 0.8;
    } else if (daysDiff <= 3) {
      score += dateWeight * 0.5;
    } else if (daysDiff <= 7) {
      score += dateWeight * 0.2;
    }

    // Transaction ID similarity (10% weight)
    const idWeight = 0.1;
    maxScore += idWeight;
    if (trans1.chase_transaction_id && trans2.chase_transaction_id && 
        trans1.chase_transaction_id === trans2.chase_transaction_id) {
      score += idWeight;
    } else if (trans1.external_transaction_id && trans2.external_transaction_id && 
               trans1.external_transaction_id === trans2.external_transaction_id) {
      score += idWeight;
    }

    return score / maxScore;
  }

  // Calculate similarity score between two receipts
  calculateReceiptSimilarity(receipt1, receipt2) {
    let score = 0;
    let maxScore = 0;

    // Amount similarity (40% weight)
    const amountWeight = 0.4;
    maxScore += amountWeight;
    const amountDiff = Math.abs(receipt1.extracted_amount - receipt2.extracted_amount);
    if (amountDiff <= this.amountTolerance) {
      score += amountWeight;
    } else if (amountDiff <= 1.0) {
      score += amountWeight * 0.8;
    }

    // Date similarity (25% weight)
    const dateWeight = 0.25;
    maxScore += dateWeight;
    const daysDiff = Math.abs(moment(receipt1.extracted_date).diff(moment(receipt2.extracted_date), 'days'));
    if (daysDiff === 0) {
      score += dateWeight;
    } else if (daysDiff <= 1) {
      score += dateWeight * 0.8;
    } else if (daysDiff <= 3) {
      score += dateWeight * 0.5;
    }

    // Merchant similarity (20% weight)
    const merchantWeight = 0.2;
    maxScore += merchantWeight;
    if (receipt1.extracted_merchant && receipt2.extracted_merchant) {
      const merchantSimilarity = this.calculateStringSimilarity(
        receipt1.extracted_merchant, 
        receipt2.extracted_merchant
      );
      score += merchantSimilarity * merchantWeight;
    }

    // File size similarity (10% weight) - similar file sizes might indicate same image
    const sizeWeight = 0.1;
    maxScore += sizeWeight;
    if (receipt1.file_size && receipt2.file_size) {
      const sizeDiff = Math.abs(receipt1.file_size - receipt2.file_size);
      const avgSize = (receipt1.file_size + receipt2.file_size) / 2;
      const sizeRatio = 1 - (sizeDiff / avgSize);
      if (sizeRatio > 0.9) {
        score += sizeWeight;
      } else if (sizeRatio > 0.7) {
        score += sizeWeight * 0.5;
      }
    }

    // OCR text similarity (5% weight)
    const ocrWeight = 0.05;
    maxScore += ocrWeight;
    if (receipt1.ocr_text && receipt2.ocr_text) {
      const ocrSimilarity = this.calculateStringSimilarity(
        receipt1.ocr_text.substring(0, 200), 
        receipt2.ocr_text.substring(0, 200)
      );
      score += ocrSimilarity * ocrWeight;
    }

    return score / maxScore;
  }

  // Get reasons for transaction similarity
  getTransactionSimilarityReasons(trans1, trans2) {
    const reasons = [];

    // Amount check
    const amountDiff = Math.abs(trans1.amount - trans2.amount);
    if (amountDiff <= this.amountTolerance) {
      reasons.push('Identical amounts');
    } else if (amountDiff <= 1.0) {
      reasons.push(`Similar amounts (diff: $${amountDiff.toFixed(2)})`);
    }

    // Description check
    const descSimilarity = this.calculateStringSimilarity(trans1.description, trans2.description);
    if (descSimilarity > 0.8) {
      reasons.push('Very similar descriptions');
    } else if (descSimilarity > 0.6) {
      reasons.push('Similar descriptions');
    }

    // Date check
    const daysDiff = Math.abs(moment(trans1.transaction_date).diff(moment(trans2.transaction_date), 'days'));
    if (daysDiff === 0) {
      reasons.push('Same date');
    } else if (daysDiff <= 1) {
      reasons.push('Adjacent dates');
    } else if (daysDiff <= 7) {
      reasons.push(`Within ${daysDiff} days`);
    }

    // Transaction ID check
    if (trans1.chase_transaction_id && trans2.chase_transaction_id && 
        trans1.chase_transaction_id === trans2.chase_transaction_id) {
      reasons.push('Same Chase transaction ID');
    }

    return reasons;
  }

  // Get reasons for receipt similarity
  getReceiptSimilarityReasons(receipt1, receipt2) {
    const reasons = [];

    // Amount check
    const amountDiff = Math.abs(receipt1.extracted_amount - receipt2.extracted_amount);
    if (amountDiff <= this.amountTolerance) {
      reasons.push('Identical amounts');
    }

    // Date check
    const daysDiff = Math.abs(moment(receipt1.extracted_date).diff(moment(receipt2.extracted_date), 'days'));
    if (daysDiff === 0) {
      reasons.push('Same date');
    } else if (daysDiff <= 1) {
      reasons.push('Adjacent dates');
    }

    // Merchant check
    if (receipt1.extracted_merchant && receipt2.extracted_merchant) {
      const merchantSimilarity = this.calculateStringSimilarity(
        receipt1.extracted_merchant, 
        receipt2.extracted_merchant
      );
      if (merchantSimilarity > 0.8) {
        reasons.push('Same merchant');
      } else if (merchantSimilarity > 0.6) {
        reasons.push('Similar merchant');
      }
    }

    // File size check
    if (receipt1.file_size && receipt2.file_size) {
      const sizeDiff = Math.abs(receipt1.file_size - receipt2.file_size);
      if (sizeDiff < 1000) { // Less than 1KB difference
        reasons.push('Similar file size');
      }
    }

    return reasons;
  }

  // Calculate string similarity using Levenshtein distance
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer.toLowerCase(), shorter.toLowerCase());
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance calculation
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

  // Create duplicate group in database
  async createDuplicateGroup(transaction, duplicateTransaction, companyId, confidence) {
    return new Promise((resolve, reject) => {
      const groupHash = this.generateGroupHash([transaction, duplicateTransaction]);
      
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Create duplicate group
        db.run(`
          INSERT INTO duplicate_groups 
          (company_id, group_hash, primary_transaction_id, duplicate_count, confidence_score)
          VALUES (?, ?, ?, ?, ?)
        `, [companyId, groupHash, duplicateTransaction.id, 2, confidence * 100], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          const groupId = this.lastID;

          // Add primary transaction
          db.run(`
            INSERT INTO duplicate_transactions 
            (duplicate_group_id, transaction_id, is_primary, similarity_score)
            VALUES (?, ?, ?, ?)
          `, [groupId, duplicateTransaction.id, true, confidence], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Add duplicate transaction
            db.run(`
              INSERT INTO duplicate_transactions 
              (duplicate_group_id, transaction_id, is_primary, similarity_score)
              VALUES (?, ?, ?, ?)
            `, [groupId, transaction.id, false, confidence], (err) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              db.run('COMMIT', (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(groupId);
                }
              });
            });
          });
        });
      });
    });
  }

  // Generate hash for duplicate group
  generateGroupHash(transactions) {
    const sortedTransactions = transactions.sort((a, b) => {
      if (a.id && b.id) return a.id - b.id;
      return a.amount - b.amount;
    });
    
    const hashInput = sortedTransactions.map(t => 
      `${t.amount}_${t.description}_${t.transaction_date}`
    ).join('|');
    
    return crypto.createHash('md5').update(hashInput).digest('hex');
  }

  // Get duplicate groups for review
  async getDuplicateGroups(companyId, status = 'pending') {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          dg.*,
          COUNT(dt.id) as transaction_count,
          GROUP_CONCAT(t.description, ' | ') as descriptions,
          GROUP_CONCAT(t.amount, ' | ') as amounts,
          GROUP_CONCAT(t.transaction_date, ' | ') as dates
        FROM duplicate_groups dg
        JOIN duplicate_transactions dt ON dg.id = dt.duplicate_group_id
        JOIN transactions t ON dt.transaction_id = t.id
        WHERE dg.company_id = ? AND dg.status = ?
        GROUP BY dg.id
        ORDER BY dg.confidence_score DESC, dg.created_at DESC
      `, [companyId, status], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Get transactions in a duplicate group
  async getDuplicateGroupTransactions(groupId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT t.*, dt.is_primary, dt.similarity_score
        FROM duplicate_transactions dt
        JOIN transactions t ON dt.transaction_id = t.id
        WHERE dt.duplicate_group_id = ?
        ORDER BY dt.is_primary DESC, dt.similarity_score DESC
      `, [groupId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Update duplicate group status
  async updateDuplicateGroupStatus(groupId, status) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE duplicate_groups 
        SET status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, groupId], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Remove transaction from duplicate group
  async removeTransactionFromGroup(groupId, transactionId) {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        // Remove transaction from group
        db.run(`
          DELETE FROM duplicate_transactions 
          WHERE duplicate_group_id = ? AND transaction_id = ?
        `, [groupId, transactionId], function(err) {
          if (err) {
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          // Update group count
          db.run(`
            UPDATE duplicate_groups 
            SET duplicate_count = duplicate_count - 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `, [groupId], (err) => {
            if (err) {
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            // Check if group is now empty or has only one transaction
            db.get(`
              SELECT COUNT(*) as count FROM duplicate_transactions 
              WHERE duplicate_group_id = ?
            `, [groupId], (err, result) => {
              if (err) {
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              if (result.count <= 1) {
                // Delete the group if it has 1 or fewer transactions
                db.run(`
                  DELETE FROM duplicate_groups WHERE id = ?
                `, [groupId], (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    reject(err);
                    return;
                  }

                  db.run('COMMIT', (err) => {
                    if (err) reject(err);
                    else resolve(true);
                  });
                });
              } else {
                db.run('COMMIT', (err) => {
                  if (err) reject(err);
                  else resolve(false);
                });
              }
            });
          });
        });
      });
    });
  }

  // Get duplicate detection statistics
  async getDuplicateStats(companyId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(DISTINCT dg.id) as total_groups,
          COUNT(dt.id) as total_duplicates,
          AVG(dg.confidence_score) as avg_confidence,
          COUNT(CASE WHEN dg.status = 'confirmed' THEN 1 END) as confirmed_groups,
          COUNT(CASE WHEN dg.status = 'dismissed' THEN 1 END) as dismissed_groups,
          SUM(CASE WHEN dg.status = 'confirmed' THEN dg.duplicate_count - 1 ELSE 0 END) as prevented_duplicates
        FROM duplicate_groups dg
        LEFT JOIN duplicate_transactions dt ON dg.id = dt.duplicate_group_id
        WHERE dg.company_id = ?
      `, [companyId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0] || {
          total_groups: 0,
          total_duplicates: 0,
          avg_confidence: 0,
          confirmed_groups: 0,
          dismissed_groups: 0,
          prevented_duplicates: 0
        });
      });
    });
  }

  // Batch process for finding duplicates in existing data
  async batchProcessDuplicates(companyId, limit = 100) {
    return new Promise((resolve, reject) => {
      // Get recent transactions that haven't been processed for duplicates
      db.all(`
        SELECT t.* FROM transactions t
        LEFT JOIN duplicate_transactions dt ON t.id = dt.transaction_id
        WHERE t.company_id = ? AND dt.id IS NULL
        ORDER BY t.created_at DESC
        LIMIT ?
      `, [companyId, limit], async (err, transactions) => {
        if (err) {
          reject(err);
          return;
        }

        const results = {
          processed: 0,
          duplicatesFound: 0,
          groupsCreated: 0
        };

        for (const transaction of transactions) {
          try {
            const duplicateResult = await this.detectDuplicateTransactions(transaction, companyId);
            results.processed++;
            
            if (duplicateResult.isDuplicate) {
              results.duplicatesFound++;
              if (duplicateResult.confidence >= 0.9) {
                results.groupsCreated++;
              }
            }
          } catch (error) {
            console.error(`Error processing transaction ${transaction.id}:`, error);
          }
        }

        resolve(results);
      });
    });
  }

  // Check for duplicate transactions
  async checkTransactionDuplicates(transaction, companyId) {
    try {
      // Get similar transactions for LLM analysis
      const similarTransactions = await this.findSimilarTransactions(transaction, companyId);
      
      // Try LLM-powered duplicate detection first
      try {
        const llmResult = await llmService.detectDuplicates(transaction, similarTransactions);
        
        if (llmResult.success) {
          const duplicateAnalysis = llmResult.duplicateAnalysis;
          
          // Create duplicate group if duplicates found
          if (duplicateAnalysis.isDuplicate && duplicateAnalysis.similarTransactions.length > 0) {
            await this.createDuplicateGroup(transaction.id, companyId, {
              groupType: 'llm_detected',
              confidence: duplicateAnalysis.confidence,
              reasoning: duplicateAnalysis.reasoning,
              similarTransactions: duplicateAnalysis.similarTransactions
            });
          }
          
          return {
            isDuplicate: duplicateAnalysis.isDuplicate,
            confidence: duplicateAnalysis.confidence,
            duplicates: similarTransactions.filter(t => 
              duplicateAnalysis.similarTransactions.includes(t.id)
            ),
            reasoning: duplicateAnalysis.reasoning,
            recommendation: duplicateAnalysis.recommendation,
            llmPowered: true
          };
        }
      } catch (llmError) {
        console.log('LLM duplicate detection failed, falling back to rule-based detection:', llmError.message);
      }

      // Fallback to rule-based detection
      const analysis = await this.performRuleBasedDuplicateDetection(transaction, similarTransactions);
      
      // Create duplicate group if duplicates found
      if (analysis.isDuplicate && analysis.duplicates.length > 0) {
        await this.createDuplicateGroup(transaction.id, companyId, {
          groupType: 'rule_based',
          confidence: analysis.confidence,
          reasoning: analysis.reasoning,
          similarTransactions: analysis.duplicates.map(d => d.id)
        });
      }
      
      return {
        ...analysis,
        llmPowered: false
      };
    } catch (error) {
      console.error('Error in duplicate detection:', error);
      return {
        isDuplicate: false,
        confidence: 0.0,
        duplicates: [],
        reasoning: 'Error during duplicate detection',
        recommendation: 'keep',
        llmPowered: false
      };
    }
  }
}

module.exports = new DuplicateDetectionService();
