import React, { useState, useEffect, useCallback } from 'react';
import { masterDataAPI } from '../services/api';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const MasterDataSettings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('categories');
  const [categories, setCategories] = useState([]);
  const [jobNumbers, setJobNumbers] = useState([]);
  const [costCodes, setCostCodes] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [editItem, setEditItem] = useState(null); // { id, name, type, category_id }
  const [loading, setLoading] = useState(true);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);

  // Helper functions for proper display names
  const getDisplayName = (type) => {
    const displayNames = {
      categories: 'Category',
      jobNumbers: 'Job Number',
      costCodes: 'Cost Code'
    };
    return displayNames[type] || type;
  };

  const getDisplayNamePlural = (type) => {
    const displayNames = {
      categories: 'Categories',
      jobNumbers: 'Job Numbers',
      costCodes: 'Cost Codes'
    };
    return displayNames[type] || type;
  };

  const fetchData = useCallback(async (tab) => {
    setLoading(true);
    try {
      let response;
      if (tab === 'categories') {
        response = await masterDataAPI.getCategories();
        setCategories(response.data);
      } else if (tab === 'jobNumbers') {
        response = await masterDataAPI.getJobNumbers();
        setJobNumbers(response.data);
      } else if (tab === 'costCodes') {
        response = await masterDataAPI.getCostCodes();
        setCostCodes(response.data);
      }
    } catch (error) {
      console.error(`Error fetching ${tab}:`, error);
      toast.error(`Failed to fetch ${getDisplayNamePlural(tab)}.`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.currentRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchData(activeTab);
  }, [activeTab, user, fetchData]);

  const handleAddItem = async (type) => {
    if (!newItemName.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    try {
      // Map type to correct API method name
      const methodMap = {
        categories: 'addCategory',
        jobNumbers: 'addJobNumber', 
        costCodes: 'addCostCode'
      };
      
      if (type === 'costCodes') {
        await masterDataAPI[methodMap[type]](newItemName, newItemCategoryId || null);
      } else {
        await masterDataAPI[methodMap[type]](newItemName);
      }
      
      toast.success(`${newItemName} added successfully!`);
      setNewItemName('');
      setNewItemCategoryId('');
      fetchData(type);
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      toast.error(error.response?.data?.error || `Failed to add ${getDisplayName(type)}.`);
    }
  };

  const handleUpdateItem = async (type) => {
    if (!editItem?.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    try {
      // Map type to correct API method name
      const methodMap = {
        categories: 'updateCategory',
        jobNumbers: 'updateJobNumber', 
        costCodes: 'updateCostCode'
      };
      
      if (type === 'costCodes') {
        await masterDataAPI[methodMap[type]](editItem.id, editItem.name, editItem.category_id || null);
      } else {
        await masterDataAPI[methodMap[type]](editItem.id, editItem.name);
      }
      
      toast.success(`${editItem.name} updated successfully!`);
      setEditItem(null);
      fetchData(type);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      toast.error(error.response?.data?.error || `Failed to update ${getDisplayName(type)}.`);
    }
  };

  const handleDeleteItem = async (id, type, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone if it's not used in any transactions.`)) {
      return;
    }
    try {
      // Map type to correct API method name
      const methodMap = {
        categories: 'deleteCategory',
        jobNumbers: 'deleteJobNumber', 
        costCodes: 'deleteCostCode'
      };
      
      await masterDataAPI[methodMap[type]](id);
      toast.success(`${name} deleted successfully!`);
      fetchData(type);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(error.response?.data?.error || `Failed to delete ${getDisplayName(type)}.`);
    }
  };

  const handleCSVImport = async (file, type) => {
    if (!file) {
      toast.error('Please select a CSV file to import.');
      return;
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file.');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB.');
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      // Map type to correct API method name
      const methodMap = {
        categories: 'importCategories',
        jobNumbers: 'importJobNumbers', 
        costCodes: 'importCostCodes'
      };

      const response = await masterDataAPI[methodMap[type]](file);
      const result = response.data;

      setImportResult(result);
      
      if (result.summary.imported > 0) {
        toast.success(`Successfully imported ${result.summary.imported} ${getDisplayNamePlural(type).toLowerCase()}!`);
        fetchData(type); // Refresh the data
      } else if (result.summary.errors > 0) {
        toast.warning(`Import completed with ${result.summary.errors} errors. Check the details below.`);
      } else {
        toast.info('No new items were imported. All items may already exist.');
      }
    } catch (error) {
      console.error(`Error importing ${type}:`, error);
      toast.error(error.response?.data?.error || `Failed to import ${getDisplayNamePlural(type).toLowerCase()}.`);
      setImportResult(null);
    } finally {
      setImporting(false);
    }
  };

  const clearImportResult = () => {
    setImportResult(null);
  };

  // CSV Import Component
  const renderCSVImport = (type) => (
    <div className="card mb-4">
      <div className="card-header">
        <h3 className="card-title">Import {getDisplayNamePlural(type)} from CSV</h3>
        <div className="text-sm text-gray">
          Upload a CSV file to bulk import {getDisplayNamePlural(type).toLowerCase()}
        </div>
      </div>
      <div className="p-3">
        <div className="mb-3">
          <input
            type="file"
            accept=".csv"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                handleCSVImport(file, type);
                e.target.value = ''; // Reset input
              }
            }}
            disabled={importing}
            className="form-input"
          />
          {importing && (
            <div className="flex mt-2" style={{ alignItems: 'center' }}>
              <div className="spinner mr-2"></div>
              <span className="text-sm text-gray">Importing...</span>
            </div>
          )}
        </div>
        
        {/* CSV Format Instructions */}
        <div className="text-sm text-gray mb-3">
          <strong>CSV Format:</strong> The CSV file should have a column named "Name" containing the {getDisplayName(type).toLowerCase()} names.
          {type === 'costCodes' && (
            <>
              <br />
              <strong>For Cost Codes:</strong> Include a "Category" column to associate cost codes with categories. Categories will be created automatically if they don't exist.
            </>
          )}
          <br />
          <strong>Example CSV content:</strong>
          <pre className="mt-2 p-2" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '12px' }}>
{type === 'categories' ? 'Name\nOffice Supplies\nFood & Dining\nTransportation\nUtilities' : 
 type === 'jobNumbers' ? 'Name\nJOB-2024-001\nJOB-2024-002\nJOB-2024-003' : 
 'Cost Code,Category\n01-0000,DIV. 01- GEN. REQUIREMENTS\n01-0001,CERTIFIED PAYROLL PROJECT\n01-3105,ESTIMATING\n01-3106,PRECONSTRUCTION SERVICES'}
          </pre>
          <div className="text-xs text-gray mt-1">
            💡 Tip: You can also use columns named "Category", "Job Number", "Cost Code", or "Item" - the system will automatically detect the correct column.
            {type === 'costCodes' && (
              <>
                <br />
                💡 For Cost Codes: Categories referenced in your CSV will be created automatically if they don't already exist, ensuring all cost codes are properly linked.
              </>
            )}
          </div>
        </div>

        {/* Import Results */}
        {importResult && (
          <div className={`card mb-3 ${importResult.summary.errors > 0 ? 'border-warning' : 'border-success'}`}>
            <div className="card-header">
              <div className="flex-between">
                <h4 className="card-title">Import Results</h4>
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={clearImportResult}
                >
                  ×
                </button>
              </div>
            </div>
            <div className="p-3">
              {/* Summary */}
              <div className="grid grid-4 mb-3">
                <div className="text-center">
                  <div className="text-xl text-success">{importResult.summary.imported}</div>
                  <div className="text-sm text-gray">Imported</div>
                </div>
                <div className="text-center">
                  <div className="text-xl text-warning">{importResult.summary.skipped}</div>
                  <div className="text-sm text-gray">Skipped</div>
                </div>
                <div className="text-center">
                  <div className="text-xl text-danger">{importResult.summary.errors}</div>
                  <div className="text-sm text-gray">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-xl text-gray">{importResult.summary.totalRows}</div>
                  <div className="text-sm text-gray">Total Rows</div>
                </div>
              </div>

              {/* Duplicates */}
              {importResult.details.duplicates.length > 0 && (
                <div className="mb-3">
                  <h5 className="mb-2">Duplicates/Skipped Items:</h5>
                  <div className="text-sm">
                    {importResult.details.duplicates.map((duplicate, index) => (
                      <div key={index} className="mb-1">
                        <strong>Row {duplicate.row}:</strong> "{duplicate.name}" - {duplicate.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errors */}
              {importResult.details.errors.length > 0 && (
                <div className="mb-3">
                  <h5 className="mb-2">Errors:</h5>
                  <div className="text-sm text-danger">
                    {importResult.details.errors.map((error, index) => (
                      <div key={index} className="mb-1">
                        <strong>Row {error.row}:</strong> {error.error}
                        {error.name && ` (${error.name})`}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderTable = (items, type) => (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            {type === 'costCodes' && <th>Category</th>}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <tr>
              <td colSpan={type === 'costCodes' ? "3" : "2"} className="text-center text-gray">No {getDisplayNamePlural(type).toLowerCase()} found.</td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td>
                  {editItem && editItem.id === item.id && editItem.type === type ? (
                    <input
                      type="text"
                      className="form-control"
                      value={editItem.name}
                      onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    />
                  ) : (
                    item.name
                  )}
                </td>
                {type === 'costCodes' && (
                  <td>
                    {editItem && editItem.id === item.id && editItem.type === type ? (
                      <select
                        className="form-select"
                        value={editItem.category_id || ''}
                        onChange={(e) => setEditItem({ ...editItem, category_id: e.target.value || null })}
                      >
                        <option value="">No category assigned</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`badge ${item.category_name ? 'badge-info' : 'badge-secondary'}`}>
                        {item.category_name || 'No category'}
                      </span>
                    )}
                  </td>
                )}
                <td>
                  {editItem && editItem.id === item.id && editItem.type === type ? (
                    <button className="btn btn-sm btn-success me-2" onClick={() => handleUpdateItem(type)}>
                      Save
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-info me-2" onClick={() => setEditItem({ 
                      id: item.id, 
                      name: item.name, 
                      type,
                      category_id: item.category_id || null
                    })}>
                      Edit
                    </button>
                  )}
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteItem(item.id, type, item.name)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex-center" style={{ height: '50vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-4">Master Data Settings</h1>
      <p className="text-gray mb-4">Manage your company's master lists for categories, job numbers, and cost codes. These lists will be available for users when entering transaction data.</p>

      <div className="tab-navigation mb-4">
        <button 
          className={`tab-button ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('categories');
            clearImportResult();
          }}
        >
          Categories
        </button>
        <button 
          className={`tab-button ${activeTab === 'jobNumbers' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('jobNumbers');
            clearImportResult();
          }}
        >
          Job Numbers
        </button>
        <button 
          className={`tab-button ${activeTab === 'costCodes' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('costCodes');
            clearImportResult();
          }}
        >
          Cost Codes
        </button>
      </div>

      {/* CSV Import Section */}
      {renderCSVImport(activeTab)}

      <div className="card p-4">
        {/* Fixed display names and typos */}
        <h2 className="mb-3">Add New {getDisplayName(activeTab)}</h2>
        <div className="mb-4">
          <div className="input-group mb-3">
            <input
              type="text"
              className="form-control"
              placeholder={`Enter ${getDisplayName(activeTab).toLowerCase()} name`}
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleAddItem(activeTab);
                }
              }}
            />
            <button className="btn btn-primary" onClick={() => handleAddItem(activeTab)}>
              Add {getDisplayName(activeTab)}
            </button>
          </div>
          
          {/* Category selection for cost codes */}
          {activeTab === 'costCodes' && (
            <div className="mb-3">
              <label className="form-label">Associated Category (Optional)</label>
              <select
                className="form-select"
                value={newItemCategoryId}
                onChange={(e) => setNewItemCategoryId(e.target.value)}
              >
                <option value="">No category assigned</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <div className="text-sm text-gray mt-1">
                You can associate this cost code with a category for better organization.
              </div>
            </div>
          )}
        </div>

        <h2 className="mb-3">Existing {getDisplayNamePlural(activeTab)}</h2>
        {renderTable(activeTab === 'categories' ? categories : activeTab === 'jobNumbers' ? jobNumbers : costCodes, activeTab)}
      </div>
    </div>
  );
};

export default MasterDataSettings;
