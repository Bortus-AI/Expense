import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { receiptAPI } from '../services/api';
import { toast } from 'react-toastify';

const Receipts = () => {
  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadReceipts(currentPage);
  }, [currentPage]);

  const loadReceipts = async (page = 1) => {
    setLoading(true);
    try {
      const response = await receiptAPI.getAll(page, 20);
      setReceipts(response.data.receipts || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Error loading receipts');
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    
    try {
      // Upload all files simultaneously
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        try {
          await receiptAPI.upload(file);
          return { success: true, filename: file.name };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          return { success: false, filename: file.name, error };
        }
      });

      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        const message = acceptedFiles.length === 1 
          ? 'Receipt uploaded successfully! Processing OCR...'
          : `${successful.length} of ${acceptedFiles.length} receipts uploaded successfully! Processing OCR...`;
        toast.success(message);
      }

      if (failed.length > 0) {
        const message = failed.length === 1
          ? `Failed to upload: ${failed[0].filename}`
          : `Failed to upload ${failed.length} receipts`;
        toast.error(message);
      }
      
      // Refresh receipts list after a short delay to allow for OCR processing
      setTimeout(() => {
        loadReceipts(currentPage);
      }, 3000); // Longer delay for multiple files
      
    } catch (error) {
      console.error('Error in batch upload:', error);
      toast.error('Error uploading receipts');
    } finally {
      setUploading(false);
    }
  }, [currentPage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: uploading
  });

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this receipt?')) {
      return;
    }

    try {
      await receiptAPI.delete(id);
      toast.success('Receipt deleted');
      loadReceipts(currentPage);
    } catch (error) {
      toast.error('Error deleting receipt');
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getStatusBadge = (status) => {
    const badgeClass = 
      status === 'completed' ? 'badge-success' :
      status === 'processing' ? 'badge-warning' :
      'badge-danger';
    
    return <span className={`badge ${badgeClass}`}>{status}</span>;
  };

  const getMatchStatus = (matchCount) => {
    if (matchCount > 0) {
      return <span className="badge badge-success">Matched</span>;
    }
    return <span className="badge badge-warning">Unmatched</span>;
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex-between mb-3">
        <h1>Receipts</h1>
        <div className="text-sm text-gray">
          Total: {pagination.total || 0} receipts
        </div>
      </div>

      {/* Upload Area */}
      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Upload Receipt</h3>
          <p className="card-subtitle">
            Upload multiple receipt images or PDF files for OCR processing and matching
          </p>
        </div>
        
        <div 
          {...getRootProps()} 
          className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'disabled' : ''}`}
        >
          <input {...getInputProps()} />
          {uploading ? (
            <div className="flex-center gap-2">
              <div className="spinner"></div>
              <span>Uploading and processing...</span>
            </div>
          ) : isDragActive ? (
            <p>Drop the receipt files here...</p>
          ) : (
            <div>
              <p><strong>Drag & drop</strong> receipt images or PDFs here, or <strong>click to select multiple files</strong></p>
              <p className="text-sm text-gray">Supports: PNG, JPG, JPEG, GIF, BMP, WebP, PDF • Multiple files supported</p>
            </div>
          )}
        </div>
      </div>

      {/* Receipts List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Uploaded Receipts</h3>
        </div>

        {receipts.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Filename</th>
                    <th>Upload Date</th>
                    <th>OCR Status</th>
                    <th>Extracted Amount</th>
                    <th>Extracted Merchant</th>
                    <th>Match Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td>
                        <div className="text-sm">
                          {receipt.original_filename.toLowerCase().endsWith('.pdf') ? '📄 ' : '🖼️ '}
                          {receipt.original_filename}
                        </div>
                        <div className="text-sm text-gray">
                          {(receipt.file_size / 1024).toFixed(1)} KB
                          {receipt.original_filename.toLowerCase().endsWith('.pdf') ? ' (PDF)' : ' (Image)'}
                        </div>
                      </td>
                      <td>
                        {new Date(receipt.upload_date).toLocaleDateString()}
                      </td>
                      <td>
                        {getStatusBadge(receipt.processing_status)}
                      </td>
                      <td>
                        {receipt.extracted_amount ? 
                          `$${receipt.extracted_amount.toFixed(2)}` : 
                          <span className="text-gray">-</span>
                        }
                      </td>
                      <td>
                        {receipt.extracted_merchant || 
                          <span className="text-gray">-</span>
                        }
                      </td>
                      <td>
                        {getMatchStatus(receipt.match_count)}
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {receipt.file_path && (
                            <a
                              href={`http://localhost:5000/uploads/receipts/${receipt.filename}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-sm btn-secondary"
                            >
                              View
                            </a>
                          )}
                          <button
                            onClick={() => handleDelete(receipt.id)}
                            className="btn btn-sm btn-danger"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex-center mt-3 gap-2">
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                
                <span className="text-sm">
                  Page {currentPage} of {pagination.pages}
                </span>
                
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={currentPage >= pagination.pages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray">
            <p>No receipts uploaded yet</p>
            <p className="text-sm">Upload your first receipt above to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Receipts; 