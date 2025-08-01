package com.example.expensereceiptmatcher.presentation.transactions;

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
import com.example.expensereceiptmatcher.presentation.viewmodel.TransactionViewModel;
import com.example.expensereceiptmatcher.presentation.adapter.TransactionAdapter;
import com.example.expensereceiptmatcher.domain.model.Transaction;

public class TransactionsFragment extends Fragment {

    private TransactionViewModel transactionViewModel;
    private TransactionAdapter transactionAdapter;
    private ProgressBar progressBar;
    private TextView textViewEmpty;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_transactions, container, false);

        // Initialize RecyclerView
        RecyclerView recyclerView = root.findViewById(R.id.recycler_view_transactions);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        // Initialize adapter
        transactionAdapter = new TransactionAdapter();
        recyclerView.setAdapter(transactionAdapter);
        
        // Initialize progress bar and empty text view
        progressBar = root.findViewById(R.id.progress_bar);
        textViewEmpty = root.findViewById(R.id.text_view_empty);
        
        // Set up click listeners for the adapter
        transactionAdapter.setOnTransactionClickListener(new TransactionAdapter.OnTransactionClickListener() {
            @Override
            public void onTransactionClick(Transaction transaction) {
                // TODO: Implement transaction details view
            }
            
            @Override
            public void onMatchClick(Transaction transaction) {
                // TODO: Implement match functionality
            }
        });

        // Initialize ViewModel
        transactionViewModel = new ViewModelProvider(this).get(TransactionViewModel.class);
        
        // Observe transactions data
        transactionViewModel.getTransactions().observe(getViewLifecycleOwner(), transactions -> {
            if (transactions != null) {
                transactionAdapter.setTransactions(transactions);
                textViewEmpty.setVisibility(transactions.isEmpty() ? View.VISIBLE : View.GONE);
            }
        });
        
        // Observe loading state
        transactionViewModel.getIsLoading().observe(getViewLifecycleOwner(), isLoading -> {
            if (isLoading != null) {
                progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
            }
        });
        
        // Load transactions
        transactionViewModel.loadTransactions();

        return root;
    }
}