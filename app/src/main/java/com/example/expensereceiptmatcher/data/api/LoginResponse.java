package com.example.expensereceiptmatcher.data.api;

import com.example.expensereceiptmatcher.domain.model.User;
import java.util.List;

public class LoginResponse {
    private String message;
    private User user;
    private List<Company> companies;
    private String accessToken;
    private String refreshToken;
    
    // Getters and setters
    public String getMessage() {
        return message;
    }
    
    public void setMessage(String message) {
        this.message = message;
    }
    
    public User getUser() {
        return user;
    }
    
    public void setUser(User user) {
        this.user = user;
    }
    
    public List<Company> getCompanies() {
        return companies;
    }
    
    public void setCompanies(List<Company> companies) {
        this.companies = companies;
    }
    
    public String getAccessToken() {
        return accessToken;
    }
    
    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }
    
    public String getRefreshToken() {
        return refreshToken;
    }
    
    public void setRefreshToken(String refreshToken) {
        this.refreshToken = refreshToken;
    }
    
    public static class Company {
        private int id;
        private String name;
        private String role;
        
        public Company() {
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
        
        public String getRole() {
            return role;
        }
        
        public void setRole(String role) {
            this.role = role;
        }
    }
}