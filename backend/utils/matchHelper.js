const moment = require('moment');

function findPotentialMatches(receipt, transactions) {
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
}

module.exports = {
  findPotentialMatches
};
