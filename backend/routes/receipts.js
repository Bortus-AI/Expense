const express = require('express');
const router = express.Router();
const db = require('../database/init');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const Tesseract = require('tesseract.js');
const moment = require('moment');
const pdfParse = require('pdf-parse');
const { authenticateToken, getUserCompanies, requireCompanyAccess, addUserTracking } = require('../middleware/auth');
const llmService = require('../services/llmService');

// Apply middleware to all receipt routes
router.use(authenticateToken);
router.use(getUserCompanies);
router.use(requireCompanyAccess);
router.use(addUserTracking);

// Import the matching algorithm from matches route
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
       
       // Also check for exact merchant name match
       if (descriptionLower.includes(receipt.extracted_merchant.toLowerCase())) {
         confidence += 25;
         reasons.push('Exact merchant name match');
       } else {
         merchantWords.forEach(word => {
           // Skip common words like "llc", "inc", "corp", etc.
           if (word.length > 2 && !['llc', 'inc', 'corp', 'ltd', 'company', 'co', 'name'].includes(word)) {
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
             w.length > 2 && !['llc', 'inc', 'corp', 'ltd', 'company', 'co', 'name'].includes(w)
           ).length) * 15;
           
           // Bonus for significant word matches (like "openai")
           const bonusPoints = significantWordMatches * 5;
           
           const totalMerchantPoints = Math.min(baseMatchPercent + bonusPoints, 20); // Cap at 20 points
           confidence += totalMerchantPoints;
           reasons.push(`Merchant keywords match (${wordMatches} words, ${significantWordMatches} significant)`);
         }
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

// Function to trigger automatic matching for a specific receipt
const triggerAutoMatchForReceipt = (receiptId) => {
  console.log(`Triggering auto-match for receipt ${receiptId}`);
  
  // Get receipt details
  db.get('SELECT * FROM receipts WHERE id = ?', [receiptId], (err, receipt) => {
    if (err || !receipt) {
      console.error('Error getting receipt for auto-match:', err);
      return;
    }

    console.log(`Auto-matching receipt:`, {
      id: receipt.id,
      amount: receipt.extracted_amount,
      merchant: receipt.extracted_merchant,
      date: receipt.extracted_date
    });

    // Get unmatched transactions
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
        console.error('Error getting transactions for auto-match:', err);
        return;
      }

      const potentialMatches = findPotentialMatches(receipt, transactions);
      
             // Auto-match if confidence is high enough (lowered to 60% threshold)
       if (potentialMatches.length > 0 && potentialMatches[0].confidence >= 60) {
        const bestMatch = potentialMatches[0];
        
        // Create the match
        db.run(`
          INSERT OR REPLACE INTO matches 
          (transaction_id, receipt_id, match_confidence, match_status, user_confirmed)
          VALUES (?, ?, ?, 'auto_matched', 0)
        `, [
          bestMatch.transaction.id,
          receiptId,
          bestMatch.confidence
        ], function(err) {
          if (err) {
            console.error('Error creating auto-match:', err);
          } else {
            console.log(`Auto-matched receipt ${receiptId} with transaction ${bestMatch.transaction.id} (confidence: ${bestMatch.confidence}%)`);
          }
        });
      } else {
        if (potentialMatches.length > 0) {
          const bestMatch = potentialMatches[0];
          console.log(`No high-confidence matches found for receipt ${receiptId}.`);
          console.log(`Best match: ${bestMatch.confidence}% - Transaction: "${bestMatch.transaction.description}" (${bestMatch.transaction.transaction_date}, $${Math.abs(bestMatch.transaction.amount)})`);
          console.log(`Match reasons: ${bestMatch.reasons.join(', ')}`);
        } else {
          console.log(`No matches found for receipt ${receiptId}`);
        }
      }
    });
  });
};

// Configure multer for receipt image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const receiptsDir = path.join(__dirname, '../uploads/receipts');
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
    cb(null, receiptsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Accept image files and PDF files
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit (increased for PDFs)
  }
});

