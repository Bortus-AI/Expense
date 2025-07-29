const db = require('./database/init');

// Import the matching algorithm from receipts route
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

async function testSpecificMatching() {
  console.log('Testing auto-matching for receipt 97 (OpenAI $21.28)...\n');

  // Get receipt 97
  db.get('SELECT id, extracted_merchant, extracted_amount, extracted_date FROM receipts WHERE id = 97', [], (err, receipt) => {
    if (err || !receipt) {
      console.error('Error getting receipt 97:', err);
      return;
    }

    console.log('Receipt 97 details:');
    console.log(`- Amount: $${receipt.extracted_amount}`);
    console.log(`- Merchant: ${receipt.extracted_merchant}`);
    console.log(`- Date: ${receipt.extracted_date}`);
    console.log('');

    // Get transactions with amount 21.28
    db.all('SELECT * FROM transactions WHERE amount = 21.28 ORDER BY transaction_date DESC', [], (err, transactions) => {
      if (err) {
        console.error('Error getting transactions:', err);
        return;
      }

      console.log(`Found ${transactions.length} transactions with amount $21.28:`);
      transactions.forEach(t => {
        console.log(`- ${t.description} | $${t.amount} | ${t.transaction_date}`);
      });
      console.log('');

      const matches = findPotentialMatches(receipt, transactions);
      
      if (matches.length > 0) {
        console.log(`Found ${matches.length} potential matches:`);
        matches.forEach((match, index) => {
          console.log(`${index + 1}. ${match.transaction.description} | $${match.transaction.amount} | ${match.transaction.transaction_date} | Confidence: ${match.confidence}%`);
          console.log(`   Reasons: ${match.reasons.join(', ')}`);
        });
        
        if (matches[0].confidence >= 60) {
          console.log('✅ Would auto-match!');
        } else {
          console.log(`❌ Below threshold (60%). Best match: ${matches[0].confidence}%`);
        }
      } else {
        console.log('❌ No matches found');
      }
    });
  });
}

testSpecificMatching(); 