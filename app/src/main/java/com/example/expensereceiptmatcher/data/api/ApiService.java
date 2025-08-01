package com.example.expensereceiptmatcher.data.api;

import com.example.expensereceiptmatcher.domain.model.Receipt;
import com.example.expensereceiptmatcher.domain.model.Transaction;
import com.example.expensereceiptmatcher.domain.model.Match;
import com.example.expensereceiptmatcher.domain.model.User;
import com.example.expensereceiptmatcher.data.api.ApiResponse;
import com.example.expensereceiptmatcher.data.api.LoginResponse;
import com.example.expensereceiptmatcher.data.api.RegisterResponse;
import com.example.expensereceiptmatcher.data.api.CompanyResponse;
import com.example.expensereceiptmatcher.data.api.UserListResponse;
import com.example.expensereceiptmatcher.data.api.MatchStatsResponse;

import java.util.List;

import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.Call;
import retrofit2.http.Body;
import retrofit2.http.GET;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.DELETE;
import retrofit2.http.Path;
import retrofit2.http.Query;
import retrofit2.http.Header;
import retrofit2.http.Multipart;
import retrofit2.http.Part;

public interface ApiService {
    // API service interface for Retrofit
    
    // Authentication endpoints
    @POST("auth/register")
    Call<RegisterResponse> register(@Body RegisterRequest request);
    
    @POST("auth/login")
    Call<LoginResponse> login(@Body LoginRequest request);
    
    @POST("auth/refresh")
    Call<ApiResponse<String>> refreshToken(@Body RefreshTokenRequest request);
    
    @POST("auth/logout")
    Call<ApiResponse<Void>> logout();
    
    @GET("auth/profile")
    Call<ApiResponse<User>> getProfile();
    
    @PUT("auth/profile")
    Call<ApiResponse<User>> updateProfile(@Body UpdateProfileRequest request);
    
    @PUT("auth/password")
    Call<ApiResponse<Void>> changePassword(@Body ChangePasswordRequest request);
    
    // Company endpoints
    @GET("companies")
    Call<ApiResponse<CompanyResponse>> getCompanies();
    
    @GET("companies/{id}")
    Call<ApiResponse<CompanyResponse>> getCompany(@Path("id") int id);
    
    @PUT("companies/{id}")
    Call<ApiResponse<CompanyResponse>> updateCompany(@Path("id") int id, @Body CompanyResponse request);
    
    @GET("companies/{id}/users")
    Call<ApiResponse<UserListResponse>> getCompanyUsers(@Path("id") int id);
    
    @POST("companies/{id}/invite")
    Call<ApiResponse<Void>> inviteUser(@Path("id") int id, @Body RequestBody inviteData);
    
    @PUT("companies/{id}/users/{userId}/role")
    Call<ApiResponse<Void>> updateUserRole(@Path("id") int id, @Path("userId") int userId, @Body RequestBody roleData);
    
    @DELETE("companies/{id}/users/{userId}")
    Call<ApiResponse<Void>> removeUser(@Path("id") int id, @Path("userId") int userId);
    
    // Receipt endpoints
    @GET("receipts")
    Call<ApiResponse<List<Receipt>>> getReceipts(
        @Query("page") Integer page,
        @Query("limit") Integer limit,
        @Query("status") String status,
        @Header("x-company-id") String companyId
    );
    
    @GET("receipts/{id}")
    Call<ApiResponse<Receipt>> getReceipt(@Path("id") int id, @Header("x-company-id") String companyId);
    
    @Multipart
    @POST("receipts/upload")
    Call<ApiResponse<Receipt>> uploadReceipt(
        @Part MultipartBody.Part file,
        @Header("x-company-id") String companyId
    );
    
    @PUT("receipts/{id}")
    Call<ApiResponse<Receipt>> updateReceipt(
        @Path("id") int id,
        @Body Receipt receipt,
        @Header("x-company-id") String companyId
    );
    
    @DELETE("receipts/{id}")
    Call<ApiResponse<Void>> deleteReceipt(@Path("id") int id, @Header("x-company-id") String companyId);
    
    @GET("receipts/{id}/view")
    Call<okhttp3.ResponseBody> viewReceipt(
        @Path("id") int id,
        @Query("download") Boolean download,
        @Header("x-company-id") String companyId
    );
    
    @GET("receipts/{id}/download")
    Call<okhttp3.ResponseBody> downloadReceipt(
        @Path("id") int id,
        @Header("x-company-id") String companyId
    );
    
    @GET("receipts/unmatched/list")
    Call<ApiResponse<List<Receipt>>> getUnmatchedReceipts(@Header("x-company-id") String companyId);
    
    // Transaction endpoints
    @GET("transactions")
    Call<ApiResponse<List<Transaction>>> getTransactions(
        @Query("page") Integer page,
        @Query("limit") Integer limit,
        @Query("status") String status,
        @Header("x-company-id") String companyId
    );
    
    @GET("transactions/{id}")
    Call<ApiResponse<Transaction>> getTransaction(@Path("id") int id, @Header("x-company-id") String companyId);
    
    @POST("transactions/import")
    @Multipart
    Call<ApiResponse<Void>> importTransactions(
        @Part MultipartBody.Part file,
        @Header("x-company-id") String companyId
    );
    
    @PUT("transactions/{id}")
    Call<ApiResponse<Transaction>> updateTransaction(
        @Path("id") int id,
        @Body Transaction transaction,
        @Header("x-company-id") String companyId
    );
    
    @DELETE("transactions/{id}")
    Call<ApiResponse<Void>> deleteTransaction(@Path("id") int id, @Header("x-company-id") String companyId);
    
    // Match endpoints
    @GET("matches")
    Call<ApiResponse<List<Match>>> getMatches(@Header("x-company-id") String companyId);
    
    @GET("matches/pending")
    Call<ApiResponse<List<Match>>> getPendingMatches(@Header("x-company-id") String companyId);
    
    @POST("matches/find/{receiptId}")
    Call<ApiResponse<List<Match>>> findMatches(
        @Path("receiptId") int receiptId,
        @Header("x-company-id") String companyId
    );
    
    @POST("matches")
    Call<ApiResponse<Match>> createMatch(@Body CreateMatchRequest request, @Header("x-company-id") String companyId);
    
    @PUT("matches/{id}/confirm")
    Call<ApiResponse<Void>> confirmMatch(@Path("id") int id, @Header("x-company-id") String companyId);
    
    @PUT("matches/{id}/reject")
    Call<ApiResponse<Void>> rejectMatch(@Path("id") int id, @Header("x-company-id") String companyId);
    
    @DELETE("matches/{id}")
    Call<ApiResponse<Void>> deleteMatch(@Path("id") int id, @Header("x-company-id") String companyId);
    
    @POST("matches/auto-match")
    Call<ApiResponse<Void>> autoMatch(
        @Body RequestBody threshold,
        @Header("x-company-id") String companyId
    );
    
    @GET("matches/stats")
    Call<ApiResponse<MatchStatsResponse>> getMatchStats(@Header("x-company-id") String companyId);
}