package com.example.expensereceiptmatcher.utils;

import android.content.Context;
import android.util.Log;
import android.widget.Toast;

import com.example.expensereceiptmatcher.R;

import java.io.IOException;
import java.net.SocketTimeoutException;

import retrofit2.HttpException;

public class ApiErrorUtils {
    private static final String TAG = "ApiErrorUtils";
    
    public static void handleApiError(Context context, Throwable throwable) {
        String errorMessage = getErrorMessage(context, throwable);
        Log.e(TAG, "API Error: " + errorMessage, throwable);
        Toast.makeText(context, errorMessage, Toast.LENGTH_LONG).show();
    }
    
    public static String getErrorMessage(Context context, Throwable throwable) {
        if (throwable instanceof HttpException) {
            HttpException httpException = (HttpException) throwable;
            switch (httpException.code()) {
                case 400:
                    return context.getString(R.string.error_bad_request);
                case 401:
                    return context.getString(R.string.error_unauthorized);
                case 403:
                    return context.getString(R.string.error_forbidden);
                case 404:
                    return context.getString(R.string.error_not_found);
                case 409:
                    return context.getString(R.string.error_conflict);
                case 500:
                    return context.getString(R.string.error_internal_server);
                case 502:
                case 503:
                case 504:
                    return context.getString(R.string.error_server_unavailable);
                default:
                    return context.getString(R.string.error_http, httpException.code());
            }
        } else if (throwable instanceof SocketTimeoutException) {
            return context.getString(R.string.error_timeout);
        } else if (throwable instanceof IOException) {
            return context.getString(R.string.error_network);
        } else {
            return context.getString(R.string.error_generic, throwable.getMessage());
        }
    }
    
    public static boolean isNetworkError(Throwable throwable) {
        return throwable instanceof IOException;
    }
    
    public static boolean isAuthError(Throwable throwable) {
        if (throwable instanceof HttpException) {
            HttpException httpException = (HttpException) throwable;
            return httpException.code() == 401 || httpException.code() == 403;
        }
        return false;
    }
    
    public static boolean isServerError(Throwable throwable) {
        if (throwable instanceof HttpException) {
            HttpException httpException = (HttpException) throwable;
            return httpException.code() >= 500;
        }
        return false;
    }
    
    public static boolean isClientError(Throwable throwable) {
        if (throwable instanceof HttpException) {
            HttpException httpException = (HttpException) throwable;
            return httpException.code() >= 400 && httpException.code() < 500;
        }
        return false;
    }
    
    public static String getErrorType(Throwable throwable) {
        if (isNetworkError(throwable)) {
            return "NETWORK";
        } else if (isAuthError(throwable)) {
            return "AUTH";
        } else if (isServerError(throwable)) {
            return "SERVER";
        } else if (isClientError(throwable)) {
            return "CLIENT";
        } else {
            return "UNKNOWN";
        }
    }
}