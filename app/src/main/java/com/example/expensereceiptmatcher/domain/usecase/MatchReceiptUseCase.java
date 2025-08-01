package com.example.expensereceiptmatcher.domain.usecase;

import com.example.expensereceiptmatcher.domain.model.Receipt;
import com.example.expensereceiptmatcher.domain.model.Transaction;

public class MatchReceiptUseCase {
    // Use case for matching a receipt with a transaction
    
    public void execute(Receipt receipt, Transaction transaction) {
        // This would typically involve validating the match and updating both entities
        // For now, we'll just mark them as matched
        receipt.setMatched(true);
        receipt.setTransactionId(transaction.getId());
        transaction.setMatched(true);
        transaction.setReceiptId(receipt.getId());
    }
}