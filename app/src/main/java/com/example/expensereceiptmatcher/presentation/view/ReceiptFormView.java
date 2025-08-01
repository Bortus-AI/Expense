package com.example.expensereceiptmatcher.presentation.view;

import android.content.Context;
import android.text.Editable;
import android.text.TextWatcher;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.widget.EditText;
import android.widget.LinearLayout;

import androidx.annotation.Nullable;

import com.example.expensereceiptmatcher.R;
import com.example.expensereceiptmatcher.domain.model.Receipt;

public class ReceiptFormView extends LinearLayout {
    private EditText editTextDate;
    private EditText editTextAmount;
    private EditText editTextVendor;
    private EditText editTextCategory;
    private EditText editTextNotes;
    
    private OnFormChangeListener onFormChangeListener;

    public interface OnFormChangeListener {
        void onFormChanged();
    }

    public ReceiptFormView(Context context) {
        super(context);
        init();
    }

    public ReceiptFormView(Context context, @Nullable AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ReceiptFormView(Context context, @Nullable AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        LayoutInflater.from(getContext()).inflate(R.layout.view_receipt_form, this, true);
        editTextDate = findViewById(R.id.edit_text_date);
        editTextAmount = findViewById(R.id.edit_text_amount);
        editTextVendor = findViewById(R.id.edit_text_vendor);
        editTextCategory = findViewById(R.id.edit_text_category);
        editTextNotes = findViewById(R.id.edit_text_notes);
        
        // Add text watchers to notify form changes
        TextWatcher textWatcher = new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (onFormChangeListener != null) {
                    onFormChangeListener.onFormChanged();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        };
        
        editTextDate.addTextChangedListener(textWatcher);
        editTextAmount.addTextChangedListener(textWatcher);
        editTextVendor.addTextChangedListener(textWatcher);
        editTextCategory.addTextChangedListener(textWatcher);
        editTextNotes.addTextChangedListener(textWatcher);
    }

    public void setReceipt(Receipt receipt) {
        if (receipt != null) {
            editTextDate.setText(receipt.getDate());
            editTextAmount.setText(String.valueOf(receipt.getAmount()));
            editTextVendor.setText(receipt.getVendor());
            editTextCategory.setText(receipt.getCategory());
            editTextNotes.setText(receipt.getNotes());
        }
    }

    public Receipt getReceipt() {
        Receipt receipt = new Receipt();
        receipt.setDate(editTextDate.getText().toString());
        try {
            receipt.setAmount(Double.parseDouble(editTextAmount.getText().toString()));
        } catch (NumberFormatException e) {
            receipt.setAmount(0.0);
        }
        receipt.setVendor(editTextVendor.getText().toString());
        receipt.setCategory(editTextCategory.getText().toString());
        receipt.setNotes(editTextNotes.getText().toString());
        return receipt;
    }
    
    public void setOnFormChangeListener(OnFormChangeListener listener) {
        this.onFormChangeListener = listener;
    }
    
    public boolean validate() {
        // Basic validation
        return !editTextDate.getText().toString().trim().isEmpty() &&
               !editTextAmount.getText().toString().trim().isEmpty() &&
               !editTextVendor.getText().toString().trim().isEmpty();
    }
}