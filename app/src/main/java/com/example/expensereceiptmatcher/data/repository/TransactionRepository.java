package com.example.expensereceiptmatcher.data.repository;

import android.content.Context;
import android.util.Log;

import com.example.expensereceiptmatcher.data.api.ApiClient;
import com.example.expensereceiptmatcher.data.api.ApiService;
import com.example.expensereceiptmatcher.data.api.ApiResponse;
import com.example.expensereceiptmatcher.domain.model.Transaction;

import java.io.File;
import java.util.List;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class TransactionRepository {
    private static final String TAG = "TransactionRepository";
    private ApiClient apiClient;
    private ApiService apiService;
    
    public TransactionRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
        apiService = apiClient.getApiService();
    }
    
    public interface TransactionCallback<T> {
        void onSuccess(T response);
        void onError(String error);
    }
    
    // Get all transactions
    public void getAllTransactions(Integer page, Integer limit, String status, TransactionCallback<List<Transaction>> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<List<Transaction>>> call = apiService.getTransactions(page, limit, status, companyId);
        call.enqueue(new Callback<ApiResponse<List<Transaction>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Transaction>>> call, Response<ApiResponse<List<Transaction>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<List<Transaction>> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No data received");
                    }
                } else {
                    String error = "Failed to fetch transactions";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<List<Transaction>>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch transactions", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Get transaction by ID
    public void getTransactionById(int id, TransactionCallback<Transaction> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<Transaction>> call = apiService.getTransaction(id, companyId);
        call.enqueue(new Callback<ApiResponse<Transaction>>() {
            @Override
            public void onResponse(Call<ApiResponse<Transaction>> call, Response<ApiResponse<Transaction>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Transaction> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("Transaction not found");
                    }
                } else {
                    String error = "Failed to fetch transaction";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Transaction>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch transaction", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Import transactions from CSV
    public void importTransactions(File csvFile, TransactionCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        // Create request body for file
        RequestBody requestFile = RequestBody.create(csvFile, MediaType.parse("text/csv"));
        MultipartBody.Part body = MultipartBody.Part.createFormData("csvFile", csvFile.getName(), requestFile);
        
        Call<ApiResponse<Void>> call = apiService.importTransactions(body, companyId);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to import transactions";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to import transactions", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Update transaction
    public void updateTransaction(Transaction transaction, TransactionCallback<Transaction> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<Transaction>> call = apiService.updateTransaction(transaction.getId(), transaction, companyId);
        call.enqueue(new Callback<ApiResponse<Transaction>>() {
            @Override
            public void onResponse(Call<ApiResponse<Transaction>> call, Response<ApiResponse<Transaction>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Transaction> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("Failed to update transaction");
                    }
                } else {
                    String error = "Failed to update transaction";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Transaction>> call, Throwable t) {
                Log.e(TAG, "Failed to update transaction", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Delete transaction
    public void deleteTransaction(int id, TransactionCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<Void>> call = apiService.deleteTransaction(id, companyId);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to delete transaction";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to delete transaction", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Get unmatched transactions
    public void getUnmatchedTransactions(TransactionCallback<List<Transaction>> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<List<Transaction>>> call = apiService.getTransactions(null, null, "unmatched", companyId);
        call.enqueue(new Callback<ApiResponse<List<Transaction>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Transaction>>> call, Response<ApiResponse<List<Transaction>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<List<Transaction>> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No data received");
                    }
                } else {
                    String error = "Failed to fetch unmatched transactions";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<List<Transaction>>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch unmatched transactions", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
}