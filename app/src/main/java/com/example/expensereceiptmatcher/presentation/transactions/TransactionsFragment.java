package com.example.expensereceiptmatcher.presentation.transactions;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.presentation.viewmodel.TransactionViewModel;
import com.example.expensereceiptmatcher.presentation.adapter.TransactionAdapter;

public class TransactionsFragment extends Fragment {

    private TransactionViewModel transactionViewModel;
    private TransactionAdapter transactionAdapter;

    public View onCreateView(@NonNull LayoutInflater inflater,
                             ViewGroup container, Bundle savedInstanceState) {
        View root = inflater.inflate(R.layout.fragment_transactions, container, false);

        // Initialize RecyclerView
        RecyclerView recyclerView = root.findViewById(R.id.recycler_view_transactions);
        recyclerView.setLayoutManager(new LinearLayoutManager(getContext()));
        
        // Initialize adapter
        transactionAdapter = new TransactionAdapter();
        recyclerView.setAdapter(transactionAdapter);

        // Initialize ViewModel
        transactionViewModel = new ViewModelProvider(this).get(TransactionViewModel.class);
        
        // Observe transactions data
        transactionViewModel.getTransactions().observe(getViewLifecycleOwner(), transactions -> {
            if (transactions != null) {
                transactionAdapter.setTransactions(transactions);
            }
        });
        
        // Load transactions
        transactionViewModel.loadTransactions();

        return root;
    }
}