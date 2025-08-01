package com.example.expensereceiptmatcher.presentation.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.presentation.viewmodel.ProfileViewModel;
import com.example.expensereceiptmatcher.domain.model.User;
import com.example.expensereceiptmatcher.domain.model.Company;

public class ProfileFragment extends Fragment {

    private ProfileViewModel profileViewModel;
    private TextView textViewUsername;
    private TextView textViewEmail;
    private TextView textViewFullName;
    private TextView textViewCompany;
    private Button buttonEditProfile;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_profile, container, false);

        // Initialize ViewModel
        profileViewModel = new ViewModelProvider(this).get(ProfileViewModel.class);
        
        // Set up UI components and event handlers for user profile settings
        textViewUsername = root.findViewById(R.id.text_view_username);
        textViewEmail = root.findViewById(R.id.text_view_email);
        textViewFullName = root.findViewById(R.id.text_view_full_name);
        textViewCompany = root.findViewById(R.id.text_view_company);
        buttonEditProfile = root.findViewById(R.id.button_edit_profile);
        
        // Set click listener for edit profile button
        buttonEditProfile.setOnClickListener(v -> {
            // TODO: Implement edit profile functionality
        });
        
        // Observe user data
        profileViewModel.getCurrentUser().observe(getViewLifecycleOwner(), user -> {
            if (user != null) {
                updateUIWithUser(user);
            }
        });
        
        // Observe company data
        profileViewModel.getCurrentCompany().observe(getViewLifecycleOwner(), company -> {
            if (company != null) {
                textViewCompany.setText(company.getName());
            }
        });
        
        // Load user profile
        profileViewModel.loadUserProfile();
        
        return root;
    }
    
    private void updateUIWithUser(User user) {
        textViewUsername.setText(user.getUsername());
        textViewEmail.setText(user.getEmail());
        textViewFullName.setText(user.getFullName());
    }
}