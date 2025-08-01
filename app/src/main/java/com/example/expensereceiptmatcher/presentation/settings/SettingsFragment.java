package com.example.expensereceiptmatcher.presentation.settings;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.Switch;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.presentation.viewmodel.ProfileViewModel;

public class SettingsFragment extends Fragment {

    private ProfileViewModel profileViewModel;
    private Button buttonEditProfile;
    private Button buttonChangePassword;
    private Switch switchNotifications;
    private Switch switchAutoSync;
    private Button buttonLogout;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_settings, container, false);
        
        // Initialize UI components and set up event handlers for settings
        profileViewModel = new ViewModelProvider(this).get(ProfileViewModel.class);
        
        // Find UI components
        buttonEditProfile = root.findViewById(R.id.button_edit_profile);
        buttonChangePassword = root.findViewById(R.id.button_change_password);
        switchNotifications = root.findViewById(R.id.switch_notifications);
        switchAutoSync = root.findViewById(R.id.switch_auto_sync);
        buttonLogout = root.findViewById(R.id.button_logout);
        
        // Set click listeners
        buttonEditProfile.setOnClickListener(v -> {
            // TODO: Implement edit profile functionality
        });
        
        buttonChangePassword.setOnClickListener(v -> {
            // TODO: Implement change password functionality
        });
        
        switchNotifications.setOnCheckedChangeListener((buttonView, isChecked) -> {
            // TODO: Implement notification settings
        });
        
        switchAutoSync.setOnCheckedChangeListener((buttonView, isChecked) -> {
            // TODO: Implement auto sync settings
        });
        
        buttonLogout.setOnClickListener(v -> {
            // TODO: Implement logout functionality
        });
        
        return root;
    }
}