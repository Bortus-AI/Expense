package com.example.expensereceiptmatcher.utils;

import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;

public class UiStateHelper {
    
    public static void showLoading(ProgressBar progressBar, View... viewsToHide) {
        if (progressBar != null) {
            progressBar.setVisibility(View.VISIBLE);
        }
        
        for (View view : viewsToHide) {
            if (view != null) {
                view.setVisibility(View.GONE);
            }
        }
    }
    
    public static void showContent(ProgressBar progressBar, View... viewsToShow) {
        if (progressBar != null) {
            progressBar.setVisibility(View.GONE);
        }
        
        for (View view : viewsToShow) {
            if (view != null) {
                view.setVisibility(View.VISIBLE);
            }
        }
    }
    
    public static void showError(ProgressBar progressBar, TextView errorTextView, String errorMessage, View... viewsToHide) {
        if (progressBar != null) {
            progressBar.setVisibility(View.GONE);
        }
        
        if (errorTextView != null) {
            errorTextView.setVisibility(View.VISIBLE);
            errorTextView.setText(errorMessage);
        }
        
        for (View view : viewsToHide) {
            if (view != null) {
                view.setVisibility(View.GONE);
            }
        }
    }
    
    public static void hideError(TextView errorTextView) {
        if (errorTextView != null) {
            errorTextView.setVisibility(View.GONE);
        }
    }
}