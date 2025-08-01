package com.example.expensereceiptmatcher.data.repository;

import android.content.Context;
import android.util.Log;

import com.example.expensereceiptmatcher.data.api.ApiClient;
import com.example.expensereceiptmatcher.data.api.ApiService;
import com.example.expensereceiptmatcher.data.api.ApiResponse;
import com.example.expensereceiptmatcher.data.api.UpdateProfileRequest;
import com.example.expensereceiptmatcher.data.api.ChangePasswordRequest;
import com.example.expensereceiptmatcher.domain.model.User;

import okhttp3.RequestBody;
import okhttp3.MediaType;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class UserRepository {
    private static final String TAG = "UserRepository";
    private ApiClient apiClient;
    private ApiService apiService;
    
    public UserRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
        apiService = apiClient.getApiService();
    }
    
    public interface UserCallback<T> {
        void onSuccess(T response);
        void onError(String error);
    }
    
    // Get current user profile
    public void getCurrentUser(UserCallback<User> callback) {
        Call<ApiResponse<User>> call = apiService.getProfile();
        call.enqueue(new Callback<ApiResponse<User>>() {
            @Override
            public void onResponse(Call<ApiResponse<User>> call, Response<ApiResponse<User>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<User> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No user data received");
                    }
                } else {
                    String error = "Failed to fetch user profile";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<User>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch user profile", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Update user profile
    public void updateProfile(String firstName, String lastName, UserCallback<User> callback) {
        UpdateProfileRequest request = new UpdateProfileRequest(firstName, lastName);
        Call<ApiResponse<User>> call = apiService.updateProfile(request);
        call.enqueue(new Callback<ApiResponse<User>>() {
            @Override
            public void onResponse(Call<ApiResponse<User>> call, Response<ApiResponse<User>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<User> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("Failed to update profile");
                    }
                } else {
                    String error = "Failed to update profile";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<User>> call, Throwable t) {
                Log.e(TAG, "Failed to update profile", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Change password
    public void changePassword(String currentPassword, String newPassword, UserCallback<Void> callback) {
        ChangePasswordRequest request = new ChangePasswordRequest(currentPassword, newPassword);
        Call<ApiResponse<Void>> call = apiService.changePassword(request);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to change password";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to change password", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Get company details
    public void getCompanyDetails(UserCallback<com.example.expensereceiptmatcher.data.api.CompanyResponse> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>> call = 
            apiService.getCompany(Integer.parseInt(companyId));
        call.enqueue(new Callback<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>>() {
            @Override
            public void onResponse(Call<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>> call, 
                                  Response<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No company data received");
                    }
                } else {
                    String error = "Failed to fetch company details";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch company details", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Update company details
    public void updateCompanyDetails(com.example.expensereceiptmatcher.data.api.CompanyResponse companyData, 
                                    UserCallback<com.example.expensereceiptmatcher.data.api.CompanyResponse> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>> call = 
            apiService.updateCompany(Integer.parseInt(companyId), companyData);
        call.enqueue(new Callback<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>>() {
            @Override
            public void onResponse(Call<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>> call, 
                                  Response<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("Failed to update company details");
                    }
                } else {
                    String error = "Failed to update company details";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<com.example.expensereceiptmatcher.data.api.CompanyResponse>> call, Throwable t) {
                Log.e(TAG, "Failed to update company details", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Get company users
    public void getCompanyUsers(UserCallback<com.example.expensereceiptmatcher.data.api.UserListResponse> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<com.example.expensereceiptmatcher.data.api.UserListResponse>> call = 
            apiService.getCompanyUsers(Integer.parseInt(companyId));
        call.enqueue(new Callback<ApiResponse<com.example.expensereceiptmatcher.data.api.UserListResponse>>() {
            @Override
            public void onResponse(Call<ApiResponse<com.example.expensereceiptmatcher.data.api.UserListResponse>> call, 
                                  Response<ApiResponse<com.example.expensereceiptmatcher.data.api.UserListResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<com.example.expensereceiptmatcher.data.api.UserListResponse> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No user data received");
                    }
                } else {
                    String error = "Failed to fetch company users";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<com.example.expensereceiptmatcher.data.api.UserListResponse>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch company users", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Invite user to company
    public void inviteUser(String email, String role, UserCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        // Create request body for invite data
        String inviteData = "{\"email\":\"" + email + "\",\"role\":\"" + role + "\"}";
        RequestBody body = RequestBody.create(inviteData, MediaType.parse("application/json"));
        
        Call<ApiResponse<Void>> call = apiService.inviteUser(Integer.parseInt(companyId), body);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to invite user";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to invite user", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Update user role
    public void updateUserRole(int userId, String role, UserCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        // Create request body for role data
        String roleData = "{\"role\":\"" + role + "\"}";
        RequestBody body = RequestBody.create(roleData, MediaType.parse("application/json"));
        
        Call<ApiResponse<Void>> call = apiService.updateUserRole(Integer.parseInt(companyId), userId, body);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to update user role";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to update user role", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Remove user from company
    public void removeUser(int userId, UserCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<Void>> call = apiService.removeUser(Integer.parseInt(companyId), userId);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to remove user";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to remove user", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
}