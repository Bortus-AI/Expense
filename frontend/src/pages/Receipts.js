import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { receiptAPI, companyAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const Receipts = () => {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // View modal state
  const [viewModal, setViewModal] = useState({
    isOpen: false,
    receipt: null,
    viewUrl: null,
    loading: false
  });
  
  // Admin filtering state
  const [companyUsers, setCompanyUsers] = useState([]);
  const [filters, setFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    processingStatus: '',
    minAmount: '',
    maxAmount: '',
    status: '',
    sortBy: 'upload_date',
    sortOrder: 'DESC'
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadReceipts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Only include non-empty filters
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => value !== '')
      );
      
      const response = await receiptAPI.getAll(page, 20, activeFilters);
      setReceipts(response.data.receipts || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error loading receipts:', error);
      toast.error('Error loading receipts');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const loadCompanyUsers = useCallback(async () => {
    try {
      console.log('Loading company users for receipts filtering...');
      console.log('User role:', user?.currentRole);
      console.log('Company ID:', user?.currentCompany?.id);
      
      const response = await companyAPI.getUsersForFilter();
      console.log('Company users response for receipts:', response.data);
      console.log('Users array for receipts:', response.data.users);
      
      setCompanyUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading company users for receipts:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }
  }, [user?.currentRole, user?.currentCompany?.id]);

  useEffect(() => {
    loadReceipts(currentPage);
    // Only load company users if user is admin and fully loaded
    if (user?.currentRole === 'admin' && user?.currentCompany?.id) {
      loadCompanyUsers();
    }
  }, [currentPage, user?.currentRole, user?.currentCompany?.id, loadReceipts, loadCompanyUsers]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({
      userId: '',
      startDate: '',
      endDate: '',
      processingStatus: '',
      minAmount: '',
      maxAmount: '',
      status: '',
      sortBy: 'upload_date',
      sortOrder: 'DESC'
    });
    setCurrentPage(1);
  };

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        await receiptAPI.upload(file);
      }
      toast.success(`${acceptedFiles.length} receipt(s) uploaded successfully`);
      loadReceipts(currentPage);
    } catch (error) {
      console.error('Error uploading receipts:', error);
      toast.error('Error uploading receipts');
    } finally {
      setUploading(false);
    }
  }, [currentPage, loadReceipts]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'application/pdf': ['.pdf']
    },
    multiple: true
  });

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await receiptAPI.delete(id);
        toast.success('Receipt deleted successfully');
        loadReceipts(currentPage);
      } catch (error) {
        console.error('Error deleting receipt:', error);
        toast.error('Error deleting receipt');
      }
    }
  };

  const handleView = async (receipt) => {
    setViewModal({
      isOpen: true,
      receipt,
      viewUrl: null,
      loading: true
    });

    try {
      const response = await receiptAPI.view(receipt.id);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      
      setViewModal(prev => ({
        ...prev,
        viewUrl: url,
        loading: false
      }));
    } catch (error) {
      console.error('Error loading receipt:', error);
      toast.error('Error loading receipt');
      setViewModal(prev => ({
        ...prev,
        loading: false
      }));
    }
  };

  const openInNewTab = async (receipt) => {
    try {
      // Fetch the file data with proper content type
      const response = await receiptAPI.view(receipt.id);
      
      // Determine content type based on file extension
      const ext = receipt.original_filename.toLowerCase().split('.').pop();
      let contentType = 'application/octet-stream';
      
      if (ext === 'pdf') {
        contentType = 'application/pdf';
      } else if (['jpg', 'jpeg'].includes(ext)) {
        contentType = 'image/jpeg';
      } else if (ext === 'png') {
        contentType = 'image/png';
      } else if (ext === 'gif') {
        contentType = 'image/gif';
      } else if (ext === 'webp') {
        contentType = 'image/webp';
      }

      // Create a new blob with the correct content type
      const blob = new Blob([response.data], { type: contentType });
      const url = URL.createObjectURL(blob);
      
      // Open in new tab
      const newWindow = window.open(url, '_blank');
      
      // Clean up the URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      console.error('Error opening receipt in new tab:', error);
      toast.error('Error opening receipt');
    }
  };

  const handleDownload = async (receipt) => {
    try {
      const response = await receiptAPI.download(receipt.id);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = receipt.original_filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL
      URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Error downloading receipt');
    }
  };

  const closeViewModal = () => {
    if (viewModal.viewUrl) {
      URL.revokeObjectURL(viewModal.viewUrl);
    }
    setViewModal({
      isOpen: false,
      receipt: null,
      viewUrl: null,
      loading: false
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      case 'processing':
        return <span className="badge badge-warning">Processing</span>;
      case 'failed':
        return <span className="badge badge-danger">Failed</span>;
      default:
        return <span className="badge badge-info">Pending</span>;
    }
  };

  const getMatchStatus = (matchCount) => {
    if (matchCount > 0) {
      return <span className="badge badge-success">Matched</span>;
    }
    return <span className="badge badge-warning">Unmatched</span>;
  };

  const formatAmount = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading receipts...</p>
      </div>
    );
  }

  return (
    <div className="receipts-page">
      <div className="page-header">
        <h1>Receipts</h1>
        <p>Upload and manage receipt images</p>
      </div>

      {/* Upload Section */}
      <div className="card mb-3">
        <div className="card-header">
          <h3 className="card-title">Upload Receipts</h3>
        </div>
        <div className="p-3">
          <div
            {...getRootProps()}
            className={`dropzone ${isDragActive ? 'active' : ''}`}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div className="text-center">
                <div className="spinner"></div>
                <p>Uploading receipts...</p>
              </div>
            ) : (
              <div className="text-center">
                <p>Drag & drop receipt files here, or click to select files</p>
                <p className="text-sm text-gray">
                  Supports: JPG, PNG, PDF (max 10MB each)
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Filter Section */}
      {user?.currentRole === 'admin' && (
        <div className="card mb-3">
          <div className="card-header">
            <h3 className="card-title">Admin Filters</h3>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </button>
          </div>
          {showFilters && (
            <div className="p-3">
              <div className="grid grid-3 gap-3">
                <div className="form-group">
                  <label className="form-label">User</label>
                  <select 
                    value={filters.userId} 
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Users</option>
                    {companyUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.role})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Processing Status</label>
                  <select 
                    value={filters.processingStatus} 
                    onChange={(e) => handleFilterChange('processingStatus', e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Status</option>
                    <option value="completed">Completed</option>
                    <option value="processing">Processing</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Min Amount</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Max Amount</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="form-input"
                    placeholder="0.00"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Match Status</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Status</option>
                    <option value="matched">Matched</option>
                    <option value="unmatched">Unmatched</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Sort By</label>
                  <select 
                    value={filters.sortBy} 
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="form-select"
                  >
                    <option value="upload_date">Upload Date</option>
                    <option value="extracted_date">Extracted Date</option>
                    <option value="extracted_amount">Amount</option>
                    <option value="file_size">File Size</option>
                    <option value="original_filename">Filename</option>
                    <option value="created_at">Created</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <select 
                    value={filters.sortOrder} 
                    onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                    className="form-select"
                  >
                    <option value="DESC">Descending</option>
                    <option value="ASC">Ascending</option>
                  </select>
                </div>
              </div>
              
              <div className="flex gap-2 mt-3">
                <button 
                  className="btn btn-primary"
                  onClick={() => loadReceipts(1)}
                >
                  Apply Filters
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={clearFilters}
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Receipts</h3>
          <p className="card-subtitle">
            {user?.currentRole === 'admin' ? 'All company receipts' : 'Your receipts'}
          </p>
        </div>

        {receipts.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Upload Date</th>
                    <th>Extracted Date</th>
                    <th>Amount</th>
                    <th>Merchant</th>
                    <th>File Size</th>
                    <th>Processing Status</th>
                    <th>Match Status</th>
                    {user?.currentRole === 'admin' && <th>Created By</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.map((receipt) => (
                    <tr key={receipt.id}>
                      <td>
                        <div className="text-sm">
                          {receipt.original_filename}
                        </div>
                      </td>
                      <td>{formatDate(receipt.upload_date)}</td>
                      <td>{formatDate(receipt.extracted_date)}</td>
                      <td>{formatAmount(receipt.extracted_amount)}</td>
                      <td>
                        <div className="text-sm">
                          {receipt.extracted_merchant || 'N/A'}
                        </div>
                      </td>
                      <td>{formatFileSize(receipt.file_size)}</td>
                      <td>{getStatusBadge(receipt.processing_status)}</td>
                      <td>{getMatchStatus(receipt.match_count)}</td>
                      {user?.currentRole === 'admin' && (
                        <td>
                          <div className="text-sm">
                            {receipt.created_by_first_name && receipt.created_by_last_name ? (
                              <span>
                                {receipt.created_by_first_name} {receipt.created_by_last_name}
                              </span>
                            ) : (
                              <span className="text-gray">Unknown</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td>
                        <button
                          className="btn btn-sm btn-info"
                          onClick={() => handleView(receipt)}
                        >
                          View
                        </button>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleDownload(receipt)}
                        >
                          Download
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(receipt.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Previous
                </button>
                <span className="pagination-info">
                  Page {currentPage} of {pagination.pages} ({pagination.total} total)
                </span>
                <button
                  className="btn btn-sm btn-secondary"
                  disabled={currentPage === pagination.pages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <p>No receipts found.</p>
            {user?.currentRole === 'admin' && filters.userId && (
              <p className="text-sm text-gray">
                Try adjusting your filters or selecting a different user.
              </p>
            )}
          </div>
        )}
      </div>

      {/* View Modal */}
      {viewModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Receipt Details</h3>
            {viewModal.loading ? (
              <div className="text-center">
                <div className="spinner"></div>
                <p>Loading receipt...</p>
              </div>
            ) : (
              <div className="receipt-details">
                <p><strong>Filename:</strong> {viewModal.receipt.original_filename}</p>
                <p><strong>Upload Date:</strong> {formatDate(viewModal.receipt.upload_date)}</p>
                <p><strong>Extracted Date:</strong> {formatDate(viewModal.receipt.extracted_date)}</p>
                <p><strong>Amount:</strong> {formatAmount(viewModal.receipt.extracted_amount)}</p>
                <p><strong>Merchant:</strong> {viewModal.receipt.extracted_merchant || 'N/A'}</p>
                <p><strong>File Size:</strong> {formatFileSize(viewModal.receipt.file_size)}</p>
                <p><strong>Processing Status:</strong> {getStatusBadge(viewModal.receipt.processing_status)}</p>
                <p><strong>Match Status:</strong> {getMatchStatus(viewModal.receipt.match_count)}</p>
                {viewModal.receipt.created_by_first_name && viewModal.receipt.created_by_last_name && (
                  <p><strong>Created By:</strong> {viewModal.receipt.created_by_first_name} {viewModal.receipt.created_by_last_name}</p>
                )}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={closeViewModal}>Close</button>
              {viewModal.viewUrl && (
                <button 
                  className="btn btn-secondary"
                  onClick={async () => {
                    const button = event.target;
                    const originalText = button.textContent;
                    button.textContent = 'Opening...';
                    button.disabled = true;
                    
                    try {
                      await openInNewTab(viewModal.receipt);
                    } finally {
                      button.textContent = originalText;
                      button.disabled = false;
                    }
                  }}
                >
                  Open in New Tab
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Receipts; 