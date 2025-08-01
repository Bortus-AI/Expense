package com.example.expensereceiptmatcher.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.expensereceiptmatcher.domain.model.User;
import com.example.expensereceiptmatcher.domain.model.Company;

public class ProfileViewModel extends ViewModel {
    private MutableLiveData<User> currentUser;
    private MutableLiveData<Company> currentCompany;
    private MutableLiveData<Boolean> isLoading;
    private MutableLiveData<String> errorMessage;
    
    public ProfileViewModel() {
        currentUser = new MutableLiveData<>();
        currentCompany = new MutableLiveData<>();
        isLoading = new MutableLiveData<>();
        errorMessage = new MutableLiveData<>();
        
        // Initialize with default values
        isLoading.setValue(false);
        errorMessage.setValue(null);
    }
    
    public LiveData<User> getCurrentUser() {
        return currentUser;
    }
    
    public LiveData<Company> getCurrentCompany() {
        return currentCompany;
    }
    
    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }
    
    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }
    
    public void loadUserProfile() {
        // Load user profile from repository
        setIsLoading(true);
        // TODO: Implement actual data loading
        setIsLoading(false);
    }
    
    public void updateUserProfile(User user) {
        // Update user profile
        setIsLoading(true);
        // TODO: Implement actual update logic
        setIsLoading(false);
    }
    
    public void changePassword(String oldPassword, String newPassword) {
        // Change user password
        setIsLoading(true);
        // TODO: Implement actual password change logic
        setIsLoading(false);
    }
    
    public void updateCompanyProfile(Company company) {
        // Update company profile
        setIsLoading(true);
        // TODO: Implement actual update logic
        setIsLoading(false);
    }
    
    private void setIsLoading(boolean loading) {
        isLoading.setValue(loading);
    }
    
    public void setErrorMessage(String message) {
        errorMessage.setValue(message);
    }
    
    public void clearError() {
        errorMessage.setValue(null);
    }
}