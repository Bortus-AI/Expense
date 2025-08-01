package com.example.expensereceiptmatcher.data.repository;

import com.example.expensereceiptmatcher.domain.model.Receipt;
import com.example.expensereceiptmatcher.domain.model.Transaction;

import java.util.List;

public class ReceiptRepository {
    // Repository for managing receipt data
    // This would typically interact with a local database and/or remote API
    
    public void saveReceipt(Receipt receipt) {
        // Save receipt to local database
    }
    
    public List<Receipt> getAllReceipts() {
        // Retrieve all receipts from local database
        return null;
    }
    
    public Receipt getReceiptById(int id) {
        // Retrieve a specific receipt by ID
        return null;
    }
    
    public void deleteReceipt(Receipt receipt) {
        // Delete a receipt from the database
    }
    
    public void updateReceipt(Receipt receipt) {
        // Update an existing receipt
    }
    
    public List<Transaction> getUnmatchedTransactions() {
        // Retrieve transactions that haven't been matched with receipts
        return null;
    }
    
    public void matchReceiptWithTransaction(Receipt receipt, Transaction transaction) {
        // Create a match between a receipt and a transaction
    }
}