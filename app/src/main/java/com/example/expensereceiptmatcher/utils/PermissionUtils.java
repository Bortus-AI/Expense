package com.example.expensereceiptmatcher.utils;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;

import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

public class PermissionUtils {
    // Utility class for handling permissions
    
    public static final int CAMERA_PERMISSION_REQUEST_CODE = 1001;
    public static final int STORAGE_PERMISSION_REQUEST_CODE = 1002;
    
    public static boolean hasCameraPermission(Activity activity) {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.CAMERA) 
                == PackageManager.PERMISSION_GRANTED;
    }
    
    public static boolean hasStoragePermission(Activity activity) {
        return ContextCompat.checkSelfPermission(activity, Manifest.permission.READ_EXTERNAL_STORAGE) 
                == PackageManager.PERMISSION_GRANTED;
    }
    
    public static void requestCameraPermission(Activity activity) {
        ActivityCompat.requestPermissions(activity, 
                new String[]{Manifest.permission.CAMERA}, 
                CAMERA_PERMISSION_REQUEST_CODE);
    }
    
    public static void requestStoragePermission(Activity activity) {
        ActivityCompat.requestPermissions(activity, 
                new String[]{Manifest.permission.READ_EXTERNAL_STORAGE, Manifest.permission.WRITE_EXTERNAL_STORAGE}, 
                STORAGE_PERMISSION_REQUEST_CODE);
    }
}