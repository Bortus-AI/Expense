package com.example.expensereceiptmatcher.presentation.viewmodel;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.expensereceiptmatcher.domain.model.User;
import com.example.expensereceiptmatcher.domain.model.Company;

public class MainViewModel extends ViewModel {
    private MutableLiveData<User> currentUser;
    private MutableLiveData<Company> currentCompany;
    private MutableLiveData<Boolean> isLoading;
    private MutableLiveData<String> errorMessage;
    
    public MainViewModel() {
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
    
    public void setCurrentUser(User user) {
        currentUser.setValue(user);
    }
    
    public LiveData<Company> getCurrentCompany() {
        return currentCompany;
    }
    
    public void setCurrentCompany(Company company) {
        currentCompany.setValue(company);
    }
    
    public LiveData<Boolean> getIsLoading() {
        return isLoading;
    }
    
    public void setIsLoading(boolean loading) {
        isLoading.setValue(loading);
    }
    
    public LiveData<String> getErrorMessage() {
        return errorMessage;
    }
    
    public void setErrorMessage(String message) {
        errorMessage.setValue(message);
    }
    
    public void clearError() {
        errorMessage.setValue(null);
    }
}