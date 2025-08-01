package com.example.expensereceiptmatcher.presentation.adapter;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.domain.model.Receipt;

import java.util.ArrayList;
import java.util.List;

public class ReceiptAdapter extends RecyclerView.Adapter<ReceiptAdapter.ReceiptViewHolder> {
    private List<Receipt> receipts;
    private OnReceiptClickListener listener;
    
    public interface OnReceiptClickListener {
        void onReceiptClick(Receipt receipt);
        void onMatchClick(Receipt receipt);
    }
    
    public ReceiptAdapter() {
        this.receipts = new ArrayList<>();
    }
    
    public void setReceipts(List<Receipt> receipts) {
        this.receipts = receipts;
        notifyDataSetChanged();
    }
    
    public void setOnReceiptClickListener(OnReceiptClickListener listener) {
        this.listener = listener;
    }
    
    @NonNull
    @Override
    public ReceiptViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext())
                .inflate(R.layout.item_receipt, parent, false);
        return new ReceiptViewHolder(view);
    }
    
    @Override
    public void onBindViewHolder(@NonNull ReceiptViewHolder holder, int position) {
        Receipt receipt = receipts.get(position);
        holder.bind(receipt);
    }
    
    @Override
    public int getItemCount() {
        return receipts.size();
    }
    
    class ReceiptViewHolder extends RecyclerView.ViewHolder {
        private ImageView imageViewReceipt;
        private TextView textViewDate;
        private TextView textViewVendor;
        private TextView textViewAmount;
        private TextView textViewCategory;
        private View buttonMatch;
        
        public ReceiptViewHolder(@NonNull View itemView) {
            super(itemView);
            imageViewReceipt = itemView.findViewById(R.id.image_view_receipt);
            textViewDate = itemView.findViewById(R.id.text_view_date);
            textViewVendor = itemView.findViewById(R.id.text_view_vendor);
            textViewAmount = itemView.findViewById(R.id.text_view_amount);
            textViewCategory = itemView.findViewById(R.id.text_view_category);
            buttonMatch = itemView.findViewById(R.id.button_match);
        }
        
        public void bind(Receipt receipt) {
            textViewDate.setText(receipt.getDate());
            textViewVendor.setText(receipt.getVendor());
            textViewAmount.setText(String.format("$%.2f", receipt.getAmount()));
            textViewCategory.setText(receipt.getCategory());
            
            // Set click listeners
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onReceiptClick(receipt);
                }
            });
            
            buttonMatch.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onMatchClick(receipt);
                }
            });
            
            // Update UI based on match status
            if (receipt.isMatched()) {
                buttonMatch.setVisibility(View.GONE);
            } else {
                buttonMatch.setVisibility(View.VISIBLE);
            }
        }
    }
}