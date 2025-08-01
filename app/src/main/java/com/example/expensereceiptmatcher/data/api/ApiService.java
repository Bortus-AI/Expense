package com.example.expensereceiptmatcher.data.api;

import com.example.expensereceiptmatcher.domain.model.Receipt;
import com.example.expensereceiptmatcher.domain.model.Transaction;

import java.util.List;

import retrofit2.Call;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.Body;
import retrofit2.http.Path;

public interface ApiService {
    // API service interface for Retrofit
    
    @GET("receipts")
    Call<List<Receipt>> getReceipts();
    
    @GET("receipts/{id}")
    Call<Receipt> getReceipt(@Path("id") int id);
    
    @POST("receipts")
    Call<Receipt> createReceipt(@Body Receipt receipt);
    
    @GET("transactions")
    Call<List<Transaction>> getTransactions();
    
    @GET("transactions/unmatched")
    Call<List<Transaction>> getUnmatchedTransactions();
    
    @POST("matches")
    Call<Void> createMatch(@Body MatchRequest matchRequest);
}