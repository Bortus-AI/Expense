package com.example.expensereceiptmatcher.domain.model;

public class Receipt {
    private int id;
    private String imageUrl;
    private String date;
    private double amount;
    private String vendor;
    private String category;
    private String notes;
    private boolean isMatched;
    private int transactionId;
    
    public Receipt() {
        this.isMatched = false;
        this.transactionId = -1;
    }
    
    // Getters and setters
    public int getId() {
        return id;
    }
    
    public void setId(int id) {
        this.id = id;
    }
    
    public String getImageUrl() {
        return imageUrl;
    }
    
    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
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
    
    public String getVendor() {
        return vendor;
    }
    
    public void setVendor(String vendor) {
        this.vendor = vendor;
    }
    
    public String getCategory() {
        return category;
    }
    
    public void setCategory(String category) {
        this.category = category;
    }
    
    public String getNotes() {
        return notes;
    }
    
    public void setNotes(String notes) {
        this.notes = notes;
    }
    
    public boolean isMatched() {
        return isMatched;
    }
    
    public void setMatched(boolean matched) {
        isMatched = matched;
    }
    
    public int getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(int transactionId) {
        this.transactionId = transactionId;
        this.isMatched = transactionId != -1;
    }
}