package com.example.expensereceiptmatcher.data.repository;

import android.content.Context;
import android.util.Log;

import com.example.expensereceiptmatcher.data.api.ApiClient;
import com.example.expensereceiptmatcher.data.api.LoginRequest;
import com.example.expensereceiptmatcher.data.api.RegisterRequest;
import com.example.expensereceiptmatcher.data.api.RefreshTokenRequest;
import com.example.expensereceiptmatcher.data.api.ApiService;
import com.example.expensereceiptmatcher.data.api.LoginResponse;
import com.example.expensereceiptmatcher.data.api.RegisterResponse;
import com.example.expensereceiptmatcher.data.api.ApiResponse;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class AuthRepository {
    private static final String TAG = "AuthRepository";
    private ApiClient apiClient;
    private ApiService apiService;
    
    public AuthRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
        apiService = apiClient.getApiService();
    }
    
    public interface AuthCallback<T> {
        void onSuccess(T response);
        void onError(String error);
    }
    
    // Login method
    public void login(String email, String password, AuthCallback<LoginResponse> callback) {
        LoginRequest request = new LoginRequest(email, password);
        Call<LoginResponse> call = apiService.login(request);
        
        call.enqueue(new Callback<LoginResponse>() {
            @Override
            public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    LoginResponse loginResponse = response.body();
                    
                    // Save tokens and company ID
                    apiClient.saveTokens(loginResponse.getAccessToken(), loginResponse.getRefreshToken());
                    if (loginResponse.getCompanies() != null && !loginResponse.getCompanies().isEmpty()) {
                        // Set the first company as default
                        apiClient.setCompanyId(String.valueOf(loginResponse.getCompanies().get(0).getId()));
                    }
                    
                    callback.onSuccess(loginResponse);
                } else {
                    String error = "Login failed";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<LoginResponse> call, Throwable t) {
                Log.e(TAG, "Login failed", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Register method
    public void register(String email, String password, String firstName, String lastName, 
                         AuthCallback<RegisterResponse> callback) {
        RegisterRequest request = new RegisterRequest(email, password, firstName, lastName);
        Call<RegisterResponse> call = apiService.register(request);
        
        call.enqueue(new Callback<RegisterResponse>() {
            @Override
            public void onResponse(Call<RegisterResponse> call, Response<RegisterResponse> response) {
                if (response.isSuccessful() && response.body() != null) {
                    RegisterResponse registerResponse = response.body();
                    
                    // Save tokens and company ID
                    apiClient.saveTokens(registerResponse.getAccessToken(), registerResponse.getRefreshToken());
                    if (registerResponse.getCompany() != null) {
                        apiClient.setCompanyId(String.valueOf(registerResponse.getCompany().getId()));
                    }
                    
                    callback.onSuccess(registerResponse);
                } else {
                    String error = "Registration failed";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<RegisterResponse> call, Throwable t) {
                Log.e(TAG, "Registration failed", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Refresh token method
    public void refreshToken(AuthCallback<String> callback) {
        String refreshToken = apiClient.getRefreshToken();
        if (refreshToken == null || refreshToken.isEmpty()) {
            callback.onError("No refresh token available");
            return;
        }
        
        RefreshTokenRequest request = new RefreshTokenRequest(refreshToken);
        Call<ApiResponse<String>> call = apiService.refreshToken(request);
        
        call.enqueue(new Callback<ApiResponse<String>>() {
            @Override
            public void onResponse(Call<ApiResponse<String>> call, Response<ApiResponse<String>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<String> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        // Save new access token
                        apiClient.saveAccessToken(apiResponse.getData());
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("Failed to refresh token");
                    }
                } else {
                    // Refresh token might be expired, clear all tokens
                    apiClient.clearTokens();
                    callback.onError("Session expired, please login again");
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<String>> call, Throwable t) {
                Log.e(TAG, "Token refresh failed", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Logout method
    public void logout(AuthCallback<Void> callback) {
        Call<ApiResponse<Void>> call = apiService.logout();
        
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                // Clear tokens regardless of server response
                apiClient.clearTokens();
                
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    // Even if server returns error, we still clear local tokens
                    callback.onSuccess(null);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Logout failed", t);
                // Clear tokens even on network failure
                apiClient.clearTokens();
                callback.onSuccess(null);
            }
        });
    }
    
    // Check if user is authenticated
    public boolean isAuthenticated() {
        return apiClient.getAccessToken() != null && !apiClient.getAccessToken().isEmpty();
    }
    
    // Get current company ID
    public String getCompanyId() {
        return apiClient.getCompanyId();
    }
    
    // Set company ID
    public void setCompanyId(String companyId) {
        apiClient.setCompanyId(companyId);
    }
}