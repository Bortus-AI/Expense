package com.example.expensereceiptmatcher.presentation.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.domain.model.Match;
import com.example.expensereceiptmatcher.domain.model.Receipt;
import com.example.expensereceiptmatcher.domain.model.Transaction;

import java.util.ArrayList;
import java.util.List;

public class MatchAdapter extends RecyclerView.Adapter<MatchAdapter.MatchViewHolder> {
    private List<Match> matches;
    private List<Receipt> receipts;
    private List<Transaction> transactions;
    private OnMatchClickListener listener;
    
    public interface OnMatchClickListener {
        void onMatchClick(Match match);
        void onDeleteClick(Match match);
    }
    
    public MatchAdapter() {
        this.matches = new ArrayList<>();
        this.receipts = new ArrayList<>();
        this.transactions = new ArrayList<>();
    }
    
    public void setMatches(List<Match> matches) {
        this.matches = matches;
        notifyDataSetChanged();
    }
    
    public void setReceipts(List<Receipt> receipts) {
        this.receipts = receipts;
        notifyDataSetChanged();
    }
    
    public void setTransactions(List<Transaction> transactions) {
        this.transactions = transactions;
        notifyDataSetChanged();
    }
    
    public void setOnMatchClickListener(OnMatchClickListener listener) {
        this.listener = listener;
    }
    
    @NonNull
    @Override
    public MatchViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_match, parent, false);
        return new MatchViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull MatchViewHolder holder, int position) {
        Match match = matches.get(position);
        holder.bind(match);
    }
    
    @Override
    public int getItemCount() {
        return matches.size();
    }
    
    class MatchViewHolder extends RecyclerView.ViewHolder {
        private ImageView imageViewReceipt;
        private TextView textViewReceiptVendor;
        private TextView textViewReceiptAmount;
        private TextView textViewTransactionDescription;
        private TextView textViewTransactionAmount;
        private TextView textViewMatchDate;
        private TextView textViewConfidenceScore;
        private View buttonDelete;
        
        public MatchViewHolder(@NonNull View itemView) {
            super(itemView);
            imageViewReceipt = itemView.findViewById(R.id.image_view_receipt);
            textViewReceiptVendor = itemView.findViewById(R.id.text_view_receipt_vendor);
            textViewReceiptAmount = itemView.findViewById(R.id.text_view_receipt_amount);
            textViewTransactionDescription = itemView.findViewById(R.id.text_view_transaction_description);
            textViewTransactionAmount = itemView.findViewById(R.id.text_view_transaction_amount);
            textViewMatchDate = itemView.findViewById(R.id.text_view_match_date);
            textViewConfidenceScore = itemView.findViewById(R.id.text_view_confidence_score);
            buttonDelete = itemView.findViewById(R.id.button_delete);
        }
        
        public void bind(Match match) {
            // Find associated receipt and transaction
            Receipt receipt = findReceiptById(match.getReceiptId());
            Transaction transaction = findTransactionById(match.getTransactionId());
            
            if (receipt != null) {
                textViewReceiptVendor.setText(receipt.getVendor());
                textViewReceiptAmount.setText(String.format("$%.2f", receipt.getAmount()));
            }
            
            if (transaction != null) {
                textViewTransactionDescription.setText(transaction.getDescription());
                textViewTransactionAmount.setText(String.format("$%.2f", transaction.getAmount()));
            }
            
            textViewMatchDate.setText(match.getMatchDate());
            textViewConfidenceScore.setText(String.format("Confidence: %.2f", match.getConfidenceScore()));
            
            // Set click listeners
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onMatchClick(match);
                }
            });
            
            buttonDelete.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onDeleteClick(match);
                }
            });
        }
        
        private Receipt findReceiptById(int id) {
            for (Receipt receipt : receipts) {
                if (receipt.getId() == id) {
                    return receipt;
                }
            }
            return null;
        }
        
        private Transaction findTransactionById(int id) {
            for (Transaction transaction : transactions) {
                if (transaction.getId() == id) {
                    return transaction;
                }
            }
            return null;
        }
    }
}