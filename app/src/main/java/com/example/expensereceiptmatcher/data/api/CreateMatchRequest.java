package com.example.expensereceiptmatcher.data.api;

public class CreateMatchRequest {
    private int transactionId;
    private int receiptId;
    private int matchConfidence;
    private boolean autoConfirm;
    
    public CreateMatchRequest() {
    }
    
    public CreateMatchRequest(int transactionId, int receiptId) {
        this.transactionId = transactionId;
        this.receiptId = receiptId;
    }
    
    public CreateMatchRequest(int transactionId, int receiptId, int matchConfidence, boolean autoConfirm) {
        this.transactionId = transactionId;
        this.receiptId = receiptId;
        this.matchConfidence = matchConfidence;
        this.autoConfirm = autoConfirm;
    }
    
    // Getters and setters
    public int getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(int transactionId) {
        this.transactionId = transactionId;
    }
    
    public int getReceiptId() {
        return receiptId;
    }
    
    public void setReceiptId(int receiptId) {
        this.receiptId = receiptId;
    }
    
    public int getMatchConfidence() {
        return matchConfidence;
    }
    
    public void setMatchConfidence(int matchConfidence) {
        this.matchConfidence = matchConfidence;
    }
    
    public boolean isAutoConfirm() {
        return autoConfirm;
    }
    
    public void setAutoConfirm(boolean autoConfirm) {
        this.autoConfirm = autoConfirm;
    }
}