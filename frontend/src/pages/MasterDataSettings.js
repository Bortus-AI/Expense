import React, { useState, useEffect } from 'react';
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
  const [editItem, setEditItem] = useState(null); // { id, name, type }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.currentRole !== 'admin') {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchData(activeTab);
  }, [activeTab, user]);

  const fetchData = async (tab) => {
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
      toast.error(`Failed to fetch ${tab}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async (type) => {
    if (!newItemName.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    try {
      await masterDataAPI[`add${type.charAt(0).toUpperCase() + type.slice(1)}`](newItemName);
      toast.success(`${newItemName} added successfully!`);
      setNewItemName('');
      fetchData(type);
    } catch (error) {
      console.error(`Error adding ${type}:`, error);
      toast.error(error.response?.data?.error || `Failed to add ${type}.`);
    }
  };

  const handleUpdateItem = async (type) => {
    if (!editItem?.name.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }
    try {
      await masterDataAPI[`update${type.charAt(0).toUpperCase() + type.slice(1)}`](editItem.id, editItem.name);
      toast.success(`${editItem.name} updated successfully!`);
      setEditItem(null);
      fetchData(type);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      toast.error(error.response?.data?.error || `Failed to update ${type}.`);
    }
  };

  const handleDeleteItem = async (id, type, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone if it's not used in any transactions.`)) {
      return;
    }
    try {
      await masterDataAPI[`delete${type.charAt(0).toUpperCase() + type.slice(1)}`](id);
      toast.success(`${name} deleted successfully!`);
      fetchData(type);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(error.response?.data?.error || `Failed to delete ${type}.`);
    }
  };

  const renderTable = (items, type) => (
    <div className="table-container">
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <tr>
              <td colSpan="2" className="text-center text-gray">No {type} found.</td>
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
                <td>
                  {editItem && editItem.id === item.id && editItem.type === type ? (
                    <button className="btn btn-sm btn-success me-2" onClick={() => handleUpdateItem(type)}>
                      Save
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-info me-2" onClick={() => setEditItem({ id: item.id, name: item.name, type })}>
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
          onClick={() => setActiveTab('categories')}
        >
          Categories
        </button>
        <button 
          className={`tab-button ${activeTab === 'jobNumbers' ? 'active' : ''}`}
          onClick={() => setActiveTab('jobNumbers')}
        >
          Job Numbers
        </button>
        <button 
          className={`tab-button ${activeTab === 'costCodes' ? 'active' : ''}`}
          onClick={() => setActiveTab('costCodes')}
        >
          Cost Codes
        </button>
      </div>

      <div className="card p-4">
        <h2 className="mb-3">Add New {activeTab.replace(/([A-Z])/g, ' $1').toLowerCase().replace('s', '').trim()}</h2>
        <div className="input-group mb-4">
          <input
            type="text"
            className="form-control"
            placeholder={`New ${activeTab.replace(/([A-Z])/g, ' $1').toLowerCase().replace('s', '').trim()} Name`}
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddItem(activeTab);
              }
            }}
          />
          <button className="btn btn-primary" onClick={() => handleAddItem(activeTab)}>
            Add
          </button>
        </div>

        <h2 className="mb-3">Existing {activeTab.replace(/([A-Z])/g, ' $1').toLowerCase().trim()}</h2>
        {renderTable(activeTab === 'categories' ? categories : activeTab === 'jobNumbers' ? jobNumbers : costCodes, activeTab)}
      </div>
    </div>
  );
};

export default MasterDataSettings;
