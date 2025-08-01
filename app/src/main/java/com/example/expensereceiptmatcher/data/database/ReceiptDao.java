package com.example.expensereceiptmatcher.data.database;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Update;
import androidx.room.Delete;

import com.example.expensereceiptmatcher.domain.model.Receipt;

import java.util.List;

@Dao
public interface ReceiptDao {
    @Query("SELECT * FROM receipts")
    List<Receipt> getAllReceipts();
    
    @Query("SELECT * FROM receipts WHERE id = :id")
    Receipt getReceiptById(int id);
    
    @Insert
    void insertReceipt(Receipt receipt);
    
    @Update
    void updateReceipt(Receipt receipt);
    
    @Delete
    void deleteReceipt(Receipt receipt);
}