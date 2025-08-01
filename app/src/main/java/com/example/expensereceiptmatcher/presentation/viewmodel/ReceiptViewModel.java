package com.example.expensereceiptmatcher.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.expensereceiptmatcher.domain.model.Receipt;
import com.example.expensereceiptmatcher.domain.model.Transaction;

import java.util.List;

public class ReceiptViewModel extends ViewModel {
    private MutableLiveData<List<Receipt>> receipts;
    private MutableLiveData<List<Transaction>> unmatchedTransactions;
    
    public ReceiptViewModel() {
        receipts = new MutableLiveData<>();
        unmatchedTransactions = new MutableLiveData<>();
    }
    
    public LiveData<List<Receipt>> getReceipts() {
        return receipts;
    }
    
    public LiveData<List<Transaction>> getUnmatchedTransactions() {
        return unmatchedTransactions;
    }
    
    public void loadReceipts() {
        // Load receipts from repository
    }
    
    public void loadUnmatchedTransactions() {
        // Load unmatched transactions from repository
    }
    
    public void scanReceipt(String imagePath) {
        // Scan a receipt and add it to the list
    }
    
    public void matchReceipt(Receipt receipt, Transaction transaction) {
        // Match a receipt with a transaction
    }
}