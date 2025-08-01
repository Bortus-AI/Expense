package com.example.expensereceiptmatcher.data.api;

public class MatchStatsResponse {
    private int totalMatches;
    private int confirmedMatches;
    private int pendingMatches;
    private int unmatchedReceipts;
    private int unmatchedTransactions;
    
    public MatchStatsResponse() {
    }
    
    // Getters and setters
    public int getTotalMatches() {
        return totalMatches;
    }
    
    public void setTotalMatches(int totalMatches) {
        this.totalMatches = totalMatches;
    }
    
    public int getConfirmedMatches() {
        return confirmedMatches;
    }
    
    public void setConfirmedMatches(int confirmedMatches) {
        this.confirmedMatches = confirmedMatches;
    }
    
    public int getPendingMatches() {
        return pendingMatches;
    }
    
    public void setPendingMatches(int pendingMatches) {
        this.pendingMatches = pendingMatches;
    }
    
    public int getUnmatchedReceipts() {
        return unmatchedReceipts;
    }
    
    public void setUnmatchedReceipts(int unmatchedReceipts) {
        this.unmatchedReceipts = unmatchedReceipts;
    }
    
    public int getUnmatchedTransactions() {
        return unmatchedTransactions;
    }
    
    public void setUnmatchedTransactions(int unmatchedTransactions) {
        this.unmatchedTransactions = unmatchedTransactions;
    }
}