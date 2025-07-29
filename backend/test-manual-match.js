const db = require('./database/init');

// Import the matching algorithm and trigger function from receipts route
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
      const receiptDate = new Date(receipt.extracted_date);
      const transactionDate = new Date(transaction.transaction_date);
      
      if (!isNaN(receiptDate.getTime()) && !isNaN(transactionDate.getTime())) {
        const daysDiff = Math.abs(receiptDate - transactionDate) / (1000 * 60 * 60 * 24);
        
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

    if (confidence > 0) {
      matches.push({
        transaction: transaction,
        confidence: Math.round(confidence),
        reasons: reasons
      });
    }
  });

  // Sort by confidence (highest first)
  return matches.sort((a, b) => b.confidence - a.confidence);
};

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
            console.log(`✅ Auto-matched receipt ${receiptId} with transaction ${bestMatch.transaction.id} (confidence: ${bestMatch.confidence}%)`);
          }
        });
      } else {
        if (potentialMatches.length > 0) {
          const bestMatch = potentialMatches[0];
          console.log(`❌ No high-confidence matches found for receipt ${receiptId}.`);
          console.log(`Best match: ${bestMatch.confidence}% - Transaction: "${bestMatch.transaction.description}" (${bestMatch.transaction.transaction_date}, $${Math.abs(bestMatch.transaction.amount)})`);
          console.log(`Match reasons: ${bestMatch.reasons.join(', ')}`);
        } else {
          console.log(`❌ No matches found for receipt ${receiptId}`);
        }
      }
    });
  });
};

async function testManualMatch() {
  console.log('Manually triggering auto-match for receipt 97...\n');

  // Trigger auto-match for receipt 97
  triggerAutoMatchForReceipt(97);

  // Wait a moment and then check if match was created
  setTimeout(() => {
    db.all('SELECT m.*, r.extracted_merchant, r.extracted_amount, t.description, t.amount FROM matches m JOIN receipts r ON m.receipt_id = r.id JOIN transactions t ON m.transaction_id = t.id WHERE m.receipt_id = 97', [], (err, rows) => {
      if (err) {
        console.error('Error checking matches:', err);
      } else {
        console.log('\nMatches for receipt 97:', JSON.stringify(rows, null, 2));
      }
    });
  }, 2000);
}

testManualMatch(); 