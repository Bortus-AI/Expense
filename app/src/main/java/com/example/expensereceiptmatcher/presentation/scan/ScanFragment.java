package com.example.expensereceiptmatcher.presentation.scan;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.presentation.ReceiptScannerActivity;
import com.example.expensereceiptmatcher.utils.PermissionUtils;

public class ScanFragment extends Fragment {

    private static final int REQUEST_CAMERA_PERMISSION = 1001;
    private Button buttonCapture;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_scan, container, false);
        
        // Initialize UI components and set up event handlers for scanning receipts
        buttonCapture = root.findViewById(R.id.button_capture);
        buttonCapture.setOnClickListener(v -> startReceiptScanner());
        
        return root;
    }
    
    private void startReceiptScanner() {
        if (PermissionUtils.hasCameraPermission(requireActivity())) {
            // Start the receipt scanner activity
            Intent intent = new Intent(getActivity(), ReceiptScannerActivity.class);
            startActivity(intent);
        } else {
            // Request camera permission
            PermissionUtils.requestCameraPermission(requireActivity());
        }
    }
    
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        if (requestCode == REQUEST_CAMERA_PERMISSION) {
            if (PermissionUtils.hasCameraPermission(requireActivity())) {
                // Permission granted, start the receipt scanner
                Intent intent = new Intent(getActivity(), ReceiptScannerActivity.class);
                startActivity(intent);
            } else {
                // Permission denied, show a message
                Toast.makeText(getContext(), R.string.error_camera_permission, Toast.LENGTH_LONG).show();
            }
        }
    }
}