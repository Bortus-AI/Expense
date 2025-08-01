package com.example.expensereceiptmatcher.utils;

import android.content.Context;
import android.database.Cursor;
import android.net.Uri;
import android.provider.OpenableColumns;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

public class FileUploadUtils {
    private static final String TAG = "FileUploadUtils";
    
    public interface UploadProgressListener {
        void onProgress(long bytesWritten, long totalBytes);
        void onComplete(File file);
        void onError(String error);
    }
    
    /**
     * Copy a file from a URI to a temporary file for upload
     * @param context Application context
     * @param uri URI of the file to copy
     * @param listener Progress listener
     */
    public static void copyFileFromUri(Context context, Uri uri, UploadProgressListener listener) {
        if (uri == null) {
            listener.onError("Invalid file URI");
            return;
        }
        
        try {
            // Get file name and size
            String fileName = getFileName(context, uri);
            long fileSize = getFileSize(context, uri);
            
            if (fileName == null) {
                fileName = "upload_" + System.currentTimeMillis();
            }
            
            // Create temporary file
            File tempFile = new File(context.getCacheDir(), fileName);
            
            // Copy file with progress tracking
            copyFileWithProgress(context, uri, tempFile, fileSize, listener);
            
        } catch (Exception e) {
            Log.e(TAG, "Error copying file from URI", e);
            listener.onError("Failed to process file: " + e.getMessage());
        }
    }
    
    /**
     * Copy file with progress tracking
     */
    private static void copyFileWithProgress(Context context, Uri sourceUri, File destFile, 
                                           long fileSize, UploadProgressListener listener) {
        InputStream inputStream = null;
        OutputStream outputStream = null;
        
        try {
            inputStream = context.getContentResolver().openInputStream(sourceUri);
            outputStream = new FileOutputStream(destFile);
            
            byte[] buffer = new byte[4096];
            long totalBytesRead = 0;
            int bytesRead;
            
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
                totalBytesRead += bytesRead;
                
                // Notify progress
                listener.onProgress(totalBytesRead, fileSize);
            }
            
            outputStream.flush();
            listener.onComplete(destFile);
            
        } catch (IOException e) {
            Log.e(TAG, "Error copying file", e);
            listener.onError("Failed to copy file: " + e.getMessage());
        } finally {
            try {
                if (inputStream != null) {
                    inputStream.close();
                }
                if (outputStream != null) {
                    outputStream.close();
                }
            } catch (IOException e) {
                Log.e(TAG, "Error closing streams", e);
            }
        }
    }
    
    /**
     * Get file name from URI
     */
    private static String getFileName(Context context, Uri uri) {
        String fileName = null;
        
        try {
            // Try to get file name from OpenableColumns
            Cursor cursor = context.getContentResolver().query(uri, null, null, null, null);
            if (cursor != null) {
                try {
                    if (cursor.moveToFirst()) {
                        int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                        if (nameIndex != -1) {
                            fileName = cursor.getString(nameIndex);
                        }
                    }
                } finally {
                    cursor.close();
                }
            }
            
            // If we couldn't get the file name, try to get it from the URI
            if (fileName == null) {
                fileName = uri.getLastPathSegment();
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting file name", e);
        }
        
        return fileName;
    }
    
    /**
     * Get file size from URI
     */
    private static long getFileSize(Context context, Uri uri) {
        long fileSize = 0;
        
        try {
            Cursor cursor = context.getContentResolver().query(uri, null, null, null, null);
            if (cursor != null) {
                try {
                    if (cursor.moveToFirst()) {
                        int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                        if (sizeIndex != -1) {
                            fileSize = cursor.getLong(sizeIndex);
                        }
                    }
                } finally {
                    cursor.close();
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error getting file size", e);
        }
        
        return fileSize;
    }
    
    /**
     * Check if file type is supported
     */
    public static boolean isSupportedFileType(String fileName) {
        if (fileName == null) return false;
        
        String extension = getFileExtension(fileName).toLowerCase();
        return extension.equals("jpg") || extension.equals("jpeg") || 
               extension.equals("png") || extension.equals("pdf");
    }
    
    /**
     * Get file extension
     */
    private static String getFileExtension(String fileName) {
        if (fileName == null) return "";
        
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < fileName.length() - 1) {
            return fileName.substring(lastDotIndex + 1);
        }
        return "";
    }
    
    /**
     * Get MIME type based on file extension
     */
    public static String getMimeType(String fileName) {
        if (fileName == null) return "application/octet-stream";
        
        String extension = getFileExtension(fileName).toLowerCase();
        switch (extension) {
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "pdf":
                return "application/pdf";
            default:
                return "application/octet-stream";
        }
    }
}