package com.example.expensereceiptmatcher.data.api;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

import java.io.IOException;
import java.security.GeneralSecurityException;

public class SecureTokenStorage {
    private static final String TAG = "SecureTokenStorage";
    private static final String PREFS_NAME = "secure_api_prefs";
    private static final String ACCESS_TOKEN_KEY = "access_token";
    private static final String REFRESH_TOKEN_KEY = "refresh_token";
    private static final String COMPANY_ID_KEY = "company_id";
    
    private SharedPreferences encryptedPrefs;
    
    public SecureTokenStorage(Context context) {
        try {
            MasterKey masterKey = new MasterKey.Builder(context, MasterKey.DEFAULT_MASTER_KEY_ALIAS)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            
            encryptedPrefs = EncryptedSharedPreferences.create(
                    context,
                    PREFS_NAME,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (GeneralSecurityException | IOException e) {
            Log.e(TAG, "Failed to create encrypted shared preferences", e);
            // Fallback to regular shared preferences (less secure)
            encryptedPrefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        }
    }
    
    public void saveTokens(String accessToken, String refreshToken) {
        SharedPreferences.Editor editor = encryptedPrefs.edit();
        editor.putString(ACCESS_TOKEN_KEY, accessToken);
        editor.putString(REFRESH_TOKEN_KEY, refreshToken);
        editor.apply();
    }
    
    public void saveAccessToken(String accessToken) {
        SharedPreferences.Editor editor = encryptedPrefs.edit();
        editor.putString(ACCESS_TOKEN_KEY, accessToken);
        editor.apply();
    }
    
    public void saveRefreshToken(String refreshToken) {
        SharedPreferences.Editor editor = encryptedPrefs.edit();
        editor.putString(REFRESH_TOKEN_KEY, refreshToken);
        editor.apply();
    }
    
    public String getAccessToken() {
        return encryptedPrefs.getString(ACCESS_TOKEN_KEY, null);
    }
    
    public String getRefreshToken() {
        return encryptedPrefs.getString(REFRESH_TOKEN_KEY, null);
    }
    
    public void clearTokens() {
        SharedPreferences.Editor editor = encryptedPrefs.edit();
        editor.remove(ACCESS_TOKEN_KEY);
        editor.remove(REFRESH_TOKEN_KEY);
        editor.remove(COMPANY_ID_KEY);
        editor.apply();
    }
    
    public void saveCompanyId(String companyId) {
        SharedPreferences.Editor editor = encryptedPrefs.edit();
        editor.putString(COMPANY_ID_KEY, companyId);
        editor.apply();
    }
    
    public String getCompanyId() {
        return encryptedPrefs.getString(COMPANY_ID_KEY, null);
    }
}