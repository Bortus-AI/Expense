const db = require('../database/init');
const moment = require('moment');

class IntelligentCategorizationService {
  constructor() {
    this.merchantPatterns = new Map();
    this.categoryPatterns = new Map();
    this.softwarePatterns = new Map();
    this.subscriptionPatterns = new Map();
    this.loadPatterns();
    this.initializeDefaultPatterns();
  }

  // Initialize default patterns for common categories
  initializeDefaultPatterns() {
    // Software and Technology patterns
    const softwarePatterns = [
      'openai', 'chatgpt', 'github', 'microsoft', 'adobe', 'autodesk', 'salesforce',
      'zoom', 'slack', 'notion', 'figma', 'canva', 'dropbox', 'google', 'aws', 'azure',
      'digitalocean', 'heroku', 'stripe', 'paypal', 'shopify', 'wordpress', 'squarespace',
      'wix', 'webflow', 'hubspot', 'mailchimp', 'sendgrid', 'twilio', 'plaid', 'stripe',
      'software', 'saas', 'subscription', 'license', 'premium', 'pro', 'enterprise'
    ];

    softwarePatterns.forEach(pattern => {
      this.softwarePatterns.set(pattern.toLowerCase(), {
        categoryName: 'Software & Technology',
        confidence: 0.85,
        type: 'software'
      });
    });

    // Subscription patterns
    const subscriptionPatterns = [
      'subscription', 'monthly', 'annual', 'recurring', 'billing', 'membership',
      'premium', 'pro', 'enterprise', 'plus', 'premium', 'unlimited', 'basic',
      'standard', 'professional', 'business', 'team', 'organization'
    ];

    subscriptionPatterns.forEach(pattern => {
      this.subscriptionPatterns.set(pattern.toLowerCase(), {
        categoryName: 'Subscriptions & Memberships',
        confidence: 0.80,
        type: 'subscription'
      });
    });
  }

  // Load existing patterns from database
  async loadPatterns() {
    try {
      const patterns = await this.getCategorizationPatterns();
      patterns.forEach(pattern => {
        if (pattern.pattern_type === 'merchant') {
          this.merchantPatterns.set(pattern.pattern_value.toLowerCase(), {
            categoryId: pattern.category_id,
            confidence: pattern.confidence_score,
            usageCount: pattern.usage_count
          });
        } else if (pattern.pattern_type === 'description') {
          this.categoryPatterns.set(pattern.pattern_value.toLowerCase(), {
            categoryId: pattern.category_id,
            confidence: pattern.confidence_score,
            usageCount: pattern.usage_count
          });
        }
      });
    } catch (error) {
      console.error('Error loading categorization patterns:', error);
    }
  }