// Process receipt with OCR and LLM enhancement
async function processReceipt(filePath, originalFilename) {
  try {
    const fileExtension = path.extname(originalFilename).toLowerCase();
    let ocrText = '';
    let extractedData = {
      merchant: null,
      amount: null,
      date: null,
      items: [],
      category: null,
      confidence: 0.0,
      notes: ''
    };

    // Extract text based on file type
    if (fileExtension === '.pdf') {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      ocrText = pdfData.text;
    } else {
      // Use Tesseract for image files
      const worker = await createWorker();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
      
      const { data: { text } } = await worker.recognize(filePath);
      ocrText = text;
      
      await worker.terminate();
    }

    // Enhanced processing with LLM
    try {
      console.log('Starting LLM OCR processing for:', originalFilename);
      console.log('OCR Text length:', ocrText.length);
      console.log('Sample OCR text:', ocrText.substring(0, 200) + '...');
      
      const llmResult = await llmService.processOCRText(ocrText, {
        filename: originalFilename,
        fileSize: fs.statSync(filePath).size,
        fileType: fileExtension
      });

      console.log('LLM Result:', llmResult);

      if (llmResult.success) {
        extractedData = {
          ...extractedData,
          ...llmResult.data,
          llmProcessed: true,
          rawOcrText: ocrText
        };
        console.log('LLM processing successful:', extractedData);
      } else {
        // Fallback to basic extraction
        extractedData = {
          ...extractedData,
          llmProcessed: false,
          rawOcrText: ocrText,
          notes: `LLM processing failed: ${llmResult.error}`
        };
        console.log('LLM processing failed, using fallback:', llmResult.error);
      }
    } catch (llmError) {
      console.log('LLM OCR processing failed, using basic extraction:', llmError.message);
      extractedData = {
        ...extractedData,
        llmProcessed: false,
        rawOcrText: ocrText,
        notes: 'LLM processing failed, using basic OCR'
      };
    }

    return {
      success: true,
      ocrText: ocrText,
      extractedData: extractedData
    };
  } catch (error) {
    console.error('Error processing receipt:', error);
    return {
      success: false,
      error: error.message,
      ocrText: '',
      extractedData: {
        merchant: null,
        amount: null,
        date: null,
        items: [],
        category: null,
        confidence: 0.0,
        notes: 'Processing failed'
      }
    };
  }
}

