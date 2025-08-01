package com.example.expensereceiptmatcher.presentation.view;

import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.annotation.Nullable;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.domain.model.Receipt;
import com.example.expensereceiptmatcher.domain.model.Transaction;

public class ReceiptTransactionView extends LinearLayout {
    private TextView textViewTitle;
    private TextView textViewDate;
    private TextView textViewAmount;
    private TextView textViewDescription;
    private TextView textViewCategory;

    public ReceiptTransactionView(Context context) {
        super(context);
        init();
    }

    public ReceiptTransactionView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ReceiptTransactionView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        LayoutInflater.from(getContext()).inflate(R.layout.view_receipt_transaction, this, true);
        textViewTitle = findViewById(R.id.text_view_title);
        textViewDate = findViewById(R.id.text_view_date);
        textViewAmount = findViewById(R.id.text_view_amount);
        textViewDescription = findViewById(R.id.text_view_description);
        textViewCategory = findViewById(R.id.text_view_category);
    }

    public void setReceipt(Receipt receipt) {
        textViewTitle.setText("Receipt");
        textViewDate.setText(receipt.getDate());
        textViewAmount.setText(String.format("$%.2f", receipt.getAmount()));
        textViewDescription.setText(receipt.getVendor());
        textViewCategory.setText(receipt.getCategory());
    }

    public void setTransaction(Transaction transaction) {
        textViewTitle.setText("Transaction");
        textViewDate.setText(transaction.getDate());
        textViewAmount.setText(String.format("$%.2f", transaction.getAmount()));
        textViewDescription.setText(transaction.getDescription());
        textViewCategory.setText(transaction.getCategory());
    }
}