  // Get categorization patterns from database
  getCategorizationPatterns(companyId = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM categorization_patterns';
      let params = [];
      
      if (companyId) {
        query += ' WHERE company_id = ?';
        params.push(companyId);
      }
      
      query += ' ORDER BY confidence_score DESC, usage_count DESC';
      
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  // Normalize merchant name for better matching
  normalizeMerchantName(merchantName) {
    if (!merchantName) return '';
    
    return merchantName
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove special characters
      .replace(/\b(inc|llc|corp|ltd|co|company|store|shop|restaurant|cafe|market)\b/g, '') // Remove common suffixes
      .replace(/\b(the|a|an)\b/g, '') // Remove articles
      .replace(/\s+/g, ' ') // Normalize spaces
      .trim();
  }

  // Extract keywords from transaction description
  extractKeywords(description) {
    if (!description) return [];
    
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over']);
    
    return description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word))
      .filter(word => !/^\d+$/.test(word)); // Remove pure numbers
  }

  // Enhanced categorization with software/subscription detection
  async categorizeTransaction(transaction, companyId) {
    try {
      const results = {
        suggestedCategory: null,
        confidence: 0.0,
        reasoning: [],
        merchantInfo: null,
        predictedCategory: 'Unknown',
        predictedCategoryId: null
      };

      const description = transaction.description || '';
      const amount = transaction.amount || 0;
      const normalizedDescription = description.toLowerCase();

      // 1. Check for software/subscription patterns first
      const softwareMatch = await this.detectSoftwareSubscription(description);
      if (softwareMatch.confidence > results.confidence) {
        results.suggestedCategory = softwareMatch.categoryId;
        results.confidence = softwareMatch.confidence;
        results.predictedCategory = softwareMatch.categoryName;
        results.predictedCategoryId = softwareMatch.categoryId;
        results.reasoning.push(`Software/Subscription pattern match: ${softwareMatch.reason}`);
      }

      // 2. Merchant-based categorization
      const merchantResult = await this.categorizeBySimilarMerchant(description, companyId);
      if (merchantResult.confidence > results.confidence) {
        results.suggestedCategory = merchantResult.categoryId;
        results.confidence = merchantResult.confidence;
        results.predictedCategory = merchantResult.categoryName || 'Unknown';
        results.predictedCategoryId = merchantResult.categoryId;
        results.reasoning.push(`Merchant pattern match: ${merchantResult.reason}`);
        results.merchantInfo = merchantResult.merchantInfo;
      }

      // 3. Keyword-based categorization
      const keywordResult = await this.categorizeByKeywords(description, companyId);
      if (keywordResult.confidence > results.confidence) {
        results.suggestedCategory = keywordResult.categoryId;
        results.confidence = keywordResult.confidence;
        results.predictedCategory = keywordResult.categoryName || 'Unknown';
        results.predictedCategoryId = keywordResult.categoryId;
        results.reasoning.push(`Keyword pattern match: ${keywordResult.reason}`);
      }

      // 4. Amount-based categorization
      const amountResult = await this.categorizeByAmountRange(amount, companyId);
      if (amountResult.confidence > results.confidence) {
        results.suggestedCategory = amountResult.categoryId;
        results.confidence = amountResult.confidence;
        results.predictedCategory = amountResult.categoryName || 'Unknown';
        results.predictedCategoryId = amountResult.categoryId;
        results.reasoning.push(`Amount range match: ${amountResult.reason}`);
      }

      // 5. Historical pattern matching
      const historicalResult = await this.categorizeByHistoricalPattern(transaction, companyId);
      if (historicalResult.confidence > results.confidence) {
        results.suggestedCategory = historicalResult.categoryId;
        results.confidence = historicalResult.confidence;
        results.predictedCategory = historicalResult.categoryName || 'Unknown';
        results.predictedCategoryId = historicalResult.categoryId;
        results.reasoning.push(`Historical pattern match: ${historicalResult.reason}`);
      }

      // If no category found, try to create a default category
      if (!results.suggestedCategory) {
        const defaultCategory = await this.getOrCreateDefaultCategory(companyId, 'Software & Technology');
        results.suggestedCategory = defaultCategory.id;
        results.predictedCategory = defaultCategory.name;
        results.predictedCategoryId = defaultCategory.id;
        results.confidence = 0.3; // Low confidence for default
        results.reasoning.push('Using default category: Software & Technology');
      }

      return results;
    } catch (error) {
      console.error('Error in enhanced categorization:', error);
      return {
        suggestedCategory: null,
        confidence: 0.0,
        reasoning: ['Error during categorization'],
        predictedCategory: 'Unknown',
        predictedCategoryId: null
      };
    }
  }

  // Categorize by similar merchant patterns
  async categorizeBySimilarMerchant(description, companyId) {
    const normalizedDescription = this.normalizeMerchantName(description);
    const keywords = this.extractKeywords(normalizedDescription);
    
    // Check for exact merchant matches first
    for (const [merchant, info] of this.merchantPatterns) {
      if (normalizedDescription.includes(merchant)) {
        const categoryName = await this.getCategoryName(info.categoryId);
        return {
          categoryId: info.categoryId,
          categoryName: categoryName,
          confidence: Math.min(0.95, info.confidence + (info.usageCount * 0.01)),
          reason: `Exact merchant match: ${merchant}`,
          merchantInfo: { name: merchant, usageCount: info.usageCount }
        };
      }
    }

    // Check for partial matches using keywords
    let bestMatch = { categoryId: null, categoryName: 'Unknown', confidence: 0.0, reason: '', merchantInfo: null };
    
    for (const keyword of keywords) {
      if (keyword.length < 3) continue;
      
      for (const [merchant, info] of this.merchantPatterns) {
        if (merchant.includes(keyword) || keyword.includes(merchant)) {
          const confidence = Math.min(0.8, info.confidence * 0.8 + (info.usageCount * 0.005));
          if (confidence > bestMatch.confidence) {
            const categoryName = await this.getCategoryName(info.categoryId);
            bestMatch = {
              categoryId: info.categoryId,
              categoryName: categoryName,
              confidence,
              reason: `Partial merchant match: ${keyword} in ${merchant}`,
              merchantInfo: { name: merchant, usageCount: info.usageCount }
            };
          }
        }
      }
    }
    
    return bestMatch;
  }

  // Get category name by ID
  async getCategoryName(categoryId) {
    if (!categoryId) return 'Unknown';
    
    return new Promise((resolve, reject) => {
      db.get('SELECT name FROM categories WHERE id = ?', [categoryId], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.name : 'Unknown');
      });
    });
  }

  // Find vendor match from vendor database
  async findVendorMatch(description, companyId) {
    return new Promise((resolve, reject) => {
      const normalizedDescription = this.normalizeMerchantName(description);
      
      db.all(`
        SELECT v.*, c.name as category_name 
        FROM vendors v 
        LEFT JOIN categories c ON v.category_id = c.id 
        WHERE (v.company_id = ? OR v.company_id IS NULL) 
        AND v.is_verified = 1
        ORDER BY v.confidence_score DESC
      `, [companyId], (err, vendors) => {
        if (err) {
          reject(err);
          return;
        }

        let bestMatch = null;
        let highestScore = 0;

        for (const vendor of vendors) {
          const normalizedVendor = this.normalizeMerchantName(vendor.normalized_name);
          let score = 0;

          // Exact match
          if (normalizedDescription.includes(normalizedVendor)) {
            score = 0.95;
          } else {
            // Check aliases
            try {
              const aliases = JSON.parse(vendor.aliases || '[]');
              for (const alias of aliases) {
                const normalizedAlias = this.normalizeMerchantName(alias);
                if (normalizedDescription.includes(normalizedAlias)) {
                  score = Math.max(score, 0.85);
                }
              }
            } catch (e) {
              // Invalid JSON in aliases, skip
            }

            // Partial match scoring
            const vendorWords = normalizedVendor.split(' ').filter(w => w.length > 2);
            const descWords = normalizedDescription.split(' ').filter(w => w.length > 2);
            
            let matchingWords = 0;
            for (const vWord of vendorWords) {
              for (const dWord of descWords) {
                if (vWord === dWord || vWord.includes(dWord) || dWord.includes(vWord)) {
                  matchingWords++;
                  break;
                }
              }
            }
            
            if (vendorWords.length > 0) {
              score = Math.max(score, (matchingWords / vendorWords.length) * 0.7);
            }
          }

          // Apply vendor confidence multiplier
          score *= (vendor.confidence_score / 100);

          if (score > highestScore && score > 0.3) {
            highestScore = score;
            bestMatch = {
              categoryId: vendor.category_id,
              confidence: score,
              reason: `Vendor database match: ${vendor.name}`,
              merchantInfo: {
                name: vendor.name,
                vendorId: vendor.id,
                isVerified: vendor.is_verified
              }
            };
          }
        }

        resolve(bestMatch);
      });
    });
  }

  // Categorize by keywords in description
  async categorizeByKeywords(description, companyId) {
    const keywords = this.extractKeywords(description);
    
    let bestMatch = { categoryId: null, categoryName: 'Unknown', confidence: 0.0, reason: '' };
    
    for (const keyword of keywords) {
      if (keyword.length < 3) continue;
      
      for (const [pattern, info] of this.categoryPatterns) {
        if (pattern.includes(keyword) || keyword.includes(pattern)) {
          const confidence = Math.min(0.7, info.confidence * 0.7 + (info.usageCount * 0.003));
          if (confidence > bestMatch.confidence) {
            const categoryName = await this.getCategoryName(info.categoryId);
            bestMatch = {
              categoryId: info.categoryId,
              categoryName: categoryName,
              confidence,
              reason: `Keyword pattern match: ${keyword} -> ${pattern}`
            };
          }
        }
      }
    }
    
    return bestMatch;
  }

  // Categorize by amount range patterns
  async categorizeByAmountRange(amount, companyId) {
    // Get amount-based patterns from database
    const patterns = await new Promise((resolve, reject) => {
      db.all(`
        SELECT DISTINCT category_id, 
               MIN(amount) as min_amount, 
               MAX(amount) as max_amount,
               COUNT(*) as frequency,
               AVG(amount) as avg_amount
        FROM transactions 
        WHERE company_id = ? AND category_id IS NOT NULL
        GROUP BY category_id
        HAVING frequency >= 3
        ORDER BY frequency DESC
      `, [companyId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    let bestMatch = { categoryId: null, categoryName: 'Unknown', confidence: 0.0, reason: '' };
    
    for (const pattern of patterns) {
      if (amount >= pattern.min_amount && amount <= pattern.max_amount) {
        const deviation = Math.abs(amount - pattern.avg_amount) / pattern.avg_amount;
        const confidence = Math.max(0.3, 0.8 - deviation);
        
        if (confidence > bestMatch.confidence) {
          const categoryName = await this.getCategoryName(pattern.category_id);
          bestMatch = {
            categoryId: pattern.category_id,
            categoryName: categoryName,
            confidence,
            reason: `Amount range match: $${pattern.min_amount}-${pattern.max_amount} (${pattern.frequency} transactions)`
          };
        }
      }
    }
    
    return bestMatch;
  }

  // Categorize by historical patterns
  async categorizeByHistoricalPattern(transaction, companyId) {
    const description = transaction.description || '';
    const amount = transaction.amount || 0;
    
    // Find similar transactions from history
    const similarTransactions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT category_id, COUNT(*) as frequency, AVG(amount) as avg_amount
        FROM transactions 
        WHERE company_id = ? 
          AND category_id IS NOT NULL
          AND (
            LOWER(description) LIKE ? 
            OR ABS(amount - ?) < 5
          )
        GROUP BY category_id
        HAVING frequency >= 2
        ORDER BY frequency DESC, avg_amount DESC
        LIMIT 5
      `, [companyId, `%${description.toLowerCase()}%`, amount], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    if (similarTransactions.length === 0) {
      return { categoryId: null, categoryName: 'Unknown', confidence: 0.0, reason: 'No historical patterns found' };
    }

    const topResult = similarTransactions[0];
    const categoryName = await this.getCategoryName(topResult.category_id);
    
    return {
      categoryId: topResult.category_id,
      categoryName: categoryName,
      confidence: Math.min(0.9, 0.5 + (topResult.frequency * 0.1)),
      reason: `Historical pattern (${topResult.frequency} similar transactions)`
    };
  }

  // Detect software and subscription patterns
  async detectSoftwareSubscription(description) {
    const normalizedDesc = description.toLowerCase();
    const words = normalizedDesc.split(/\s+/);
    
    let bestMatch = { confidence: 0, categoryName: 'Unknown', categoryId: null, reason: '' };
    
    // Check software patterns
    for (const [pattern, info] of this.softwarePatterns) {
      if (normalizedDesc.includes(pattern)) {
        if (info.confidence > bestMatch.confidence) {
          bestMatch = {
            confidence: info.confidence,
            categoryName: info.categoryName,
            categoryId: null, // Will be resolved later
            reason: `Matched software pattern: ${pattern}`
          };
        }
      }
    }
    
    // Check subscription patterns
    for (const [pattern, info] of this.subscriptionPatterns) {
      if (normalizedDesc.includes(pattern)) {
        if (info.confidence > bestMatch.confidence) {
          bestMatch = {
            confidence: info.confidence,
            categoryName: info.categoryName,
            categoryId: null, // Will be resolved later
            reason: `Matched subscription pattern: ${pattern}`
          };
        }
      }
    }
    
    // Resolve category ID
    if (bestMatch.categoryName !== 'Unknown') {
      const categoryId = await this.resolveCategoryId(bestMatch.categoryName);
      bestMatch.categoryId = categoryId;
    }
    
    return bestMatch;
  }

  // Resolve category ID by name
  async resolveCategoryId(categoryName) {
    return new Promise((resolve, reject) => {
      db.get('SELECT id FROM categories WHERE name = ?', [categoryName], (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.id : null);
      });
    });
  }

  // Get or create default category
  async getOrCreateDefaultCategory(companyId, categoryName) {
    return new Promise((resolve, reject) => {
      // First try to find existing category
      db.get('SELECT id, name FROM categories WHERE company_id = ? AND name = ?', 
        [companyId, categoryName], (err, row) => {
          if (err) reject(err);
          else if (row) {
            resolve(row);
          } else {
            // Create new category
            db.run('INSERT INTO categories (company_id, name) VALUES (?, ?)', 
              [companyId, categoryName], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, name: categoryName });
              });
          }
        });
    });
  }

  // Learn from user feedback to improve categorization
  async learnFromFeedback(transactionId, actualCategoryId, predictedCategoryId, confidence) {
    try {
      const transaction = await this.getTransaction(transactionId);
      if (!transaction) return;

      const isCorrect = actualCategoryId === predictedCategoryId;
      
      // Update ML prediction log
      await this.updatePredictionFeedback(transactionId, 'category', actualCategoryId, isCorrect);

      if (isCorrect) {
        // Reinforce correct patterns
        await this.reinforcePattern(transaction, actualCategoryId, confidence);
      } else {
        // Learn new patterns from correction
        await this.learnNewPattern(transaction, actualCategoryId);
      }

      // Update merchant patterns
      await this.updateMerchantPattern(transaction.description, actualCategoryId);
      
    } catch (error) {
      console.error('Error in learnFromFeedback:', error);
    }
  }

  // Reinforce existing patterns that were correct
  async reinforcePattern(transaction, categoryId, confidence) {
    const normalizedMerchant = this.normalizeMerchantName(transaction.description);
    const keywords = this.extractKeywords(transaction.description);

    // Reinforce merchant pattern
    if (normalizedMerchant) {
      await this.updateCategorizationPattern(
        transaction.company_id,
        'merchant',
        normalizedMerchant,
        categoryId,
        Math.min(95, confidence * 100 + 5)
      );
    }

    // Reinforce keyword patterns
    for (const keyword of keywords.slice(0, 3)) { // Top 3 keywords
      await this.updateCategorizationPattern(
        transaction.company_id,
        'description',
        keyword,
        categoryId,
        Math.min(80, confidence * 100)
      );
    }
  }

  // Learn new patterns from user corrections
  async learnNewPattern(transaction, categoryId) {
    const normalizedMerchant = this.normalizeMerchantName(transaction.description);
    const keywords = this.extractKeywords(transaction.description);

    // Create new merchant pattern
    if (normalizedMerchant) {
      await this.createCategorizationPattern(
        transaction.company_id,
        'merchant',
        normalizedMerchant,
        categoryId,
        70 // Start with moderate confidence
      );
    }

    // Create new keyword patterns
    for (const keyword of keywords.slice(0, 2)) { // Top 2 keywords
      await this.createCategorizationPattern(
        transaction.company_id,
        'description',
        keyword,
        categoryId,
        50 // Start with lower confidence for keywords
      );
    }
  }

  // Update or create categorization pattern
  async updateCategorizationPattern(companyId, patternType, patternValue, categoryId, confidenceScore) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT OR REPLACE INTO categorization_patterns 
        (company_id, pattern_type, pattern_value, category_id, confidence_score, usage_count, last_used, updated_at)
        VALUES (?, ?, ?, ?, ?, 
          COALESCE((SELECT usage_count + 1 FROM categorization_patterns 
                   WHERE company_id = ? AND pattern_type = ? AND pattern_value = ?), 1),
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [companyId, patternType, patternValue, categoryId, confidenceScore, companyId, patternType, patternValue], 
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Create new categorization pattern
  async createCategorizationPattern(companyId, patternType, patternValue, categoryId, confidenceScore) {
    return new Promise((resolve, reject) => {
      db.run(`
        INSERT INTO categorization_patterns 
        (company_id, pattern_type, pattern_value, category_id, confidence_score, usage_count, last_used)
        VALUES (?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
      `, [companyId, patternType, patternValue, categoryId, confidenceScore], 
      function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });
  }

  // Update merchant pattern and vendor database
  async updateMerchantPattern(description, categoryId) {
    const normalizedMerchant = this.normalizeMerchantName(description);
    if (!normalizedMerchant) return;

    // Update in-memory patterns
    if (this.merchantPatterns.has(normalizedMerchant)) {
      const existing = this.merchantPatterns.get(normalizedMerchant);
      existing.usageCount++;
      existing.confidence = Math.min(95, existing.confidence + 1);
    } else {
      this.merchantPatterns.set(normalizedMerchant, {
        categoryId,
        confidence: 70,
        usageCount: 1
      });
    }
  }

  // Get transaction by ID
  async getTransaction(transactionId) {
    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM transactions WHERE id = ?', [transactionId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  // Log ML prediction for performance tracking
  async logPrediction(modelType, transactionId, receiptId, predictionType, predictedValue, confidence) {
    return new Promise((resolve, reject) => {
      // First get or create the model record
      db.get(`
        SELECT id FROM ml_models 
        WHERE model_type = ? AND is_active = 1 
        ORDER BY created_at DESC LIMIT 1
      `, [modelType], (err, model) => {
        if (err) {
          reject(err);
          return;
        }

        let modelId = model ? model.id : null;
        
        if (!modelId) {
          // Create default model record
          db.run(`
            INSERT INTO ml_models (model_name, model_type, version, is_active)
            VALUES (?, ?, ?, ?)
          `, [`${modelType}_v1`, modelType, '1.0', true], function(err) {
            if (err) {
              reject(err);
              return;
            }
            modelId = this.lastID;
            insertPrediction();
          });
        } else {
          insertPrediction();
        }

        function insertPrediction() {
          db.run(`
            INSERT INTO ml_predictions 
            (model_id, transaction_id, receipt_id, prediction_type, predicted_value, confidence_score)
            VALUES (?, ?, ?, ?, ?, ?)
          `, [modelId, transactionId, receiptId, predictionType, predictedValue, confidence], 
          function(err) {
            if (err) reject(err);
            else resolve(this.lastID);
          });
        }
      });
    });
  }

  // Update prediction feedback
  async updatePredictionFeedback(transactionId, predictionType, actualValue, isCorrect) {
    return new Promise((resolve, reject) => {
      db.run(`
        UPDATE ml_predictions 
        SET actual_value = ?, is_correct = ?, feedback_provided = 1
        WHERE transaction_id = ? AND prediction_type = ?
        ORDER BY created_at DESC LIMIT 1
      `, [actualValue, isCorrect, transactionId, predictionType], function(err) {
        if (err) reject(err);
        else resolve(this.changes);
      });
    });
  }

  // Get categorization statistics
  async getCategorizationStats(companyId) {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT 
          COUNT(*) as total_predictions,
          AVG(CASE WHEN is_correct = 1 THEN 1.0 ELSE 0.0 END) as accuracy,
          AVG(confidence_score) as avg_confidence,
          COUNT(CASE WHEN feedback_provided = 1 THEN 1 END) as feedback_count
        FROM ml_predictions mp
        JOIN ml_models mm ON mp.model_id = mm.id
        JOIN transactions t ON mp.transaction_id = t.id
        WHERE mm.model_type = 'categorization' AND t.company_id = ?
      `, [companyId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0] || { total_predictions: 0, accuracy: 0, avg_confidence: 0, feedback_count: 0 });
      });
    });
  }
}

module.exports = new IntelligentCategorizationService();