// Get all receipts with pagination
router.get('/', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Admin-specific filtering parameters
  const userId = req.query.userId ? parseInt(req.query.userId) : null;
  const startDate = req.query.startDate || null;
  const endDate = req.query.endDate || null;
  const processingStatus = req.query.processingStatus || null;
  const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount) : null;
  const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount) : null;
  const status = req.query.status || null; // 'matched', 'unmatched'
  const sortBy = req.query.sortBy || 'upload_date';
  const sortOrder = req.query.sortOrder || 'DESC';

  // DEBUG: Log user information for admin role debugging
  console.log('=== RECEIPTS ROUTE DEBUG ===');
  console.log('User:', {
    id: req.user?.id,
    email: req.user?.email,
    currentRole: req.user?.currentRole,
    currentCompany: req.user?.currentCompany?.name,
    companyId: req.companyId
  });
  console.log('Filter params:', { userId, startDate, endDate, processingStatus, minAmount, maxAmount, status, sortBy, sortOrder });

  // Build query with proper user/admin filtering
  let whereClause = 'WHERE r.company_id = ?';
  let queryParams = [req.companyId];
  let countParams = [req.companyId];

  // If user is not admin, only show their own receipts
  if (req.user && req.user.currentRole !== 'admin') {
    console.log('Applying user-level filtering (not admin)');
    whereClause += ' AND r.created_by = ?';
    queryParams.push(req.user.id);
    countParams.push(req.user.id);
  } else {
    console.log('Admin user - showing all company receipts');
    
    // Admin-specific filters
    if (userId) {
      whereClause += ' AND r.created_by = ?';
      queryParams.push(userId);
      countParams.push(userId);
    }
  }

  // Date range filtering (upload date or extracted date)
  if (startDate) {
    whereClause += ' AND (r.upload_date >= ? OR r.extracted_date >= ?)';
    queryParams.push(startDate, startDate);
    countParams.push(startDate, startDate);
  }
  if (endDate) {
    whereClause += ' AND (r.upload_date <= ? OR r.extracted_date <= ?)';
    queryParams.push(endDate, endDate);
    countParams.push(endDate, endDate);
  }

  // Processing status filtering
  if (processingStatus) {
    whereClause += ' AND r.processing_status = ?';
    queryParams.push(processingStatus);
    countParams.push(processingStatus);
  }

  // Amount range filtering
  if (minAmount !== null) {
    whereClause += ' AND r.extracted_amount >= ?';
    queryParams.push(minAmount);
    countParams.push(minAmount);
  }
  if (maxAmount !== null) {
    whereClause += ' AND r.extracted_amount <= ?';
    queryParams.push(maxAmount);
    countParams.push(maxAmount);
  }

  // Status filtering (matched/unmatched)
  if (status === 'matched') {
    whereClause += ' AND EXISTS (SELECT 1 FROM matches m WHERE m.receipt_id = r.id AND m.user_confirmed = 1)';
  } else if (status === 'unmatched') {
    whereClause += ' AND NOT EXISTS (SELECT 1 FROM matches m WHERE m.receipt_id = r.id AND m.user_confirmed = 1)';
  }

  // Validate sort parameters
  const allowedSortFields = ['upload_date', 'extracted_date', 'extracted_amount', 'file_size', 'original_filename', 'created_at'];
  const allowedSortOrders = ['ASC', 'DESC'];
  
  if (!allowedSortFields.includes(sortBy)) {
    sortBy = 'upload_date';
  }
  if (!allowedSortOrders.includes(sortOrder.toUpperCase())) {
    sortOrder = 'DESC';
  }

  const query = `
    SELECT r.*, 
           COUNT(m.id) as match_count,
           GROUP_CONCAT(t.description) as matched_transactions,
           u.first_name as created_by_first_name,
           u.last_name as created_by_last_name,
           u.email as created_by_email
    FROM receipts r
    LEFT JOIN matches m ON r.id = m.receipt_id AND m.user_confirmed = 1
    LEFT JOIN transactions t ON m.transaction_id = t.id
    LEFT JOIN users u ON r.created_by = u.id
    ${whereClause}
    GROUP BY r.id
    ORDER BY r.${sortBy} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  // Add limit and offset to params
  queryParams.push(limit, offset);

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Count query with same filtering
    const countQuery = `SELECT COUNT(*) as total FROM receipts r ${whereClause}`;
    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        receipts: rows,
        pagination: {
          page,
          limit,
          total: countRow.total,
          pages: Math.ceil(countRow.total / limit)
        },
        filters: {
          userId,
          startDate,
          endDate,
          processingStatus,
          minAmount,
          maxAmount,
          status,
          sortBy,
          sortOrder
        }
      });
    });
  });
});

// Get single receipt
router.get('/:id', (req, res) => {
  // Build query with proper user/admin filtering
  let whereClause = 'WHERE r.id = ? AND r.company_id = ?';
  let queryParams = [req.params.id, req.companyId];

  // If user is not admin, only show their own receipts
  if (req.user && req.user.currentRole !== 'admin') {
    whereClause += ' AND r.created_by = ?';
    queryParams.push(req.user.id);
  }

  const query = `
    SELECT r.*, 
           GROUP_CONCAT(t.description) as matched_transactions,
           GROUP_CONCAT(t.id) as transaction_ids
    FROM receipts r
    LEFT JOIN matches m ON r.id = m.receipt_id AND m.user_confirmed = 1
    LEFT JOIN transactions t ON m.transaction_id = t.id
    ${whereClause}
    GROUP BY r.id
  `;

  db.get(query, queryParams, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json(row);
  });
});

// Upload receipt
router.post('/upload', upload.single('receipt'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No receipt file uploaded' });
  }

  const receiptData = {
    filename: req.file.filename,
    original_filename: req.file.originalname,
    file_path: req.file.path,
    file_size: req.file.size,
    processing_status: 'processing'
  };

  // Insert receipt record
  db.run(`
    INSERT INTO receipts (filename, original_filename, file_path, file_size, processing_status, company_id, created_by, updated_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    receiptData.filename,
    receiptData.original_filename,
    receiptData.file_path,
    receiptData.file_size,
    receiptData.processing_status,
    req.companyId,
    req.userId,
    req.userId
  ], async function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const receiptId = this.lastID;

    // Process OCR in background
    try {
      const ocrResult = await processReceipt(req.file.path, req.file.originalname);
      
      // Update receipt with OCR results
      const breakdown = ocrResult.extractedData || {};
      db.run(`
        UPDATE receipts 
        SET ocr_text = ?, extracted_amount = ?, extracted_date = ?, 
            extracted_merchant = ?, processing_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [
        ocrResult.ocrText,
        breakdown.amount,
        breakdown.date,
        breakdown.merchant,
        'completed',
        receiptId
      ], (err) => {
        if (err) {
          console.error('Error updating OCR results:', err);
        } else {
          // Log the breakdown for debugging
          console.log(`Stored receipt ${receiptId} with breakdown:`, {
            amount: breakdown.amount,
            date: breakdown.date,
            merchant: breakdown.merchant,
            finalAmount: breakdown.amount,
            llmProcessed: breakdown.llmProcessed,
            notes: breakdown.notes
          });
          
          // Trigger automatic matching for this receipt
          let amountForMatching = breakdown.amount;
          
          // Convert amount to number if it's a string (LLM might return "$20.00")
          if (typeof amountForMatching === 'string') {
            // Remove currency symbols, commas, and convert to number
            amountForMatching = parseFloat(amountForMatching.replace(/[$,]/g, ''));
          }
          
          // Also handle if amount is already a number but needs validation
          if (typeof amountForMatching === 'number' && isNaN(amountForMatching)) {
            amountForMatching = null;
          }
          
          // Check if we have valid data for matching
          const hasValidAmount = amountForMatching && !isNaN(amountForMatching);
          const hasValidMerchant = breakdown.merchant && breakdown.merchant !== 'name' && !breakdown.merchant.includes('If a more specific category');
          
          console.log(`Auto-match check for receipt ${receiptId}:`, {
            amount: amountForMatching,
            merchant: breakdown.merchant,
            hasValidAmount,
            hasValidMerchant
          });
          
          if (hasValidAmount && hasValidMerchant) {
            console.log(`✅ Triggering auto-match for receipt ${receiptId} with amount: ${amountForMatching}, merchant: ${breakdown.merchant}`);
            
            // Update the receipt with the extracted data for matching
            db.run(`
              UPDATE receipts 
              SET extracted_amount = ?, extracted_merchant = ?, extracted_date = ?
              WHERE id = ?
            `, [amountForMatching, breakdown.merchant, breakdown.date, receiptId], (err) => {
              if (err) {
                console.error('Error updating receipt for matching:', err);
              } else {
                console.log(`✅ Updated receipt ${receiptId} with extracted data, triggering auto-match...`);
                // Add a small delay to ensure the database update is complete
                setTimeout(() => {
                  triggerAutoMatchForReceipt(receiptId);
                }, 100);
              }
            });
          } else {
            console.log(`❌ Skipping auto-match for receipt ${receiptId}:`, {
              reason: !hasValidAmount ? 'Invalid amount' : 'Invalid merchant',
              amount: breakdown.amount,
              merchant: breakdown.merchant
            });
          }
        }
      });

    } catch (error) {
      console.error('OCR processing failed:', error);
      
      // Update status to failed
      db.run(`
        UPDATE receipts 
        SET processing_status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, ['failed', receiptId]);
    }

    res.json({
      message: 'Receipt uploaded successfully',
      receiptId: receiptId,
      filename: receiptData.filename,
      processing_status: 'processing'
    });
  });
});

