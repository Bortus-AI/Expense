package com.example.expensereceiptmatcher.data.repository;

import android.content.Context;
import android.util.Log;

import com.example.expensereceiptmatcher.data.api.ApiClient;
import com.example.expensereceiptmatcher.data.api.ApiService;
import com.example.expensereceiptmatcher.data.api.ApiResponse;
import com.example.expensereceiptmatcher.data.api.CreateMatchRequest;
import com.example.expensereceiptmatcher.data.api.MatchStatsResponse;
import com.example.expensereceiptmatcher.domain.model.Match;
import com.example.expensereceiptmatcher.domain.model.Receipt;
import com.example.expensereceiptmatcher.domain.model.Transaction;

import java.util.List;

import okhttp3.RequestBody;
import okhttp3.MediaType;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MatchRepository {
    private static final String TAG = "MatchRepository";
    private ApiClient apiClient;
    private ApiService apiService;
    
    public MatchRepository(Context context) {
        apiClient = ApiClient.getInstance(context);
        apiService = apiClient.getApiService();
    }
    
    public interface MatchCallback<T> {
        void onSuccess(T response);
        void onError(String error);
    }
    
    // Get all matches
    public void getAllMatches(MatchCallback<List<Match>> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<List<Match>>> call = apiService.getMatches(companyId);
        call.enqueue(new Callback<ApiResponse<List<Match>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Match>>> call, Response<ApiResponse<List<Match>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<List<Match>> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No data received");
                    }
                } else {
                    String error = "Failed to fetch matches";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<List<Match>>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch matches", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Get pending matches
    public void getPendingMatches(MatchCallback<List<Match>> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<List<Match>>> call = apiService.getPendingMatches(companyId);
        call.enqueue(new Callback<ApiResponse<List<Match>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Match>>> call, Response<ApiResponse<List<Match>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<List<Match>> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No data received");
                    }
                } else {
                    String error = "Failed to fetch pending matches";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<List<Match>>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch pending matches", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Find matches for a receipt
    public void findMatches(int receiptId, MatchCallback<List<Match>> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<List<Match>>> call = apiService.findMatches(receiptId, companyId);
        call.enqueue(new Callback<ApiResponse<List<Match>>>() {
            @Override
            public void onResponse(Call<ApiResponse<List<Match>>> call, Response<ApiResponse<List<Match>>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<List<Match>> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No data received");
                    }
                } else {
                    String error = "Failed to find matches";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<List<Match>>> call, Throwable t) {
                Log.e(TAG, "Failed to find matches", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Create a match
    public void createMatch(int transactionId, int receiptId, int matchConfidence, boolean autoConfirm, 
                           MatchCallback<Match> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        CreateMatchRequest request = new CreateMatchRequest(transactionId, receiptId, matchConfidence, autoConfirm);
        Call<ApiResponse<Match>> call = apiService.createMatch(request, companyId);
        call.enqueue(new Callback<ApiResponse<Match>>() {
            @Override
            public void onResponse(Call<ApiResponse<Match>> call, Response<ApiResponse<Match>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<Match> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("Failed to create match");
                    }
                } else {
                    String error = "Failed to create match";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Match>> call, Throwable t) {
                Log.e(TAG, "Failed to create match", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Confirm a match
    public void confirmMatch(int matchId, MatchCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<Void>> call = apiService.confirmMatch(matchId, companyId);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to confirm match";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to confirm match", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Reject a match
    public void rejectMatch(int matchId, MatchCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<Void>> call = apiService.rejectMatch(matchId, companyId);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to reject match";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to reject match", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Delete a match
    public void deleteMatch(int matchId, MatchCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<Void>> call = apiService.deleteMatch(matchId, companyId);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to delete match";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to delete match", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Auto match
    public void autoMatch(int threshold, MatchCallback<Void> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        // Create request body for threshold
        RequestBody body = RequestBody.create(String.valueOf(threshold), MediaType.parse("text/plain"));
        Call<ApiResponse<Void>> call = apiService.autoMatch(body, companyId);
        call.enqueue(new Callback<ApiResponse<Void>>() {
            @Override
            public void onResponse(Call<ApiResponse<Void>> call, Response<ApiResponse<Void>> response) {
                if (response.isSuccessful()) {
                    callback.onSuccess(null);
                } else {
                    String error = "Failed to auto match";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<Void>> call, Throwable t) {
                Log.e(TAG, "Failed to auto match", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
    
    // Get match stats
    public void getMatchStats(MatchCallback<MatchStatsResponse> callback) {
        String companyId = apiClient.getCompanyId();
        if (companyId == null) {
            callback.onError("No company selected");
            return;
        }
        
        Call<ApiResponse<MatchStatsResponse>> call = apiService.getMatchStats(companyId);
        call.enqueue(new Callback<ApiResponse<MatchStatsResponse>>() {
            @Override
            public void onResponse(Call<ApiResponse<MatchStatsResponse>> call, Response<ApiResponse<MatchStatsResponse>> response) {
                if (response.isSuccessful() && response.body() != null) {
                    ApiResponse<MatchStatsResponse> apiResponse = response.body();
                    if (apiResponse.getData() != null) {
                        callback.onSuccess(apiResponse.getData());
                    } else {
                        callback.onError("No data received");
                    }
                } else {
                    String error = "Failed to fetch match stats";
                    if (response.errorBody() != null) {
                        error = response.message();
                    }
                    callback.onError(error);
                }
            }
            
            @Override
            public void onFailure(Call<ApiResponse<MatchStatsResponse>> call, Throwable t) {
                Log.e(TAG, "Failed to fetch match stats", t);
                callback.onError("Network error: " + t.getMessage());
            }
        });
    }
}