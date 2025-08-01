package com.example.expensereceiptmatcher.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.expensereceiptmatcher.domain.model.Match;
import com.example.expensereceiptmatcher.domain.model.Transaction;
import com.example.expensereceiptmatcher.domain.model.Receipt;

import java.util.List;

public class MatchViewModel extends ViewModel {
    private MutableLiveData<List<Match>> matches;
    private MutableLiveData<Boolean> isLoading;
    private MutableLiveData<String> errorMessage;
    
    public MatchViewModel() {
        matches = new MutableLiveData<>();
        isLoading = new MutableLiveData<>();
        errorMessage = new MutableLiveData<>();
        
        // Initialize with default values
        isLoading.setValue(false);
        errorMessage.setValue(null);
    }
    
    public LiveData<List<Match>> getMatches() {
        return matches;
    }
    
    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }
    
    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }
    
    public void loadMatches() {
        // Load matches from repository
        setIsLoading(true);
        // TODO: Implement actual data loading
        setIsLoading(false);
    }
    
    public void refreshMatches() {
        loadMatches();
    }
    
    public void createMatch(Receipt receipt, Transaction transaction, double confidenceScore) {
        // Create a match between a receipt and a transaction
        // TODO: Implement actual matching logic
    }
    
    public void deleteMatch(Match match) {
        // Delete a match
        // TODO: Implement actual deletion logic
    }
    
    public void updateMatch(Match match) {
        // Update an existing match
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