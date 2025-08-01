package com.example.expensereceiptmatcher.data.api;

import android.content.Context;
import android.util.Log;

import com.example.expensereceiptmatcher.BuildConfig;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import okhttp3.Interceptor;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;

public class ApiClient {
    private static final String TAG = "ApiClient";
    private static final String BASE_URL = BuildConfig.API_BASE_URL != null ? 
        BuildConfig.API_BASE_URL : "http://localhost:3000/api/";
    
    private static ApiClient instance;
    private ApiService apiService;
    private SecureTokenStorage tokenStorage;
    private String companyId;
    
    private ApiClient(Context context) {
        tokenStorage = new SecureTokenStorage(context);
        companyId = tokenStorage.getCompanyId();
        
        // Create HTTP logging interceptor for debug builds
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(BuildConfig.DEBUG ? 
            HttpLoggingInterceptor.Level.BODY : HttpLoggingInterceptor.Level.NONE);
        
        // Create OkHttpClient with interceptors
        OkHttpClient.Builder httpClientBuilder = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .writeTimeout(30, TimeUnit.SECONDS)
                .addInterceptor(loggingInterceptor)
                .addInterceptor(new AuthInterceptor())
                .addInterceptor(new CompanyIdInterceptor());
        
        // Build Retrofit instance
        Retrofit retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(httpClientBuilder.build())
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        
        apiService = retrofit.create(ApiService.class);
    }
    
    public static synchronized ApiClient getInstance(Context context) {
        if (instance == null) {
            instance = new ApiClient(context);
        }
        return instance;
    }
    
    public ApiService getApiService() {
        return apiService;
    }
    
    // Token management methods
    public void saveTokens(String accessToken, String refreshToken) {
        tokenStorage.saveTokens(accessToken, refreshToken);
    }
    
    public void saveAccessToken(String accessToken) {
        tokenStorage.saveAccessToken(accessToken);
    }
    
    public void saveRefreshToken(String refreshToken) {
        tokenStorage.saveRefreshToken(refreshToken);
    }
    
    public void clearTokens() {
        tokenStorage.clearTokens();
        companyId = null;
    }
    
    public String getAccessToken() {
        return tokenStorage.getAccessToken();
    }
    
    public String getRefreshToken() {
        return tokenStorage.getRefreshToken();
    }
    
    public void setCompanyId(String companyId) {
        this.companyId = companyId;
        tokenStorage.saveCompanyId(companyId);
    }
    
    public String getCompanyId() {
        if (companyId == null) {
            companyId = tokenStorage.getCompanyId();
        }
        return companyId;
    }
    
    // Interceptor for adding authorization header
    private class AuthInterceptor implements Interceptor {
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request originalRequest = chain.request();
            Request.Builder requestBuilder = originalRequest.newBuilder();
            
            // Add authorization header if access token exists
            String accessToken = tokenStorage.getAccessToken();
            if (accessToken != null && !accessToken.isEmpty()) {
                requestBuilder.addHeader("Authorization", "Bearer " + accessToken);
            }
            
            Request newRequest = requestBuilder.build();
            return chain.proceed(newRequest);
        }
    }
    
    // Interceptor for adding company ID header
    private class CompanyIdInterceptor implements Interceptor {
        @Override
        public Response intercept(Chain chain) throws IOException {
            Request originalRequest = chain.request();
            Request.Builder requestBuilder = originalRequest.newBuilder();
            
            // Add company ID header if it exists
            String companyId = tokenStorage.getCompanyId();
            if (companyId != null && !companyId.isEmpty()) {
                requestBuilder.addHeader("x-company-id", companyId);
            }
            
            Request newRequest = requestBuilder.build();
            return chain.proceed(newRequest);
        }
    }
}