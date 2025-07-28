import React, { useState, useEffect } from 'react';
import { transactionAPI, companyAPI, masterDataAPI, api } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Master data lists
  const [categories, setCategories] = useState([]);
  const [jobNumbers, setJobNumbers] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  
  // Admin filtering state
  const [companyUsers, setCompanyUsers] = useState([]);
  const [filters, setFilters] = useState({
    userId: '',
    startDate: '',
    endDate: '',
    category: '',
    minAmount: '',
    maxAmount: '',
    status: '',
    sortBy: 'transaction_date',
    sortOrder: 'DESC'
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Editing state
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [savingTransaction, setSavingTransaction] = useState(null);

  useEffect(() => {
    loadTransactions(currentPage);
    // Only load company users if user is admin and fully loaded
    if (user?.currentRole === 'admin' && user?.currentCompany?.id) {
      loadCompanyUsers();
      loadMasterData();
    }
  }, [currentPage, filters, user?.currentRole, user?.currentCompany?.id]);

  const loadMasterData = async () => {
    try {
      const [categoriesRes, jobNumbersRes, costCodesRes] = await Promise.all([
        masterDataAPI.getCategories(),
        masterDataAPI.getJobNumbers(),
        masterDataAPI.getCostCodes()
      ]);
      setCategories(categoriesRes.data);
      setJobNumbers(jobNumbersRes.data);
      setCostCodes(costCodesRes.data);
    } catch (error) {
      console.error('Error loading master data:', error);
      toast.error('Failed to load master data for dropdowns.');
    }
  };

  const loadCompanyUsers = async () => {
    try {
      console.log('Loading company users for filtering...');
      console.log('User role:', user?.currentRole);
      console.log('Company ID:', user?.currentCompany?.id);
      
      const response = await companyAPI.getUsersForFilter();
      console.log('Company users response:', response.data);
      console.log('Users array:', response.data.users);
      
      setCompanyUsers(response.data.users || []);
    } catch (error) {
      console.error('Error loading company users:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
    }
  };

  const loadTransactions = async (page = 1) => {
    setLoading(true);
    try {
      // Only include non-empty filters
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => value !== '')
      );
      
      const response = await transactionAPI.getAll(page, 50, activeFilters);
      setTransactions(response.data.transactions || []);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

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
      category: '',
      minAmount: '',
      maxAmount: '',
      status: '',
      sortBy: 'transaction_date',
      sortOrder: 'DESC'
    });
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const formatAmount = (amount) => {
    const isDebit = amount < 0;
    return (
      <span className={isDebit ? 'text-danger' : 'text-success'}>
        {isDebit ? '-' : '+'}${Math.abs(amount).toFixed(2)}
      </span>
    );
  };

  // Helper function to format dates without timezone conversion
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    // Parse as local date to avoid timezone shifts
    // Database format: YYYY-MM-DD
    const [year, month, day] = dateString.split('-');
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    return date.toLocaleDateString();
  };

  const getReceiptStatus = (receiptCount) => {
    if (receiptCount > 0) {
      return <span className="badge badge-success">Matched</span>;
    }
    return <span className="badge badge-warning">Unmatched</span>;
  };

  const handleDelete = async (transactionId, description) => {
    if (window.confirm(`Are you sure you want to delete the transaction "${description}"?`)) {
      try {
        await transactionAPI.delete(transactionId);
        toast.success('Transaction deleted successfully');
        loadTransactions(currentPage);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        toast.error('Error deleting transaction');
      }
    }
  };

  // Editing functions
  const handleEditStart = (transaction) => {
    setEditingTransaction(transaction.id);
    setEditFormData({
      description: transaction.description || '',
      category: transaction.category_name || '',
      amount: transaction.amount || '',
      job_number: transaction.job_number_name || '',
      cost_code: transaction.cost_code_name || ''
    });
  };

  const handleEditCancel = () => {
    setEditingTransaction(null);
    setEditFormData({});
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSave = async (transactionId) => {
    // Validation
    if (!editFormData.description || !editFormData.category || !editFormData.job_number || !editFormData.cost_code) {
      toast.error('Description, category, job number, and cost code are required');
      return;
    }

    if (!editFormData.amount || isNaN(parseFloat(editFormData.amount))) {
      toast.error('Please enter a valid amount');
      return;
    }

    setSavingTransaction(transactionId);
    
    try {
      await transactionAPI.update(transactionId, {
        description: editFormData.description,
        category: editFormData.category,
        amount: parseFloat(editFormData.amount),
        job_number: editFormData.job_number,
        cost_code: editFormData.cost_code
      });
      
      toast.success('Transaction updated successfully');
      setEditingTransaction(null);
      setEditFormData({});
      loadTransactions(currentPage);
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error(error.response?.data?.error || 'Error updating transaction');
    } finally {
      setSavingTransaction(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <div className="page-header">
        <h1>Transactions</h1>
        <p>Manage and review all company transactions</p>
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
                  <label className="form-label">Category</label>
                  <select 
                    value={filters.category} 
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="form-select"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
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
                  <label className="form-label">Status</label>
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
                    <option value="transaction_date">Date</option>
                    <option value="description">Description</option>
                    <option value="amount">Amount</option>
                    <option value="category">Category</option>
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
                  onClick={() => loadTransactions(1)}
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
          <h3 className="card-title">All Transactions</h3>
          <p className="card-subtitle">
            {user?.currentRole === 'admin' ? 'All company transactions' : 'Your transactions'}
          </p>
        </div>

        {transactions.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Job Number</th>
                    <th>Cost Code</th>
                    <th>Amount</th>
                    <th>Transaction ID</th>
                    <th>Sales Tax</th>
                    <th>Receipt Status</th>
                    <th>Receipts</th>
                    {user?.currentRole === 'admin' && <th>Created By</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        {formatDate(transaction.transaction_date)}
                      </td>
                      
                      {/* Description */}
                      <td>
                        {editingTransaction === transaction.id ? (
                          <input
                            type="text"
                            className="form-input"
                            value={editFormData.description}
                            onChange={(e) => handleEditChange('description', e.target.value)}
                            placeholder="Description"
                          />
                        ) : (
                          <div className="text-sm">
                            {transaction.description || <span className="text-danger">Missing description</span>}
                          </div>
                        )}
                      </td>
                      
                      {/* Category */}
                      <td>
                        {editingTransaction === transaction.id ? (
                          <select
                            className="form-select"
                            value={editFormData.category}
                            onChange={(e) => handleEditChange('category', e.target.value)}
                          >
                            <option value="">Select Category</option>
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                            ))}
                          </select>
                        ) : (
                          <span className={`badge ${transaction.category_name ? 'badge-info' : 'badge-warning'}`}>
                            {transaction.category_name || 'Not set'}
                          </span>
                        )}
                      </td>
                      
                      {/* Job Number */}
                      <td>
                        {editingTransaction === transaction.id ? (
                          <select
                            className="form-select"
                            value={editFormData.job_number}
                            onChange={(e) => handleEditChange('job_number', e.target.value)}
                          >
                            <option value="">Select Job Number</option>
                            {jobNumbers.map(jn => (
                              <option key={jn.id} value={jn.name}>{jn.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm">
                            {transaction.job_number_name ? (
                              <span className="badge badge-success">{transaction.job_number_name}</span>
                            ) : (
                              <span className="text-danger">Required</span>
                            )}
                          </div>
                        )}
                      </td>
                      
                      {/* Cost Code */}
                      <td>
                        {editingTransaction === transaction.id ? (
                          <select
                            className="form-select"
                            value={editFormData.cost_code}
                            onChange={(e) => handleEditChange('cost_code', e.target.value)}
                          >
                            <option value="">Select Cost Code</option>
                            {costCodes.map(cc => (
                              <option key={cc.id} value={cc.name}>{cc.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm">
                            {transaction.cost_code_name ? (
                              <span className="badge badge-success">{transaction.cost_code_name}</span>
                            ) : (
                              <span className="text-danger">Required</span>
                            )}
                          </div>
                        )}
                      </td>
                      
                      {/* Amount */}
                      <td>
                        {editingTransaction === transaction.id ? (
                          <input
                            type="number"
                            step="0.01"
                            className="form-input"
                            value={editFormData.amount}
                            onChange={(e) => handleEditChange('amount', e.target.value)}
                            placeholder="0.00"
                          />
                        ) : (
                          formatAmount(transaction.amount)
                        )}
                      </td>
                      
                      <td>
                        <div className="text-sm text-gray">
                          {transaction.external_transaction_id || 'N/A'}
                        </div>
                      </td>
                      <td>
                        {transaction.sales_tax ? formatAmount(transaction.sales_tax) : 'N/A'}
                      </td>
                      <td>{getReceiptStatus(transaction.receipt_count)}</td>
                      <td>
                        {transaction.receipts ? (
                          <div className="text-sm">
                            {transaction.receipts.split(',').map((receipt, index) => (
                              <div key={index}>{receipt}</div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray">None</span>
                        )}
                      </td>
                      {user?.currentRole === 'admin' && (
                        <td>
                          <div className="text-sm">
                            {transaction.created_by_first_name && transaction.created_by_last_name ? (
                              <span>
                                {transaction.created_by_first_name} {transaction.created_by_last_name}
                              </span>
                            ) : (
                              <span className="text-gray">Unknown</span>
                            )}
                          </div>
                        </td>
                      )}
                      <td>
                        {editingTransaction === transaction.id ? (
                          <div className="flex gap-1">
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => handleEditSave(transaction.id)}
                              disabled={savingTransaction === transaction.id}
                            >
                              {savingTransaction === transaction.id ? (
                                <div className="spinner"></div>
                              ) : (
                                'Save'
                              )}
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={handleEditCancel}
                              disabled={savingTransaction === transaction.id}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => handleEditStart(transaction)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(transaction.id, transaction.description)}
                            >
                              Delete
                            </button>
                          </div>
                        )}
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
            <p>No transactions found.</p>
            {user?.currentRole === 'admin' && filters.userId && (
              <p className="text-sm text-gray">
                Try adjusting your filters or selecting a different user.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Transactions; 