// Update receipt
router.put('/:id', (req, res) => {
  const { extracted_amount, extracted_date, extracted_merchant } = req.body;
  
  const query = `
    UPDATE receipts 
    SET extracted_amount = ?, extracted_date = ?, extracted_merchant = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [extracted_amount, extracted_date, extracted_merchant, req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.json({ message: 'Receipt updated successfully' });
  });
});

// Delete receipt
router.delete('/:id', (req, res) => {
  // First check if user has permission to delete this receipt
  let whereClause = 'WHERE r.id = ? AND r.company_id = ?';
  let queryParams = [req.params.id, req.companyId];

  // If user is not admin, only allow deletion of their own receipts
  if (req.user && req.user.currentRole !== 'admin') {
    whereClause += ' AND r.created_by = ?';
    queryParams.push(req.user.id);
  }

  // Get the receipt to check permissions and get file path
  db.get(`SELECT r.*, COUNT(m.id) as match_count FROM receipts r LEFT JOIN matches m ON r.id = m.receipt_id ${whereClause} GROUP BY r.id`, queryParams, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Receipt not found or access denied' });
    }

    // Delete related matches first (due to foreign key constraint)
    db.run('DELETE FROM matches WHERE receipt_id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting receipt matches: ' + err.message });
      }

      // Delete the file if it exists
      if (row.file_path && fs.existsSync(row.file_path)) {
        try {
          fs.unlinkSync(row.file_path);
        } catch (fileErr) {
          console.error('Error deleting file:', fileErr);
          // Continue with database deletion even if file deletion fails
        }
      }

      // Delete from database
      db.run('DELETE FROM receipts WHERE id = ?', [req.params.id], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error deleting receipt: ' + err.message });
        }
        res.json({ 
          message: 'Receipt deleted successfully',
          deletedMatches: this.changes > 0 ? row.match_count : 0
        });
      });
    });
  });
});

// View/Download receipt
router.get('/:id/view', (req, res) => {
  // Check if user has permission to view this receipt
  let whereClause = 'WHERE r.id = ? AND r.company_id = ?';
  let queryParams = [req.params.id, req.companyId];

  // If user is not admin, only allow viewing their own receipts
  if (req.user && req.user.currentRole !== 'admin') {
    whereClause += ' AND r.created_by = ?';
    queryParams.push(req.user.id);
  }

  db.get(`SELECT * FROM receipts r ${whereClause}`, queryParams, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Receipt not found or access denied' });
    }

    // Check if file exists
    if (!row.file_path || !fs.existsSync(row.file_path)) {
      return res.status(404).json({ error: 'Receipt file not found' });
    }

    // Determine content type based on file extension
    const ext = path.extname(row.filename).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }

    // Set headers for download or inline viewing
    const disposition = req.query.download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `${disposition}; filename="${row.original_filename}"`);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    // Stream the file
    const fileStream = fs.createReadStream(row.file_path);
    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      res.status(500).json({ error: 'Error reading receipt file' });
    });
    
    fileStream.pipe(res);
  });
});

// Download receipt with proper blob handling
router.get('/:id/download', (req, res) => {
  // Check if user has permission to view this receipt
  let whereClause = 'WHERE r.id = ? AND r.company_id = ?';
  let queryParams = [req.params.id, req.companyId];

  // If user is not admin, only allow viewing their own receipts
  if (req.user && req.user.currentRole !== 'admin') {
    whereClause += ' AND r.created_by = ?';
    queryParams.push(req.user.id);
  }

  db.get(`SELECT * FROM receipts r ${whereClause}`, queryParams, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Receipt not found or access denied' });
    }

    // Check if file exists
    if (!row.file_path || !fs.existsSync(row.file_path)) {
      return res.status(404).json({ error: 'Receipt file not found' });
    }

    // Read file as buffer and send as blob
    fs.readFile(row.file_path, (err, data) => {
      if (err) {
        return res.status(500).json({ error: 'Error reading receipt file' });
      }

      // Determine content type based on file extension
      const ext = path.extname(row.filename).toLowerCase();
      let contentType = 'application/octet-stream';
      
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        contentType = 'image/jpeg';
      } else if (ext === '.png') {
        contentType = 'image/png';
      } else if (ext === '.gif') {
        contentType = 'image/gif';
      } else if (ext === '.webp') {
        contentType = 'image/webp';
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${row.original_filename}"`);
      res.setHeader('Content-Length', data.length);
      res.send(data);
    });
  });
});

