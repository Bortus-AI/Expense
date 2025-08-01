package com.example.expensereceiptmatcher.data.api;

public class UpdateProfileRequest {
    private String firstName;
    private String lastName;
    
    public UpdateProfileRequest() {
    }
    
    public UpdateProfileRequest(String firstName, String lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }
    
    // Getters and setters
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
}