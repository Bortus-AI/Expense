package com.example.expensereceiptmatcher.presentation.home;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.presentation.viewmodel.MainViewModel;

public class HomeFragment extends Fragment {

    private MainViewModel mainViewModel;
    private TextView textViewWelcome;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_home, container, false);
        
        // Initialize UI components and set up event handlers
        textViewWelcome = root.findViewById(R.id.text_home);
        
        // Initialize ViewModel
        mainViewModel = new ViewModelProvider(requireActivity()).get(MainViewModel.class);
        
        // Observe user data to update welcome message
        mainViewModel.getCurrentUser().observe(getViewLifecycleOwner(), user -> {
            if (user != null) {
                textViewWelcome.setText("Welcome, " + user.getFirstName() + "!");
            } else {
                textViewWelcome.setText("Welcome to Expense Receipt Matcher!");
            }
        });
        
        return root;
    }
}