// Get receipt thumbnail (for preview)
router.get('/:id/thumbnail', (req, res) => {
  // Check if user has permission to view this receipt
  let whereClause = 'WHERE r.id = ? AND r.company_id = ?';
  let queryParams = [req.params.id, req.companyId];

  // If user is not admin, only allow viewing their own receipts
  if (req.user && req.user.currentRole !== 'admin') {
    whereClause += ' AND r.created_by = ?';
    queryParams.push(req.user.id);
  }

  db.get(`SELECT * FROM receipts r ${whereClause}`, queryParams, (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Receipt not found or access denied' });
    }

    // Check if file exists
    if (!row.file_path || !fs.existsSync(row.file_path)) {
      return res.status(404).json({ error: 'Receipt file not found' });
    }

    const ext = path.extname(row.filename).toLowerCase();
    
    // Only generate thumbnails for images, not PDFs
    if (ext === '.pdf') {
      return res.status(400).json({ error: 'Thumbnails not available for PDF files' });
    }

    // For images, serve the original file as thumbnail (could be optimized later)
    let contentType = 'image/jpeg';
    if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.webp') {
      contentType = 'image/webp';
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const fileStream = fs.createReadStream(row.file_path);
    fileStream.on('error', (err) => {
      console.error('Error streaming thumbnail:', err);
      res.status(500).json({ error: 'Error reading receipt file' });
    });
    
    fileStream.pipe(res);
  });
});

