package com.example.expensereceiptmatcher.data.api;

import java.util.List;

public class UserListResponse {
    private List<User> users;
    
    public UserListResponse() {
    }
    
    public UserListResponse(List<User> users) {
        this.users = users;
    }
    
    // Getters and setters
    public List<User> getUsers() {
        return users;
    }
    
    public void setUsers(List<User> users) {
        this.users = users;
    }
    
    public static class User {
        private int id;
        private String email;
        private String firstName;
        private String lastName;
        private String role;
        private String status;
        private String lastLogin;
        private String joinedAt;
        private String memberSince;
        
        public User() {
        }
        
        // Getters and setters
        public int getId() {
            return id;
        }
        
        public void setId(int id) {
            this.id = id;
        }
        
        public String getEmail() {
            return email;
        }
        
        public void setEmail(String email) {
            this.email = email;
        }
        
        public String getFirstName() {
            return firstName;
        }
        
        public void setFirstName(String firstName) {
            this.firstName = firstName;
        }
        
        public String getLastName() {
            return lastName;
        }
        
        public void setLastName(String lastName) {
            this.lastName = lastName;
        }
        
        public String getRole() {
            return role;
        }
        
        public void setRole(String role) {
            this.role = role;
        }
        
        public String getStatus() {
            return status;
        }
        
        public void setStatus(String status) {
            this.status = status;
        }
        
        public String getLastLogin() {
            return lastLogin;
        }
        
        public void setLastLogin(String lastLogin) {
            this.lastLogin = lastLogin;
        }
        
        public String getJoinedAt() {
            return joinedAt;
        }
        
        public void setJoinedAt(String joinedAt) {
            this.joinedAt = joinedAt;
        }
        
        public String getMemberSince() {
            return memberSince;
        }
        
        public void setMemberSince(String memberSince) {
            this.memberSince = memberSince;
        }
        
        // Helper method to get full name
        public String getFullName() {
            return firstName + " " + lastName;
        }
    }
}