package com.example.expensereceiptmatcher.domain.model;

public class Match {
    private int id;
    private int receiptId;
    private int transactionId;
    private double confidenceScore; // Confidence score between 0.0 and 1.0
    private String matchDate;
    private boolean isManual; // True if manually matched, false if auto-matched
    
    public Match() {
        this.confidenceScore = 0.0;
        this.isManual = false;
    }
    
    // Getters and setters
    public int getId() {
        return id;
    }
    
    public void setId(int id) {
        this.id = id;
    }
    
    public int getReceiptId() {
        return receiptId;
    }
    
    public void setReceiptId(int receiptId) {
        this.receiptId = receiptId;
    }
    
    public int getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(int transactionId) {
        this.transactionId = transactionId;
    }
    
    public double getConfidenceScore() {
        return confidenceScore;
    }
    
    public void setConfidenceScore(double confidenceScore) {
        this.confidenceScore = confidenceScore;
    }
    
    public String getMatchDate() {
        return matchDate;
    }
    
    public void setMatchDate(String matchDate) {
        this.matchDate = matchDate;
    }
    
    public boolean isManual() {
        return isManual;
    }
    
    public void setManual(boolean manual) {
        isManual = manual;
    }
}