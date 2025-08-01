package com.example.expensereceiptmatcher.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.expensereceiptmatcher.domain.model.Transaction;
import com.example.expensereceiptmatcher.domain.model.Receipt;

import java.util.List;

public class TransactionViewModel extends ViewModel {
    private MutableLiveData<List<Transaction>> transactions;
    private MutableLiveData<List<Transaction>> unmatchedTransactions;
    private MutableLiveData<Boolean> isLoading;
    private MutableLiveData<String> errorMessage;
    
    public TransactionViewModel() {
        transactions = new MutableLiveData<>();
        unmatchedTransactions = new MutableLiveData<>();
        isLoading = new MutableLiveData<>();
        errorMessage = new MutableLiveData<>();
        
        // Initialize with default values
        isLoading.setValue(false);
        errorMessage.setValue(null);
    }
    
    public LiveData<List<Transaction>> getTransactions() {
        return transactions;
    }
    
    public LiveData<List<Transaction>> getUnmatchedTransactions() {
        return unmatchedTransactions;
    }
    
    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }
    
    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }
    
    public void loadTransactions() {
        // Load transactions from repository
        setIsLoading(true);
        // TODO: Implement actual data loading
        setIsLoading(false);
    }
    
    public void loadUnmatchedTransactions() {
        // Load unmatched transactions from repository
        setIsLoading(true);
        // TODO: Implement actual data loading
        setIsLoading(false);
    }
    
    public void refreshTransactions() {
        loadTransactions();
    }
    
    public void refreshUnmatchedTransactions() {
        loadUnmatchedTransactions();
    }
    
    public void matchTransactionWithReceipt(Transaction transaction, Receipt receipt) {
        // Match a transaction with a receipt
        // TODO: Implement actual matching logic
    }
    
    public void deleteTransaction(Transaction transaction) {
        // Delete a transaction
        // TODO: Implement actual deletion logic
    }
    
    public void updateTransaction(Transaction transaction) {
        // Update an existing transaction
        // TODO: Implement actual update logic
    }
    
    private void setIsLoading(boolean loading) {
        isLoading.setValue(loading);
    }
    
    public void setErrorMessage(String message) {
        errorMessage.setValue(message);
    }
    
    public void clearError() {
        errorMessage.setValue(null);
    }
}