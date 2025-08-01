package com.example.expensereceiptmatcher.domain.usecase;

import com.example.expensereceiptmatcher.domain.model.Receipt;

public class ScanReceiptUseCase {
    // Use case for scanning a receipt
    
    public Receipt execute(String imagePath) {
        // This would typically use OCR to extract data from the receipt image
        // For now, we'll return a placeholder receipt
        Receipt receipt = new Receipt();
        receipt.setImageUrl(imagePath);
        // In a real implementation, we would populate the receipt with data extracted from the image
        return receipt;
    }
}