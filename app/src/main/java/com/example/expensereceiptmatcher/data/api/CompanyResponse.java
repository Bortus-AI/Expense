package com.example.expensereceiptmatcher.data.api;

import java.util.Map;

public class CompanyResponse {
    private int id;
    private String name;
    private String domain;
    private String planType;
    private Map<String, Object> settings;
    private int userCount;
    private int transactionCount;
    private int receiptCount;
    private int confirmedMatches;
    private int matchRate;
    private String createdAt;
    private String updatedAt;
    
    public CompanyResponse() {
    }
    
    // Getters and setters
    public int getId() {
        return id;
    }
    
    public void setId(int id) {
        this.id = id;
    }
    
    public String getName() {
        return name;
    }
    
    public void setName(String name) {
        this.name = name;
    }
    
    public String getDomain() {
        return domain;
    }
    
    public void setDomain(String domain) {
        this.domain = domain;
    }
    
    public String getPlanType() {
        return planType;
    }
    
    public void setPlanType(String planType) {
        this.planType = planType;
    }
    
    public Map<String, Object> getSettings() {
        return settings;
    }
    
    public void setSettings(Map<String, Object> settings) {
        this.settings = settings;
    }
    
    public int getUserCount() {
        return userCount;
    }
    
    public void setUserCount(int userCount) {
        this.userCount = userCount;
    }
    
    public int getTransactionCount() {
        return transactionCount;
    }
    
    public void setTransactionCount(int transactionCount) {
        this.transactionCount = transactionCount;
    }
    
    public int getReceiptCount() {
        return receiptCount;
    }
    
    public void setReceiptCount(int receiptCount) {
        this.receiptCount = receiptCount;
    }
    
    public int getConfirmedMatches() {
        return confirmedMatches;
    }
    
    public void setConfirmedMatches(int confirmedMatches) {
        this.confirmedMatches = confirmedMatches;
    }
    
    public int getMatchRate() {
        return matchRate;
    }
    
    public void setMatchRate(int matchRate) {
        this.matchRate = matchRate;
    }
    
    public String getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }
    
    public String getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }
}