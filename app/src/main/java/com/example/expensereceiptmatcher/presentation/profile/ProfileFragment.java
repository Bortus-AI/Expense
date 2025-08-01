package com.example.expensereceiptmatcher.presentation.profile;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.presentation.viewmodel.ProfileViewModel;

public class ProfileFragment extends Fragment {

    private ProfileViewModel profileViewModel;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_profile, container, false);

        // Initialize ViewModel
        profileViewModel = new ViewModelProvider(this).get(ProfileViewModel.class);
        
        // Set up UI components and event handlers for user profile settings
        
        return root;
    }
}