package com.example.expensereceiptmatcher.domain.model;

public class Transaction {
    private int id;
    private String date;
    private double amount;
    private String description;
    private String category;
    private boolean isMatched;
    private int receiptId;
    
    public Transaction() {
        this.isMatched = false;
        this.receiptId = -1;
    }
    
    // Getters and setters
    public int getId() {
        return id;
    }
    
    public void setId(int id) {
        this.id = id;
    }
    
    public String getDate() {
        return date;
    }
    
    public void setDate(String date) {
        this.date = date;
    }
    
    public double getAmount() {
        return amount;
    }
    
    public void setAmount(double amount) {
        this.amount = amount;
    }
    
    public String getDescription() {
        return description;
    }
    
    public void setDescription(String description) {
        this.description = description;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public boolean isMatched() {
        return isMatched;
    }
    
    public void setMatched(boolean matched) {
        isMatched = matched;
    }
    
    public int getReceiptId() {
        return receiptId;
    }
    
    public void setReceiptId(int receiptId) {
        this.receiptId = receiptId;
        this.isMatched = receiptId != -1;
    }
}