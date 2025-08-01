package com.example.expensereceiptmatcher.presentation.matches;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.presentation.viewmodel.MatchViewModel;
import com.example.expensereceiptmatcher.presentation.adapter.MatchAdapter;

public class MatchesFragment extends Fragment {

    private MatchViewModel matchViewModel;
    private MatchAdapter matchAdapter;
    private ProgressBar progressBar;
    private TextView textViewEmpty;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_matches, container, false);
        
        // Initialize UI components and set up event handlers for displaying matches
        RecyclerView recyclerView = root.findViewById(R.id.recycler_view_matches);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        // Initialize adapter
        matchAdapter = new MatchAdapter();
        recyclerView.setAdapter(matchAdapter);
        
        // Initialize progress bar and empty text view
        progressBar = root.findViewById(R.id.progress_bar);
        textViewEmpty = root.findViewById(R.id.text_view_empty);
        
        // Initialize ViewModel
        matchViewModel = new ViewModelProvider(this).get(MatchViewModel.class);
        
        // Observe matches data
        matchViewModel.getMatches().observe(getViewLifecycleOwner(), matches -> {
            if (matches != null) {
                matchAdapter.setMatches(matches);
                textViewEmpty.setVisibility(matches.isEmpty() ? View.VISIBLE : View.GONE);
            }
        });
        
        // Observe loading state
        matchViewModel.getIsLoading().observe(getViewLifecycleOwner(), isLoading -> {
            if (isLoading != null) {
                progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
            }
        });
        
        // Load matches
        matchViewModel.loadMatches();
        
        return root;
    }
}