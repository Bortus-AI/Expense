package com.example.expensereceiptmatcher.presentation.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.domain.model.Transaction;

import java.util.ArrayList;
import java.util.List;

public class TransactionAdapter extends RecyclerView.Adapter<TransactionAdapter.TransactionViewHolder> {
    private List<Transaction> transactions;
    private OnTransactionClickListener listener;
    
    public interface OnTransactionClickListener {
        void onTransactionClick(Transaction transaction);
        void onMatchClick(Transaction transaction);
    }
    
    public TransactionAdapter() {
        this.transactions = new ArrayList<>();
    }
    
    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
        notifyDataSetChanged();
    }
    
    public void setOnTransactionClickListener(OnTransactionClickListener listener) {
        this.listener = listener;
    }
    
    @NonNull
    @Override
    public TransactionViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_transaction, parent, false);
        return new TransactionViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull TransactionViewHolder holder, int position) {
        Transaction transaction = transactions.get(position);
        holder.bind(transaction);
    }
    
    @Override
    public int getItemCount() {
        return transactions.size();
    }
    
    class TransactionViewHolder extends RecyclerView.ViewHolder {
        private TextView textViewDate;
        private TextView textViewDescription;
        private TextView textViewAmount;
        private TextView textViewCategory;
        private View buttonMatch;
        
        public TransactionViewHolder(@NonNull View itemView) {
            super(itemView);
            textViewDate = itemView.findViewById(R.id.text_view_date);
            textViewDescription = itemView.findViewById(R.id.text_view_description);
            textViewAmount = itemView.findViewById(R.id.text_view_amount);
            textViewCategory = itemView.findViewById(R.id.text_view_category);
            buttonMatch = itemView.findViewById(R.id.button_match);
        }
        
        public void bind(Transaction transaction) {
            textViewDate.setText(transaction.getDate());
            textViewDescription.setText(transaction.getDescription());
            textViewAmount.setText(String.format("$%.2f", transaction.getAmount()));
            textViewCategory.setText(transaction.getCategory());
            
            // Set click listeners
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onTransactionClick(transaction);
                }
            });
            
            buttonMatch.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onMatchClick(transaction);
                }
            });
            
            // Update UI based on match status
            if (transaction.isMatched()) {
                buttonMatch.setVisibility(View.GONE);
            } else {
                buttonMatch.setVisibility(View.VISIBLE);
            }
        }
    }
}