// Get unmatched receipts
router.get('/unmatched/list', (req, res) => {
  // Build query with proper user/admin filtering
  let whereClause = 'WHERE r.company_id = ?';
  let queryParams = [req.companyId];

  // If user is not admin, only show their own receipts
  if (req.user && req.user.currentRole !== 'admin') {
    whereClause += ' AND r.created_by = ?';
    queryParams.push(req.user.id);
  }

  const query = `
    SELECT * FROM receipts r
    ${whereClause}
    AND r.id NOT IN (
      SELECT receipt_id FROM matches WHERE user_confirmed = 1
    )
    AND r.processing_status = 'completed'
    ORDER BY r.upload_date DESC
  `;

  db.all(query, queryParams, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Manual trigger for auto-matching existing receipts
router.post('/trigger-auto-match/:id', (req, res) => {
  const receiptId = req.params.id;
  
  console.log(`Manual trigger for auto-matching receipt ${receiptId}`);
  
  // Check if receipt exists and belongs to user's company
  db.get('SELECT * FROM receipts WHERE id = ? AND company_id = ?', [receiptId, req.companyId], (err, receipt) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    // Check if receipt already has a match
    db.get('SELECT COUNT(*) as count FROM matches WHERE receipt_id = ? AND user_confirmed = 1', [receiptId], (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      
      if (result.count > 0) {
        return res.status(400).json({ error: 'Receipt already has a confirmed match' });
      }
      
      // Trigger auto-match
      triggerAutoMatchForReceipt(receiptId);
      
      res.json({ 
        message: 'Auto-match triggered successfully',
        receiptId: receiptId
      });
    });
  });
});

// Bulk trigger auto-matching for all unmatched receipts
router.post('/trigger-auto-match-all', (req, res) => {
  console.log('Bulk trigger for auto-matching all unmatched receipts');
  
  // Get all receipts without confirmed matches
  const query = `
    SELECT r.* FROM receipts r
    WHERE r.company_id = ? 
    AND r.id NOT IN (
      SELECT receipt_id FROM matches WHERE user_confirmed = 1
    )
    AND r.extracted_amount IS NOT NULL 
    AND r.extracted_merchant IS NOT NULL
    AND r.extracted_merchant != 'name'
    AND r.extracted_merchant NOT LIKE '%If a more specific category%'
  `;
  
  db.all(query, [req.companyId], (err, receipts) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    console.log(`Found ${receipts.length} receipts eligible for auto-matching`);
    
    let processedCount = 0;
    receipts.forEach(receipt => {
      triggerAutoMatchForReceipt(receipt.id);
      processedCount++;
    });
    
    res.json({ 
      message: `Auto-match triggered for ${processedCount} receipts`,
      processedCount: processedCount
    });
  });
});

module.exports = router; 