package com.example.expensereceiptmatcher.data.api;

public class MatchRequest {
    private int receiptId;
    private int transactionId;
    
    public MatchRequest(int receiptId, int transactionId) {
        this.receiptId = receiptId;
        this.transactionId = transactionId;
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
}